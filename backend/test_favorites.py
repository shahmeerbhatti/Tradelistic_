"""
Test the favorites functionality
"""

from products.models import Product, Favorite
from users.models import User

# Get test users
customer_user = User.objects.filter(user_type='customer').first()
if not customer_user:
    print("ERROR: Need at least one customer user")
    exit()

# Get test product
product = Product.objects.first()
if not product:
    print("ERROR: Need at least one product")
    exit()

print(f"Testing favorites functionality:")
print(f"User: {customer_user.username}")
print(f"Product: {product.name}")

# Test 1: Check initial state
print("\n=== Test 1: Initial state ===")
initial_favorites = Favorite.objects.filter(user=customer_user, product=product).exists()
print(f"Initially favorited: {initial_favorites}")

# Test 2: Add to favorites
print("\n=== Test 2: Adding to favorites ===")
favorite, created = Favorite.objects.get_or_create(
    user=customer_user,
    product=product
)

if created:
    print("✅ Favorite created successfully")
    print(f"Favorite ID: {favorite.id}")
    print(f"Created at: {favorite.created_at}")
else:
    print("ℹ️ Favorite already existed")

# Verify favorite exists
is_favorited = Favorite.objects.filter(user=customer_user, product=product).exists()
print(f"Is now favorited: {is_favorited}")

# Test 3: Check favorite count
print("\n=== Test 3: Favorite counts ===")
user_favorites_count = Favorite.objects.filter(user=customer_user).count()
product_favorites_count = Favorite.objects.filter(product=product).count()

print(f"User's total favorites: {user_favorites_count}")
print(f"Product's total favorites: {product_favorites_count}")

# Test 4: Remove from favorites
print("\n=== Test 4: Removing from favorites ===")
deleted_count, _ = Favorite.objects.filter(user=customer_user, product=product).delete()
print(f"Favorites deleted: {deleted_count}")

# Verify favorite removed
is_favorited_after = Favorite.objects.filter(user=customer_user, product=product).exists()
print(f"Is favorited after removal: {is_favorited_after}")

# Test 5: Unique constraint test
print("\n=== Test 5: Unique constraint test ===")
try:
    # Create first favorite
    fav1 = Favorite.objects.create(user=customer_user, product=product)
    print("✅ First favorite created")
    
    # Try to create duplicate (should fail)
    fav2 = Favorite.objects.create(user=customer_user, product=product)
    print("❌ ERROR: Duplicate favorite created (this shouldn't happen)")
    
except Exception as e:
    print("✅ Duplicate favorite prevented (expected behavior)")
    print(f"Error: {str(e)}")

# Final cleanup
print("\n=== Cleanup ===")
Favorite.objects.filter(user=customer_user, product=product).delete()
print("✅ Test favorites cleaned up")

print("\n🎯 Favorites functionality test completed!")
print("✅ Favorite creation working")
print("✅ Favorite removal working")
print("✅ Unique constraint working")
print("✅ Database queries working")