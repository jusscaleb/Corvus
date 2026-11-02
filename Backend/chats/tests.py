import uuid
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from Newsroom.models import Group, Member
from .models import ChatConversation

User = get_user_model()


class ChatsTestSuite(APITestCase):
    def setUp(self):
        # Create user 1
        self.user1 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="reporter1",
            full_name="Reporter One",
            email="reporter1@example.com",
            password="testPassword123!",
        )
        self.token1 = str(RefreshToken.for_user(self.user1).access_token)

        # Create user 2
        self.user2 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="editor2",
            full_name="Editor Two",
            email="editor2@example.com",
            password="testPassword123!",
        )
        self.token2 = str(RefreshToken.for_user(self.user2).access_token)

        # Create Newsroom Group
        self.group = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Investigative Desk",
        )
        Member.objects.create(member=self.user1, group=self.group)

        # Authenticate user 1 by default
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')

    def test_relational_chat_conversation_model(self):
        """Tests the RDBMS ChatConversation model creation and participant assignment."""
        conv = ChatConversation.objects.create(
            type="direct",
            title="Private Discussion",
        )
        conv.participants.add(self.user1, self.user2)

        self.assertEqual(conv.participants.count(), 2)
        self.assertEqual(conv.type, "direct")
        self.assertTrue(ChatConversation.objects.filter(pk=conv.pk).exists())

    @patch('chats.views.get_user_conversations')
    def test_inbox_view_hydrates_participants(self, mock_get_convs):
        """Tests GET /api/chats/inbox/ hydrates participant profiles and handles dates."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        mock_get_convs.return_value = [
            {
                "_id": "conv_inbox_1",
                "conversation_id": "conv_inbox_1",
                "type": "direct",
                "title": "",
                "participants": [self.user1.pk, self.user2.pk],
                "newsroom_group_id": None,
                "created_at": now,
                "updated_at": now,
            }
        ]

        url = reverse('chat_inbox')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        conv = response.data[0]
        self.assertEqual(conv["conversation_id"], "conv_inbox_1")
        self.assertIn("other_participants", conv)
        self.assertEqual(len(conv["other_participants"]), 1)
        self.assertEqual(conv["other_participants"][0]["user_id"], str(self.user2.pk))
        self.assertEqual(conv["other_participants"][0]["username"], "editor2")

    @patch('chats.views.create_conversation')
    def test_create_direct_conversation_api(self, mock_create_conv):
        """Tests POST /api/chats/conversations/ for direct user-to-user chat."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        mock_create_conv.return_value = {
            "_id": "conv_mock_1",
            "conversation_id": "conv_mock_1",
            "type": "direct",
            "title": "",
            "participants": [self.user1.pk, self.user2.pk],
            "newsroom_group_id": None,
            "created_at": now,
            "updated_at": now,
        }

        url = reverse('conversation_list_create')
        data = {
            "type": "direct",
            "recipient_id": self.user2.pk,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["type"], "direct")
        mock_create_conv.assert_called_once()

    @patch('chats.views.get_conversations_collection')
    def test_direct_conversation_deduplication(self, mock_get_coll):
        """Tests that initiating a direct chat returns the existing one if already present."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        existing_doc = {
            "_id": "conv_existing_123",
            "conversation_id": "conv_existing_123",
            "type": "direct",
            "title": "",
            "participants": [str(self.user1.pk), str(self.user2.pk)],
            "newsroom_group_id": None,
            "created_at": now,
            "updated_at": now,
        }
        mock_coll = MagicMock()
        mock_coll.find_one.return_value = existing_doc
        mock_get_coll.return_value = mock_coll

        url = reverse('conversation_list_create')
        data = {
            "type": "direct",
            "recipient_id": str(self.user2.pk),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["conversation_id"], "conv_existing_123")
        self.assertEqual(response.data["type"], "direct")
        self.assertIn("other_participants", response.data)
        self.assertEqual(response.data["other_participants"][0]["user_id"], str(self.user2.pk))
        mock_coll.find_one.assert_called_once()

    @patch('chats.views.create_conversation')
    def test_create_group_conversation_checks_newsroom_membership(self, mock_create_conv):
        """Tests that creating a group conversation ensures the user belongs to that newsroom."""
        url = reverse('conversation_list_create')

        # User 1 belongs to self.group -> should succeed
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        mock_create_conv.return_value = {
            "_id": "conv_mock_group",
            "conversation_id": "conv_mock_group",
            "type": "group",
            "title": "Desk Chat",
            "participants": [self.user1.pk],
            "newsroom_group_id": self.group.group_id,
            "created_at": now,
            "updated_at": now,
        }
        res_ok = self.client.post(url, {
            "type": "group",
            "newsroom_group_id": self.group.group_id,
            "title": "Desk Chat",
        })
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # Authenticate as User 2 (not a member of self.group) -> should return 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        res_forbidden = self.client.post(url, {
            "type": "group",
            "newsroom_group_id": self.group.group_id,
        })
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

    @patch('chats.views.get_conversation_messages_page')
    def test_get_messages_history_api(self, mock_get_page):
        """Tests GET /api/chats/conversations/<id>/messages/ with pagination."""
        mock_get_page.return_value = (
            [
                {
                    "_id": "msg_1",
                    "conversation_id": "conv_test_123",
                    "sender_id": self.user1.pk,
                    "sender_type": "user",
                    "content": "Hello world",
                    "created_at": "2026-10-31T12:00:00Z",
                }
            ],
            False,
        )

        url = reverse('conversation_messages', kwargs={'conversation_id': 'conv_test_123'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("messages", response.data)
        self.assertIn("has_more", response.data)
        self.assertEqual(len(response.data["messages"]), 1)

    @patch('chats.views.save_chat_message')
    def test_post_message_api(self, mock_save_msg):
        """Tests POST /api/chats/conversations/<id>/messages/ storing message."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        mock_save_msg.return_value = {
            "_id": "msg_new",
            "conversation_id": "conv_test_123",
            "sender_id": self.user1.pk,
            "sender_type": "user",
            "content": "New headline draft ready.",
            "created_at": now,
        }

        url = reverse('conversation_messages', kwargs={'conversation_id': 'conv_test_123'})
        response = self.client.post(url, {"content": "New headline draft ready."})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user_message"]["content"], "New headline draft ready.")

    def test_unauthenticated_chat_access_rejected(self):
        """Tests that requests without a JWT token receive 401 Unauthorized."""
        self.client.credentials()  # Clear JWT token
        url = reverse('conversation_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
