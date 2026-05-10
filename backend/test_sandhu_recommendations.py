"""
Test recommendation API for user 'sandhu' who has phone interactions
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from collections import Counter
from django.db.models import Q, Count
import random

# Get user sandhu
user = User.objects.get(username='sandhu')

print(f"=== TESTING RECOMMENDATIONS FOR USER: {user.username} ===\n")

# Get user's interaction history (same as recommendation API)
user_favorites = list(Favorite.objects.filter(user=user).values_list('product__id', flat=True))
user_views = list(ProductView.objects.filter(user=user).values_list('product__id', flat=True))
user_purchases = list(Sale.objects.filter(customer=user).values_list('product__id', flat=True))

# Combine all interacted product IDs
interacted_products = set(user_favorites + user_views + user_purchases)

print(f"User Interactions:")
print(f"  Favorites: {len(user_favorites)}")
print(f"  Views: {len(user_views)}")
print(f"  Purchases: {len(user_purchases)}")
print(f"  Total unique products: {len(interacted_products)}\n")

# Get the interacted products
interacted_product_objects = Product.objects.filter(id__in=interacted_products)

print("Products user interacted with:")
for p in interacted_product_objects:
    print(f"  - {p.name} (Category: {p.category}, Subcategory: {p.subcategory or 'None'})")

# Count frequency of each category and subcategory
user_category_counts = Counter(interacted_product_objects.values_list('category', flat=True))

# Count subcategories (only non-empty ones)
user_subcategory_data = interacted_product_objects.exclude(
    Q(subcategory='') | Q(subcategory__isnull=True)
).values_list('category', 'subcategory')

user_subcategory_counts = Counter(user_subcategory_data)

print(f"\nCategory preferences: {dict(user_category_counts)}")
print(f"Subcategory preferences: {dict(user_subcategory_counts)}")

# Calculate slots
total_category_interactions = sum(user_category_counts.values())
subcategory_slots = min(6, len(user_subcategory_counts) * 2)
category_slots = 20 - subcategory_slots

print(f"\nSlot allocation:")
print(f"  Subcategory slots: {subcategory_slots}")
print(f"  Category slots: {category_slots}")

# SUBCATEGORY RECOMMENDATIONS
print(f"\n=== SUBCATEGORY RECOMMENDATIONS ===")
recommended_products = []
seen_ids = set()

sorted_subcategories = user_subcategory_counts.most_common()

for (category, subcategory), count in sorted_subcategories:
    if len(recommended_products) >= subcategory_slots:
        break
    
    allocated_subcategory_products = min(3, subcategory_slots - len(recommended_products))
    
    print(f"\n{category}/{subcategory}: {count} interactions -> {allocated_subcategory_products} products allocated")
    
    # Find products in this specific subcategory
    subcategory_matches = Product.objects.filter(
        category=category,
        subcategory=subcategory
    ).exclude(
        id__in=interacted_products
    ).exclude(
        owner=user
    ).exclude(
        id__in=seen_ids
    ).annotate(
        score=Count('views') + Count('favorited_by') * 2 + Count('sales') * 3
    ).order_by('-score')[:allocated_subcategory_products]
    
    print(f"  Found {subcategory_matches.count()} matching products")
    
    added_count = 0
    for product in subcategory_matches:
        recommended_products.append(product)
        seen_ids.add(product.id)
        added_count += 1
        print(f"    ✓ Added: {product.name} (Score calculated)")
    
    if added_count == 0:
        print(f"    ⚠️ No products added (might be already interacted or owned)")

print(f"\nTotal subcategory-based products: {len(recommended_products)}")

# CATEGORY RECOMMENDATIONS
print(f"\n=== CATEGORY RECOMMENDATIONS ===")

sorted_categories = user_category_counts.most_common()

for category, count in sorted_categories:
    if len(recommended_products) >= 20:
        break
    
    category_weight = count / total_category_interactions
    allocated_products = max(2, int(category_slots * category_weight))
    
    print(f"\n{category}: {count} interactions ({category_weight:.2%}) -> {allocated_products} products allocated")
    
    category_matches = Product.objects.filter(
        category=category
    ).exclude(
        id__in=interacted_products
    ).exclude(
        owner=user
    ).exclude(
        id__in=seen_ids
    ).annotate(
        score=Count('views') + Count('favorited_by') * 2 + Count('sales') * 3
    ).order_by('-score')
    
    added_from_category = 0
    for product in category_matches:
        if added_from_category < allocated_products and len(recommended_products) < 20:
            recommended_products.append(product)
            seen_ids.add(product.id)
            added_from_category += 1
            if added_from_category <= 3:  # Show first 3
                print(f"    ✓ Added: {product.name}")
        else:
            break
    
    print(f"  Total added from this category: {added_from_category}")

print(f"\n=== FINAL RESULTS ===")
print(f"Total recommendations: {len(recommended_products)}")

# Check if any phones were recommended
phone_recommendations = [p for p in recommended_products if p.subcategory == 'mobile_phones' or 'phone' in p.name.lower()]
print(f"\nPhone products in recommendations: {len(phone_recommendations)}")

if phone_recommendations:
    print("\nRecommended phones:")
    for p in phone_recommendations:
        print(f"  ✓ {p.name}")
else:
    print("\n⚠️ NO PHONES WERE RECOMMENDED!")
    print("\nChecking why...")
    
    # Check what phones are available
    all_phones = Product.objects.filter(
        category='electronics',
        subcategory='mobile_phones'
    )
    print(f"\nTotal phones in database: {all_phones.count()}")
    
    phones_user_owns = all_phones.filter(owner=user).count()
    phones_user_interacted = all_phones.filter(id__in=interacted_products).count()
    phones_available = all_phones.exclude(owner=user).exclude(id__in=interacted_products).count()
    
    print(f"  Phones user owns: {phones_user_owns}")
    print(f"  Phones user interacted with: {phones_user_interacted}")
    print(f"  Phones available for recommendation: {phones_available}")
    
    if phones_available > 0:
        print("\n  Available phones:")
        for p in all_phones.exclude(owner=user).exclude(id__in=interacted_products):
            print(f"    - {p.name} (Owner: {p.owner.username})")
