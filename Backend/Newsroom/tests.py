import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Group, Member

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
