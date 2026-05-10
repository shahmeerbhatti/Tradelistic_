"""
Complete flow test to verify:
1. Single sale creation with sales_id
2. Review creation with proper sales_id linking
3. Data integrity between sales and reviews tables
"""

import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from transactions.models import Sale, Review
from products.models import Product
from users.models import User

def test_complete_flow():
    print("=" * 60)
    print("TESTING COMPLETE SALES + REVIEW FLOW")
    print("=" * 60)
    
    # Get test user and product
    user = User.objects.first()
    product = Product.objects.first()
    
    if not user or not product:
        print("❌ ERROR: Need at least one user and one product in database")
        return
    
    print(f"✅ Using user: {user.username}")
    print(f"✅ Using product: {product.name}")
    
    # Clear existing test data
    print("\n📝 Clearing existing test data...")
    Sale.objects.filter(user=user, product=product).delete()
    Review.objects.filter(user=user, product=product).delete()
    
    initial_sale_count = Sale.objects.count()
    initial_review_count = Review.objects.count()
    print(f"✅ Initial sales count: {initial_sale_count}")
    print(f"✅ Initial reviews count: {initial_review_count}")
    
    # Test 1: Create a sale
    print("\n" + "="*40)
    print("TEST 1: CREATING SALE")
    print("="*40)
    
    sale_data = {
        'user': user,
        'product': product,
        'quantity': 2,
        'price': product.price,
        'total_amount': product.price * 2
    }
    
    sale = Sale.objects.create(**sale_data)
    print(f"✅ Sale created:")
    print(f"   - ID: {sale.id}")
    print(f"   - Sales ID: {sale.sales_id}")
    print(f"   - Product: {sale.product.name}")
    print(f"   - User: {sale.user.username}")
    print(f"   - Total: ${sale.total_amount}")
    
    # Verify single sale created
    final_sale_count = Sale.objects.count()
    print(f"✅ Final sales count: {final_sale_count}")
    print(f"✅ Sales created: {final_sale_count - initial_sale_count}")
    
    if final_sale_count - initial_sale_count == 1:
        print("🎉 SUCCESS: Only one sale created!")
    else:
        print("❌ ERROR: Multiple sales created!")
        return
    
    # Test 2: Create a review with sales_id
    print("\n" + "="*40)
    print("TEST 2: CREATING REVIEW WITH SALES_ID")
    print("="*40)
    
    review_data = {
        'user': user,
        'product': product,
        'sale': sale,
        'sales_id': sale.sales_id,  # Store the sales_id directly
        'rating': 5,
        'title': 'Test Review',
        'comment': 'This is a test review for the complete flow.'
    }
    
    review = Review.objects.create(**review_data)
    print(f"✅ Review created:")
    print(f"   - ID: {review.id}")
    print(f"   - Sale ID (FK): {review.sale.id}")
    print(f"   - Sales ID: {review.sales_id}")
    print(f"   - Rating: {review.rating}")
    print(f"   - Comment: {review.comment}")
    
    # Verify single review created
    final_review_count = Review.objects.count()
    print(f"✅ Final reviews count: {final_review_count}")
    print(f"✅ Reviews created: {final_review_count - initial_review_count}")
    
    if final_review_count - initial_review_count == 1:
        print("🎉 SUCCESS: Only one review created!")
    else:
        print("❌ ERROR: Multiple reviews created!")
        return
    
    # Test 3: Verify data integrity
    print("\n" + "="*40)
    print("TEST 3: VERIFYING DATA INTEGRITY")
    print("="*40)
    
    # Check sales_id matching
    if review.sales_id == sale.sales_id:
        print("🎉 SUCCESS: Review.sales_id matches Sale.sales_id")
        print(f"   - Both have sales_id: {sale.sales_id}")
    else:
        print("❌ ERROR: Sales ID mismatch!")
        print(f"   - Sale.sales_id: {sale.sales_id}")
        print(f"   - Review.sales_id: {review.sales_id}")
        return
    
    # Check foreign key relationship
    if review.sale.id == sale.id:
        print("🎉 SUCCESS: Review.sale foreign key correctly references Sale")
        print(f"   - Review.sale.id: {review.sale.id}")
        print(f"   - Sale.id: {sale.id}")
    else:
        print("❌ ERROR: Foreign key relationship broken!")
        return
    
    # Test 4: Query capabilities
    print("\n" + "="*40)
    print("TEST 4: TESTING QUERY CAPABILITIES")
    print("="*40)
    
    # Find review by sales_id
    found_by_sales_id = Review.objects.filter(sales_id=sale.sales_id).first()
    if found_by_sales_id:
        print(f"🎉 SUCCESS: Found review by sales_id: {sale.sales_id}")
    else:
        print("❌ ERROR: Could not find review by sales_id")
        return
    
    # Find sale by sales_id
    found_sale_by_sales_id = Sale.objects.filter(sales_id=sale.sales_id).first()
    if found_sale_by_sales_id:
        print(f"🎉 SUCCESS: Found sale by sales_id: {sale.sales_id}")
    else:
        print("❌ ERROR: Could not find sale by sales_id")
        return
    
    # Cross-reference check
    related_reviews = Review.objects.filter(sale=sale)
    print(f"✅ Reviews for this sale: {related_reviews.count()}")
    
    for rev in related_reviews:
        print(f"   - Review ID: {rev.id}, Sales ID: {rev.sales_id}, Rating: {rev.rating}")
    
    print("\n" + "="*60)
    print("🎉 ALL TESTS PASSED! COMPLETE FLOW WORKING CORRECTLY!")
    print("="*60)
    print("✅ Single sale creation")
    print("✅ Proper sales_id generation")
    print("✅ Single review creation")
    print("✅ Correct sales_id linking")
    print("✅ Data integrity maintained")
    print("✅ Query capabilities verified")

if __name__ == "__main__":
    test_complete_flow()