from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from transactions.models import Sale, Review
from products.models import Product
from decimal import Decimal
import random
from datetime import datetime, timedelta
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate sales and reviews data from existing review system users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing sales and reviews data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing sales and reviews data...')
            Review.objects.all().delete()
            Sale.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data.'))

        # Get all importer users (reviewers) and products
        reviewers = User.objects.filter(
            user_type='importer'
        ).exclude(
            city__isnull=True
        ).exclude(
            city=''
        ).exclude(
            state_country__isnull=True
        ).exclude(
            state_country=''
        )
        products = Product.objects.all()

        if not reviewers.exists():
            self.stdout.write(self.style.ERROR('No reviewer users found. Run populate_reviewers first.'))
            return

        if not products.exists():
            self.stdout.write(self.style.ERROR('No products found. Add some products first.'))
            return

        self.stdout.write(f'Found {reviewers.count()} reviewers and {products.count()} products.')

        # Review text templates
        review_templates = [
            {"rating": 5, "title": "Excellent Quality", "comment": "Excellent detail in pattern. Excellent stitchout.", "verified": True},
            {"rating": 5, "title": "Great Design", "comment": "Great design sewed out perfectly.", "verified": True},
            {"rating": 5, "title": "Perfect Results", "comment": "Great file, Came out perfectly.", "verified": False},
            {"rating": 5, "title": "Love It", "comment": "Loved the way this stitched out", "verified": True},
            {"rating": 5, "title": "As Described", "comment": "The font set matched the description and stitches well.", "verified": True},
            {"rating": 5, "title": "Highly Recommend", "comment": "Great purchase! Highly recommend, easy to use.", "verified": True},
            {"rating": 4, "title": "Good Quality", "comment": "Good quality product, exactly as described.", "verified": True},
            {"rating": 5, "title": "Perfect", "comment": "Perfect! Easy to use and great results.", "verified": True},
            {"rating": 4, "title": "Satisfied", "comment": "Very satisfied with this purchase. Will buy again.", "verified": False},
            {"rating": 5, "title": "Amazing", "comment": "Amazing quality and fast delivery. Highly recommended!", "verified": True},
            {"rating": 4, "title": "Good Product", "comment": "Good product overall, meets expectations.", "verified": True},
            {"rating": 5, "title": "Excellent", "comment": "Excellent craftsmanship and attention to detail.", "verified": True},
            {"rating": 5, "title": "Outstanding", "comment": "Outstanding product, exceeded my expectations!", "verified": False},
            {"rating": 4, "title": "Good Value", "comment": "Great value for money, would recommend to others.", "verified": True},
            {"rating": 5, "title": "Impressed", "comment": "Perfect fit and finish. Very impressed!", "verified": True}
        ]

        # Payment methods for realistic data
        payment_methods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer']
        
        sales_created = 0
        reviews_created = 0

        # For each product, create 20-30 sales with reviews
        for product in products:
            num_sales = random.randint(20, 30)
            # Ensure we don't exceed available reviewers for unique reviews
            num_sales = min(num_sales, len(reviewers))
            product_reviewers = random.sample(list(reviewers), num_sales)
            
            for i, reviewer in enumerate(product_reviewers):
                # Check if this user already has a review for this product
                existing_review = Review.objects.filter(user=reviewer, product=product).exists()
                if existing_review:
                    continue  # Skip if review already exists
                # Create a sale first
                order_date = timezone.now() - timedelta(days=random.randint(1, 180))
                delivered_date = order_date + timedelta(days=random.randint(1, 14))
                
                # Calculate pricing
                unit_price = product.price
                quantity = 1  # As requested, all quantities are 1
                subtotal = unit_price * quantity
                shipping_cost = Decimal(random.choice(['0.00', '5.99', '9.99', '12.99']))
                tax_rate = Decimal('0.08')  # 8% tax
                tax_amount = subtotal * tax_rate
                service_fee = Decimal(random.choice(['0.00', '1.99', '2.99']))
                final_total = subtotal + shipping_cost + tax_amount + service_fee

                # Generate order ID
                order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

                # Create shipping address based on user location
                address_templates = [
                    f"123 Main Street",
                    f"456 Oak Avenue",
                    f"789 Pine Road",
                    f"321 Elm Drive",
                    f"654 Maple Lane"
                ]

                sale = Sale.objects.create(
                    customer=reviewer,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_amount=subtotal,
                    shipping_cost=shipping_cost,
                    tax_amount=tax_amount,
                    service_fee=service_fee,
                    final_total=final_total,
                    customer_name=f"{reviewer.first_name} {reviewer.last_name}",
                    customer_email=reviewer.email,
                    customer_phone=f"+1-{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    shipping_address_line1=random.choice(address_templates),
                    shipping_city=reviewer.city or "Unknown City",
                    shipping_state=reviewer.state_country.split(',')[0].strip() if reviewer.state_country and ',' in reviewer.state_country else (reviewer.state_country or "Unknown State"),
                    shipping_country=reviewer.state_country.split(',')[-1].strip() if reviewer.state_country and ',' in reviewer.state_country else (reviewer.state_country or "Unknown Country"),
                    shipping_postal_code=f"{random.randint(10000, 99999)}",
                    payment_method=random.choice(payment_methods),
                    payment_status='completed',
                    order_id=order_id,
                    order_status='delivered',
                    created_at=order_date,
                    delivered_at=delivered_date,
                    notes=f"Order processed and delivered successfully to {reviewer.city or 'customer location'}"
                )
                sales_created += 1

                # Create a review for this sale (80% chance of having a review)
                if random.random() < 0.8:
                    template = random.choice(review_templates)
                    review_date = delivered_date + timedelta(days=random.randint(1, 30))
                    
                    review = Review.objects.create(
                        user=reviewer,
                        product=product,
                        sale=sale,
                        rating=template['rating'],
                        title=template['title'],
                        comment=template['comment'],
                        verified_purchase=template['verified'],
                        helpful_count=random.randint(0, 15),
                        is_approved=True,
                        is_featured=random.random() < 0.1,  # 10% chance of being featured
                        created_at=review_date
                    )
                    reviews_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {sales_created} sales and {reviews_created} reviews.\n'
                f'Database now contains:\n'
                f'- Users: {User.objects.count()}\n'
                f'- Products: {Product.objects.count()}\n'
                f'- Sales: {Sale.objects.count()}\n'
                f'- Reviews: {Review.objects.count()}'
            )
        )