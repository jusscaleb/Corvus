from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from Newsroom.models import Group
from .models import Article, Branch
from .serializer import ArticleSerializer, BranchSerializer


def check_group_membership(user, group):
    return group.memberships.filter(member=user).exists()


class UserArticleListView(APIView):
    """
    GET: List all articles belonging to any newsroom group the authenticated
    user is a member of, plus any articles authored by the user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        articles = (
            Article.objects.filter(
                Q(group__memberships__member=request.user) | Q(author=request.user)
            )
            .select_related('group', 'author')
            .prefetch_related('branches')
            .distinct()
        )
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

        articles = Article.objects.filter(group=group).select_related('author').prefetch_related('branches')
        serializer = ArticleSerializer(articles, many=True)
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

            return Response(ArticleSerializer(article).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ArticleDetailView(APIView):
    """
    GET, PATCH, DELETE for a specific article.
    """
    permission_classes = [IsAuthenticated]

    def get_article(self, article_id, user):
        article = get_object_or_404(Article, pk=article_id)
        if not check_group_membership(user, article.group):
            return None
        return article

    def get(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)
        return Response(ArticleSerializer(article).data, status=status.HTTP_200_OK)

    def patch(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ArticleSerializer(article, data=request.data, partial=True)
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
        if not check_group_membership(user, article.group):
            return None
        return article

    def get(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        branches = Branch.objects.filter(article=article).select_related('created_by')
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, article_id):
        article = self.get_article(article_id, request.user)
        if not article:
            return Response({"detail": "You do not have access to this article."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            branch = serializer.save(
                article=article,
                created_by=request.user,
                is_main=False,
            )
            return Response(BranchSerializer(branch).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BranchDetailView(APIView):
    """
    GET, PATCH, DELETE for a specific branch (writing/drafting endpoint).
    """
    permission_classes = [IsAuthenticated]

    def get_branch(self, branch_id, user):
        branch = get_object_or_404(Branch, pk=branch_id)
        if not check_group_membership(user, branch.article.group):
            return None
        return branch

    def get(self, request, branch_id):
        branch = self.get_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)
        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)

    def patch(self, request, branch_id):
        branch = self.get_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, branch_id):
        branch = self.get_branch(branch_id, request.user)
        if not branch:
            return Response({"detail": "You do not have access to this branch."}, status=status.HTTP_403_FORBIDDEN)

        if branch.is_main:
            return Response({"detail": "Cannot delete the main root branch."}, status=status.HTTP_400_BAD_REQUEST)

        branch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
