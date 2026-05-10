"""
Check which products have sales, favorites, and views
"""

from products.models import Product, ProductView, Favorite
from transactions.models import Sale
from users.models import User
from django.db.models import Count

print("=== Products with Most Sales ===")
products_with_sales = Product.objects.annotate(
    sale_count=Count('sales')
).filter(sale_count__gt=0).order_by('-sale_count')[:10]

for p in products_with_sales:
    print(f"  {p.name} (ID: {p.id}) - Owner: {p.owner.username} - Sales: {p.sale_count}")

print("\n=== Products with Most Favorites ===")
products_with_favs = Product.objects.annotate(
    fav_count=Count('favorited_by')
).filter(fav_count__gt=0).order_by('-fav_count')[:10]

if products_with_favs:
    for p in products_with_favs:
        print(f"  {p.name} (ID: {p.id}) - Owner: {p.owner.username} - Favorites: {p.fav_count}")
else:
    print("  No products have favorites")

print("\n=== Products with Most Views ===")
products_with_views = Product.objects.annotate(
    view_count=Count('views')
).filter(view_count__gt=0).order_by('-view_count')[:10]

for p in products_with_views:
    print(f"  {p.name} (ID: {p.id}) - Owner: {p.owner.username} - Views: {p.view_count}")

print("\n=== Exporters with Most Products ===")
exporters = User.objects.filter(user_type='exporter').annotate(
    product_count=Count('products')
).order_by('-product_count')[:5]

for exp in exporters:
    print(f"  {exp.username} - Products: {exp.product_count}")
    
    # Count sales for this exporter's products
    exporter_products = Product.objects.filter(owner=exp)
    sales_count = Sale.objects.filter(product__in=exporter_products).count()
    favs_count = Favorite.objects.filter(product__in=exporter_products).count()
    views_count = ProductView.objects.filter(product__in=exporter_products, user__isnull=False).count()
    
    print(f"    Sales: {sales_count}, Favorites: {favs_count}, Views: {views_count}")
