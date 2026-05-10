import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import Product, CATEGORY_CHOICES

class Command(BaseCommand):
    help = 'Add 100 random products with different categories'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        # Get or create a default exporter user
        exporter, _ = User.objects.get_or_create(
            username='default_exporter',
            defaults={'email': 'exporter@example.com', 'user_type': 'exporter', 'password': 'exporter123'}
        )
        categories = [c[0] for c in CATEGORY_CHOICES]
        for i in range(100):
            name = f'Product {i+1}'
            description = f'This is a description for product {i+1}.'
            price = round(random.uniform(10, 1000), 2)
            category = random.choice(categories)
            Product.objects.create(
                name=name,
                description=description,
                price=price,
                category=category,
                owner=exporter
            )
        self.stdout.write(self.style.SUCCESS('100 random products added.'))
