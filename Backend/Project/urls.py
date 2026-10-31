from django.urls import path
from .views import (
    GroupArticleListCreateView,
    ArticleDetailView,
    ArticleBranchListCreateView,
    BranchDetailView,
)

urlpatterns = [
    # Articles within a group
    path('groups/<str:group_id>/articles/', GroupArticleListCreateView.as_view(), name='group_article_list_create'),
    path('articles/<str:article_id>/', ArticleDetailView.as_view(), name='article_detail'),

    # Branches within an article
    path('articles/<str:article_id>/branches/', ArticleBranchListCreateView.as_view(), name='article_branch_list_create'),
    path('branches/<str:branch_id>/', BranchDetailView.as_view(), name='branch_detail'),
]
