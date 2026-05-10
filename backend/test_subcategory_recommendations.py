"""
Test subcategory-based recommendations
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from collections import Counter
from django.db.models import Q

# Get a customer user
customer = User.objects.filter(user_type='customer').first()

if not customer:
    print("ERROR: Need at least one customer user")
    exit()

print(f"=== Testing Recommendations for User: {customer.username} ===\n")

# Get user's interaction history
user_favorites = Favorite.objects.filter(user=customer).values_list('product__id', flat=True)
user_views = ProductView.objects.filter(user=customer).values_list('product__id', flat=True)
user_purchases = Sale.objects.filter(customer=customer).values_list('product__id', flat=True)

# Combine all interacted product IDs
interacted_products = set(list(user_favorites) + list(user_views) + list(user_purchases))

print(f"User Interactions:")
print(f"  Favorites: {len(user_favorites)}")
print(f"  Views: {len(user_views)}")
print(f"  Purchases: {len(user_purchases)}")
print(f"  Total unique products: {len(interacted_products)}\n")

if interacted_products:
    # Get the interacted products
    interacted_product_objects = Product.objects.filter(id__in=interacted_products)
    
    print("Interacted Products:")
    for p in interacted_product_objects[:10]:
        print(f"  - {p.name} (Category: {p.category}, Subcategory: {p.subcategory or 'None'})")
    
    # Count categories
    user_category_counts = Counter(interacted_product_objects.values_list('category', flat=True))
    print(f"\nCategory Preferences:")
    for category, count in user_category_counts.most_common():
        print(f"  {category}: {count} interactions")
    
    # Count subcategories (only non-empty ones)
    user_subcategory_data = interacted_product_objects.exclude(
        Q(subcategory='') | Q(subcategory__isnull=True)
    ).values_list('category', 'subcategory')
    
    user_subcategory_counts = Counter(user_subcategory_data)
    
    print(f"\nSubcategory Preferences:")
    for (category, subcategory), count in user_subcategory_counts.most_common():
        print(f"  {category}/{subcategory}: {count} interactions")
    
    # Simulate recommendation logic
    print(f"\n=== RECOMMENDATION SIMULATION ===")
    
    # Reserve slots for subcategory-specific recommendations (2-3 per subcategory)
    subcategory_slots = min(6, len(user_subcategory_counts) * 2)
    category_slots = 20 - subcategory_slots
    
    print(f"Subcategory slots: {subcategory_slots}")
    print(f"Category slots: {category_slots}")
    
    # Check available products for top subcategory
    if user_subcategory_counts:
        (top_category, top_subcategory), top_count = user_subcategory_counts.most_common(1)[0]
        
        print(f"\nTop Subcategory: {top_category}/{top_subcategory} ({top_count} interactions)")
        
        subcategory_available = Product.objects.filter(
            category=top_category,
            subcategory=top_subcategory
        ).exclude(
            id__in=interacted_products
        ).exclude(
            owner=customer
        ).count()
        
        print(f"Available products in {top_category}/{top_subcategory}: {subcategory_available}")
        
        if subcategory_available > 0:
            print("\nSample products from this subcategory:")
            samples = Product.objects.filter(
                category=top_category,
                subcategory=top_subcategory
            ).exclude(
                id__in=interacted_products
            ).exclude(
                owner=customer
            )[:3]
            
            for p in samples:
                print(f"  - {p.name} (Owner: {p.owner.username})")
    
else:
    print("No interactions found. User would get popular products.")
