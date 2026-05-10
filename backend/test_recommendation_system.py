"""
Comprehensive test for the recommendation system
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from collections import Counter
from django.db.models import Q, Count

print("=" * 80)
print("RECOMMENDATION SYSTEM TEST")
print("=" * 80)

# Check database state
print("\n1. DATABASE STATE CHECK")
print("-" * 80)
total_products = Product.objects.count()
total_users = User.objects.filter(user_type='customer').count()
total_views = ProductView.objects.count()
total_favorites = Favorite.objects.count()
total_sales = Sale.objects.count()

print(f"Total Products: {total_products}")
print(f"Total Customers: {total_users}")
print(f"Total Product Views: {total_views}")
print(f"Total Favorites: {total_favorites}")
print(f"Total Sales: {total_sales}")

# Check categories and subcategories
print("\n2. PRODUCT CATEGORIES & SUBCATEGORIES")
print("-" * 80)
categories = Product.objects.values('category', 'subcategory').annotate(
    count=Count('id')
).order_by('category', 'subcategory')

for cat in categories:
    subcat = cat['subcategory'] or '(No subcategory)'
    print(f"  {cat['category']}/{subcat}: {cat['count']} products")

# Test with customers
print("\n3. CUSTOMER INTERACTION ANALYSIS")
print("-" * 80)
customers = User.objects.filter(user_type='customer')

if customers.count() == 0:
    print("❌ ERROR: No customers found in database!")
else:
    print(f"Found {customers.count()} customers")
    
    # Find customers with any interactions
    active_customers = []
    for customer in customers[:10]:  # Check first 10
        views = ProductView.objects.filter(user=customer).count()
        favs = Favorite.objects.filter(user=customer).count()
        sales = Sale.objects.filter(customer=customer).count()
        total_interactions = views + favs + sales
        
        if total_interactions > 0:
            active_customers.append({
                'user': customer,
                'views': views,
                'favorites': favs,
                'sales': sales,
                'total': total_interactions
            })
    
    if not active_customers:
        print("❌ No customers with interactions found!")
        print("\n4. TESTING NEW USER SCENARIO (Popular Products)")
        print("-" * 80)
        
        # Test popular products logic (for new users)
        popular_products = Product.objects.annotate(
            view_count=Count('views'),
            favorite_count=Count('favorited_by'),
            sales_count=Count('sales')
        ).order_by('-view_count', '-favorite_count', '-sales_count')[:20]
        
        if popular_products.exists():
            print(f"✅ Found {popular_products.count()} popular products")
            print("\nTop 5 Popular Products:")
            for i, p in enumerate(popular_products[:5], 1):
                print(f"  {i}. {p.name}")
                print(f"     Views: {p.view_count}, Favorites: {p.favorite_count}, Sales: {p.sales_count}")
        else:
            print("❌ No products available for recommendations!")
    else:
        print(f"✅ Found {len(active_customers)} active customers")
        
        # Test with most active customer
        test_customer = sorted(active_customers, key=lambda x: x['total'], reverse=True)[0]
        customer = test_customer['user']
        
        print(f"\n4. TESTING WITH MOST ACTIVE CUSTOMER: {customer.username}")
        print("-" * 80)
        print(f"Views: {test_customer['views']}, Favorites: {test_customer['favorites']}, Sales: {test_customer['sales']}")
        
        # Get interaction history
        user_favorites = list(Favorite.objects.filter(user=customer).values_list('product__id', flat=True))
        user_views = list(ProductView.objects.filter(user=customer).values_list('product__id', flat=True))
        user_purchases = list(Sale.objects.filter(customer=customer).values_list('product__id', flat=True))
        
        interacted_products = set(user_favorites + user_views + user_purchases)
        
        print(f"\nUnique interacted products: {len(interacted_products)}")
        
        # Check category preferences
        interacted_product_objects = Product.objects.filter(id__in=interacted_products)
        user_category_counts = Counter(interacted_product_objects.values_list('category', flat=True))
        
        print("\nCategory Preferences:")
        for category, count in user_category_counts.most_common():
            print(f"  {category}: {count} interactions")
        
        # Check subcategory preferences
        user_subcategory_data = interacted_product_objects.exclude(
            Q(subcategory='') | Q(subcategory__isnull=True)
        ).values_list('category', 'subcategory')
        
        user_subcategory_counts = Counter(user_subcategory_data)
        
        if user_subcategory_counts:
            print("\nSubcategory Preferences:")
            for (category, subcategory), count in user_subcategory_counts.most_common():
                print(f"  {category}/{subcategory}: {count} interactions")
                
                # Check available recommendations
                available = Product.objects.filter(
                    category=category,
                    subcategory=subcategory
                ).exclude(
                    id__in=interacted_products
                ).exclude(
                    owner=customer
                ).annotate(
                    score=Count('views') + Count('favorited_by') * 2 + Count('sales') * 3
                ).order_by('-score')
                
                print(f"    → {available.count()} products available")
                if available.exists():
                    top_prod = available.first()
                    print(f"    → Top recommendation: {top_prod.name} (Score calculation in progress)")
        
        print("\n5. RECOMMENDATION SCORE CALCULATION TEST")
        print("-" * 80)
        
        # Test score calculation for available products
        test_products = Product.objects.exclude(
            id__in=interacted_products
        ).exclude(
            owner=customer
        ).annotate(
            score=Count('views') + Count('favorited_by') * 2 + Count('sales') * 3,
            view_count=Count('views'),
            fav_count=Count('favorited_by'),
            sales_count=Count('sales')
        ).order_by('-score')[:10]
        
        if test_products.exists():
            print(f"✅ Score calculation working! Top 10 available products:")
            for i, p in enumerate(test_products, 1):
                print(f"  {i}. {p.name}")
                print(f"     Score: {p.score} = {p.view_count} views + {p.fav_count}×2 favs + {p.sales_count}×3 sales")
        else:
            print("❌ No products available for recommendation!")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
