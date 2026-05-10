"""
Test analytics data retrieval
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User

print("=== Database Statistics ===")
print(f"Total Products: {Product.objects.count()}")
print(f"Total ProductViews: {ProductView.objects.count()}")
print(f"Total Favorites: {Favorite.objects.count()}")
print(f"Total Sales: {Sale.objects.count()}")

# Get an exporter user
exporter = User.objects.filter(user_type='exporter').first()

if exporter:
    print(f"\n=== Exporter: {exporter.username} ===")
    
    # Get exporter's products
    exporter_products = Product.objects.filter(owner=exporter)
    print(f"Exporter's products: {exporter_products.count()}")
    
    if exporter_products.exists():
        print("\nProducts owned:")
        for p in exporter_products:
            print(f"  - {p.name} (ID: {p.id})")
    
    # Get views on exporter's products
    views = ProductView.objects.filter(
        product__in=exporter_products,
        user__isnull=False
    ).select_related('user', 'product').order_by('-viewed_at')[:10]
    
    print(f"\n=== Product Views (Last 10) ===")
    print(f"Total views with logged-in users: {ProductView.objects.filter(product__in=exporter_products, user__isnull=False).count()}")
    
    if views:
        for view in views:
            print(f"  [{view.viewed_at}] User '{view.user.username}' viewed '{view.product.name}'")
    else:
        print("  No views found")
    
    # Get favorites
    favorites = Favorite.objects.filter(
        product__in=exporter_products
    ).select_related('user', 'product').order_by('-created_at')
    
    print(f"\n=== Favorites ===")
    print(f"Total favorites: {favorites.count()}")
    
    if favorites:
        for fav in favorites:
            print(f"  [{fav.created_at}] User '{fav.user.username}' favorited '{fav.product.name}'")
    else:
        print("  No favorites found")
    
    # Get sales
    sales = Sale.objects.filter(
        product__in=exporter_products
    ).select_related('customer', 'product').order_by('-created_at')
    
    print(f"\n=== Sales ===")
    print(f"Total sales: {sales.count()}")
    
    if sales:
        for sale in sales:
            print(f"  [{sale.created_at}] '{sale.customer_name}' ({sale.customer.username}) purchased '{sale.product.name}'")
            print(f"    Order: {sale.sales_id}, Quantity: {sale.quantity}, Amount: ${sale.final_total}")
    else:
        print("  No sales found")
else:
    print("\nNo exporter user found in database")

print("\n=== All Users ===")
for user in User.objects.all()[:10]:
    print(f"  - {user.username} ({user.user_type})")
