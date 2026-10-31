from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from Newsroom.models import Member

from .mongo_store import (
    MongoChatStoreUnavailable,
    create_conversation,
    get_user_conversations,
    save_chat_message,
    get_conversation_messages_page,
)


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get newsroom groups the user is member of
            group_ids = list(
                Member.objects.filter(member=request.user).values_list('group_id', flat=True)
            )
            conversations = get_user_conversations(request.user.pk, group_ids)
            for c in conversations:
                if isinstance(c.get("created_at"), object) and hasattr(c["created_at"], "isoformat"):
                    c["created_at"] = c["created_at"].isoformat()
                if isinstance(c.get("updated_at"), object) and hasattr(c["updated_at"], "isoformat"):
                    c["updated_at"] = c["updated_at"].isoformat()
            return Response(conversations, status=status.HTTP_200_OK)
        except MongoChatStoreUnavailable:
            return Response({"detail": "Chat database unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def post(self, request):
        conv_type = request.data.get("type")  # 'direct', 'group', 'ai'
        if conv_type not in ('direct', 'group', 'ai'):
            return Response({"detail": "Invalid conversation type."}, status=status.HTTP_400_BAD_REQUEST)

        participants = [request.user.pk]
        newsroom_group_id = None

        if conv_type == 'direct':
            recipient_id = request.data.get("recipient_id")
            if not recipient_id:
                return Response({"detail": "recipient_id required for direct chat."}, status=status.HTTP_400_BAD_REQUEST)
            participants.append(recipient_id)

        elif conv_type == 'group':
            newsroom_group_id = request.data.get("newsroom_group_id")
            if not Member.objects.filter(member=request.user, group_id=newsroom_group_id).exists():
                return Response({"detail": "You do not belong to this newsroom group."}, status=status.HTTP_403_FORBIDDEN)

        try:
            doc = create_conversation(
                conv_type=conv_type,
                participants=participants,
                newsroom_group_id=newsroom_group_id,
                title=request.data.get("title", ""),
            )
            doc["created_at"] = doc["created_at"].isoformat()
            doc["updated_at"] = doc["updated_at"].isoformat()
            return Response(doc, status=status.HTTP_201_CREATED)
        except MongoChatStoreUnavailable:
            return Response({"detail": "Chat database unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        limit = min(max(int(request.query_params.get("limit", 20)), 1), 50)
        before_id = request.query_params.get("before")

        try:
            messages, has_more = get_conversation_messages_page(conversation_id, limit=limit, before_id=before_id)
            return Response({"messages": messages, "has_more": has_more}, status=status.HTTP_200_OK)
        except MongoChatStoreUnavailable:
            return Response({"detail": "Chat database unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def post(self, request, conversation_id):
        content = request.data.get("content")
        if not content or not content.strip():
            return Response({"detail": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            msg = save_chat_message(
                conversation_id=conversation_id,
                sender_id=request.user.pk,
                sender_type="user",
                content=content,
            )
            if hasattr(msg["created_at"], "isoformat"):
                msg["created_at"] = msg["created_at"].isoformat()
            return Response(msg, status=status.HTTP_201_CREATED)
        except MongoChatStoreUnavailable:
            return Response({"detail": "Chat database unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
