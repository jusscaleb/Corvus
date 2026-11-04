from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q

from .models import AgentMemory, AgentConversationMessage
from .translation import (
    MAX_CHARS_PER_ITEM,
    MAX_ITEMS,
    MAX_TOTAL_CHARS,
    SUPPORTED_LANGUAGES,
    translate_texts,
)
from .article_agent import (
    get_accessible_article,
    get_or_create_workspace,
    get_primary_branch,
    generate_article_draft_from_brief,
    generate_article_mindmap,
    generate_article_board,
    review_article_branch,
    interact_with_article_agent,
)


class GenerateDraftView(APIView):
    """
    POST /api/ai/generate-draft/
    Accepts { "title": "...", "brief": "...", "category": "..." } and returns an AI-generated
    article draft ({ "headline", "summary", "content", "key_facts" }) so users can create an
    article from a brief summary.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        brief = (request.data.get("brief") or request.data.get("summary") or "").strip()
        category = (request.data.get("category") or "Investigative Report").strip()

        if not brief and not title:
            return Response(
                {"detail": "Please provide a brief summary or topic so Saiph can generate a draft."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        draft = generate_article_draft_from_brief(
            title=title or brief[:60],
            brief=brief or title,
            category=category,
            user=request.user,
        )
        return Response(draft, status=status.HTTP_200_OK)


class ArticleAIWorkspaceView(APIView):
    """
    GET /api/ai/articles/<article_id>/workspace/
    Returns the article's AI Mindmap, Editorial Board (suggestions & sources),
    latest Review report, saved Long-Term Memories, and 1-to-1 Chat History.
    Auto-seeds initial Mindmap and Board if empty so the tabs are immediately useful.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, article_id):
        article = get_accessible_article(request.user, article_id)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        branch_id = request.query_params.get("branch_id")
        branch = get_primary_branch(article, branch_id=branch_id)
        workspace = get_or_create_workspace(article)

        if not workspace.mindmap_data:
            generate_article_mindmap(article, branch, user=request.user)
            workspace.refresh_from_db()

        if not workspace.board_items:
            generate_article_board(article, branch, user=request.user)
            workspace.refresh_from_db()

        memories = AgentMemory.objects.filter(
            Q(article=article) | Q(user=request.user, article__isnull=True)
        ).distinct()[:25]

        messages = AgentConversationMessage.objects.filter(
            user=request.user,
            article=article,
        ).order_by('created_at')[:50]

        return Response(
            {
                "article_id": article.article_id,
                "mindmap": workspace.mindmap_data,
                "board": workspace.board_items,
                "review": workspace.last_review or None,
                "memories": [
                    {
                        "memory_id": m.memory_id,
                        "category": m.category,
                        "fact": m.fact,
                        "scope": "article" if m.article_id else "user",
                        "created_at": m.created_at.isoformat(),
                    }
                    for m in memories
                ],
                "messages": [
                    {
                        "message_id": msg.message_id,
                        "role": msg.role,
                        "content": msg.content,
                        "actions_taken": msg.actions_taken,
                        "created_at": msg.created_at.isoformat(),
                    }
                    for msg in messages
                ],
            },
            status=status.HTTP_200_OK,
        )


class ArticleMindmapGenerateView(APIView):
    """
    POST /api/ai/articles/<article_id>/mindmap/
    Generates or refreshes the AI Mindmap for an article.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        article = get_accessible_article(request.user, article_id)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        branch = get_primary_branch(article, branch_id=request.data.get("branch_id"))
        mindmap = generate_article_mindmap(article, branch, user=request.user)
        return Response({"mindmap": mindmap}, status=status.HTTP_200_OK)


class ArticleBoardView(APIView):
    """
    POST /api/ai/articles/<article_id>/board/   -> Regenerate AI suggestions & sources
    PATCH /api/ai/articles/<article_id>/board/  -> Mark a board item as applied or add a custom item
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        article = get_accessible_article(request.user, article_id)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        branch = get_primary_branch(article, branch_id=request.data.get("branch_id"))
        board = generate_article_board(article, branch, user=request.user)
        return Response({"board": board}, status=status.HTTP_200_OK)

    def patch(self, request, article_id):
        article = get_accessible_article(request.user, article_id)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        workspace = get_or_create_workspace(article)
        items = list(workspace.board_items or [])
        item_id = request.data.get("item_id")
        applied = request.data.get("applied")

        if item_id is not None:
            for item in items:
                if str(item.get("id")) == str(item_id):
                    item["applied"] = bool(applied) if applied is not None else not item.get("applied", False)
            workspace.board_items = items
            workspace.save(update_fields=['board_items', 'updated_at'])

        return Response({"board": workspace.board_items}, status=status.HTTP_200_OK)


class ArticleReviewView(APIView):
    """
    POST /api/ai/articles/<article_id>/review/
    Runs Saiph's editorial review, plagiarism check, AI-writing check, and plain-language
    improvement coach on the article's active branch.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        article = get_accessible_article(request.user, article_id)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        branch = get_primary_branch(article, branch_id=request.data.get("branch_id"))
        report = review_article_branch(article, branch, user=request.user)
        return Response(report, status=status.HTTP_200_OK)


class AgentChatView(APIView):
    """
    GET /api/ai/chat/?article_id=<optional>  -> Fetch 1-to-1 conversation history & memories
    POST /api/ai/chat/                       -> Send 1-to-1 message to Saiph with optional article/branch context
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        article_id = request.query_params.get("article_id")
        article = None
        if article_id:
            article = get_accessible_article(request.user, article_id)
            if not article:
                return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        messages = AgentConversationMessage.objects.filter(
            user=request.user,
            article=article,
        ).order_by('created_at')[:50]

        memories = AgentMemory.objects.filter(
            Q(user=request.user, article__isnull=True) | (Q(article=article) if article else Q(pk__isnull=True))
        ).distinct()[:25]

        return Response(
            {
                "messages": [
                    {
                        "message_id": m.message_id,
                        "role": m.role,
                        "content": m.content,
                        "actions_taken": m.actions_taken,
                        "created_at": m.created_at.isoformat(),
                    }
                    for m in messages
                ],
                "memories": [
                    {
                        "memory_id": mem.memory_id,
                        "category": mem.category,
                        "fact": mem.fact,
                        "scope": "article" if mem.article_id else "user",
                    }
                    for mem in memories
                ],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        content = (request.data.get("content") or request.data.get("message") or "").strip()
        if not content:
            return Response({"detail": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        article_id = request.data.get("article_id")
        branch_id = request.data.get("branch_id")

        article = None
        branch = None
        if article_id:
            article = get_accessible_article(request.user, article_id)
            if not article:
                return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)
            branch = get_primary_branch(article, branch_id=branch_id)

        result = interact_with_article_agent(
            user=request.user,
            message=content,
            article=article,
            branch=branch,
        )
        return Response(result, status=status.HTTP_200_OK)


class AgentMemoryListCreateView(APIView):
    """
    GET /api/ai/memories/?article_id=<optional>
    POST /api/ai/memories/ { "fact": "...", "category": "fact"|"source"|"style"|"goal", "article_id": "<optional>" }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        article_id = request.query_params.get("article_id")
        if article_id:
            article = get_accessible_article(request.user, article_id)
            if not article:
                return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)
            memories = AgentMemory.objects.filter(Q(article=article) | Q(user=request.user, article__isnull=True)).distinct()
        else:
            memories = AgentMemory.objects.filter(user=request.user)

        return Response(
            [
                {
                    "memory_id": m.memory_id,
                    "category": m.category,
                    "fact": m.fact,
                    "article_id": m.article_id,
                    "scope": "article" if m.article_id else "user",
                    "created_at": m.created_at.isoformat(),
                }
                for m in memories[:30]
            ],
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        fact = (request.data.get("fact") or "").strip()
        if not fact:
            return Response({"detail": "Memory fact cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get("category") or "fact"
        if category not in dict(AgentMemory.CATEGORY_CHOICES):
            category = "fact"

        article_id = request.data.get("article_id")
        article = None
        if article_id:
            article = get_accessible_article(request.user, article_id)
            if not article:
                return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        mem = AgentMemory.objects.create(
            user=request.user,
            article=article,
            category=category,
            fact=fact,
        )
        return Response(
            {
                "memory_id": mem.memory_id,
                "category": mem.category,
                "fact": mem.fact,
                "article_id": mem.article_id,
                "scope": "article" if mem.article_id else "user",
                "created_at": mem.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class AgentMemoryDeleteView(APIView):
    """DELETE /api/ai/memories/<memory_id>/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, memory_id):
        mem = AgentMemory.objects.select_related('article').filter(pk=memory_id).first()
        if not mem:
            return Response({"detail": "Memory not found."}, status=status.HTTP_404_NOT_FOUND)
        if mem.user_id != request.user.pk and not (mem.article and get_accessible_article(request.user, mem.article_id)):
            return Response({"detail": "You do not have permission to delete this memory."}, status=status.HTTP_403_FORBIDDEN)
        mem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicTranslateView(APIView):
    """
    POST /api/ai/translate/
    Translates reader-facing English news text into Shona or Ndebele.
    Body: { "target": "shona" | "ndebele", "texts": ["...", "..."] }
    Returns { "target", "translations": [...], "complete": bool }.
    Translations are cached server-side, so repeat reads cost nothing.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        target = str(request.data.get("target") or "").strip().lower()
        texts = request.data.get("texts")

        if target not in SUPPORTED_LANGUAGES:
            return Response(
                {"detail": "Unsupported target language. Use 'shona' or 'ndebele'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(texts, list) or not texts:
            return Response(
                {"detail": "Provide a non-empty list of texts to translate."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not all(isinstance(text, str) for text in texts):
            return Response(
                {"detail": "Every item in 'texts' must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(texts) > MAX_ITEMS:
            return Response(
                {"detail": f"Translate at most {MAX_ITEMS} texts per request."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(len(text) > MAX_CHARS_PER_ITEM for text in texts):
            return Response(
                {"detail": f"Each text must be under {MAX_CHARS_PER_ITEM} characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if sum(len(text) for text in texts) > MAX_TOTAL_CHARS:
            return Response(
                {"detail": f"Send at most {MAX_TOTAL_CHARS} characters per request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        translations, complete = translate_texts(texts, target)
        return Response(
            {"target": target, "translations": translations, "complete": complete},
            status=status.HTTP_200_OK,
        )
