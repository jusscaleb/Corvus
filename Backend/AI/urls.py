from django.urls import path
from .views import (
    GenerateDraftView,
    ArticleAIWorkspaceView,
    ArticleMindmapGenerateView,
    ArticleBoardView,
    ArticleReviewView,
    AgentChatView,
    AgentMemoryListCreateView,
    AgentMemoryDeleteView,
)

urlpatterns = [
    path('generate-draft/', GenerateDraftView.as_view(), name='ai_generate_draft'),
    path('articles/<str:article_id>/workspace/', ArticleAIWorkspaceView.as_view(), name='ai_article_workspace'),
    path('articles/<str:article_id>/mindmap/', ArticleMindmapGenerateView.as_view(), name='ai_article_mindmap'),
    path('articles/<str:article_id>/board/', ArticleBoardView.as_view(), name='ai_article_board'),
    path('articles/<str:article_id>/review/', ArticleReviewView.as_view(), name='ai_article_review'),
    path('chat/', AgentChatView.as_view(), name='ai_agent_chat'),
    path('memories/', AgentMemoryListCreateView.as_view(), name='ai_agent_memories'),
    path('memories/<str:memory_id>/', AgentMemoryDeleteView.as_view(), name='ai_agent_memory_delete'),
]
