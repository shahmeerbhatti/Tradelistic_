"""
Corrected test for sales and review functionality
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

# Clear existing test data
Sale.objects.filter(customer=user, product=product).delete()
Review.objects.filter(user=user, product=product).delete()

print("Creating sale...")
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
    order_id="TEST-ORDER-123"
)

print(f"Sale created - ID: {sale.id}, Sales ID: {sale.sales_id}")

print("Creating review...")
review = Review.objects.create(
    user=user,
    product=product,
    sale=sale,
    sales_id=sale.sales_id,
    rating=5,
    title="Test Review",
    comment="Test comment"
)

print(f"Review created - ID: {review.id}, Sales ID: {review.sales_id}")

# Verify matching
if review.sales_id == sale.sales_id:
    print("SUCCESS: Sales IDs match!")
else:
    print("ERROR: Sales IDs do not match!")

print(f"Sale sales_id: {sale.sales_id}")
print(f"Review sales_id: {review.sales_id}")

# Test query by sales_id
found_review = Review.objects.filter(sales_id=sale.sales_id).first()
if found_review:
    print("SUCCESS: Found review by sales_id!")
else:
    print("ERROR: Could not find review by sales_id!")