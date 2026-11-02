import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication

from .mongo_store import save_chat_message


@database_sync_to_async
def get_user_from_token(token):
    try:
        authenticator = JWTAuthentication()
        validated_token = authenticator.get_validated_token(token)
        return authenticator.get_user(validated_token)
    except Exception:
        return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f"chat_{self.conversation_id}"

        query = parse_qs(self.scope.get('query_string', b'').decode('utf-8'))
        token = query.get('access_token', [None])[0]

        if not token:
            await self.close(code=4401)
            return

        user = await get_user_from_token(token)
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.scope['user'] = user

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content', '').strip()
            if not content:
                return

            user = self.scope['user']

            saved_msg = await sync_to_async(save_chat_message)(
                conversation_id=self.conversation_id,
                sender_id=user.pk,
                sender_type="user",
                content=content,
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message_broadcast",
                    "message": {
                        "id": saved_msg["_id"],
                        "conversation_id": self.conversation_id,
                        "sender_id": str(user.pk),
                        "sender_username": user.username,
                        "sender_type": "user",
                        "content": content,
                        "created_at": (
                            saved_msg["created_at"].isoformat()
                            if hasattr(saved_msg["created_at"], "isoformat")
                            else str(saved_msg["created_at"])
                        ),
                    },
                },
            )
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def voice_call_status(self, event):
        await self.send(text_data=json.dumps(event["message"]))
