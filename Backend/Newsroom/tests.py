import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter

from .models import Group, Member
import Newsroom.routing

User = get_user_model()


class NewsroomTests(APITestCase):
    def setUp(self):
        # Create primary test user
        self.user1 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="editor1",
            full_name="Editor One",
            email="editor1@example.com",
            password="testPassword123!",
        )
        self.token1 = str(RefreshToken.for_user(self.user1).access_token)

        # Create secondary test user
        self.user2 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="reporter2",
            full_name="Reporter Two",
            email="reporter2@example.com",
            password="testPassword123!",
        )
        self.token2 = str(RefreshToken.for_user(self.user2).access_token)

        # Default auth headers with user1
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')

    def test_create_group_automatically_adds_creator_as_member(self):
        url = reverse('group_list_create')
        data = {
            "group_name": "Breaking News Desk",
            "group_description": "Handles daily breaking stories.",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['group_name'], "Breaking News Desk")
        self.assertEqual(response.data['member_number'], 1)
        self.assertTrue(Group.objects.filter(group_name="Breaking News Desk").exists())

        # Verify creator is a member in DB
        group_id = response.data['group_id']
        self.assertTrue(Member.objects.filter(group_id=group_id, member=self.user1).exists())

    def test_create_newsroom_with_minimum_three_members_success(self):
        user3 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="editor3",
            full_name="Editor Three",
            email="editor3@example.com",
            password="testPassword123!",
        )
        url = reverse('group_list_create')
        data = {
            "group_name": "Investigative Desk",
            "group_description": "Cross-border reporting.",
            "member_ids": [str(self.user2.pk), str(user3.pk)],
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['group_name'], "Investigative Desk")
        self.assertEqual(response.data['member_number'], 3)

        group_id = response.data['group_id']
        members = Member.objects.filter(group_id=group_id)
        self.assertEqual(members.count(), 3)
        member_user_ids = {str(m.member.pk) for m in members}
        self.assertEqual(member_user_ids, {str(self.user1.pk), str(self.user2.pk), str(user3.pk)})

    def test_create_newsroom_fails_if_less_than_three_members(self):
        url = reverse('group_list_create')
        # Only providing 1 other colleague (total members = 2)
        data = {
            "group_name": "Understaffed Desk",
            "member_ids": [str(self.user2.pk)],
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A newsroom requires at least 3 members", response.data['detail'])

        # Providing duplicates of the same member
        dup_data = {
            "group_name": "Duplicate Desk",
            "member_ids": [str(self.user2.pk), str(self.user2.pk)],
        }
        dup_response = self.client.post(url, dup_data, format='json')
        self.assertEqual(dup_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_groups_only_shows_user_groups(self):
        # User 1 creates group A
        group_a = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Politics",
        )
        Member.objects.create(member=self.user1, group=group_a)

        # User 2 creates group B
        group_b = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Sports",
        )
        Member.objects.create(member=self.user2, group=group_b)

        url = reverse('group_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['group_name'], "Politics")

    def test_add_and_remove_member(self):
        # Create group with user1
        group = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Culture",
        )
        Member.objects.create(member=self.user1, group=group)

        # Add user2 to group
        add_member_url = reverse('group_members_list_create', kwargs={'group_id': group.group_id})
        add_res = self.client.post(add_member_url, {"user_id": self.user2.user_id})
        self.assertEqual(add_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(group.member_number, 2)

        # Adding same member again should fail
        dup_res = self.client.post(add_member_url, {"user_id": self.user2.user_id})
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

        # List members
        list_res = self.client.get(add_member_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 2)

        # Remove user2
        del_member_url = reverse(
            'group_member_delete',
            kwargs={'group_id': group.group_id, 'user_id': self.user2.user_id}
        )
        del_res = self.client.delete(del_member_url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(group.member_number, 1)

    def test_unauthenticated_group_access_rejected(self):
        self.client.credentials()  # Clear auth
        url = reverse('group_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class VoiceSignalingTests(APITestCase):
    def setUp(self):
        self.application = URLRouter(Newsroom.routing.websocket_urlpatterns)
        self.user1 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="voice_peer_1",
            full_name="Journalist One",
            email="peer1@example.com",
            password="testPassword123!",
        )
        self.token1 = str(RefreshToken.for_user(self.user1).access_token)

        self.user2 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="voice_peer_2",
            full_name="Journalist Two",
            email="peer2@example.com",
            password="testPassword123!",
        )
        self.token2 = str(RefreshToken.for_user(self.user2).access_token)

    async def test_voice_signaling_unauthenticated_connection_rejected(self):
        communicator = WebsocketCommunicator(
            self.application,
            "/ws/rooms/session-123/voice/"
        )
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4401)
        await communicator.disconnect()

    async def test_voice_signaling_peer_join_and_notification(self):
        room_id = "mindmap-room-alpha"

        # Peer 1 connects
        comm1 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token1}"
        )
        connected1, _ = await comm1.connect()
        self.assertTrue(connected1)

        # Peer 2 connects
        comm2 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token2}"
        )
        connected2, _ = await comm2.connect()
        self.assertTrue(connected2)

        # Peer 2 sends join_room event
        await comm2.send_json_to({
            "type": "join_room",
            "room_id": room_id,
        })

        # Peer 1 should receive user_joined event for Peer 2
        response = await comm1.receive_json_from()
        self.assertEqual(response["type"], "user_joined")
        self.assertEqual(response["user_id"], str(self.user2.pk))
        self.assertEqual(response["user_name"], "Journalist Two")

        await comm1.disconnect()
        await comm2.disconnect()

    async def test_voice_signaling_offer_answer_and_ice_relay(self):
        room_id = "mindmap-room-beta"

        comm1 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token1}"
        )
        await comm1.connect()

        comm2 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token2}"
        )
        await comm2.connect()

        # Peer 1 sends offer targeted to Peer 2
        fake_offer_sdp = {"type": "offer", "sdp": "v=0\r\no=mock-sdp-offer"}
        await comm1.send_json_to({
            "type": "offer",
            "target_user_id": str(self.user2.pk),
            "sdp": fake_offer_sdp,
        })

        # Peer 2 should receive the offer
        offer_msg = await comm2.receive_json_from()
        self.assertEqual(offer_msg["type"], "offer")
        self.assertEqual(offer_msg["sender_user_id"], str(self.user1.pk))
        self.assertEqual(offer_msg["target_user_id"], str(self.user2.pk))
        self.assertEqual(offer_msg["sdp"], fake_offer_sdp)

        # Peer 2 sends answer targeted to Peer 1
        fake_answer_sdp = {"type": "answer", "sdp": "v=0\r\no=mock-sdp-answer"}
        await comm2.send_json_to({
            "type": "answer",
            "target_user_id": str(self.user1.pk),
            "sdp": fake_answer_sdp,
        })

        # Peer 1 should receive the answer
        answer_msg = await comm1.receive_json_from()
        self.assertEqual(answer_msg["type"], "answer")
        self.assertEqual(answer_msg["sender_user_id"], str(self.user2.pk))
        self.assertEqual(answer_msg["target_user_id"], str(self.user1.pk))
        self.assertEqual(answer_msg["sdp"], fake_answer_sdp)

        # Peer 1 sends ICE candidate
        fake_candidate = {"candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 5000 typ host", "sdpMid": "0"}
        await comm1.send_json_to({
            "type": "ice_candidate",
            "target_user_id": str(self.user2.pk),
            "candidate": fake_candidate,
        })

        # Peer 2 receives ICE candidate
        ice_msg = await comm2.receive_json_from()
        self.assertEqual(ice_msg["type"], "ice_candidate")
        self.assertEqual(ice_msg["candidate"], fake_candidate)

        await comm1.disconnect()
        await comm2.disconnect()

    async def test_voice_signaling_speaking_state_and_disconnect(self):
        room_id = "mindmap-room-gamma"

        comm1 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token1}"
        )
        await comm1.connect()

        comm2 = WebsocketCommunicator(
            self.application,
            f"/ws/rooms/{room_id}/voice/?access_token={self.token2}"
        )
        await comm2.connect()

        # Peer 1 sends speaking state update
        await comm1.send_json_to({
            "type": "speaking_state",
            "is_speaking": True,
            "is_muted": False,
        })

        speaking_msg = await comm2.receive_json_from()
        self.assertEqual(speaking_msg["type"], "speaking_state")
        self.assertEqual(speaking_msg["user_id"], str(self.user1.pk))
        self.assertTrue(speaking_msg["is_speaking"])
        self.assertFalse(speaking_msg["is_muted"])

        # Peer 2 disconnects -> Peer 1 receives user_left
        await comm2.disconnect()
        left_msg = await comm1.receive_json_from()
        self.assertEqual(left_msg["type"], "user_left")
        self.assertEqual(left_msg["user_id"], str(self.user2.pk))

        await comm1.disconnect()


    def test_active_voice_sessions_endpoint(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        url = reverse('active_voice_sessions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
