"""
English → Shona / Ndebele translation for reader-facing news content.

Article text is authored in English. When a reader picks Shona or Ndebele in the
public portal, the portal asks this module for a translation. Results are cached
in `TextTranslation` keyed by a hash of the source text, so each paragraph is
only ever sent to the model once.
"""

import hashlib
import json
import re

from .groq_service import chat_with_groq
from .models import TextTranslation

SUPPORTED_LANGUAGES = {
    'shona': 'chiShona (Shona, Zimbabwe)',
    'ndebele': 'isiNdebele (Northern Ndebele, Zimbabwe)',
}

# Request guards so a public endpoint cannot be used to burn API credits.
MAX_ITEMS = 12
MAX_CHARS_PER_ITEM = 4000
MAX_TOTAL_CHARS = 8000
BATCH_CHARS = 3500


def language_label(target):
    return SUPPORTED_LANGUAGES.get((target or '').strip().lower(), '')


def _hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def _extract_json_array(raw, expected_length):
    """Pull a JSON string array out of a model reply, or return None."""
    if not raw:
        return None
    cleaned = raw.strip()
    cleaned = re.sub(r'^```(?:json)?|```$', '', cleaned, flags=re.MULTILINE).strip()
    candidates = [cleaned]
    start, end = cleaned.find('['), cleaned.rfind(']')
    if start != -1 and end > start:
        candidates.append(cleaned[start:end + 1])
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except Exception:
            continue
        if (
            isinstance(parsed, list)
            and len(parsed) == expected_length
            and all(isinstance(item, str) for item in parsed)
        ):
            return parsed
    return None


def _translate_batch(batch, target):
    """Translate one batch of strings. Returns list of translations or None."""
    label = SUPPORTED_LANGUAGES[target]
    system_prompt = (
        "You are a professional news translator for Corvus, a Zimbabwean "
        f"investigative newsroom. Translate every item from English into {label}. "
        "Preserve names, place names, numbers, dates, units and quoted speech. "
        "Keep a plain, factual journalistic register suitable for a newspaper. "
        "Do not summarise, expand, explain or add commentary. "
        "Return ONLY a JSON array of translated strings, in the same order and "
        "of the same length as the input array."
    )
    user_prompt = json.dumps(batch, ensure_ascii=False)

    try:
        raw = chat_with_groq(
            prompt=user_prompt,
            user_language=label,
            system_instruction=system_prompt,
        )
    except Exception:
        return None

    return _extract_json_array(raw, len(batch))


def translate_texts(texts, target_language):
    """
    Translate `texts` into `target_language` ('shona' or 'ndebele').

    Returns (translations, complete) where `translations` is aligned with the
    input list and `complete` is False if any item could not be translated
    (those items are returned in their original English form).
    """
    target = (target_language or '').strip().lower()
    if target not in SUPPORTED_LANGUAGES:
        raise ValueError('Unsupported target language.')

    sources = [text if isinstance(text, str) else '' for text in texts]
    hashes = [_hash(text) for text in sources]

    cached = {}
    if hashes:
        rows = TextTranslation.objects.filter(
            target_language=target, source_hash__in=hashes
        ).values_list('source_hash', 'translated_text')
        cached = dict(rows)

    results = [
        source if not source.strip() else cached.get(digest)
        for source, digest in zip(sources, hashes)
    ]

    missing = [index for index, value in enumerate(results) if value is None]
    if not missing:
        return results, True

    complete = True

    # Group the uncached texts into batches that respect the model's context
    # budget, then translate each batch in a single call.
    batch, batch_chars = [], 0

    def flush():
        nonlocal complete
        if not batch:
            return
        translations = _translate_batch([sources[i] for i in batch], target)
        if translations is None:
            complete = False
            for index in batch:
                results[index] = sources[index]
        else:
            rows = []
            for index, translated in zip(batch, translations):
                results[index] = translated
                rows.append(
                    TextTranslation(
                        source_hash=hashes[index],
                        target_language=target,
                        source_text=sources[index],
                        translated_text=translated,
                    )
                )
            TextTranslation.objects.bulk_create(rows, ignore_conflicts=True)
        batch.clear()

    for index in missing:
        text = sources[index]
        if batch and batch_chars + len(text) > BATCH_CHARS:
            flush()
            batch_chars = 0
        batch.append(index)
        batch_chars += len(text)
    flush()

    return results, complete
