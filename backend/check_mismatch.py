#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import connection
from transactions.models import Sale, Review

def check_sales_id_mismatch():
    print("=== Checking Sales ID Mismatch ===")
    
    # Check recent sales with their sales_id
    print("\nRecent Sales (transactions_sale):")
    recent_sales = Sale.objects.all().order_by('-created_at')[:5]
    for sale in recent_sales:
        print(f"  DB ID: {sale.id}, Sales_ID: {sale.sales_id}, Order: {sale.order_id}")
    
    # Check recent reviews and their sale references
    print("\nRecent Reviews (transactions_review):")
    recent_reviews = Review.objects.all().order_by('-created_at')[:5]
    for review in recent_reviews:
        sale_info = f"Sale DB ID: {review.sale.id}, Sales_ID: {review.sale.sales_id}" if review.sale else "No Sale"
        print(f"  Review ID: {review.id}, {sale_info}, Product: {review.product.name}")
    
    # Check if any reviews are linked
    reviews_with_sales = Review.objects.filter(sale__isnull=False).count()
    total_reviews = Review.objects.count()
    print(f"\nReviews linked to sales: {reviews_with_sales}/{total_reviews}")
    
    # Show the mismatch issue
    if recent_reviews.exists() and recent_reviews.first().sale:
        sample_review = recent_reviews.first()
        if sample_review.sale:
            print(f"\nMismatch Example:")
            print(f"  Review references Sale DB ID: {sample_review.sale.id}")
            print(f"  But Sale has Sales_ID: {sample_review.sale.sales_id}")
            print(f"  Frontend should use Sales_ID for consistency!")

if __name__ == '__main__':
    check_sales_id_mismatch()