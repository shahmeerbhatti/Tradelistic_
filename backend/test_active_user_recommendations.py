"""
Test subcategory-based recommendations with active user
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from collections import Counter
from django.db.models import Q

# Find a customer with interactions
customers_with_views = ProductView.objects.filter(
    user__user_type='customer'
).values_list('user', flat=True).distinct()

user_ids = list(customers_with_views[:5])
customers = User.objects.filter(id__in=user_ids)

print(f"Found {len(user_ids)} customers with views")

for customer in customers:
    print(f"\n=== Testing User: {customer.username} ===")
    
    # Get user's interaction history
    user_favorites = list(Favorite.objects.filter(user=customer).values_list('product__id', flat=True))
    user_views = list(ProductView.objects.filter(user=customer).values_list('product__id', flat=True))
    user_purchases = list(Sale.objects.filter(customer=customer).values_list('product__id', flat=True))
    
    # Combine all interacted product IDs
    interacted_products = set(user_favorites + user_views + user_purchases)
    
    print(f"Favorites: {len(user_favorites)}, Views: {len(user_views)}, Purchases: {len(user_purchases)}")
    print(f"Total unique interactions: {len(interacted_products)}")
    
    if len(interacted_products) > 0:
        # Get the interacted products
        interacted_product_objects = Product.objects.filter(id__in=interacted_products)
        
        # Count subcategories (only non-empty ones)
        user_subcategory_data = interacted_product_objects.exclude(
            Q(subcategory='') | Q(subcategory__isnull=True)
        ).values_list('category', 'subcategory')
        
        user_subcategory_counts = Counter(user_subcategory_data)
        
        if user_subcategory_counts:
            print(f"\nSubcategory Preferences:")
            for (category, subcategory), count in user_subcategory_counts.most_common():
                print(f"  {category}/{subcategory}: {count} interactions")
                
                # Check available products
                available = Product.objects.filter(
                    category=category,
                    subcategory=subcategory
                ).exclude(
                    id__in=interacted_products
                ).exclude(
                    owner=customer
                ).count()
                
                print(f"    -> {available} products available for recommendation")
        else:
            print("No subcategory preferences (products don't have subcategories)")
        
        break  # Test with first user that has interactions
