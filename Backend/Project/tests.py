import uuid
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from Newsroom.models import Group, Member
from .models import Article, Branch, ArticleTranslation

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

        # Create Newsroom group with user1 as member and also add user2 as a member for visibility tests
        self.group = Group.objects.create(
            group_id=str(uuid.uuid4()),
            group_name="Tech Newsroom",
        )
        Member.objects.create(member=self.user1, group=self.group)
        Member.objects.create(member=self.user2, group=self.group)

        # Auth with user1 for most tests
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
        # Authenticate with outsider (already a group member now, so test with a fresh user)
        outsider = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="noaccess",
            full_name="No Access",
            email="noaccess@example.com",
            password="testPassword123!",
        )
        outsider_token = str(RefreshToken.for_user(outsider).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {outsider_token}')
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

        # A non-member has no access to user1's group articles
        outsider = User.objects.create_user(
            user_id=str(uuid.uuid4()),
            username="noaccess2",
            full_name="No Access Two",
            email="noaccess2@example.com",
            password="testPassword123!",
        )
        outsider_token = str(RefreshToken.for_user(outsider).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {outsider_token}')
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
            branch_name='main',
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

    def test_create_personal_article_without_group(self):
        url = reverse('user_article_list')
        data = {"title": "My Private Confidential Lead"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "My Private Confidential Lead")
        self.assertIsNone(response.data['group'])
        self.assertEqual(response.data['branch_count'], 1)

        article_id = response.data['article_id']
        main_branch = Branch.objects.get(article_id=article_id, is_main=True)
        self.assertEqual(main_branch.branch_name, 'main')

        # Outsider user cannot view this personal article
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        detail_url = reverse('article_detail', kwargs={'article_id': article_id})
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_push_branch_makes_it_public_and_visible(self):
        # Create article and a private branch
        article = Article.objects.create(
            title="Public Push Test",
            group=self.group,
            author=self.user1,
        )
        Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
        )
        private_branch = Branch.objects.create(
            branch_name='feature/private',
            article=article,
            created_by=self.user1,
            is_main=False,
            is_public=False,
        )
        # Push the private branch
        push_url = reverse('branch_push', kwargs={'branch_id': private_branch.branch_id})
        push_res = self.client.post(push_url)
        self.assertEqual(push_res.status_code, status.HTTP_200_OK)
        self.assertTrue(push_res.data['is_public'])

        # Now as user2 (also a group member) fetch branch list and see the branch
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        branch_list_url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})
        list_res = self.client.get(branch_list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        # The pushed branch should be present
        branch_ids = [b['branch_id'] for b in list_res.data]
        self.assertIn(private_branch.branch_id, branch_ids)

    def test_branch_diff_endpoint_returns_content(self):
        article = Article.objects.create(
            title="Diff Test",
            group=self.group,
            author=self.user1,
        )
        Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
        )
        branch = Branch.objects.create(
            branch_name='feature/diff',
            article=article,
            created_by=self.user1,
            is_main=False,
            content='Original content',
        )
        diff_url = reverse('branch_diff', kwargs={'branch_id': branch.branch_id})
        diff_res = self.client.get(diff_url)
        self.assertEqual(diff_res.status_code, status.HTTP_200_OK)
        self.assertIn('diff', diff_res.data)
        self.assertEqual(diff_res.data['diff'], 'Original content')

    def test_private_branch_hidden_from_other_members_until_pushed(self):
        article = Article.objects.create(title="Privacy Test", group=self.group, author=self.user1)
        Branch.objects.create(branch_name='main', article=article, created_by=self.user1, is_main=True)
        private_branch = Branch.objects.create(
            branch_name='feature/secret',
            article=article,
            created_by=self.user1,
            is_public=False,
        )
        list_url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})

        # Creator sees their own private branch
        own_ids = [b['branch_id'] for b in self.client.get(list_url).data]
        self.assertIn(private_branch.branch_id, own_ids)

        # Another member does not see it, but still sees main
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        other = self.client.get(list_url).data
        other_ids = [b['branch_id'] for b in other]
        self.assertNotIn(private_branch.branch_id, other_ids)
        self.assertTrue(any(b['is_main'] for b in other))

    # â”€â”€â”€ Backend review fixes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _article_with_private_branch(self):
        article = Article.objects.create(title="Review Fix Test", group=self.group, author=self.user1)
        Branch.objects.create(branch_name='main', article=article, created_by=self.user1, is_main=True)
        private = Branch.objects.create(
            branch_name='feature/secret', article=article, created_by=self.user1,
            content='Confidential draft', is_public=False,
        )
        return article, private

    def test_article_list_does_not_leak_private_branches(self):
        article, private = self._article_with_private_branch()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        res = self.client.get(reverse('user_article_list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = next(a for a in res.data if a['article_id'] == article.article_id)
        # Only main is embedded, and the private branch isn't counted
        self.assertEqual([b['branch_name'] for b in data['branches']], ['main'])
        self.assertEqual(data['branch_count'], 1)
        self.assertNotIn('Confidential draft', str(res.data))

        # The creator still counts their own private branch
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        res = self.client.get(reverse('user_article_list'))
        data = next(a for a in res.data if a['article_id'] == article.article_id)
        self.assertEqual(data['branch_count'], 2)

    def test_duplicate_branch_name_returns_400_not_500(self):
        article, _ = self._article_with_private_branch()
        url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})
        # user2 can't see feature/secret, but the name is still taken (case-insensitive)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        res = self.client.post(url, {"branch_name": "Feature/Secret"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already exists', res.data['detail'])

    def test_branch_name_with_spaces_rejected(self):
        article, _ = self._article_with_private_branch()
        url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})
        res = self.client.post(url, {"branch_name": "has spaces"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_branch_is_private_even_if_client_says_public(self):
        article, _ = self._article_with_private_branch()
        url = reverse('article_branch_list_create', kwargs={'article_id': article.article_id})
        res = self.client.post(url, {"branch_name": "feature/sneaky", "is_public": True})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data['is_public'])

    def test_only_creator_can_push_branch(self):
        _, private = self._article_with_private_branch()
        push_url = reverse('branch_push', kwargs={'branch_id': private.branch_id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        res = self.client.post(push_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        private.refresh_from_db()
        self.assertFalse(private.is_public)

    def test_other_member_cannot_read_or_edit_private_branch(self):
        _, private = self._article_with_private_branch()
        detail_url = reverse('branch_detail', kwargs={'branch_id': private.branch_id})
        diff_url = reverse('branch_diff', kwargs={'branch_id': private.branch_id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(detail_url, {"content": "hijack"}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(diff_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_rename_branch_to_existing_name_returns_400(self):
        article, private = self._article_with_private_branch()
        other = Branch.objects.create(branch_name='feature/other', article=article, created_by=self.user1)
        detail_url = reverse('branch_detail', kwargs={'branch_id': other.branch_id})
        res = self.client.patch(detail_url, {"branch_name": "feature/secret"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_article_list_query_count_does_not_grow_with_articles(self):
        for i in range(5):
            a = Article.objects.create(title=f"Bulk {i}", group=self.group, author=self.user1)
            Branch.objects.create(branch_name='main', article=a, created_by=self.user1, is_main=True)
        url = reverse('user_article_list')
        with self.assertNumQueries(self._count_queries(url)):
            Article.objects.create(title="One more", group=self.group, author=self.user1)
            self.client.get(url)

    def _count_queries(self, url):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext
        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url)
        return len(ctx.captured_queries) + 1  # +1 for the Article insert inside the block

    def test_newsroom_article_appears_to_all_members_in_newsroom(self):
        # User 1 creates an article in the shared newsroom via the group endpoint
        create_url = reverse('group_article_list_create', kwargs={'group_id': self.group.group_id})
        res = self.client.post(create_url, {"title": "Shared Newsroom Investigation"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        article_id = res.data['article_id']
        self.assertEqual(res.data['group_name'], self.group.group_name)

        # User 2 (another member of the same newsroom) fetches both the global article feed
        # and the group-specific article list and sees the article with its newsroom name
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        global_res = self.client.get(reverse('user_article_list'))
        self.assertEqual(global_res.status_code, status.HTTP_200_OK)
        matching = [a for a in global_res.data if a['article_id'] == article_id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]['title'], "Shared Newsroom Investigation")
        self.assertEqual(matching[0]['group_name'], self.group.group_name)

        group_res = self.client.get(create_url)
        self.assertEqual(group_res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(a['article_id'] == article_id for a in group_res.data))

    def test_publish_article_workflow_and_public_visibility(self):
        # 1. Author creates an article
        article = Article.objects.create(title="Breaking Water Report", group=self.group, author=self.user1)
        main_branch = Branch.objects.create(
            branch_name='main',
            content='Full investigation report details.',
            branch_description='Water crisis investigation',
            article=article,
            created_by=self.user1,
            is_main=True,
            is_public=False,
        )

        publish_url = reverse('article_publish', kwargs={'article_id': article.article_id})
        public_url = reverse('public_article_list')

        # 2. Before publishing, verify unauthenticated public list does NOT return this unpublished article
        self.client.credentials()  # unauthenticated
        res_before = self.client.get(public_url)
        self.assertEqual(res_before.status_code, status.HTTP_200_OK)
        self.assertFalse(any(a['article_id'] == article.article_id for a in res_before.data))

        # 3. Unauthorized outsider cannot publish
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        # remove user2 from group temporarily
        Member.objects.filter(member=self.user2, group=self.group).delete()
        fail_res = self.client.post(publish_url)
        self.assertEqual(fail_res.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Author publishes the article
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        pub_res = self.client.post(publish_url, {"force": True})
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        self.assertTrue(pub_res.data['is_published'])

        # Refresh from db
        article.refresh_from_db()
        self.assertTrue(article.is_published)
        self.assertIsNotNone(article.published_at)

        # 5. Public portal now lists the published article with content
        self.client.credentials()  # unauthenticated
        res_after = self.client.get(public_url)
        self.assertEqual(res_after.status_code, status.HTTP_200_OK)
        published_match = [a for a in res_after.data if a['article_id'] == article.article_id]
        self.assertEqual(len(published_match), 1)
        self.assertEqual(published_match[0]['title'], "Breaking Water Report")
        self.assertTrue(published_match[0]['is_published'])

        # 6. Author unpublishes the article
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        unpub_res = self.client.post(publish_url, {"action": "unpublish"})
        self.assertEqual(unpub_res.status_code, status.HTTP_200_OK)
        self.assertFalse(unpub_res.data['is_published'])

        article.refresh_from_db()
        self.assertFalse(article.is_published)
        self.assertIsNone(article.published_at)

        # 7. Public portal no longer shows it
        self.client.credentials()
        res_unpub = self.client.get(public_url)
        self.assertFalse(any(a['article_id'] == article.article_id for a in res_unpub.data))

    @patch('Project.views.translate_text')
    def test_article_translation_and_caching_workflow(self, mock_translate):
        # Mock translate function to return simulated Shona and Ndebele text
        def fake_translate(text, target_language, source_language='auto'):
            if target_language == 'sn':
                return f"[SN] {text}"
            elif target_language == 'nd':
                return f"[ND] {text}"
            return text
        mock_translate.side_effect = fake_translate

        # 1. Create and publish an article with main branch content
        article = Article.objects.create(
            title="Clean Water for Bulawayo Suburbs",
            group=self.group,
            author=self.user1,
            is_published=True,
        )
        Branch.objects.create(
            branch_name='main',
            branch_description='Water reservoir repair updates',
            content='Municipal engineers have successfully repaired the main water valve.',
            is_main=True,
            is_public=True,
            article=article,
            created_by=self.user1,
        )

        translate_url = reverse('article_translate', kwargs={'article_id': article.article_id})

        # 2. Translate to Shona (unauthenticated public user)
        self.client.credentials()
        res_sn = self.client.get(f"{translate_url}?lang=sn")
        self.assertEqual(res_sn.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sn.data['language_code'], 'sn')
        self.assertEqual(res_sn.data['title'], "[SN] Clean Water for Bulawayo Suburbs")
        self.assertEqual(res_sn.data['content'], "[SN] Municipal engineers have successfully repaired the main water valve.")
        self.assertFalse(res_sn.data['cached'])
        self.assertTrue(mock_translate.called)

        # 3. Verify it was persisted to ArticleTranslation in database
        db_translation = ArticleTranslation.objects.get(article=article, language_code='sn')
        self.assertEqual(db_translation.title, "[SN] Clean Water for Bulawayo Suburbs")

        # 4. Request again: must return cached version with zero external AI calls
        mock_translate.reset_mock()
        res_cached = self.client.get(f"{translate_url}?lang=sn")
        self.assertEqual(res_cached.status_code, status.HTTP_200_OK)
        self.assertTrue(res_cached.data['cached'])
        self.assertEqual(res_cached.data['title'], "[SN] Clean Water for Bulawayo Suburbs")
        self.assertFalse(mock_translate.called)

        # 5. Query public article list with ?lang=sn
        public_url = reverse('public_article_list')
        res_pub_sn = self.client.get(f"{public_url}?lang=sn")
        self.assertEqual(res_pub_sn.status_code, status.HTTP_200_OK)
        art_data = next(a for a in res_pub_sn.data if a['article_id'] == article.article_id)
        self.assertEqual(art_data['translated_title'], "[SN] Clean Water for Bulawayo Suburbs")
        self.assertEqual(art_data['translated_content'], "[SN] Municipal engineers have successfully repaired the main water valve.")

        # 6. Request in English returns canonical without calling translation
        res_en = self.client.get(f"{translate_url}?lang=en")
        self.assertEqual(res_en.status_code, status.HTTP_200_OK)
        self.assertEqual(res_en.data['title'], "Clean Water for Bulawayo Suburbs")
        self.assertTrue(res_en.data['cached'])
    # ─── Offline SMS Dispatch (AI Summary + Twilio) ───────────────────────

    def test_profile_phone_number_update_and_validation(self):
        profile_url = reverse('user_profile')
        # Valid phone number with spaces is normalized to compact E.164
        res = self.client.patch(profile_url, {"phone_number": "+263 77 123 4567"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['phone_number'], '+263771234567')
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.phone_number, '+263771234567')

        # Invalid phone number is rejected with 400
        bad_res = self.client.patch(profile_url, {"phone_number": "not-a-phone"})
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)


    def test_sms_short_circuits_when_no_members_have_phone_numbers(self):
        from unittest.mock import patch
        from Project.sms_service import notify_newsroom_branch_published

        _, private_branch = self._article_with_private_branch()
        with patch('Project.sms_service.chat_with_groq') as mock_ai, patch(
            'Project.sms_service.send_twilio_sms'
        ) as mock_twilio:
            result = notify_newsroom_branch_published(
                private_branch,
                pushed_by=self.user1,
                async_dispatch=False,
            )
            self.assertFalse(result['queued'])
            self.assertEqual(result['recipient_count'], 0)
            mock_ai.assert_not_called()
            mock_twilio.assert_not_called()

    def test_branch_diff_with_compare_parameter(self):
        """Feature: Branch diff with ?compare=<branch_id> returns structured chunks and stats."""
        article = Article.objects.create(title="Branch Diff Compare Test", group=self.group, author=self.user1)
        main_branch = Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
            content='Harare council approved annual budget.\nContext line.',
        )
        investigative = Branch.objects.create(
            branch_name='investigative',
            article=article,
            created_by=self.user1,
            is_main=False,
            content='Harare council approved annual budget.\nAudit exposes $12M unverified payments.\nContext line.',
        )
        url = reverse('branch_diff', kwargs={'branch_id': main_branch.branch_id})
        res = self.client.get(f"{url}?compare={investigative.branch_id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('chunks', res.data)
        self.assertIn('stats', res.data)
        self.assertEqual(res.data['stats']['added_lines'], 1)

    def test_branch_merge_with_creator_permission_allowed(self):
        """Feature: Branch author can merge their own branch into target branch."""
        article = Article.objects.create(title="Merge Creator Test", group=self.group, author=self.user1)
        main_branch = Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
            content='Original main content.',
        )
        feature_branch = Branch.objects.create(
            branch_name='feature-draft',
            article=article,
            created_by=self.user1,
            is_main=False,
            content='Merged polished report.',
        )
        merge_url = reverse('branch_merge', kwargs={'branch_id': main_branch.branch_id})
        res = self.client.post(merge_url, {"source_branch_id": feature_branch.branch_id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        main_branch.refresh_from_db()
        self.assertEqual(main_branch.content, 'Merged polished report.')
        self.assertEqual(main_branch.status, 'merged')

    def test_branch_merge_by_non_creator_without_permission_forbidden(self):
        """Feature: Merging another journalist's branch without creator permission is blocked with 403."""
        article = Article.objects.create(title="Merge Permission Guard Test", group=self.group, author=self.user1)
        main_branch = Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
            content='Main content.',
        )
        # Branch authored by user2
        user2_branch = Branch.objects.create(
            branch_name='user2-investigation',
            article=article,
            created_by=self.user2,
            is_main=False,
            is_public=True,
            content='User2 exclusive scoop.',
        )
        # user1 attempts to merge user2's branch into main without permission
        merge_url = reverse('branch_merge', kwargs={'branch_id': main_branch.branch_id})
        res = self.client.post(merge_url, {"source_branch_id": user2_branch.branch_id})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only the journalist who created this branch", res.data['detail'])

    def test_branch_merge_with_explicit_permission_granted(self):
        """Feature: Merging with explicit permission_granted=True succeeds."""
        article = Article.objects.create(title="Merge Explicit Permission Test", group=self.group, author=self.user1)
        main_branch = Branch.objects.create(
            branch_name='main',
            article=article,
            created_by=self.user1,
            is_main=True,
            content='Main content.',
        )
        user2_branch = Branch.objects.create(
            branch_name='user2-scoop',
            article=article,
            created_by=self.user2,
            is_main=False,
            is_public=True,
            content='User2 authorized merge content.',
        )
        merge_url = reverse('branch_merge', kwargs={'branch_id': main_branch.branch_id})
        res = self.client.post(merge_url, {
            "source_branch_id": user2_branch.branch_id,
            "permission_granted": True,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        main_branch.refresh_from_db()
        self.assertEqual(main_branch.content, 'User2 authorized merge content.')

    def test_article_peer_approval_workflow(self):
        """Feature: Newsroom peer approval recording, listing, and self-approval block."""
        from accounts.models import User
        article = Article.objects.create(title="Peer Approval Test", group=self.group, author=self.user1)
        approve_url = reverse('article_approve', kwargs={'article_id': article.article_id})

        # 1. Author cannot peer-approve their own article
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        self_res = self.client.post(approve_url)
        self.assertEqual(self_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Authors cannot peer-approve", self_res.data['detail'])

        # 2. Newsroom colleague (user2) grants approval
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        appr_res = self.client.post(approve_url)
        self.assertEqual(appr_res.status_code, status.HTTP_200_OK)
        self.assertEqual(appr_res.data['approval_count'], 1)

        # 3. Third newsroom member grants approval
        user3 = User.objects.create_user(username='colleague3', email='c3@news.org', password='Password123!')
        Member.objects.create(member=user3, group=self.group)
        token3 = str(AccessToken.for_user(user3))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token3}')
        appr3_res = self.client.post(approve_url)
        self.assertEqual(appr3_res.status_code, status.HTTP_200_OK)
        self.assertEqual(appr3_res.data['approval_count'], 2)

        # 4. List approvals
        list_res = self.client.get(approve_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['approval_count'], 2)

    def test_publishing_quality_gate_requires_passing_ai_review(self):
        """Feature: Publishing without passing AI Review is blocked with 400 Bad Request."""
        from AI.models import ArticleWorkspace
        article = Article.objects.create(title="AI Review Gate Test", group=self.group, author=self.user1)
        publish_url = reverse('article_publish', kwargs={'article_id': article.article_id})

        # No AI review exists
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        res = self.client.post(publish_url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Article must pass Saiph AI Review", res.data['detail'])

        # AI review exists but fails quality threshold (quality < 60)
        ws, _ = ArticleWorkspace.objects.get_or_create(article=article)
        ws.last_review = {"quality_score": 45, "plagiarism": {"score": 10}}
        ws.save()

        res_fail = self.client.post(publish_url)
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("editorial quality standards", res_fail.data['detail'])

    def test_publishing_peer_approvals_gate_requires_two_colleagues(self):
        """Feature: Publishing with passing AI review but fewer than 2 peer approvals is blocked."""
        from AI.models import ArticleWorkspace
        from accounts.models import User
        from Project.models import ArticleApproval

        article = Article.objects.create(title="Peer Approval Gate Test", group=self.group, author=self.user1)
        publish_url = reverse('article_publish', kwargs={'article_id': article.article_id})

        # Passing AI review
        ws, _ = ArticleWorkspace.objects.get_or_create(article=article)
        ws.last_review = {"quality_score": 88, "plagiarism": {"score": 5}}
        ws.save()

        # 0 peer approvals
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        res0 = self.client.post(publish_url)
        self.assertEqual(res0.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must be approved by at least 2 other journalists", res0.data['detail'])

        # 1 peer approval
        ArticleApproval.objects.create(article=article, user=self.user2)
        res1 = self.client.post(publish_url)
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Current: 1/2", res1.data['detail'])

        # 2 peer approvals
        user3 = User.objects.create_user(username='colleague_gate_3', email='cg3@news.org', password='Password123!')
        Member.objects.create(member=user3, group=self.group)
        ArticleApproval.objects.create(article=article, user=user3)

        # Publishing now succeeds!
        res2 = self.client.post(publish_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['is_published'])

    def test_article_translation_with_branch_id_parameter(self):
        """Feature: Translation endpoint accepts optional branch_id to translate active branch."""
        from unittest.mock import patch
        article = Article.objects.create(title="Branch Translation Test", group=self.group, author=self.user1, is_published=True)
        main_branch = Branch.objects.create(branch_name='main', article=article, created_by=self.user1, is_main=True, content='Main English text.')
        investigative = Branch.objects.create(branch_name='draft-v2', article=article, created_by=self.user1, is_main=False, content='Draft v2 exclusive facts.')

        with patch('Project.views.translate_text') as mock_t:
            mock_t.side_effect = lambda text, target_language, source_language='auto': f"[{target_language.upper()}] {text}"
            url = reverse('article_translate', kwargs={'article_id': article.article_id})
            res = self.client.get(f"{url}?lang=sn&branch_id={investigative.branch_id}")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertIn('[SN] Draft v2 exclusive facts.', res.data['content'])

