import json
import math
import re
import uuid
from collections import Counter

from django.db import transaction
from django.db.models import Q

from Project.models import Article, Branch
from Project.views import check_group_membership, branch_name_taken
from .models import ArticleWorkspace, AgentMemory, AgentConversationMessage
from .groq_service import chat_with_groq, is_prompt_safe


# ─── Access Control Helpers ───────────────────────────────────────────────────

def get_accessible_article(user, article_id):
    """Returns the Article if `user` is its author or a member of its newsroom group."""
    if not article_id:
        return None
    article = Article.objects.select_related('group', 'author').filter(pk=article_id).first()
    if not article:
        return None
    if article.author_id == user.pk:
        return article
    if article.group and check_group_membership(user, article.group):
        return article
    return None


def get_or_create_workspace(article):
    workspace, _ = ArticleWorkspace.objects.get_or_create(article=article)
    return workspace


def get_primary_branch(article, branch_id=None):
    if branch_id:
        branch = Branch.objects.filter(article=article, pk=branch_id).first()
        if branch:
            return branch
    return (
        Branch.objects.filter(article=article, is_main=True).first()
        or Branch.objects.filter(article=article).first()
    )


def _extract_json_block(raw_text, fallback):
    """Safely extracts JSON from an LLM response (handling markdown code fences or prose)."""
    if not raw_text:
        return fallback
    cleaned = raw_text.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    for start_char, end_char in (('{', '}'), ('[', ']')):
        s = cleaned.find(start_char)
        e = cleaned.rfind(end_char)
        if s != -1 and e != -1 and e > s:
            try:
                return json.loads(cleaned[s : e + 1])
            except Exception:
                continue
    try:
        return json.loads(cleaned)
    except Exception:
        return fallback


# ─── 1. AI Article Draft Generation from Brief Summary ────────────────────────

def generate_article_draft_from_brief(title: str, brief: str, category: str = "Investigative Report", user=None) -> dict:
    """
    Generates a structured, publication-ready journalistic draft, lead summary,
    initial mindmap, and initial editorial board items from a brief user summary.
    Falls back to a deterministic structured template if Groq is unavailable.
    """
    clean_title = (title or "Untitled Investigation").strip()
    clean_brief = (brief or clean_title).strip()
    lang = getattr(user, 'preffered_language', 'english') if user else 'english'

    system_prompt = (
        "You are Saiph, Senior Investigative Editor at Corvus Newsroom. "
        f"Write in {lang}. Return ONLY valid JSON with keys:\n"
        '{\n'
        '  "headline": "Refined punchy headline",\n'
        '  "summary": "2-sentence executive lead summary (under 45 words)",\n'
        '  "content": "Well-structured markdown article with # Headline, ## Key Findings, ## Background & Context, ## What Happens Next, and bullet points",\n'
        '  "key_facts": ["Fact 1", "Fact 2"]\n'
        '}'
    )
    user_prompt = (
        f"Headline / Topic: {clean_title}\n"
        f"Desk / Category: {category}\n"
        f"Reporter's Brief Summary: {clean_brief}\n\n"
        "Generate a thorough, well-structured journalistic draft based on this brief."
    )

    fallback = _build_fallback_draft(clean_title, clean_brief, category)
    try:
        raw = chat_with_groq(prompt=user_prompt, user_language=lang, system_instruction=system_prompt)
        parsed = _extract_json_block(raw, fallback)
        if not isinstance(parsed, dict) or not parsed.get("content"):
            return fallback
        return {
            "headline": parsed.get("headline") or clean_title,
            "summary": parsed.get("summary") or fallback["summary"],
            "content": parsed.get("content") or fallback["content"],
            "key_facts": parsed.get("key_facts") or fallback["key_facts"],
        }
    except Exception:
        return fallback


def _build_fallback_draft(title: str, brief: str, category: str) -> dict:
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', brief) if s.strip()]
    lead = sentences[0] if sentences else brief
    summary = lead if len(lead) <= 180 else lead[:177] + "..."
    bullet_lines = "\n".join(f"• {s}" for s in (sentences[:4] or [brief]))
    content = (
        f"# {title}\n\n"
        f"**{summary}**\n\n"
        f"## Key Findings\n"
        f"{bullet_lines}\n\n"
        f"## Investigation Details\n"
        f"{brief}\n\n"
        f"## Sources & Verification Checklist\n"
        f"• Primary records and official statements under review by the {category} desk.\n"
        f"• Corroborate timeline figures andaffected stakeholders before final publication.\n\n"
        f"## Next Steps\n"
        f"• Add direct quotes from primary sources and run a Saiph editorial review."
    )
    return {
        "headline": title,
        "summary": summary,
        "content": content,
        "key_facts": sentences[:3] if sentences else [brief],
    }


# ─── 2. AI Mindmap Generator ─────────────────────────────────────────────────

def generate_article_mindmap(article: Article, branch: Branch = None, user=None) -> dict:
    """
    Generates a hierarchical mindmap for `article` (root -> branches -> sub-nodes)
    and persists it to `ArticleWorkspace.mindmap_data`.
    """
    target_branch = branch or get_primary_branch(article)
    content = (target_branch.content if target_branch else "") or ""
    summary = (target_branch.branch_description if target_branch else "") or ""
    memories = list(
        AgentMemory.objects.filter(article=article).values_list('fact', flat=True)[:8]
    )

    fallback = _build_fallback_mindmap(article.title, summary, content, memories)
    lang = getattr(user, 'preffered_language', 'english') if user else 'english'

    system_prompt = (
        "You are Saiph, an investigative visual architect. "
        "Analyze the article and return ONLY valid JSON representing a mindmap:\n"
        "{\n"
        '  "root": { "title": "Central Story Theme", "subtitle": "1-line core thesis" },\n'
        '  "nodes": [\n'
        '    {\n'
        '      "id": "n1",\n'
        '      "label": "Branch Theme (2-5 words)",\n'
        '      "category": "angle" | "evidence" | "stakeholder" | "timeline" | "question",\n'
        '      "summary": "Simple 1-sentence explanation",\n'
        '      "children": [\n'
        '        { "id": "n1_1", "label": "Specific detail or lead", "note": "Short actionable note" }\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        "}"
    )
    user_prompt = (
        f"Article Title: {article.title}\n"
        f"Summary: {summary}\n"
        f"Saved Memory Facts: {memories}\n"
        f"Draft Content:\n{content[:3500]}"
    )

    mindmap = fallback
    try:
        raw = chat_with_groq(prompt=user_prompt, user_language=lang, system_instruction=system_prompt)
        parsed = _extract_json_block(raw, fallback)
        if isinstance(parsed, dict) and isinstance(parsed.get("nodes"), list) and len(parsed["nodes"]) > 0:
            mindmap = parsed
    except Exception:
        mindmap = fallback

    workspace = get_or_create_workspace(article)
    workspace.mindmap_data = mindmap
    workspace.save(update_fields=['mindmap_data', 'updated_at'])
    return mindmap


def _build_fallback_mindmap(title: str, summary: str, content: str, memories: list) -> dict:
    # Extract markdown headings or paragraphs to build a meaningful mindmap deterministically
    headings = re.findall(r'^#{1,3}\s+(.+)$', content, flags=re.MULTILINE)
    bullets = [b.strip("•-* ").strip() for b in re.findall(r'^[•\-*]\s+(.+)$', content, flags=re.MULTILINE)]
    sentences = [
        s.strip()
        for s in re.split(r'(?<=[.!?])\s+', re.sub(r'#+\s+.*', '', content))
        if len(s.strip()) > 20
    ]

    nodes = [
        {
            "id": "core_angle",
            "label": "Core Story Angle",
            "category": "angle",
            "summary": summary or (sentences[0] if sentences else f"Central investigation into {title}."),
            "children": [
                {"id": f"ca_{i+1}", "label": s[:70], "note": s}
                for i, s in enumerate((sentences[:3] or [f"Establish the key thesis for {title}"]))
            ],
        },
        {
            "id": "key_sections",
            "label": "Story Structure",
            "category": "timeline",
            "summary": "Key sections and narrative flow in the current draft.",
            "children": [
                {"id": f"sec_{i+1}", "label": h[:60], "note": f"Section {i+1}"}
                for i, h in enumerate(headings[:4] or ["Lead & Hook", "Core Evidence", "Impact & Response"])
            ],
        },
        {
            "id": "evidence_leads",
            "label": "Evidence & Key Points",
            "category": "evidence",
            "summary": "Facts, data points, and claims to verify.",
            "children": [
                {"id": f"ev_{i+1}", "label": b[:65], "note": b}
                for i, b in enumerate((bullets[:4] or memories[:3] or ["Primary source verification", "Data cross-check"]))
            ],
        },
        {
            "id": "open_questions",
            "label": "Next Questions & Stakeholders",
            "category": "stakeholder",
            "summary": "Voices to interview and questions readers will ask.",
            "children": [
                {"id": "oq_1", "label": "Who is most affected?", "note": "Add a human or stakeholder perspective."},
                {"id": "oq_2", "label": "What is the official response?", "note": "Include comment or right-of-reply."},
                {"id": "oq_3", "label": "What happens next?", "note": "Give readers a clear forward-looking takeaway."},
            ],
        },
    ]
    return {
        "root": {
            "title": title,
            "subtitle": summary or "Interactive Story Mindmap",
        },
        "nodes": nodes,
    }


# ─── 3. Editorial Board (Suggestions & Sources) ──────────────────────────────

def generate_article_board(article: Article, branch: Branch = None, user=None) -> list:
    """
    Generates actionable editorial suggestions and recommended research sources/verification leads
    for `article` and persists them to `ArticleWorkspace.board_items`.
    """
    target_branch = branch or get_primary_branch(article)
    content = (target_branch.content if target_branch else "") or ""
    summary = (target_branch.branch_description if target_branch else "") or ""

    fallback = _build_fallback_board(article.title, summary, content)
    lang = getattr(user, 'preffered_language', 'english') if user else 'english'

    system_prompt = (
        "You are Saiph, an investigative editor and research librarian. "
        "Review the article and return ONLY a JSON array of 4 to 6 items mixing "
        '"suggestion" (editorial improvements, angles, structure) and "source" '
        "(specific types of documents, public records, datasets, or expert sources to cite):\n"
        "[\n"
        "  {\n"
        '    "id": "b1",\n'
        '    "kind": "suggestion" | "source",\n'
        '    "title": "Short clear title",\n'
        '    "detail": "Simple, practical explanation of what to add or check",\n'
        '    "category": "Lead" | "Evidence" | "Clarity" | "Primary Record" | "Expert Source" | "Data",\n'
        '    "priority": "high" | "medium",\n'
        '    "snippet": "Optional ready-to-insert text or citation template"\n'
        "  }\n"
        "]"
    )
    user_prompt = (
        f"Article Title: {article.title}\n"
        f"Summary: {summary}\n"
        f"Draft Content:\n{content[:3500]}"
    )

    items = fallback
    try:
        raw = chat_with_groq(prompt=user_prompt, user_language=lang, system_instruction=system_prompt)
        parsed = _extract_json_block(raw, fallback)
        if isinstance(parsed, list) and len(parsed) > 0:
            normalized = []
            for idx, item in enumerate(parsed):
                if isinstance(item, dict) and item.get("title"):
                    normalized.append({
                        "id": str(item.get("id") or f"board_{idx+1}_{uuid.uuid4().hex[:6]}"),
                        "kind": "source" if item.get("kind") == "source" else "suggestion",
                        "title": item.get("title", "Editorial Note"),
                        "detail": item.get("detail", ""),
                        "category": item.get("category") or ("Source" if item.get("kind") == "source" else "Editorial"),
                        "priority": item.get("priority") if item.get("priority") in ("high", "medium", "low") else "medium",
                        "snippet": item.get("snippet", ""),
                        "applied": bool(item.get("applied", False)),
                    })
            if normalized:
                items = normalized
    except Exception:
        items = fallback

    workspace = get_or_create_workspace(article)
    workspace.board_items = items
    workspace.save(update_fields=['board_items', 'updated_at'])
    return items


def _build_fallback_board(title: str, summary: str, content: str) -> list:
    word_count = len(content.split())
    has_quotes = bool(re.search(r'[""].+?[""]|^>\s+', content, flags=re.MULTILINE))
    has_numbers = bool(re.search(r'\b\d+(?:\.\d+)?%?\b', content))

    items = [
        {
            "id": "sug_lead_hook",
            "kind": "suggestion",
            "title": "Sharpen the opening lead paragraph",
            "detail": (
                "State the single most important finding and who it affects in the first two sentences "
                "so readers immediately grasp why this story matters."
            ),
            "category": "Lead",
            "priority": "high",
            "snippet": f"**Key Finding:** New evidence in *{title}* reveals immediate impacts for the community.",
            "applied": False,
        },
        {
            "id": "sug_voices",
            "kind": "suggestion",
            "title": "Add a direct human quote" if not has_quotes else "Balance stakeholder perspectives",
            "detail": (
                "Readers connect best with real voices. Include at least one direct quote from an affected "
                "person or eyewitness, plus the official response."
                if not has_quotes
                else "Ensure every named party or institution subject to criticism has their response clearly noted."
            ),
            "category": "Evidence",
            "priority": "high" if not has_quotes else "medium",
            "snippet": '> "We need transparency and clear timelines," said a spokesperson familiar with the matter.',
            "applied": False,
        },
        {
            "id": "sug_data_depth",
            "kind": "suggestion",
            "title": "Anchor claims with specific numbers or dates" if not has_numbers else "Add a clear timeline box",
            "detail": (
                f"Your draft is currently {word_count} words. Adding concrete dates, figures, or percentages "
                "turns general statements into verifiable journalism."
            ),
            "category": "Clarity",
            "priority": "medium",
            "snippet": "## Key Timeline\n• **Initial Filing:** Documented in public records\n• **Latest Update:** Under review",
            "applied": False,
        },
        {
            "id": "src_public_records",
            "kind": "source",
            "title": f"Official Public Filings & Gazette Records on {title}",
            "detail": (
                "Cross-check contract numbers, budgets, or regulatory notices in municipal/ministry archives "
                "and parliamentary committee reports."
            ),
            "category": "Primary Record",
            "priority": "high",
            "snippet": "(Source: Official Public Registry & Gazette Filings, verified 2026)",
            "applied": False,
        },
        {
            "id": "src_independent_audit",
            "kind": "source",
            "title": "Independent Sector & Academic Data Benchmarks",
            "detail": (
                "Compare local figures against regional benchmarks, auditor-general reports, or peer-reviewed "
                "research to give readers context."
            ),
            "category": "Data",
            "priority": "medium",
            "snippet": "(Source: Independent Sector Audit & Regional Benchmark Report)",
            "applied": False,
        },
        {
            "id": "src_right_of_reply",
            "kind": "source",
            "title": "Right-of-Reply & Stakeholder Statements Log",
            "detail": (
                "Keep a dated log of questions sent to officials and their exact replies to protect the newsroom "
                "and strengthen credibility."
            ),
            "category": "Expert Source",
            "priority": "medium",
            "snippet": "The department was contacted for comment and stated that the matter is under active review.",
            "applied": False,
        },
    ]
    return items


# ─── 4. Review, Plagiarism Check, AI-Writing Check & Simple Improvements ─────

AI_CLICHE_PHRASES = [
    "delve into",
    "testament to",
    "tapestry of",
    "in today's fast-paced world",
    "it is important to note",
    "moreover",
    "furthermore",
    "in conclusion",
    "navigate the complexities",
    "shed light on",
    "pivotal role",
    "underscores the importance",
    "paradigm shift",
    "realm of",
]


def _shingles(text: str, k: int = 5) -> set:
    words = re.findall(r"[a-z0-9']+", text.lower())
    if len(words) < k:
        return {" ".join(words)} if words else set()
    return {" ".join(words[i : i + k]) for i in range(len(words) - k + 1)}


def _compute_plagiarism_analysis(article: Article, content: str) -> dict:
    """
    Compares 5-word shingles and sentence overlaps against all other articles in the
    database (plus internal duplicate sentence detection).
    """
    clean = content.strip()
    if not clean:
        return {
            "score": 0,
            "verdict": "Clean",
            "summary": "Write some draft text first so I can check it for copied passages.",
            "matches": [],
        }

    my_shingles = _shingles(clean, k=5)
    other_articles = (
        Article.objects.exclude(pk=article.pk)
        .prefetch_related('branches')[:50]
    )

    matches = []
    max_overlap = 0.0

    for other in other_articles:
        other_main = next((b for b in other.branches.all() if b.is_main), None) or next(iter(other.branches.all()), None)
        if not other_main or not other_main.content:
            continue
        other_shingles = _shingles(other_main.content, k=5)
        if not other_shingles or not my_shingles:
            continue
        shared = my_shingles & other_shingles
        if shared:
            ratio = len(shared) / max(len(my_shingles), 1)
            pct = round(min(ratio * 100, 100), 1)
            if pct >= 5:
                max_overlap = max(max_overlap, pct)
                sample_phrase = next(iter(shared))
                matches.append({
                    "article_id": other.article_id,
                    "title": other.title,
                    "similarity_percent": pct,
                    "sample_match": f"...{sample_phrase}...",
                })

    # Also check for repeated sentences inside the same draft
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip().split()) >= 7]
    counts = Counter(s.lower() for s in sentences)
    repeated = [s for s, c in counts.items() if c > 1]
    internal_penalty = min(len(repeated) * 8, 25)

    plagiarism_score = int(round(min(max_overlap + internal_penalty, 100)))
    if plagiarism_score < 12:
        verdict = "Original"
        summary = "Your writing looks original. No significant overlap was found with other newsroom articles."
    elif plagiarism_score < 35:
        verdict = "Minor Overlap"
        summary = "Most of your draft is original, but a few phrases overlap with existing stories or repeat themselves."
    else:
        verdict = "High Overlap — Needs Attribution"
        summary = "Several passages closely match another article. Rewrite those parts in your own words or put them in quotation marks with a clear source."

    return {
        "score": plagiarism_score,
        "originality_score": 100 - plagiarism_score,
        "verdict": verdict,
        "summary": summary,
        "matches": sorted(matches, key=lambda m: m["similarity_percent"], reverse=True)[:3],
        "repeated_sentences": len(repeated),
    }


def _compute_ai_writing_analysis(content: str) -> dict:
    """
    Heuristic + stylometric detector for AI-sounding prose:
    1. Overused AI cliché phrases ("delve into", "tapestry of", "it is important to note", etc.)
    2. Low burstiness (AI writes sentences of very uniform length; humans mix short punchy sentences with longer ones)
    3. Repetitive sentence starters
    """
    clean = content.strip()
    words = re.findall(r"[a-zA-Z']+", clean)
    if len(words) < 15:
        return {
            "ai_probability": 10,
            "human_score": 90,
            "verdict": "Mostly Human (Short Draft)",
            "summary": "The draft is short, so it reads naturally so far. Keep using specific facts and natural sentence variety.",
            "flagged_phrases": [],
        }

    lower_text = clean.lower()
    flagged = [phrase for phrase in AI_CLICHE_PHRASES if phrase in lower_text]

    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip().split()) >= 3]
    lengths = [len(s.split()) for s in sentences] or [len(words)]
    mean_len = sum(lengths) / len(lengths)
    variance = sum((l - mean_len) ** 2 for l in lengths) / max(len(lengths), 1)
    std_dev = math.sqrt(variance)
    # Burstiness: std_dev / mean_len. Humans usually have burstiness >= 0.45; flat AI prose is often < 0.28
    burstiness = std_dev / max(mean_len, 1.0)

    cliche_score = min(len(flagged) * 16, 60)
    uniformity_score = 0
    if len(sentences) >= 4:
        if burstiness < 0.25:
            uniformity_score = 28
        elif burstiness < 0.38:
            uniformity_score = 14

    ai_prob = int(min(max(cliche_score + uniformity_score + 8, 5), 95))
    if ai_prob < 30:
        verdict = "Sounds Human & Natural"
        summary = "Your writing has natural rhythm and avoids robotic filler words."
    elif ai_prob < 60:
        verdict = "Mixed — Slightly Robotic in Places"
        summary = "Some sentences sound a bit formulaic or uniform in length. Try mixing short, punchy sentences with longer ones and cutting filler transitions."
    else:
        verdict = "Sounds AI-Generated"
        summary = "This draft uses several classic AI cliché phrases and very even sentence lengths. Replace the flagged phrases with plain, direct language and concrete reporting."

    return {
        "ai_probability": ai_prob,
        "human_score": 100 - ai_prob,
        "verdict": verdict,
        "summary": summary,
        "flagged_phrases": flagged,
        "sentence_count": len(sentences),
        "avg_sentence_words": round(mean_len, 1),
    }


def _compute_readability_and_simple_tips(article: Article, content: str, summary: str, plag: dict, ai_check: dict) -> dict:
    clean = content.strip()
    words = re.findall(r"\S+", clean)
    word_count = len(words)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if s.strip()]
    long_sentences = [s for s in sentences if len(s.split()) > 28]
    passive_matches = re.findall(r'\b(?:was|were|been|being|is|are)\s+\w+ed\b', clean, flags=re.IGNORECASE)

    improvements = []

    if word_count < 80:
        improvements.append({
            "area": "Story Depth",
            "problem": f"Your draft is quite short ({word_count} words).",
            "how_to_fix": "Add the '5 Ws' (Who, What, When, Where, Why) and at least two concrete facts or quotes so readers get the full picture.",
            "example": "Explain what happened, who is affected, and what officials or witnesses say about it.",
        })

    if not summary.strip():
        improvements.append({
            "area": "Lead Summary",
            "problem": "There is no lead summary at the top of the article.",
            "how_to_fix": "Add a 1–2 sentence summary that tells busy readers the main takeaway right away.",
            "example": f"In one sentence: what is the biggest new fact in '{article.title}'?",
        })

    if long_sentences:
        sample = long_sentences[0][:110] + ("..." if len(long_sentences[0]) > 110 else "")
        improvements.append({
            "area": "Sentence Length",
            "problem": f"You have {len(long_sentences)} very long sentence(s) (over 28 words), which can tire readers out.",
            "how_to_fix": "Split long sentences in two. Aim for 15–20 words per sentence so your point lands clearly.",
            "example": f"Try breaking up: \"{sample}\"",
        })

    if ai_check.get("flagged_phrases"):
        phrases_str = ", ".join(f'"{p}"' for p in ai_check["flagged_phrases"][:4])
        improvements.append({
            "area": "Robotic / Cliché Phrasing",
            "problem": f"Found filler phrases that sound like AI: {phrases_str}.",
            "how_to_fix": "Delete these transitions or swap them for plain, everyday words.",
            "example": 'Instead of "It is important to note that costs rose", just write "Costs rose."',
        })

    if len(passive_matches) >= 3:
        improvements.append({
            "area": "Active Voice",
            "problem": f"Found {len(passive_matches)} passive-voice phrases (like '{passive_matches[0]}').",
            "how_to_fix": "Say WHO did the action first. Active voice makes journalism stronger and clearer.",
            "example": 'Instead of "The report was released by the board", write "The board released the report."',
        })

    if plag.get("score", 0) >= 20:
        improvements.append({
            "area": "Originality & Attribution",
            "problem": "Some sentences closely match existing text or repeat within the draft.",
            "how_to_fix": "Paraphrase in your own voice, or put exact words inside quotation marks and name the source.",
            "example": 'According to the Ministry\'s Tuesday filing, "..."',
        })

    if not re.search(r'^#{1,3}\s+', clean, flags=re.MULTILINE) and word_count >= 120:
        improvements.append({
            "area": "Structure & Subheadings",
            "problem": "The article is a single wall of text with no section headings.",
            "how_to_fix": "Break the story into 2–3 sections using Heading 2 (##) so readers can scan easily.",
            "example": "## What We Found   or   ## How Residents Are Affected",
        })

    if not improvements:
        improvements.append({
            "area": "Polish & Verification",
            "problem": "Your draft is clean, original, and easy to read!",
            "how_to_fix": "Double-check all names, dates, and numbers against primary sources before pushing your branch.",
            "example": "Run a quick check on the Board tab to see if any extra source citations would strengthen the piece.",
        })

    # Overall quality score (0-100)
    quality = 88
    if word_count < 60:
        quality -= 18
    quality -= min(len(long_sentences) * 4, 16)
    quality -= min(len(ai_check.get("flagged_phrases", [])) * 5, 15)
    quality -= int(plag.get("score", 0) * 0.35)
    quality = max(min(quality, 98), 25)

    return {
        "quality_score": quality,
        "word_count": word_count,
        "improvements": improvements,
    }


def review_article_branch(article: Article, branch: Branch = None, user=None) -> dict:
    """
    Runs a full editorial review on `article` / `branch`:
    1. Plagiarism & overlap check
    2. AI-writing & robotic phrasing check
    3. Plain-language improvements (optionally enriched by Groq LLM)
    Saves the report to `ArticleWorkspace.last_review`.
    """
    target_branch = branch or get_primary_branch(article)
    content = (target_branch.content if target_branch else "") or ""
    summary = (target_branch.branch_description if target_branch else "") or ""

    plagiarism = _compute_plagiarism_analysis(article, content)
    ai_check = _compute_ai_writing_analysis(content)
    readability = _compute_readability_and_simple_tips(article, content, summary, plagiarism, ai_check)

    # Optionally ask Groq for a friendly plain-English coach summary & 1-2 extra specific tips
    coach_summary = (
        f"Overall quality is {readability['quality_score']}/100. "
        f"{plagiarism['summary']} {ai_check['summary']}"
    )
    lang = getattr(user, 'preffered_language', 'english') if user else 'english'

    if content.strip():
        try:
            sys_prompt = (
                "You are Saiph, a supportive editorial coach. Explain feedback in very simple, everyday terms "
                "(no jargon). Return ONLY valid JSON:\n"
                "{\n"
                '  "coach_summary": "2-3 warm, simple sentences telling the writer what works well and the #1 thing to improve",\n'
                '  "extra_tip": {\n'
                '    "area": "Specific Story Tip",\n'
                '    "problem": "Simple description of a weak spot in this specific text",\n'
                '    "how_to_fix": "Simple step to fix it",\n'
                '    "example": "A concrete rewrite example from their text"\n'
                '  }\n'
                "}"
            )
            raw = chat_with_groq(
                prompt=f"Title: {article.title}\nSummary: {summary}\nContent:\n{content[:3000]}",
                user_language=lang,
                system_instruction=sys_prompt,
            )
            parsed = _extract_json_block(raw, {})
            if isinstance(parsed, dict):
                if parsed.get("coach_summary"):
                    coach_summary = parsed["coach_summary"]
                extra = parsed.get("extra_tip")
                if isinstance(extra, dict) and extra.get("problem") and extra.get("how_to_fix"):
                    readability["improvements"].insert(0, {
                        "area": extra.get("area", "Story Flow"),
                        "problem": extra["problem"],
                        "how_to_fix": extra["how_to_fix"],
                        "example": extra.get("example", ""),
                    })
        except Exception:
            pass

    report = {
        "article_id": article.article_id,
        "branch_id": target_branch.branch_id if target_branch else None,
        "branch_name": target_branch.branch_name if target_branch else "main",
        "quality_score": readability["quality_score"],
        "word_count": readability["word_count"],
        "coach_summary": coach_summary,
        "plagiarism": plagiarism,
        "ai_detection": ai_check,
        "improvements": readability["improvements"],
    }

    workspace = get_or_create_workspace(article)
    workspace.last_review = report
    workspace.save(update_fields=['last_review', 'updated_at'])
    return report


# ─── 5. 1-to-1 Conversational Article Agent with Memory & Autonomous Actions ──

def interact_with_article_agent(
    user,
    message: str,
    article: Article = None,
    branch: Branch = None,
) -> dict:
    """
    Handles 1-to-1 communication between the user and Saiph.
    - Checks prompt safety via Prompt Guard
    - Recalls short-term conversation history + long-term AgentMemory facts
    - Can autonomously execute article actions (drafting, editing, branching, mindmap,
      board generation, review/plagiarism/AI check, saving memories)
    - Persists both the user turn and assistant reply in `AgentConversationMessage`
    """
    clean_msg = (message or "").strip()
    if not clean_msg:
        raise ValueError("Message cannot be empty.")

    if not is_prompt_safe(clean_msg):
        return {
            "reply": "I cannot fulfill that request because it triggered our prompt safety guard. Let's focus on your article or newsroom work!",
            "actions_taken": [],
            "blocked": True,
        }

    target_branch = branch or (get_primary_branch(article) if article else None)
    actions_taken = []
    workspace_payload = {}

    # 1. Auto-extract explicit memory instructions ("remember that ...", "save to memory ...")
    mem_match = re.search(
        r"\b(?:remember\s+that|save\s+to\s+memory[:\s]+|note\s+that|keep\s+in\s+mind\s+that)\s+(.+)",
        clean_msg,
        flags=re.IGNORECASE,
    )
    if mem_match:
        fact_text = mem_match.group(1).strip().rstrip(".")
        if fact_text:
            mem = AgentMemory.objects.create(
                user=user,
                article=article,
                category='fact',
                fact=fact_text,
            )
            actions_taken.append({
                "type": "memory_saved",
                "label": f"Remembered: {fact_text[:60]}",
                "memory_id": mem.memory_id,
            })

    lower = clean_msg.lower()

    # 1b. If NO article is currently open and the user asks Saiph to write/create/draft an article,
    # autonomously create the Article + main Branch so it opens immediately in their workspace!
    if not article and any(
        k in lower
        for k in (
            "write an article",
            "write a story",
            "create an article",
            "create a story",
            "draft an article",
            "draft a story",
            "generate an article",
            "new article about",
            "write about ",
        )
    ):
        topic_match = re.search(
            r"(?:about|on|titled|called|regarding)\s+(.+)",
            clean_msg,
            flags=re.IGNORECASE,
        )
        raw_topic = (topic_match.group(1).strip() if topic_match else clean_msg).rstrip(".")
        draft_data = generate_article_draft_from_brief(
            title=raw_topic[:100],
            brief=clean_msg,
            user=user,
        )
        headline = (draft_data.get("headline") or raw_topic[:100] or "New Investigative Draft")[:150]
        if Article.objects.filter(group__isnull=True, title=headline).exists():
            headline = f"{headline[:135]} ({uuid.uuid4().hex[:4]})"
        with transaction.atomic():
            article = Article.objects.create(
                group=None,
                author=user,
                title=headline,
            )
            target_branch = Branch.objects.create(
                article=article,
                branch_name="main",
                branch_description=draft_data.get("summary", "")[:255],
                content=draft_data.get("content", ""),
                created_by=user,
                is_main=True,
                is_public=True,
            )
        workspace_payload["created_article"] = {
            "id": article.article_id,
            "article_id": article.article_id,
            "type": "article",
            "title": article.title,
            "category": "Personal Draft",
            "isPersonal": True,
            "groupId": None,
            "branchId": target_branch.branch_id,
            "timestamp": "Just now",
            "author": getattr(user, "full_name", None) or getattr(user, "username", "You"),
            "readTime": "1 branch",
            "symbol": "◎",
            "summary": target_branch.branch_description,
            "content": target_branch.content,
        }
        workspace_payload["updated_content"] = target_branch.content
        actions_taken.append({
            "type": "article_created",
            "label": f"Created & drafted '{article.title}'",
        })

    # Pre-fetch recent conversation turns so multi-turn follow-ups (e.g. replying "draft-v2"
    # after Saiph asked "What would you like to call the branch?") have full context.
    recent_turns = list(
        AgentConversationMessage.objects.filter(user=user, article=article).order_by('-created_at')[:8]
    )[::-1]
    last_assistant_msg = next(
        (t.content for t in reversed(recent_turns) if t.role == 'assistant'),
        "",
    )

    def _serialize_branch(b):
        return {
            "branch_id": b.branch_id,
            "branch_name": b.branch_name,
            "content": b.content,
            "branch_description": b.branch_description,
            "is_main": b.is_main,
            "is_public": b.is_public,
        }

    def _next_auto_branch_name(art):
        idx = 2
        while branch_name_taken(art, f"draft-v{idx}"):
            idx += 1
        return f"draft-v{idx}"

    def _create_or_switch_branch(art, raw_name, base_branch, force_create=False):
        clean_bname = re.sub(r"[^a-zA-Z0-9_-]", "-", raw_name.strip("`'\" .!?")).strip("-")
        if not clean_bname:
            clean_bname = _next_auto_branch_name(art)
        existing = Branch.objects.filter(article=art, branch_name__iexact=clean_bname).first()
        if existing and not force_create:
            payload = _serialize_branch(existing)
            workspace_payload["switched_branch"] = payload
            actions_taken.append({
                "type": "branch_switched",
                "label": f"Switched to branch '{existing.branch_name}'",
            })
            return existing
        if existing and force_create:
            clean_bname = _next_auto_branch_name(art)

        created = Branch.objects.create(
            article=art,
            branch_name=clean_bname,
            branch_description=base_branch.branch_description if base_branch else "Forked by Saiph",
            content=base_branch.content if base_branch else "",
            created_by=user,
            is_main=False,
            is_public=False,
        )
        payload = _serialize_branch(created)
        workspace_payload["created_branch"] = payload
        workspace_payload["switched_branch"] = payload
        actions_taken.append({
            "type": "branch_created",
            "label": f"Created & switched to branch '{created.branch_name}'",
        })
        return created

    # 2. Check if user is asking for specific article operations when an article is open
    if article and not workspace_payload.get("created_article"):
        # 2a. Branch creation, switching, renaming, and pushing
        # Explicit named branch creation/switching:
        # e.g. "create a branch called draft-v2", "switch to branch main", "switch to draft-v2", "checkout v2", "new branch water-audit"
        named_branch_match = (
            re.search(
                r"(?:create|fork|make|start|spin\s+up|switch\s+to|checkout|go\s+to|open|use)\s+(?:a\s+)?(?:new\s+)?(?:branch\s+)?(?:called\s+|named\s+|to\s+)?[`'\"]?([a-zA-Z0-9][a-zA-Z0-9_-]{0,45})[`'\"]?\s*$",
                clean_msg,
                flags=re.IGNORECASE,
            )
            or re.search(
                r"(?:branch\s+(?:called|named)|new\s+branch)\s+[`'\"]?([a-zA-Z0-9][a-zA-Z0-9_-]{0,45})[`'\"]?",
                clean_msg,
                flags=re.IGNORECASE,
            )
        )
        unnamed_new_branch = re.search(
            r"\b(?:switch\s+to\s+a\s+new\s+branch|create\s+a\s+new\s+branch|make\s+a\s+new\s+branch|start\s+a\s+new\s+branch|fork\s+this\s+branch|new\s+branch)\b",
            lower,
        )
        bare_slug_match = re.match(r"^[`'\"]?([a-zA-Z0-9][a-zA-Z0-9_-]{0,40})[`'\"]?\.?$", clean_msg)
        reserved_words = {
            "a", "an", "the", "new", "branch", "mindmap", "board", "review",
            "draft", "article", "story", "it", "this", "yes", "no", "ok", "okay",
            "thanks", "hello", "hi", "hey", "help", "status", "push", "pull", "diff",
        }

        if unnamed_new_branch and (
            not named_branch_match or named_branch_match.group(1).lower() in reserved_words
        ):
            # User said "switch to a new branch" or "create a new branch" without specifying a name:
            # Immediately create the next available draft-vN branch and switch to it!
            auto_name = _next_auto_branch_name(article)
            target_branch = _create_or_switch_branch(article, auto_name, target_branch, force_create=True)
        elif named_branch_match and named_branch_match.group(1).lower() not in reserved_words:
            candidate_name = named_branch_match.group(1)
            wants_new = bool(re.search(r"\b(?:create|fork|make|start|new)\b", lower))
            target_branch = _create_or_switch_branch(
                article,
                candidate_name,
                target_branch,
                force_create=wants_new and not Branch.objects.filter(article=article, branch_name__iexact=candidate_name).exists(),
            )
        elif bare_slug_match:
            slug_candidate = bare_slug_match.group(1)
            existing_b = Branch.objects.filter(article=article, branch_name__iexact=slug_candidate).first()
            assistant_asked_for_branch = any(
                k in last_assistant_msg.lower()
                for k in ("branch", "call it", "name", "draft-v")
            )
            if existing_b:
                target_branch = _create_or_switch_branch(article, slug_candidate, target_branch)
            elif assistant_asked_for_branch and slug_candidate.lower() not in reserved_words:
                target_branch = _create_or_switch_branch(article, slug_candidate, target_branch)

        # Rename current branch (e.g. "rename branch to final-draft")
        rename_branch_match = re.search(
            r"(?:rename\s+(?:this\s+)?branch\s+to|call\s+this\s+branch)\s+[`'\"]?([a-zA-Z0-9][a-zA-Z0-9_-]{0,45})[`'\"]?",
            clean_msg,
            flags=re.IGNORECASE,
        )
        if rename_branch_match and target_branch and not target_branch.is_main:
            new_bname = rename_branch_match.group(1).strip()
            if not branch_name_taken(article, new_bname, exclude_id=target_branch.branch_id):
                target_branch.branch_name = new_bname
                target_branch.save(update_fields=['branch_name', 'updated_at'])
                payload = _serialize_branch(target_branch)
                workspace_payload["switched_branch"] = payload
                actions_taken.append({
                    "type": "branch_renamed",
                    "label": f"Renamed branch to '{new_bname}'",
                })

        # Push / share current branch with newsroom
        if target_branch and any(
            k in lower
            for k in ("push branch", "push this branch", "publish branch", "share branch", "make branch public")
        ):
            if not target_branch.is_public and not target_branch.is_main:
                target_branch.is_public = True
                target_branch.save(update_fields=['is_public', 'updated_at'])
            from Project.sms_service import notify_newsroom_branch_published

            sms_info = notify_newsroom_branch_published(target_branch, pushed_by=user)
            payload = _serialize_branch(target_branch)
            payload["sms_notification"] = sms_info
            workspace_payload["pushed_branch"] = payload
            actions_taken.append({
                "type": "branch_pushed",
                "label": f"Pushed branch '{target_branch.branch_name}' to newsroom",
            })

        # Rename article headline (e.g. "change headline to ...", "rename article to ...")
        title_match = re.search(
            r"(?:change|update|set|rename)\s+(?:the\s+)?(?:article\s+)?(?:title|headline|name)\s+to\s+[\"']?(.+?)[\"']?$",
            clean_msg,
            flags=re.IGNORECASE,
        )
        if title_match:
            new_title = title_match.group(1).strip().rstrip(".")[:250]
            if new_title:
                article.title = new_title
                article.save(update_fields=['title', 'updated_at'])
                workspace_payload["updated_title"] = new_title
                actions_taken.append({
                    "type": "title_updated",
                    "label": f"Updated headline to '{new_title}'",
                })

        # Mindmap request
        if any(k in lower for k in ("mindmap", "mind map", "concept map", "visual map")):
            mm = generate_article_mindmap(article, target_branch, user=user)
            workspace_payload["mindmap"] = mm
            if any(k in lower for k in ("open", "show", "go to", "switch to", "view")):
                workspace_payload["open_section"] = "mindmap"
            actions_taken.append({
                "type": "mindmap_generated",
                "label": f"Generated mindmap with {len(mm.get('nodes', []))} key themes",
            })

        # Board / sources / suggestions request
        if any(k in lower for k in ("board", "source", "sources", "citation", "suggestions")):
            board = generate_article_board(article, target_branch, user=user)
            workspace_payload["board"] = board
            if any(k in lower for k in ("open", "show", "go to", "switch to", "view")):
                workspace_payload["open_section"] = "board"
            actions_taken.append({
                "type": "board_updated",
                "label": f"Updated board with {len(board)} suggestions & sources",
            })

        # Review / plagiarism / AI check request
        if any(k in lower for k in ("review", "plagiarism", "ai check", "check my", "improve", "critique", "grade")):
            rev = review_article_branch(article, target_branch, user=user)
            workspace_payload["review"] = rev
            if any(k in lower for k in ("open", "show", "go to", "switch to", "view")):
                workspace_payload["open_section"] = "review"
            actions_taken.append({
                "type": "review_completed",
                "label": f"Reviewed '{target_branch.branch_name if target_branch else 'main'}' (Score: {rev['quality_score']}/100)",
            })

        # Draft / write / expand / rewrite / edit content into the active branch
        if target_branch and any(
            k in lower
            for k in (
                "write a draft",
                "generate a draft",
                "write the article",
                "write this article",
                "expand this",
                "expand the",
                "expand on",
                "rewrite",
                "draft an article",
                "add a section",
                "add more sections",
                "add a paragraph",
                "add a conclusion",
                "add an intro",
                "continue writing",
                "keep writing",
                "write more",
                "fix the grammar",
                "fix grammar",
                "polish this",
                "make it longer",
                "make it shorter",
                "shorten",
                "summarize the draft",
                "update the draft",
                "edit the draft",
                "fill in the",
            )
        ):
            existing_body = (target_branch.content or "").strip()
            edit_sys = (
                "You are Saiph, Senior Investigative Editor at Corvus Newsroom. "
                f"Write in {getattr(user, 'preffered_language', 'english') if user else 'english'}. "
                "Update or write the article draft according to the reporter's instruction. "
                "Return ONLY valid JSON with keys:\n"
                "{\n"
                '  "headline": "Updated or existing headline",\n'
                '  "summary": "1-2 sentence executive lead summary",\n'
                '  "content": "Full updated markdown article body"\n'
                "}"
            )
            edit_prompt = (
                f"Current Headline: {article.title}\n"
                f"Current Summary: {target_branch.branch_description or ''}\n"
                f"Current Draft Body:\n{existing_body[:3500]}\n\n"
                f"Reporter's Instruction: {clean_msg}\n\n"
                "Produce the updated full markdown article."
            )
            generated = generate_article_draft_from_brief(
                title=article.title,
                brief=clean_msg if len(clean_msg) > 25 else (target_branch.branch_description or article.title),
                user=user,
            )
            try:
                raw_edit = chat_with_groq(
                    prompt=edit_prompt,
                    user_language=getattr(user, 'preffered_language', 'english') if user else 'english',
                    system_instruction=edit_sys,
                )
                parsed_edit = _extract_json_block(raw_edit, {})
                if isinstance(parsed_edit, dict) and parsed_edit.get("content"):
                    generated = {
                        "headline": parsed_edit.get("headline") or article.title,
                        "summary": parsed_edit.get("summary") or generated["summary"],
                        "content": parsed_edit["content"],
                    }
            except Exception:
                pass

            target_branch.content = generated["content"]
            if generated.get("summary"):
                target_branch.branch_description = generated["summary"][:255]
            target_branch.save(update_fields=['content', 'branch_description', 'updated_at'])
            workspace_payload["updated_content"] = target_branch.content
            workspace_payload["updated_summary"] = target_branch.branch_description
            workspace_payload["updated_branch"] = {
                "branch_id": target_branch.branch_id,
                "branch_name": target_branch.branch_name,
                "content": target_branch.content,
                "summary": target_branch.branch_description,
            }
            actions_taken.append({
                "type": "draft_updated",
                "label": f"Updated draft on branch '{target_branch.branch_name}'",
            })

    # 3. Load Long-Term Memories (article-scoped + user global) & Short-Term Chat History
    memories_qs = AgentMemory.objects.filter(
        Q(user=user, article__isnull=True) | (Q(article=article) if article else Q(pk__isnull=True))
    ).distinct()[:12]
    memories_list = [f"- [{m.category.upper()}] {m.fact}" for m in memories_qs]

    history_block = "\n".join(
        f"{'Reporter' if t.role == 'user' else 'Saiph'}: {t.content[:350]}"
        for t in recent_turns
    )

    # 4. Compose response using Groq (with graceful deterministic fallback if offline/mocked)
    lang = getattr(user, 'preffered_language', 'english') or 'english'
    article_context = "No specific article open (General Workspace chat)."
    if article:
        all_branch_names = list(Branch.objects.filter(article=article).values_list('branch_name', flat=True))
        article_context = (
            f"Active Article: '{article.title}' (ID: {article.article_id})\n"
            f"Active Branch: '{target_branch.branch_name if target_branch else 'main'}'\n"
            f"Available Branches on this Article: {all_branch_names}\n"
            f"Current Summary: {(target_branch.branch_description if target_branch else '')[:300]}\n"
            f"Current Draft Excerpt:\n{(target_branch.content if target_branch else '')[:1800]}"
        )

    actions_summary = ", ".join(a["label"] for a in actions_taken) or "None"
    system_prompt = (
        "You are Saiph, Corvus Newsroom's friendly, sharp editorial AI partner. "
        f"Respond in {lang} using clear, simple, everyday language. "
        "You have long-term memory and direct access to the reporter's article workspace.\n\n"
        f"=== SAVED LONG-TERM MEMORIES ===\n"
        + ("\n".join(memories_list) if memories_list else "None yet.")
        + f"\n\n=== CURRENT ARTICLE CONTEXT ===\n{article_context}\n\n"
        f"=== ACTIONS YOU JUST EXECUTED ON THIS TURN ===\n{actions_summary}\n\n"
        "IMPORTANT RULE: Only state that you created/switched a branch, updated the draft, or ran a tool "
        "if it appears in ACTIONS YOU JUST EXECUTED ON THIS TURN above. "
        "If you executed actions, briefly confirm what you did and highlight the key takeaway in simple terms."
    )
    full_prompt = (
        (f"Recent Conversation:\n{history_block}\n\n" if history_block else "")
        + f"Reporter: {clean_msg}"
    )

    reply_text = _build_fallback_chat_reply(clean_msg, article, target_branch, actions_taken, workspace_payload, memories_qs)
    try:
        llm_reply = chat_with_groq(prompt=full_prompt, user_language=lang, system_instruction=system_prompt)
        if llm_reply and llm_reply.strip():
            reply_text = llm_reply.strip()
    except Exception:
        pass

    # Post-LLM safety net: if the LLM reply mentions creating or switching to a specific branch
    # that wasn't executed yet, execute it right now so Saiph's reply is 100% truthful!
    if article and not workspace_payload.get("switched_branch") and not workspace_payload.get("created_branch"):
        claimed_branch = re.search(
            r"(?:created|switched\s+to)\s+(?:a\s+)?(?:new\s+)?branch\s+(?:called\s+|named\s+)?\*\*`?([a-zA-Z0-9_-]+)`?\*\*|(?:created|switched\s+to)\s+(?:a\s+)?(?:new\s+)?branch\s+(?:called\s+|named\s+)?`([a-zA-Z0-9_-]+)`",
            reply_text,
            flags=re.IGNORECASE,
        )
        if claimed_branch:
            bname = (claimed_branch.group(1) or claimed_branch.group(2) or "").strip()
            if bname:
                target_branch = _create_or_switch_branch(article, bname, target_branch)

    if article and (
        workspace_payload.get("created_branch")
        or workspace_payload.get("switched_branch")
        or workspace_payload.get("pushed_branch")
    ):
        workspace_payload["branches"] = [
            _serialize_branch(b)
            for b in Branch.objects.filter(article=article).order_by('-is_main', 'created_at')
        ]

    # 5. Persist User & Assistant turns to short-term conversation history
    with transaction.atomic():
        AgentConversationMessage.objects.create(
            user=user,
            article=article,
            role='user',
            content=clean_msg,
        )
        assistant_msg = AgentConversationMessage.objects.create(
            user=user,
            article=article,
            role='assistant',
            content=reply_text,
            actions_taken=actions_taken,
        )

    return {
        "message_id": assistant_msg.message_id,
        "reply": reply_text,
        "actions_taken": actions_taken,
        "workspace": workspace_payload,
        "memories": [
            {
                "memory_id": m.memory_id,
                "category": m.category,
                "fact": m.fact,
                "scope": "article" if m.article_id else "user",
            }
            for m in memories_qs
        ],
        "blocked": False,
    }


def _build_fallback_chat_reply(clean_msg, article, branch, actions_taken, workspace_payload, memories_qs) -> str:
    parts = []
    if actions_taken:
        labels = "; ".join(a["label"] for a in actions_taken)
        parts.append(f"Done — {labels}.")

    if "review" in workspace_payload:
        rev = workspace_payload["review"]
        top_tip = rev["improvements"][0] if rev.get("improvements") else None
        parts.append(
            f"Your draft scored **{rev['quality_score']}/100** "
            f"(Originality: **{rev['plagiarism']['originality_score']}%**, "
            f"Human tone: **{rev['ai_detection']['human_score']}%**)."
        )
        if top_tip:
            parts.append(f"**Top tip ({top_tip['area']}):** {top_tip['how_to_fix']}")

    if "mindmap" in workspace_payload:
        mm = workspace_payload["mindmap"]
        node_names = ", ".join(n["label"] for n in mm.get("nodes", [])[:4])
        parts.append(f"I mapped your story into key themes: **{node_names}**. Switch to the **Mindmap** tab to explore them.")

    if "board" in workspace_payload:
        board = workspace_payload["board"]
        parts.append(f"I added **{len(board)} suggestions and source leads** to your **Board** tab.")

    if not parts:
        if "what do you remember" in clean_msg.lower() or "memory" in clean_msg.lower():
            if memories_qs:
                facts = "; ".join(m.fact for m in memories_qs[:5])
                parts.append(f"Here is what I have in memory: {facts}.")
            else:
                parts.append("I don't have any saved notes for this story yet. Tell me 'Remember that ...' anytime to save a fact!")
        elif article:
            parts.append(
                f"I'm looking at **{article.title}** (branch `{branch.branch_name if branch else 'main'}`). "
                "You can ask me to write or refine a section, build a mindmap, suggest sources for the board, "
                "run a plagiarism & AI check, or remember key facts for this story."
            )
        else:
            parts.append(
                "Hi! I'm **Saiph**, your editorial AI partner. Open any article (or start a new one from a brief summary) "
                "and I can draft copy, map out story angles, suggest sources, and check for plagiarism or AI-sounding text."
            )

    return " ".join(parts)

