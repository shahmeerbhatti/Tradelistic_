import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== Setting up Super Admin in MSSQL Database ===\n")

# Check if admin exists
admin = User.objects.filter(username='superadmin').first()

if admin:
    print(f"Updating existing superadmin user...")
    admin.is_superadmin = True
    admin.is_superuser = True
    admin.is_staff = True
    admin.user_type = None  # Admin doesn't need user_type
    admin.set_password('admin123')
    admin.save()
    print("✓ Superadmin updated")
else:
    print("Creating new superadmin user...")
    admin = User.objects.create_user(
        username='superadmin',
        email='admin@tradelistic.com',
        password='admin123',
        user_type=None,  # Admin has no user type
        is_superadmin=True,
        is_superuser=True,
        is_staff=True,
        first_name='Super',
        last_name='Admin'
    )
    print("✓ Superadmin created")

print(f"\n{'='*50}")
print("Super Admin Credentials:")
print(f"{'='*50}")
print(f"  Username: superadmin")
print(f"  Password: admin123")
print(f"  User Type: {admin.user_type or 'N/A (Admin)'}")
print(f"  Is Super Admin: {admin.is_superadmin}")
print(f"  Database: tradelistic_db (MSSQL)")
print(f"{'='*50}")
print(f"\nLogin at: http://localhost:3000/login")
print("You will be redirected to: http://localhost:3000/super-admin\n")

# Show database stats
print(f"\nDatabase Statistics:")
print(f"  Total Users: {User.objects.count()}")
print(f"  Importers: {User.objects.filter(user_type='importer').count()}")
print(f"  Exporters: {User.objects.filter(user_type='exporter').count()}")
print(f"  Admins: {User.objects.filter(is_superadmin=True).count()}")

from products.models import Product
print(f"  Total Products: {Product.objects.count()}")

from stores.models import Store
print(f"  Total Stores: {Store.objects.count()}")

from transactions.models import Sale
print(f"  Total Sales: {Sale.objects.count()}")

print("\n✓ Setup complete!\n")
