"""
Test the complete fix for double ProductView counting
"""

from products.models import Product, ProductView
from django.test import Client
from django.contrib.sessions.models import Session

# Create a test client
client = Client()

# Get a test product
product = Product.objects.first()
if not product:
    print("ERROR: No products found")
    exit()

print(f"Testing double view prevention for product: {product.name}")

# Clear existing views for clean test
ProductView.objects.filter(product=product).delete()
initial_views = ProductView.objects.filter(product=product).count()
print(f"Initial views (after cleanup): {initial_views}")

# Test 1: Multiple rapid requests from same session
print("\n=== Test 1: Rapid consecutive requests ===")
session = client.session
session.save()

print("Making first request...")
response1 = client.get(f'/api/products/{product.id}/')
print(f"Response 1 status: {response1.status_code}")

views_after_1 = ProductView.objects.filter(product=product).count()
print(f"Views after request 1: {views_after_1}")

print("Making second request immediately...")
response2 = client.get(f'/api/products/{product.id}/')
print(f"Response 2 status: {response2.status_code}")

views_after_2 = ProductView.objects.filter(product=product).count()
print(f"Views after request 2: {views_after_2}")

print("Making third request immediately...")
response3 = client.get(f'/api/products/{product.id}/')
print(f"Response 3 status: {response3.status_code}")

views_after_3 = ProductView.objects.filter(product=product).count()
print(f"Views after request 3: {views_after_3}")

# Check results
if views_after_1 == 1 and views_after_2 == 1 and views_after_3 == 1:
    print("✅ SUCCESS: Only 1 view recorded despite 3 requests!")
else:
    print(f"❌ FAILED: Expected 1 view, got {views_after_3}")

# Test 2: Different sessions should create separate views
print("\n=== Test 2: Different sessions ===")
client2 = Client()
session2 = client2.session
session2.save()

print("Making request from different session...")
response4 = client2.get(f'/api/products/{product.id}/')
print(f"Response 4 status: {response4.status_code}")

views_after_different_session = ProductView.objects.filter(product=product).count()
print(f"Views after different session: {views_after_different_session}")

if views_after_different_session == 2:
    print("✅ SUCCESS: Different session created separate view!")
else:
    print(f"❌ FAILED: Expected 2 views, got {views_after_different_session}")

print(f"\n🎯 Final view count: {ProductView.objects.filter(product=product).count()}")
print("✅ Double view prevention test completed!")

# Show the actual view records
print("\n📊 View records:")
for i, view in enumerate(ProductView.objects.filter(product=product), 1):
    user_info = view.user.username if view.user else f"Anonymous ({view.ip_address})"
    session_info = view.session_id[:10] + "..." if view.session_id else "No session"
    print(f"   {i}. {user_info} | {session_info} | {view.viewed_at}")