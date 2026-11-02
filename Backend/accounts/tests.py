from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user_profile')
        self.password_reset_url = reverse('password_reset_request')
        self.password_confirm_url = reverse('password_reset_confirm')

        self.user_data = {
            "username": "testuser",
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "strongPassword123!",
            "password_confirm": "strongPassword123!",
            "preffered_language": "english",
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], self.user_data['email'])

    def test_registration_password_mismatch(self):
        invalid_data = self.user_data.copy()
        invalid_data['password_confirm'] = "differentPassword"
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)

    def test_jwt_login(self):
        self.client.post(self.register_url, self.user_data)

        response = self.client.post(self.login_url, {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_authenticated_profile_view(self):
        reg_res = self.client.post(self.register_url, self.user_data)
        token = reg_res.data['tokens']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        profile_res = self.client.get(self.profile_url)
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['email'], self.user_data['email'])

    def test_unauthenticated_profile_access_forbidden(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_reset_flow(self):
        self.client.post(self.register_url, self.user_data)

        reset_res = self.client.post(self.password_reset_url, {"email": self.user_data['email']})
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)
        uid = reset_res.data['uid']
        token = reset_res.data['token']

        confirm_res = self.client.post(self.password_confirm_url, {
            "uid": uid,
            "token": token,
            "new_password": "brandNewPassword123!",
            "new_password_confirm": "brandNewPassword123!",
        })
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        login_res = self.client.post(self.login_url, {
            "email": self.user_data['email'],
            "password": "brandNewPassword123!"
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

    def test_user_search_by_username_and_exclusion_of_self(self):
        reg_res = self.client.post(self.register_url, self.user_data)
        token = reg_res.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        colleague = User.objects.create_user(
            username="investigator_jane",
            full_name="Jane Doe",
            email="jane@example.com",
            password="passWord123!",
        )
        User.objects.create_user(
            username="investigator_ghost",
            full_name="Ghost User",
            email="ghost@example.com",
            password="passWord123!",
            is_active=False,
        )

        search_url = reverse('user_search')

        # 1. Search matching "jane"
        res = self.client.get(f"{search_url}?search=jane")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['username'], "investigator_jane")
        self.assertEqual(res.data[0]['user_id'], str(colleague.pk))
        # Ensure private credentials (email) are NOT leaked
        self.assertNotIn("email", res.data[0])

        # 2. Search matching "investigator" -> matches jane, excludes inactive ghost
        res_active = self.client.get(f"{search_url}?search=investigator")
        self.assertEqual(res_active.status_code, status.HTTP_200_OK)
        usernames = [u['username'] for u in res_active.data]
        self.assertIn("investigator_jane", usernames)
        self.assertNotIn("investigator_ghost", usernames)

        # 3. Requester (testuser) should never appear in results
        self.assertNotIn(self.user_data['username'], usernames)

    def test_user_search_unauthenticated_forbidden(self):
        search_url = reverse('user_search')
        res = self.client.get(search_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
