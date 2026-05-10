"""
Debug recommendation system for phones subcategory
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from collections import Counter
from django.db.models import Q, Count

print("=== CHECKING PHONE PRODUCTS IN DATABASE ===\n")

# Check all products with 'phone' in category or subcategory
phone_products = Product.objects.filter(
    Q(category='electronics', subcategory='mobile_phones') |
    Q(name__icontains='phone')
)

print(f"Total products with 'mobile_phones' subcategory or 'phone' in name: {phone_products.count()}\n")

if phone_products.exists():
    print("Sample phone products:")
    for p in phone_products[:10]:
        print(f"  - {p.name} (Category: {p.category}, Subcategory: {p.subcategory or 'None'})")
        print(f"    Owner: {p.owner.username}")

# Check if any user has interacted with phones
print("\n=== CHECKING USER INTERACTIONS WITH PHONES ===\n")

phone_views = ProductView.objects.filter(product__in=phone_products, user__isnull=False)
print(f"Total views on phone products: {phone_views.count()}")

if phone_views.exists():
    print("\nUsers who viewed phones:")
    for view in phone_views.select_related('user', 'product')[:10]:
        print(f"  - {view.user.username} viewed '{view.product.name}'")

phone_favorites = Favorite.objects.filter(product__in=phone_products)
print(f"\nTotal favorites on phone products: {phone_favorites.count()}")

if phone_favorites.exists():
    print("\nUsers who favorited phones:")
    for fav in phone_favorites.select_related('user', 'product'):
        print(f"  - {fav.user.username} favorited '{fav.product.name}'")

phone_sales = Sale.objects.filter(product__in=phone_products)
print(f"\nTotal sales of phone products: {phone_sales.count()}")

if phone_sales.exists():
    print("\nUsers who purchased phones:")
    for sale in phone_sales.select_related('customer', 'product')[:10]:
        print(f"  - {sale.customer.username} purchased '{sale.product.name}'")

# Test recommendation logic for a user who interacted with phones
print("\n=== TESTING RECOMMENDATION LOGIC ===\n")

# Find a user who has interacted with phones
test_user = None
if phone_views.exists():
    test_user = phone_views.first().user
elif phone_favorites.exists():
    test_user = phone_favorites.first().user
elif phone_sales.exists():
    test_user = phone_sales.first().customer

if test_user:
    print(f"Testing with user: {test_user.username}\n")
    
    # Get user's all interactions
    user_favorites = list(Favorite.objects.filter(user=test_user).values_list('product__id', flat=True))
    user_views = list(ProductView.objects.filter(user=test_user).values_list('product__id', flat=True))
    user_purchases = list(Sale.objects.filter(customer=test_user).values_list('product__id', flat=True))
    
    interacted_products = set(user_favorites + user_views + user_purchases)
    
    print(f"User interactions:")
    print(f"  Favorites: {len(user_favorites)}")
    print(f"  Views: {len(user_views)}")
    print(f"  Purchases: {len(user_purchases)}")
    print(f"  Total unique products: {len(interacted_products)}\n")
    
    # Get the interacted products
    interacted_product_objects = Product.objects.filter(id__in=interacted_products)
    
    print("Products user interacted with:")
    for p in interacted_product_objects[:15]:
        print(f"  - {p.name} (Category: {p.category}, Subcategory: {p.subcategory or 'None'})")
    
    # Count subcategories
    user_subcategory_data = interacted_product_objects.exclude(
        Q(subcategory='') | Q(subcategory__isnull=True)
    ).values_list('category', 'subcategory')
    
    user_subcategory_counts = Counter(user_subcategory_data)
    
    print(f"\nSubcategory preferences:")
    for (category, subcategory), count in user_subcategory_counts.most_common():
        print(f"  {category}/{subcategory}: {count} interactions")
    
    # Check available phone recommendations
    if ('electronics', 'mobile_phones') in user_subcategory_counts:
        print(f"\n=== PHONE RECOMMENDATION CHECK ===")
        
        available_phones = Product.objects.filter(
            category='electronics',
            subcategory='mobile_phones'
        ).exclude(
            id__in=interacted_products
        ).exclude(
            owner=test_user
        ).annotate(
            score=Count('views') + Count('favorited_by') * 2 + Count('sales') * 3
        ).order_by('-score')
        
        print(f"\nAvailable phone products for recommendation: {available_phones.count()}")
        
        if available_phones.exists():
            print("\nTop phone recommendations (by score):")
            for p in available_phones[:5]:
                print(f"  - {p.name} (Owner: {p.owner.username})")
        else:
            print("\n⚠️ NO PHONE PRODUCTS AVAILABLE FOR RECOMMENDATION")
            print("Possible reasons:")
            print("  1. User already viewed/favorited/purchased all phones")
            print("  2. User owns all the phone products")
            print("  3. No phone products exist in database")
else:
    print("⚠️ No user found who has interacted with phones")
    print("\nChecking all subcategories in database:")
    all_subcats = Product.objects.exclude(
        Q(subcategory='') | Q(subcategory__isnull=True)
    ).values_list('category', 'subcategory').distinct()
    
    print("\nAvailable subcategories:")
    for cat, subcat in all_subcats:
        count = Product.objects.filter(category=cat, subcategory=subcat).count()
        print(f"  {cat}/{subcat}: {count} products")
