from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import Product, ProductImage


class Command(BaseCommand):
    help = "Attach existing files from MEDIA_ROOT/products to product records."

    image_map = {
        "Test Laptop": ["hp_envy.jpg", "Best-Student-Laptops-in-Pakistan.jpg"],
        "Gaming Laptop": ["Dell.jpg", "Best-Student-Laptops-in-Pakistan_qujXNa1.jpg"],
        "Wireless Headphones": ["sony.jpg", "sony_QD5c0ni.jpg"],
        "Smartphone": ["samsung.jpg", "Oppo-Reno-11-5G-a.jpg"],
        "Cotton T-Shirt": ["IMG-20251210-WA0007.jpg", "IMG-20251210-WA0008.jpg"],
        "Running Shoes": ["s1.jpg", "s2.jpeg", "s3.jpeg"],
        "Test Product for Review": ["defaultimage.png", "image-removebg-preview.png"],
        "Test Product for Complete Flow": ["Gaming_mouse.jpg", "gm_3.jpg"],
        "SoundCore Aero Earbuds": [
            "artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg",
            "artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500_uru5ZkT.jpg",
        ],
        "Nebula X168A Headphones": ["gm2.jpg", "gm2_nEkvZqM.jpg"],
        "PixelCharge Magnetic Pad": ["Copilot_20250820_220925.png"],
        "Acer Swift Student Laptop": ["acer.jpg"],
        "MatePad 11.5 Tablet": ["all-matepad-11-5-s.jpg", "all-matepad-11-5-s_qdAaOWR.jpg"],
        "Canon ProShot Camera": ["canon.jpg", "canon_GCX36XX.jpg", "canon_jR6Y9jQ.jpg"],
        "Urban Knit Hoodie": ["IMG-20251210-WA0008.jpg", "IMG-20251210-WA0009.jpg"],
        "Classic Travel Backpack": ["IMG-20251210-WA0012.jpg", "IMG-20251210-WA0013.jpg"],
        "Flex Training Gloves": ["gloves.png", "gloves_FkljMAY.png"],
        "Nordic Lounge Chair": ["IMG-20251210-WA0023.jpg", "IMG-20251210-WA0024.jpg"],
        "Compact Air Purifier": ["image-removebg-preview.png", "Copilot_20250806_214806.png"],
        "Ceramic Kitchen Set": ["IMG-20251210-WA0030.jpg", "IMG-20251210-WA0031.jpg"],
    }

    def handle(self, *args, **options):
        media_products = Path(settings.MEDIA_ROOT) / "products"
        if not media_products.exists():
            self.stderr.write(f"Missing products media folder: {media_products}")
            return

        created_gallery = 0
        updated_main = 0
        skipped_missing_files = []

        for product in Product.objects.all().order_by("id"):
            filenames = self.image_map.get(product.name)
            if not filenames:
                continue

            existing_files = [
                filename
                for filename in filenames
                if (media_products / filename).exists()
            ]

            missing_files = [filename for filename in filenames if filename not in existing_files]
            skipped_missing_files.extend(f"{product.name}: {filename}" for filename in missing_files)

            if not existing_files:
                continue

            if not product.image:
                product.image = f"products/{existing_files[0]}"
                product.save(update_fields=["image"])
                updated_main += 1

            for order, filename in enumerate(existing_files):
                image_path = f"products/{filename}"
                _, created = ProductImage.objects.get_or_create(
                    product=product,
                    image=image_path,
                    defaults={"order": order},
                )
                if created:
                    created_gallery += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Attached images. Main images updated: {updated_main}. Gallery rows created: {created_gallery}."
            )
        )

        if skipped_missing_files:
            self.stdout.write("Skipped missing files:")
            for item in skipped_missing_files:
                self.stdout.write(f"  - {item}")
