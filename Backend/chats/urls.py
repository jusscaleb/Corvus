from django.urls import path
from .views import (
    InboxView,
    ConversationListCreateView,
    MessageListCreateView,
)

urlpatterns = [
    path('inbox/', InboxView.as_view(), name='chat_inbox'),
    path('conversations/', ConversationListCreateView.as_view(), name='conversation_list_create'),
    path('conversations/<str:conversation_id>/messages/', MessageListCreateView.as_view(), name='conversation_messages'),
]
