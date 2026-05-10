import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check if admin user exists
admin = User.objects.filter(username='admin').first()

if admin:
    # Update existing admin
    admin.is_superadmin = True
    admin.is_superuser = True
    admin.is_staff = True
    admin.save()
    print('✓ Existing admin user updated with super admin privileges')
else:
    # Create new admin user
    admin = User.objects.create_user(
        username='admin',
        email='admin@tradelistic.com',
        password='admin123',
        user_type='importer',
        is_superadmin=True,
        is_superuser=True,
        is_staff=True
    )
    print('✓ New super admin user created')

print('\nSuper Admin Credentials:')
print('  Username: admin')
print('  Password: admin123')
print('\nYou can now login at http://localhost:3000/login')
