from django.urls import path
from .views import (
    PublicArticleListView,
    PublicLeadSubmissionView,
    UserArticleListView,
    GroupArticleListCreateView,
    ArticleDetailView,
    PublishArticleView,
    ArticleTranslationView,
    ArticleBranchListCreateView,
    BranchDetailView,
    BranchPushView,
    BranchDiffView,
)

urlpatterns = [
    # Public portal endpoints
    path('public/', PublicArticleListView.as_view(), name='public_article_list'),
    path('leads/', PublicLeadSubmissionView.as_view(), name='public_lead_submission'),

    # Global articles list for authorized user
    path('articles/', UserArticleListView.as_view(), name='user_article_list'),

    # Articles within a group
    path('groups/<str:group_id>/articles/', GroupArticleListCreateView.as_view(), name='group_article_list_create'),
    path('articles/<str:article_id>/', ArticleDetailView.as_view(), name='article_detail'),
    path('articles/<str:article_id>/publish/', PublishArticleView.as_view(), name='article_publish'),
    path('articles/<str:article_id>/translate/', ArticleTranslationView.as_view(), name='article_translate'),

    # Push a branch to make it public
    path('branches/<str:branch_id>/push/', BranchPushView.as_view(), name='branch_push'),
    # Diff a branch
    path('branches/<str:branch_id>/diff/', BranchDiffView.as_view(), name='branch_diff'),

    path('articles/<str:article_id>/branches/', ArticleBranchListCreateView.as_view(), name='article_branch_list_create'),
    path('branches/<str:branch_id>/', BranchDetailView.as_view(), name='branch_detail'),
]
