from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from stores.models import Store


class Command(BaseCommand):
    help = "Reset and verify fixed demo login accounts for presentation."

    def handle(self, *args, **options):
        User = get_user_model()

        accounts = [
            {
                "username": "admin",
                "email": "admin@test.com",
                "password": "admin123",
                "user_type": "importer",
                "is_superadmin": True,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Super",
                "last_name": "Admin",
            },
            {
                "username": "sarah_johnson",
                "email": "sarah_johnson@example.com",
                "password": "Importer@123",
                "user_type": "importer",
                "is_superadmin": False,
                "is_staff": False,
                "is_superuser": False,
                "first_name": "Sarah",
                "last_name": "Johnson",
            },
            {
                "username": "demo_importer_01",
                "email": "demo_importer_01@tradelistic.demo",
                "password": "Importer@123",
                "user_type": "importer",
                "is_superadmin": False,
                "is_staff": False,
                "is_superuser": False,
                "first_name": "Demo",
                "last_name": "Importer",
            },
            {
                "username": "akif1",
                "email": "nicholas@vionixstore.web.id",
                "password": "Exporter@123",
                "user_type": "exporter",
                "is_superadmin": False,
                "is_staff": False,
                "is_superuser": False,
                "first_name": "Akif",
                "last_name": "Exporter",
            },
            {
                "username": "ad1",
                "email": "fineakif@gmail.com",
                "password": "Exporter@123",
                "user_type": "exporter",
                "is_superadmin": False,
                "is_staff": False,
                "is_superuser": False,
                "first_name": "Bhati",
                "last_name": "House",
            },
        ]

        for item in accounts:
            user, _created = User.objects.get_or_create(
                username=item["username"],
                defaults={"email": item["email"]},
            )
            user.email = item["email"]
            user.user_type = item["user_type"]
            user.is_active = True
            user.is_superadmin = item["is_superadmin"]
            user.is_staff = item["is_staff"]
            user.is_superuser = item["is_superuser"]
            user.first_name = item["first_name"]
            user.last_name = item["last_name"]
            if not getattr(user, "city", None):
                user.city = "Karachi"
            if not getattr(user, "state_country", None):
                user.state_country = "Pakistan"
            user.set_password(item["password"])
            user.save()

        akif = User.objects.get(username="akif1")
        Store.objects.update_or_create(
            owner=akif,
            defaults={
                "seller_name": "akif1",
                "name": "akif shop",
                "description": "akif shop is a verified seller on Tradelistic.",
                "business_type": "trader",
                "email": akif.email,
                "is_active": True,
            },
        )

        ad1 = User.objects.get(username="ad1")
        Store.objects.update_or_create(
            owner=ad1,
            defaults={
                "seller_name": "ad1",
                "name": "bhati house",
                "description": "bhati house is a verified seller on Tradelistic.",
                "business_type": "manufacturer",
                "email": ad1.email,
                "established_year": 2021,
                "employee_count": "51-200",
                "is_active": True,
            },
        )

        checks = [
            ("admin", "admin123"),
            ("sarah_johnson", "Importer@123"),
            ("demo_importer_01", "Importer@123"),
            ("akif1", "Exporter@123"),
            ("ad1", "Exporter@123"),
        ]
        for username, password in checks:
            user = User.objects.get(username=username)
            ok = user.check_password(password)
            status = "OK" if ok and user.is_active else "FAILED"
            self.stdout.write(f"{status}: {username} / {password}")

        self.stdout.write(self.style.SUCCESS("Demo accounts are reset and ready."))
