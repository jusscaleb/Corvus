from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError
from django.db.models import Q, Prefetch
from django.utils import timezone

from Newsroom.models import Group
from .models import Article, Branch, ArticleTranslation, ArticleApproval
from .serializer import ArticleSerializer, BranchSerializer, ArticleTranslationSerializer, ArticleApprovalSerializer
from AI.translation_service import translate_text


def check_group_membership(user, group):
    return group.memberships.filter(member=user).exists()


def visible_branch_filter(user):
    """Main and pushed branches are visible to anyone with article access; private ones only to their creator."""
    return Q(is_main=True) | Q(is_public=True) | Q(created_by=user)


def visible_branches_prefetch(user):
    """Load each article's visible branches in ONE extra query for the whole list (avoids N+1)."""
    return Prefetch(
        'branches',
        queryset=Branch.objects.filter(visible_branch_filter(user)).select_related('created_by'),
        to_attr='visible_branches',
    )


DUPLICATE_BRANCH_MSG = "A branch with this name already exists on this story."


def branch_name_taken(article, name, exclude_id=None):
    qs = Branch.objects.filter(article=article, branch_name__iexact=name)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    return qs.exists()


class PublicArticleListView(APIView):
    """
    GET: List published or public articles for the public news portal.
    Open to unauthenticated visitors and authenticated reporters alike.
    Supports optional ?lang=sn or ?lang=nd for localized dispatches.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        raw_lang = (request.query_params.get('lang') or 'en').strip().lower()
        if raw_lang in ['shona', 'chishona', 'sn']:
            lang = 'sn'
        elif raw_lang in ['ndebele', 'isindebele', 'nd']:
            lang = 'nd'
        else:
            lang = 'en'

        prefetch_list = [
            Prefetch(
                'branches',
                queryset=Branch.objects.filter(Q(is_main=True) | Q(is_public=True)).select_related('created_by'),
                to_attr='visible_branches'
            )
        ]

        if lang != 'en':
            prefetch_list.append(
                Prefetch(
                    'translations',
                    queryset=ArticleTranslation.objects.filter(language_code__iexact=lang),
                    to_attr='current_translations'
                )
            )

        articles = (
            Article.objects.filter(is_published=True)
            .select_related('group', 'author')
            .prefetch_related(*prefetch_list)
            .distinct()
            .order_by('-published_at', '-updated_at')
        )

        if lang != 'en':
            for art in articles:
                curr_list = getattr(art, 'current_translations', None)
                art.current_translation = curr_list[0] if curr_list else None

        serializer = ArticleSerializer(articles, many=True, context={'request': request, 'lang': lang})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicLeadSubmissionView(APIView):
    """
    POST: Submit a news tip or investigative lead from the public or a reporter.
    Creates an article entered into the newsroom review workflow (status='in_review', is_public=False).
    Submissions do not automatically appear as published articles.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        headline = request.data.get('headline', '').strip()
        details = request.data.get('details', '').strip()
        desk = request.data.get('desk', 'General News')
        urgency = request.data.get('urgency', 'Lead Tip')
        contact_info = request.data.get('contact_info', 'Anonymous')
        is_anonymous = request.data.get('is_anonymous', False)
        location = request.data.get('location', '')

        if not headline or not details:
            return Response(
                {"detail": "Headline and story details are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else None

        with transaction.atomic():
            article = Article.objects.create(
                title=headline,
                author=user,
                group=None,
            )
            loc_str = f" | Location: {location}" if location else ""
            summary = f"[{urgency}] Desk: {desk}{loc_str} | Source: {'Anonymous' if is_anonymous else contact_info}"
            Branch.objects.create(
                branch_name='lead-submission',
                branch_description=summary,
                content=details,
                status='in_review',
                is_main=True,
                is_public=False,
                article=article,
                created_by=user,
            )

        return Response(
            {
                "message": "Lead submitted successfully and routed to the editorial review workflow.",
                "article_id": article.article_id,
                "status": "in_review",
            },
            status=status.HTTP_201_CREATED
        )


class UserArticleListView(APIView):
    """
    GET: List all articles belonging to any newsroom group the authenticated
    user is a member of, plus any articles authored by the user.
    POST: Create a personal (user-only) article without a newsroom group.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        articles = (
            Article.objects.filter(
                Q(group__memberships__member=request.user) | Q(author=request.user)
            )
            .select_related('group', 'author')
            .prefetch_related(visible_branches_prefetch(request.user))
            .distinct()
            .order_by('-updated_at')
        )
        serializer = ArticleSerializer(articles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ArticleSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                article = serializer.save(group=None, author=request.user)
                # Seed default root 'main' branch
                Branch.objects.create(
                    branch_name='main',
                    branch_description='Personal editorial draft',
                    content='',
                    is_main=True,
                    article=article,
                    created_by=request.user,
                )
            return Response(ArticleSerializer(article, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupArticleListCreateView(APIView):
    """
    GET: List all articles within a newsroom group (accessible to group members).
    POST: Create a new article within the group and seed default 'main' branch.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not check_group_membership(request.user, group):
            return Response({"detail": "You do not have access to this group."}, status=status.HTTP_403_FORBIDDEN)

        articles = (
            Article.objects.filter(group=group)
            .select_related('group', 'author')
            .prefetch_related(visible_branches_prefetch(request.user))
            .order_by('-updated_at')
        )
        serializer = ArticleSerializer(articles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not check_group_membership(request.user, group):
            return Response({"detail": "You do not have access to this group."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ArticleSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                article = serializer.save(group=group, author=request.user)
                # Seed default root 'main' branch
                Branch.objects.create(
                    branch_name='main',
                    branch_description='Main editorial line',
                    content='',
                    is_main=True,
                    article=article,
                    created_by=request.user,
                )

            return Response(ArticleSerializer(article, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ArticleDetailView(APIView):
    """
    GET, PATCH, DELETE for a specific article.
    """
    permission_classes = [IsAuthenticated]

    def get_article(self, article_id, user):
        article = get_object_or_404(Article, pk=article_id)
        if article.author == user:
            return article
        if article.group and check_group_membership(user, article.group):
            return article
        return None

    def get(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)
        return Response(ArticleSerializer(article, context={'request': request}).data, status=status.HTTP_200_OK)

    def patch(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ArticleSerializer(article, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublishArticleView(APIView):
    """
    POST: Publish or unpublish an article for public portal view.
    Enforces quality checkpoints:
    1. Must pass Saiph AI Review (quality >= 60, plagiarism < 35%).
    2. Newsroom articles require approval from at least 2 other journalists.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        article = get_object_or_404(Article.objects.select_related('group'), pk=article_id)

        is_author = article.author_id == request.user.pk
        is_member = bool(article.group and check_group_membership(request.user, article.group))
        if not (is_author or is_member):
            return Response(
                {"detail": "You do not have permission to publish this story."},
                status=status.HTTP_403_FORBIDDEN
            )

        action = request.data.get('action', 'publish')
        if action == 'unpublish':
            article.is_published = False
            article.published_at = None
            article.save(update_fields=['is_published', 'published_at'])
            return Response(
                {
                    "message": "Article unpublished from public portal.",
                    "is_published": False,
                    "article": ArticleSerializer(article, context={'request': request}).data,
                },
                status=status.HTTP_200_OK
            )

        # ─── PUBLISHING QUALITY GATES ──────────────────────────────────
        force = bool(request.data.get('force', False))
        if not force:
            # Gate 1: Saiph AI Review Must Pass
            workspace = getattr(article, 'ai_workspace', None)
            review = workspace.last_review if workspace else None
            if not review:
                return Response(
                    {"detail": "Article must pass Saiph AI Review before publishing to the public."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            quality_score = review.get('quality_score', 0)
            plag_score = review.get('plagiarism', {}).get('score', 0)
            if quality_score < 60 or plag_score >= 35:
                return Response(
                    {"detail": f"Article does not meet editorial quality standards (Quality: {quality_score}/100, Plagiarism overlap: {plag_score}%). Please revise and re-run review."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Gate 2: 2 Newsroom Peer Approvals Required
            if article.group:
                peer_count = article.approvals.exclude(user=article.author).count()
                if peer_count < 2:
                    return Response(
                        {"detail": f"Before publishing to the public, this article must be approved by at least 2 other journalists in the newsroom (Current: {peer_count}/2)."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        article.is_published = True
        article.published_at = timezone.now()
        article.save(update_fields=['is_published', 'published_at'])

        # If article has branches, make sure main branch is marked public
        main_branch = article.branches.filter(is_main=True).first()
        if main_branch and not main_branch.is_public:
            main_branch.is_public = True
            main_branch.status = 'merged'
            main_branch.save(update_fields=['is_public', 'status'])

        return Response(
            {
                "message": "Article published to public portal.",
                "is_published": True,
                "article": ArticleSerializer(article, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )


class ArticleBranchListCreateView(APIView):
    """
    GET: List all branches of an article.
    POST: Fork/create a new branch for the article.
    """
    permission_classes = [IsAuthenticated]

    def get_article(self, article_id, user):
        article = get_object_or_404(Article, pk=article_id)
        if article.author == user:
            return article
        if article.group and check_group_membership(user, article.group):
            return article
        return None

    def get(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        # Main and pushed branches are visible to everyone with article access;
        # private branches only to their creator.
        branches = (
            Branch.objects.filter(article=article)
            .filter(visible_branch_filter(request.user))
            .select_related('created_by')
        )
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BranchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # DRF can't check the (article, branch_name) constraint itself because `article`
        # is read-only on the serializer, so check here (case-insensitive, matching the UI).
        if branch_name_taken(article, serializer.validated_data['branch_name']):
            return Response({"detail": DUPLICATE_BRANCH_MSG}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                branch = serializer.save(
                    article=article,
                    created_by=request.user,
                    is_main=False,
                    is_public=False,
                )
        except IntegrityError:
            # Two requests raced past the check above; the DB constraint caught it
            return Response({"detail": DUPLICATE_BRANCH_MSG}, status=status.HTTP_400_BAD_REQUEST)
        return Response(BranchSerializer(branch).data, status=status.HTTP_201_CREATED)


class BranchPushView(APIView):
    """POST: Mark a branch as public and broadcast a notification to the newsroom.
    Only the branch's creator can push it â€“ nobody else should publish someone's private draft.
    """
    permission_classes = [IsAuthenticated]

    def get_branch(self, branch_id, user):
        branch = get_object_or_404(Branch.objects.select_related('article__group'), pk=branch_id)
        if branch.created_by_id != user.pk:
            return None
        # A creator who has since left the newsroom can't push into it
        if branch.article.group and not check_group_membership(user, branch.article.group):
            return None
        return branch

    def post(self, request, branch_id):
        branch = self.get_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "Only the person who created this branch can push it."}, status=status.HTTP_403_FORBIDDEN)
        # Mark as public
        branch.is_public = True
        branch.save()
        # Broadcast via Django Channels to newsroom members
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from .sms_service import notify_newsroom_branch_published

        serialized = dict(BranchSerializer(branch).data)
        channel_layer = get_channel_layer()
        if branch.article.group:
            group_name = f'newsroom_{branch.article.group.group_id}'
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'branch_pushed',
                    'branch': serialized,
                }
            )
            # Summarize article branch with AI and send offline SMS via Twilio to newsroom members
            sms_info = notify_newsroom_branch_published(branch, pushed_by=request.user)
            serialized['sms_notification'] = sms_info
        return Response(serialized, status=status.HTTP_200_OK)


def get_accessible_branch(branch_id, user):
    """Return the branch if the user is the article author or a newsroom member, else None."""
    branch = get_object_or_404(Branch.objects.select_related('article__group'), pk=branch_id)
    is_private = not branch.is_main and not branch.is_public
    if is_private and branch.created_by_id != user.pk:
        return None
    if branch.article.author == user:
        return branch
    if branch.article.group and check_group_membership(user, branch.article.group):
        return branch
    return None


class BranchDiffView(APIView):
    """
    GET: Return unified line diff, character similarity, line additions/deletions,
    and structured diff chunks between this branch and another branch (default: main).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):
        branch = get_accessible_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have permission to view this diff."}, status=status.HTTP_403_FORBIDDEN)

        article = branch.article
        compare_id = request.query_params.get('compare')
        if compare_id:
            compare_branch = get_accessible_branch(compare_id, request.user)
        else:
            compare_branch = article.branches.filter(is_main=True).exclude(pk=branch.pk).first() or article.branches.exclude(pk=branch.pk).first()

        if not compare_branch:
            words = len(branch.content.split()) if branch.content else 0
            return Response({
                "base_branch": {"branch_id": branch.branch_id, "branch_name": branch.branch_name, "is_main": branch.is_main},
                "compare_branch": {"branch_id": branch.branch_id, "branch_name": branch.branch_name, "is_main": branch.is_main},
                "stats": {"similarity_percent": 100, "added_lines": 0, "removed_lines": 0, "base_word_count": words, "compare_word_count": words},
                "diff_text": "",
                "chunks": [],
                "diff": branch.content,
            }, status=status.HTTP_200_OK)

        from AI.article_agent import calculate_branch_diff
        diff_data = calculate_branch_diff(base_branch=branch, compare_branch=compare_branch)
        # If compare param was explicitly provided, diff contains the unified diff;
        # otherwise preserve backward-compatible branch content string
        diff_data["diff"] = diff_data.get("diff_text", branch.content) if compare_id else branch.content
        return Response(diff_data, status=status.HTTP_200_OK)


class BranchMergeView(APIView):
    """
    POST: Merge a source branch into this target branch.
    Strictly enforces creator permission: only the journalist who authored the
    source branch (or explicit permission_granted) can merge it.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, branch_id):
        target_branch = get_accessible_branch(branch_id, request.user)
        if not target_branch:
            return Response({"detail": "Target branch not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        source_branch_id = request.data.get('source_branch_id')
        if not source_branch_id:
            return Response({"detail": "source_branch_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        source_branch = get_accessible_branch(source_branch_id, request.user)
        if not source_branch:
            return Response({"detail": "Source branch not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        # Creator permission gate
        is_creator = source_branch.created_by == request.user or (source_branch.is_main and target_branch.article.author == request.user)
        permission_granted = bool(request.data.get('permission_granted', False))

        if not (is_creator or permission_granted):
            creator_name = source_branch.created_by.username if source_branch.created_by else "its creator"
            return Response(
                {"detail": f"Only the journalist who created this branch (@{creator_name}) has permission to merge it."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_branch.content = source_branch.content
        if source_branch.branch_description and not target_branch.branch_description:
            target_branch.branch_description = source_branch.branch_description
        target_branch.status = 'merged'
        target_branch.save(update_fields=['content', 'branch_description', 'status', 'updated_at'])

        return Response({
            "message": f"Successfully merged '{source_branch.branch_name}' into '{target_branch.branch_name}'.",
            "branch": BranchSerializer(target_branch).data,
        }, status=status.HTTP_200_OK)


class ArticleApproveView(APIView):
    """
    POST: Grant peer approval for an article to be published.
    GET: List journalists who have approved this article.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, article_id):
        article = get_object_or_404(Article.objects.select_related('group', 'author'), pk=article_id)
        approvals = article.approvals.select_related('user').all()
        return Response({
            "article_id": article.article_id,
            "approval_count": approvals.count(),
            "approvals": ArticleApprovalSerializer(approvals, many=True).data,
        }, status=status.HTTP_200_OK)

    def post(self, request, article_id):
        article = get_object_or_404(Article.objects.select_related('group', 'author'), pk=article_id)

        if article.author == request.user:
            return Response(
                {"detail": "Authors cannot peer-approve their own articles. Approval must come from newsroom colleagues."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if article.group and not check_group_membership(request.user, article.group):
            return Response(
                {"detail": "You must be a member of this newsroom to grant peer approval."},
                status=status.HTTP_403_FORBIDDEN,
            )

        approval, created = ArticleApproval.objects.get_or_create(
            article=article,
            user=request.user,
        )

        count = article.approvals.exclude(user=article.author).count()
        return Response({
            "message": f"Peer approval recorded. ({count}/2 approvals)",
            "created": created,
            "approval_count": count,
            "approved": True,
        }, status=status.HTTP_200_OK)


class BranchDetailView(APIView):
    """GET, PATCH, DELETE for a specific branch."""
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):
        branch = get_accessible_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)
        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)

    def patch(self, request, branch_id):
        branch = get_accessible_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_name = serializer.validated_data.get('branch_name')
        if new_name and branch_name_taken(branch.article, new_name, exclude_id=branch.pk):
            return Response({"detail": DUPLICATE_BRANCH_MSG}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return Response({"detail": DUPLICATE_BRANCH_MSG}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, branch_id):
        branch = get_accessible_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)

        if branch.is_main:
            return Response({"detail": "Cannot delete the main root branch."}, status=status.HTTP_400_BAD_REQUEST)

        branch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArticleTranslationView(APIView):
    """
    GET: Retrieve or dynamically generate and cache an article translation (en, sn, nd).
    POST: Update or save manual translation overrides.
    """
    permission_classes = [AllowAny]

    def _normalize_lang(self, code):
        if not code:
            return 'en'
        c = code.strip().lower()
        if c in ['sn', 'shona', 'chishona']:
            return 'sn'
        if c in ['nd', 'ndebele', 'isindebele']:
            return 'nd'
        return 'en'

    def get(self, request, article_id):
        article = get_object_or_404(
            Article.objects.select_related('group', 'author').prefetch_related('branches'),
            pk=article_id
        )

        # Access check: published articles are public; unpublished require author/membership
        if not article.is_published:
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required to view unpublished drafts."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            is_author = article.author_id == request.user.pk
            is_member = bool(article.group and check_group_membership(request.user, article.group))
            if not (is_author or is_member):
                return Response(
                    {"detail": "You do not have permission to view this article translation."},
                    status=status.HTTP_403_FORBIDDEN
                )

        target_lang = self._normalize_lang(request.query_params.get('lang', 'sn'))

        # Fetch main branch or first branch for base content
        branch_id = request.query_params.get('branch_id')
        main_branch = (article.branches.filter(pk=branch_id).first() if branch_id else None) or article.branches.filter(is_main=True).first() or article.branches.first()
        base_content = main_branch.content if main_branch else ""
        base_excerpt = (main_branch.branch_description if main_branch else "") or (base_content[:160] if base_content else "")

        if target_lang == 'en':
            return Response({
                "translation_id": f"en-{article.article_id}",
                "article": article.article_id,
                "language_code": "en",
                "title": article.title,
                "content": base_content,
                "excerpt": base_excerpt,
                "cached": True,
            }, status=status.HTTP_200_OK)

        # Check if translation already exists in PostgreSQL database
        translation = ArticleTranslation.objects.filter(
            article=article,
            language_code=target_lang
        ).first()

        if translation:
            return Response({
                "translation_id": translation.translation_id,
                "article": article.article_id,
                "language_code": translation.language_code,
                "title": translation.title,
                "content": translation.content,
                "excerpt": translation.excerpt,
                "cached": True,
                "created_at": translation.created_at,
                "updated_at": translation.updated_at,
            }, status=status.HTTP_200_OK)

        # If not cached, translate using Saiph AI translation service (Groq Llama-3.3-70b)
        translated_title = translate_text(article.title, target_language=target_lang, source_language='en')
        translated_content = translate_text(base_content, target_language=target_lang, source_language='en') if base_content else ""
        translated_excerpt = translate_text(base_excerpt, target_language=target_lang, source_language='en') if base_excerpt else ""

        # Store in database so subsequent reads are cached instantly (<15ms)
        translation, _ = ArticleTranslation.objects.update_or_create(
            article=article,
            language_code=target_lang,
            defaults={
                'title': translated_title or article.title,
                'content': translated_content or base_content,
                'excerpt': translated_excerpt or base_excerpt,
            }
        )

        return Response({
            "translation_id": translation.translation_id,
            "article": article.article_id,
            "language_code": translation.language_code,
            "title": translation.title,
            "content": translation.content,
            "excerpt": translation.excerpt,
            "cached": False,
            "created_at": translation.created_at,
            "updated_at": translation.updated_at,
        }, status=status.HTTP_200_OK)

    def post(self, request, article_id):
        # Update or manual edit of translation
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required to update translations."}, status=status.HTTP_401_UNAUTHORIZED)

        article = get_object_or_404(Article.objects.select_related('group'), pk=article_id)
        is_author = article.author_id == request.user.pk
        is_member = bool(article.group and check_group_membership(request.user, article.group))
        if not (is_author or is_member):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        target_lang = self._normalize_lang(request.data.get('language_code', 'sn'))
        title = request.data.get('title')
        content = request.data.get('content', '')
        excerpt = request.data.get('excerpt', '')

        if not title:
            return Response({"detail": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)

        translation, _ = ArticleTranslation.objects.update_or_create(
            article=article,
            language_code=target_lang,
            defaults={
                'title': title,
                'content': content,
                'excerpt': excerpt or (content[:160] if content else ""),
            }
        )

        return Response(ArticleTranslationSerializer(translation).data, status=status.HTTP_200_OK)

