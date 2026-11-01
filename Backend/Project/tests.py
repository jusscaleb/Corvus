import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from Newsroom.models import Group, Member
from .models import Article, Branch

User = get_user_model()


class ProjectTests(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="editor1",
            full_name="Editor One",
            email="editor1@example.com",
            password="testPassword123!",
        )
        self.token1 = str(RefreshToken.for_user(self.user1).access_token)

        self.user2 = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="outsider",
            full_name="Outsider User",
            email="outsider@example.com",
            password="testPassword123!",
        )
        self.token2 = str(RefreshToken.for_user(self.user2).access_token)

        # Create Newsroom group with user1 as member
        self.group = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Tech Newsroom",
        )
        Member.objects.create(member=self.user1, group=self.group)

        # Auth with user1
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')

    def test_create_article_auto_seeds_main_branch(self):
        url = reverse('group_article_list_create', kwargs={'group_id': self.group.group_id})
        data = {"title": "AI in Journalism 2026"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "AI in Journalism 2026")
        self.assertEqual(response.data['branch_count'], 1)

        # Confirm 'main' branch was created
        article_id = response.data['article_id']
        main_branch = Branch.objects.get(article_id=article_id, is_main=True)
        self.assertEqual(main_branch.branch_name, 'main')

    def test_non_group_member_cannot_access_articles(self):
        # Authenticate with outsider
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        url = reverse('group_article_list_create', kwargs={'group_id': self.group.group_id})

        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_403_FORBIDDEN)

        post_res = self.client.post(url, {"title": "Unauthorized Article"})
        self.assertEqual(post_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_article_list(self):
        # Create an article in user1's group
        Article.objects.create(
            title="Harare Infrastructure Report",
            group=self.group,
            author=self.user1,
        )
        url = reverse('user_article_list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], "Harare Infrastructure Report")

        # Outsider user has no access to user1's group articles
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        res2 = self.client.get(url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res2.data), 0)

    def test_fork_branch_and_update_content(self):
        # Create article first
        article = Article.objects.create(
            title="Harare Infrastructure Report",
            group=self.group,
            author=self.user1,
        )
        Branch.objects.create(
            branch_name="main",
            article=article,
            created_by=self.user1,
            is_main=True,
        )

        # Fork new branch
        branch_list_url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})
        branch_data = {
            "branch_name": "feature/water-supply-investigation",
            "branch_description": "Drafting investigative angle on water supply",
            "content": "Initial draft observations...",
        }
        res = self.client.post(branch_list_url, branch_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['branch_name'], "feature/water-supply-investigation")
        self.assertFalse(res.data['is_main'])

        # Update branch content (writing workflow)
        branch_id = res.data['branch_id']
        detail_url = reverse('branch_detail', kwargs={'branch_id': branch_id})
        patch_res = self.client.patch(detail_url, {"content": "Updated comprehensive investigative findings."})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['content'], "Updated comprehensive investigative findings.")
