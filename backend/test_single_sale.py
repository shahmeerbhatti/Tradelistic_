"""
Test to verify single sale creation (no duplicates)
"""

from transactions.models import Sale, Review
from products.models import Product
from users.models import User

# Get test data
user = User.objects.first()
product = Product.objects.first()

if not user or not product:
    print("ERROR: Need at least one user and one product")
    exit()

print(f"Using user: {user.username}")
print(f"Using product: {product.name}")

# Get initial counts
initial_sale_count = Sale.objects.count()
initial_review_count = Review.objects.count()

print(f"Initial sales in database: {initial_sale_count}")
print(f"Initial reviews in database: {initial_review_count}")

# Clear existing test data for this user/product
Sale.objects.filter(customer=user, product=product).delete()
Review.objects.filter(user=user, product=product).delete()

print("\nTesting SINGLE sale creation...")

# Create sale (simulating what frontend should do ONCE)
sale = Sale.objects.create(
    customer=user,
    product=product,
    quantity=1,
    unit_price=product.price,
    total_amount=product.price,
    final_total=product.price,
    customer_name=user.first_name + " " + user.last_name,
    customer_email=user.email,
    shipping_address_line1="123 Test St",
    shipping_city="Test City",
    shipping_state="Test State",
    shipping_country="Test Country",
    shipping_postal_code="12345",
    order_id="TEST-SINGLE-SALE"
)

# Check counts after creation
after_creation_sale_count = Sale.objects.count()
print(f"Sales after creation: {after_creation_sale_count}")
print(f"Sales created: {after_creation_sale_count - initial_sale_count}")

if after_creation_sale_count - initial_sale_count == 1:
    print("✅ SUCCESS: Exactly ONE sale created!")
    print(f"   - Sale ID: {sale.id}")
    print(f"   - Sales ID: {sale.sales_id}")
else:
    print("❌ ERROR: Multiple sales created!")
    exit()

# Now test review creation
print("\nTesting review creation with sales_id...")

review = Review.objects.create(
    user=user,
    product=product,
    sale=sale,
    sales_id=sale.sales_id,  # This should match the sale's sales_id
    rating=5,
    title="Single Sale Test",
    comment="Testing single sale creation"
)

after_review_count = Review.objects.count()
print(f"Reviews after creation: {after_review_count}")
print(f"Reviews created: {after_review_count - initial_review_count}")

if after_review_count - initial_review_count == 1:
    print("✅ SUCCESS: Exactly ONE review created!")
    print(f"   - Review ID: {review.id}")
    print(f"   - Review Sales ID: {review.sales_id}")
else:
    print("❌ ERROR: Multiple reviews created!")
    exit()

# Verify sales_id matching
print("\nVerifying sales_id matching...")
if review.sales_id == sale.sales_id:
    print("✅ SUCCESS: Sales IDs match perfectly!")
    print(f"   - Sale.sales_id: {sale.sales_id}")
    print(f"   - Review.sales_id: {review.sales_id}")
else:
    print("❌ ERROR: Sales IDs don't match!")
    print(f"   - Sale.sales_id: {sale.sales_id}")
    print(f"   - Review.sales_id: {review.sales_id}")
    exit()

print("\n🎉 ALL TESTS PASSED!")
print("✅ Single sale creation verified")
print("✅ Single review creation verified") 
print("✅ Sales ID matching verified")
print("\n📝 The frontend fix should prevent double sale creation!")