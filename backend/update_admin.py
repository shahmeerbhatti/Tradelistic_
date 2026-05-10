import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Update existing admin user
admin = User.objects.get(username='admin')
admin.is_superadmin = True
admin.is_superuser = True
admin.is_staff = True
admin.user_type = 'importer'  # Change from exporter to importer
admin.set_password('admin123')  # Reset password to be sure
admin.save()

print("✓ Admin user updated successfully!")
print(f"  Username: admin")
print(f"  Password: admin123")
print(f"  User type: {admin.user_type}")
print(f"  Is superadmin: {admin.is_superadmin}")
print(f"  Is active: {admin.is_active}")
print(f"\nYou can now login at http://localhost:3000/login")
