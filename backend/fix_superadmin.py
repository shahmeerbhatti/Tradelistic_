import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== Checking MSSQL Database ===\n")

# Show all users with admin-like usernames
print("Looking for existing admin users...")
potential_admins = User.objects.filter(username__icontains='admin')
for user in potential_admins:
    print(f"  - {user.username}: email={user.email}, type={user.user_type}, superadmin={user.is_superadmin}")

# Check for user with admin email
email_user = User.objects.filter(email='admin@tradelistic.com').first()
if email_user:
    print(f"\nUser with admin@tradelistic.com: {email_user.username}")

print(f"\nTotal users in database: {User.objects.count()}")

# Update or create proper superadmin
print("\n" + "="*50)
print("Creating/Updating Superadmin")
print("="*50)

# Try to find existing admin user
admin = User.objects.filter(username='admin').first()

if not admin:
    # Try email
    admin = User.objects.filter(email='admin@tradelistic.com').first()

if admin:
    print(f"\nUpdating existing user: {admin.username}")
    admin.username = 'superadmin' if admin.username != 'superadmin' else admin.username
    admin.email = 'superadmin@tradelistic.com'
    admin.is_superadmin = True
    admin.is_superuser = True
    admin.is_staff = True
    admin.user_type = None  # Admin doesn't need user_type
    admin.first_name = 'Super'
    admin.last_name = 'Admin'
    admin.set_password('admin123')
    admin.save()
    print("✓ Superadmin updated successfully")
else:
    print("\nCreating new superadmin...")
    admin = User.objects.create_user(
        username='superadmin',
        email='superadmin@tradelistic.com',
        password='admin123',
        user_type=None,  # Admin has no user type
        is_superadmin=True,
        is_superuser=True,
        is_staff=True,
        first_name='Super',
        last_name='Admin'
    )
    print("✓ Superadmin created successfully")

print(f"\n{'='*50}")
print("Super Admin Credentials:")
print(f"{'='*50}")
print(f"  Username: {admin.username}")
print(f"  Password: admin123")
print(f"  Email: {admin.email}")
print(f"  User Type: {admin.user_type or 'N/A (Pure Admin)'}")
print(f"  Is Super Admin: {admin.is_superadmin}")
print(f"  Database: tradelistic_db (MSSQL)")
print(f"{'='*50}")

# Show database stats
from products.models import Product
from stores.models import Store
from transactions.models import Sale

print(f"\nDatabase Statistics (Your Real Data):")
print(f"  Total Users: {User.objects.count()}")
print(f"  Importers: {User.objects.filter(user_type='importer').count()}")
print(f"  Exporters: {User.objects.filter(user_type='exporter').count()}")
print(f"  Admins: {User.objects.filter(is_superadmin=True).count()}")
print(f"  Total Products: {Product.objects.count()}")
print(f"  Total Stores: {Store.objects.count()}")
print(f"  Total Sales: {Sale.objects.count()}")

print("\n✓ Setup complete!")
print(f"\nLogin at: http://localhost:3000/login")
print("You will be redirected to: http://localhost:3000/super-admin\n")
