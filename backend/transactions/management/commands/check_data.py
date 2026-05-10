from django.core.management.base import BaseCommand
from transactions.models import Sale, Review
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

class Command(BaseCommand):
    help = 'Check the created sales and reviews data'

    def handle(self, *args, **options):
        # Count records
        users_count = User.objects.count()
        products_count = Product.objects.count()
        sales_count = Sale.objects.count()
        reviews_count = Review.objects.count()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Database Summary:\n'
                f'- Total Users: {users_count}\n'
                f'- Total Products: {products_count}\n'
                f'- Total Sales: {sales_count}\n'
                f'- Total Reviews: {reviews_count}\n'
            )
        )
        
        # Show some sample sales
        sample_sales = Sale.objects.select_related('customer', 'product')[:3]
        self.stdout.write('\nSample Sales:')
        for sale in sample_sales:
            self.stdout.write(
                f'- Order {sale.order_id}: {sale.customer.first_name} {sale.customer.last_name} '
                f'bought {sale.product.name} for ${sale.final_total}'
            )
            
        # Show some sample reviews
        sample_reviews = Review.objects.select_related('user', 'product')[:3]
        self.stdout.write('\nSample Reviews:')
        for review in sample_reviews:
            self.stdout.write(
                f'- {review.user.first_name} rated {review.product.name} '
                f'{review.rating}/5: "{review.title}"'
            )
            
        # Check for users with both sales and reviews
        users_with_sales = User.objects.filter(sale_customer__isnull=False).distinct().count()
        users_with_reviews = User.objects.filter(review_set__isnull=False).distinct().count()
        
        self.stdout.write(
            f'\nUser Activity:\n'
            f'- Users with sales: {users_with_sales}\n'
            f'- Users with reviews: {users_with_reviews}\n'
        )