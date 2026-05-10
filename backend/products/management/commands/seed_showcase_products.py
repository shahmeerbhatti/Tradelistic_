from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from products.models import Product
from stores.models import Store


SHOWCASE_PRODUCTS = [
    ("SoundCore Aero Earbuds", "Low-latency wireless earbuds with compact case and balanced everyday sound.", 270, "electronics", "accessories", "artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg"),
    ("Nebula X168A Headphones", "Over-ear headphones with soft cushions, clear calls and a rich listening profile.", 250, "electronics", "accessories", "gm2.jpg"),
    ("PixelCharge Magnetic Pad", "Slim wireless charging pad for desks, counters and bedside setups.", 240, "electronics", "accessories", "Copilot_20250820_220925.png"),
    ("Acer Swift Student Laptop", "Portable laptop for study, business work and daily productivity.", 780, "electronics", "laptops", "acer.jpg"),
    ("MatePad 11.5 Tablet", "Large display tablet for browsing, design review and lightweight office work.", 420, "electronics", "tablets", "all-matepad-11-5-s.jpg"),
    ("Canon ProShot Camera", "Compact content camera with sharp imaging for product and travel photography.", 690, "electronics", "cameras", "canon.jpg"),
    ("Urban Knit Hoodie", "Soft everyday hoodie with a clean silhouette and durable stitching.", 58, "fashion", "mens_clothing", "IMG-20251210-WA0008.jpg"),
    ("Classic Travel Backpack", "Structured backpack for campus, office and short travel routines.", 74, "fashion", "bags", "IMG-20251210-WA0012.jpg"),
    ("Flex Training Gloves", "Breathable training gloves with secure grip and padded palm support.", 32, "fashion", "accessories", "gloves.png"),
    ("Nordic Lounge Chair", "Minimal lounge chair with soft upholstery for modern living rooms.", 310, "home", "furniture", "IMG-20251210-WA0023.jpg"),
    ("Compact Air Purifier", "Quiet room purifier with a clean body and easy daily maintenance.", 145, "home", "appliances", "image-removebg-preview.png"),
    ("Ceramic Kitchen Set", "Everyday kitchen essentials with a smooth finish and durable feel.", 96, "home", "kitchen", "IMG-20251210-WA0030.jpg"),
]


class Command(BaseCommand):
    help = "Seed polished showcase products for frontend presentation."

    def handle(self, *args, **options):
        User = get_user_model()
        exporter, created = User.objects.get_or_create(
            username="tradelistic_showcase",
            defaults={
                "email": "showcase@tradelistic.local",
                "user_type": "exporter",
                "is_active": True,
            },
        )
        if created:
            exporter.set_password("showcase123")
            exporter.save(update_fields=["password"])

        Store.objects.get_or_create(
            owner=exporter,
            defaults={
                "name": "Crescendo Trade House",
                "description": "Curated marketplace supplier for electronics, fashion and home essentials.",
                "phone": "+92 300 0000000",
                "email": "showcase@tradelistic.local",
                "city": "Lahore",
                "state": "Punjab",
                "country": "Pakistan",
                "business_type": "trader",
                "established_year": 2024,
                "employee_count": "11-50",
                "is_active": True,
            },
        )

        created_count = 0
        updated_count = 0
        for name, description, price, category, subcategory, image in SHOWCASE_PRODUCTS:
            product, was_created = Product.objects.update_or_create(
                name=name,
                defaults={
                    "description": description,
                    "price": price,
                    "category": category,
                    "subcategory": subcategory,
                    "image": f"products/{image}",
                    "owner": exporter,
                },
            )
            if was_created:
                created_count += 1
            else:
                updated_count += 1
            product.created_at = timezone.now()
            product.save(update_fields=["created_at"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Showcase products ready: {created_count} created, {updated_count} updated."
            )
        )
