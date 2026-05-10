"""
Simple test to verify sales and review functionality using Django manage.py shell
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
Sale.objects.filter(user=user, product=product).delete()
Review.objects.filter(user=user, product=product).delete()

print("Creating sale...")
sale = Sale.objects.create(
    user=user,
    product=product,
    quantity=1,
    price=product.price,
    total_amount=product.price
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