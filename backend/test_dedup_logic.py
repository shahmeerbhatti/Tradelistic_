"""
Test ProductView deduplication through Django shell
"""

from products.models import Product, ProductView
from django.utils import timezone
from datetime import timedelta

# Get a test product
product = Product.objects.first()
if not product:
    print("ERROR: No products found")
    exit()

print(f"Testing deduplication for product: {product.name}")

# Check initial view count
initial_views = ProductView.objects.filter(product=product).count()
print(f"Initial views: {initial_views}")

# Simulate the same user/IP making multiple requests
test_ip = "192.168.1.100"
test_session = "test-session-123"

print("\nCreating first view...")
view1 = ProductView.objects.create(
    product=product,
    user=None,
    ip_address=test_ip,
    user_agent="Test Browser",
    session_id=test_session,
    referrer=""
)
print(f"View 1 created at: {view1.viewed_at}")

# Check count after first view
after_first = ProductView.objects.filter(product=product).count()
print(f"Views after first: {after_first}")

# Now test the deduplication logic manually
print("\nTesting deduplication logic...")
recent_cutoff = timezone.now() - timedelta(minutes=5)

duplicate_filters = {
    'product': product,
    'viewed_at__gte': recent_cutoff,
    'ip_address': test_ip,
    'session_id': test_session
}

duplicate_found = ProductView.objects.filter(**duplicate_filters).exists()
print(f"Duplicate found within 5 minutes: {duplicate_found}")

if not duplicate_found:
    print("❌ No duplicate found - this shouldn't happen!")
    print("Creating second view...")
    view2 = ProductView.objects.create(
        product=product,
        user=None,
        ip_address=test_ip,
        user_agent="Test Browser",
        session_id=test_session,
        referrer=""
    )
    final_views = ProductView.objects.filter(product=product).count()
    print(f"Final views: {final_views}")
else:
    print("✅ Duplicate detected - second view would be skipped")
    print("This is the expected behavior!")

print("\n🎯 Deduplication test completed!")