from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from stores.models import Store


class ExportGuideApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='exporter_guide_test',
            email='exporter-guide@example.com',
            password='testpass123',
            user_type='exporter',
        )
        self.store = Store.objects.create(
            owner=self.user,
            seller_name='Guide Seller',
            name='Guide Store',
            description='Exporter guide test store',
            email='seller@example.com',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_countries_endpoint_returns_seeded_guides(self):
        response = self.client.get('/api/exporter-guides/countries')

        self.assertEqual(response.status_code, 200)
        country_codes = {item['exporterCountryCode'] for item in response.data['countries']}
        self.assertTrue({'PK', 'MY', 'CA', 'AU', 'SG', 'GB'}.issubset(country_codes))

    def test_readiness_marks_missing_company_items(self):
        response = self.client.get('/api/exporter-guides/PK/readiness')

        self.assertEqual(response.status_code, 200)
        missing_labels = {item['label'] for item in response.data['missingChecks']}
        self.assertIn('NTN', missing_labels)
        self.assertIn('PSW registration', missing_labels)
        self.assertIn('Authorized Dealer bank profile linking', missing_labels)
        self.assertIn('Commercial invoice template/document', missing_labels)
        self.assertIn('Packing list template/document', missing_labels)

    def test_unsupported_country_returns_unavailable_state(self):
        response = self.client.get('/api/exporter-guides/US')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'unavailable')

    def test_foreign_importer_requirements_are_not_missing_exporter_docs(self):
        response = self.client.get('/api/exporter-guides/CA/readiness')

        self.assertEqual(response.status_code, 200)
        missing_labels = {item['label'] for item in response.data['missingChecks']}
        self.assertIn('Business Number', missing_labels)
        self.assertNotIn('Canadian importer must have Business Number/importer account', missing_labels)
        self.assertNotIn('UK EORI', missing_labels)
