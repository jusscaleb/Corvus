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
