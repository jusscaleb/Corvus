from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError
from django.db.models import Q, Prefetch

from Newsroom.models import Group
from .models import Article, Branch
from .serializer import ArticleSerializer, BranchSerializer


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
    Only the branch's creator can push it – nobody else should publish someone's private draft.
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
        channel_layer = get_channel_layer()
        if branch.article.group:
            group_name = f'newsroom_{branch.article.group.group_id}'
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'branch_pushed',
                    'branch': BranchSerializer(branch).data,
                }
            )
        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)


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
    """GET: Return the branch content as a placeholder diff (real diff logic can be added later)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):
        branch = get_accessible_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have permission to view this diff."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"diff": branch.content}, status=status.HTTP_200_OK)


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
