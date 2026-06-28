from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class SignupTests(APITestCase):
    def test_importer_signup_sets_approved(self):
        response = self.client.post(reverse('signup-list'), {
            'username': 'importer-user',
            'email': 'importer@example.com',
            'password': 'pass12345',
            'user_type': 'importer',
            'city': 'Los Angeles',
            'state_country': 'California, USA',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.get(username='importer-user').is_approved)

    def test_exporter_signup_waits_for_approval(self):
        response = self.client.post(reverse('signup-list'), {
            'username': 'exporter-user',
            'email': 'exporter@example.com',
            'password': 'pass12345',
            'user_type': 'exporter',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(User.objects.get(username='exporter-user').is_approved)

    def test_signup_rejects_null_user_type(self):
        response = self.client.post(reverse('signup-list'), {
            'username': 'missing-type-user',
            'email': 'missing-type@example.com',
            'password': 'pass12345',
            'user_type': None,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='missing-type-user').exists())

# Create your tests here.
