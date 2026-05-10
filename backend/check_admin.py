import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== Database Check ===")
print(f"Total users: {User.objects.count()}")

admin = User.objects.filter(username='admin').first()
if admin:
    print(f"\n✓ Admin user found:")
    print(f"  Username: {admin.username}")
    print(f"  Email: {admin.email}")
    print(f"  User type: {admin.user_type}")
    print(f"  Is superadmin: {admin.is_superadmin}")
    print(f"  Is active: {admin.is_active}")
    print(f"  Is staff: {admin.is_staff}")
else:
    print("\n✗ Admin user NOT FOUND - Creating now...")
    admin = User.objects.create_user(
        username='admin',
        email='admin@tradelistic.com',
        password='admin123',
        user_type='importer',
        is_superadmin=True,
        is_superuser=True,
        is_staff=True
    )
    print("✓ Admin user created successfully!")
    print(f"  Username: admin")
    print(f"  Password: admin123")

print("\nAll users in database:")
for user in User.objects.all():
    print(f"  - {user.username} ({user.user_type}) - superadmin: {user.is_superadmin}")
