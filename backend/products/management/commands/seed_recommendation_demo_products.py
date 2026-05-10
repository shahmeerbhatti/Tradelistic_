from pathlib import Path
from textwrap import dedent

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import Product, ProductImage
from users.models import User


PALETTES = [
    ("#315bd2", "#dbe7ff"),
    ("#0f766e", "#ccfbf1"),
    ("#be123c", "#ffe4e6"),
    ("#7c3aed", "#ede9fe"),
    ("#b45309", "#ffedd5"),
    ("#0369a1", "#e0f2fe"),
    ("#15803d", "#dcfce7"),
    ("#334155", "#e2e8f0"),
]


PRODUCTS = [
    ("AeroBook 14 Laptop", "Slim productivity laptop with crisp display, fast storage and all-day student/business performance.", 685, "electronics", "laptops", "laptop"),
    ("Nova X Smartphone", "Modern smartphone with sharp camera, bright screen and reliable daily battery life.", 520, "electronics", "mobile_phones", "phone"),
    ("TabLite 11 Tablet", "Portable tablet for streaming, notes, study and everyday media use.", 310, "electronics", "tablets", "tablet"),
    ("EchoPods Wireless Earbuds", "Compact earbuds with clean sound, case charging and daily comfort.", 72, "electronics", "accessories", "earbuds"),
    ("CreatorShot DSLR Camera", "Camera kit for product photos, travel shots and content creation.", 840, "electronics", "cameras", "camera"),
    ("Blue Oxford Shirt", "Breathable smart casual shirt with a clean fit for daily wear.", 34, "fashion", "mens_clothing", "shirt"),
    ("Urban Denim Jacket", "Structured denim jacket with durable stitching and street-ready styling.", 58, "fashion", "mens_clothing", "jacket"),
    ("Linen Summer Dress", "Soft lightweight dress with a relaxed silhouette and polished finish.", 49, "fashion", "womens_clothing", "dress"),
    ("FlexRun Sneakers", "Comfort sneakers with cushioned sole for work, travel and casual movement.", 66, "fashion", "shoes", "shoes"),
    ("Metro Travel Backpack", "Multi-pocket backpack with padded laptop storage and water-resistant finish.", 42, "fashion", "bags", "bag"),
    ("Pearl Drop Earrings", "Elegant jewelry accessory with a refined shine for formal and casual looks.", 38, "fashion", "jewelry", "jewelry"),
    ("Nordic Lounge Chair", "Modern lounge chair with soft support and minimal living-room profile.", 310, "home", "furniture", "chair"),
    ("Ceramic Kitchen Set", "Coordinated dining and kitchen set with smooth ceramic finish.", 96, "home", "kitchen", "kitchen"),
    ("CloudRest Bedding Pack", "Soft bedding essentials designed for comfort and clean bedroom styling.", 88, "home", "bedding", "bedding"),
    ("Marble Desk Lamp", "Decor lamp with warm light, compact base and modern home-office finish.", 44, "home", "decor", "lamp"),
    ("Compact Air Purifier", "Quiet purifier for cleaner room air with simple daily controls.", 145, "home", "appliances", "purifier"),
    ("Startup Strategy Book", "Practical business reading for planning, growth and product thinking.", 24, "books", "non_fiction", "book"),
    ("Learning Python Guide", "Educational programming book for beginners and project builders.", 31, "books", "educational", "book"),
    ("Galaxy Comic Collection", "Colorful comic issue set for collectors and leisure reading.", 18, "books", "comics", "comic"),
    ("Design Monthly Magazine", "Visual design magazine with trends, layouts and product inspiration.", 12, "books", "magazines", "magazine"),
    ("Yoga Fitness Mat", "Non-slip exercise mat for home workouts, stretching and fitness routines.", 29, "others", "sports", "fitness"),
    ("STEM Builder Toy Kit", "Creative toy kit for hands-on learning and playful engineering.", 36, "others", "toys", "toy"),
    ("GlowCare Beauty Set", "Personal care set with daily skincare essentials and compact packaging.", 41, "others", "beauty", "beauty"),
    ("AutoClean Car Kit", "Automotive cleaning bundle for interior and exterior car care.", 52, "others", "automotive", "auto"),
    ("DeskPro Office Organizer", "Office storage tray for stationery, documents and desk essentials.", 22, "others", "office", "office"),
    ("ProBook 15 Business Laptop", "Reliable business laptop for spreadsheets, research and presentation work.", 735, "electronics", "laptops", "laptop"),
    ("PixelWave Mobile Phone", "Sleek mobile phone with smooth display, camera tools and fast daily performance.", 610, "electronics", "mobile_phones", "phone"),
    ("SketchPad Mini Tablet", "Light tablet for drawing, reading and portable entertainment.", 255, "electronics", "tablets", "tablet"),
    ("BassCore Bluetooth Speaker", "Portable speaker with punchy audio and simple wireless pairing.", 48, "electronics", "accessories", "speaker"),
    ("TravelCam Mirrorless Kit", "Compact camera kit for creators, stores and travel photography.", 920, "electronics", "cameras", "camera"),
    ("Classic Black Hoodie", "Soft hoodie with everyday warmth and clean streetwear styling.", 46, "fashion", "mens_clothing", "hoodie"),
    ("Formal Knit Blazer", "Smart layering piece with comfortable knit texture and polished silhouette.", 75, "fashion", "womens_clothing", "blazer"),
    ("TrailStep Boots", "Durable boots with steady grip for travel and outdoor casual wear.", 82, "fashion", "shoes", "boots"),
    ("Canvas Crossbody Bag", "Compact daily bag with secure pockets and lightweight fabric.", 33, "fashion", "bags", "bag"),
    ("Minimal Silver Ring", "Polished ring accessory with clean minimal styling.", 27, "fashion", "jewelry", "ring"),
    ("Oak Coffee Table", "Modern table with warm wood tone and sturdy living-room build.", 185, "home", "furniture", "table"),
    ("Stainless Cookware Set", "Durable cookware set for everyday meal prep and clean kitchen presentation.", 125, "home", "kitchen", "cookware"),
    ("Hotel Pillow Pair", "Soft pillow pair with supportive fill and fresh bedroom comfort.", 54, "home", "bedding", "pillow"),
    ("Wall Art Frame Set", "Decor frame set for refreshing lounge, hallway or workroom walls.", 39, "home", "decor", "decor"),
    ("Smart Electric Kettle", "Fast-heating kettle with compact design and easy daily use.", 59, "home", "appliances", "kettle"),
    ("Modern Fiction Novel", "Engaging fiction title for weekend reading and personal libraries.", 19, "books", "fiction", "novel"),
    ("Marketing Playbook", "Non-fiction guide covering practical growth, brand and sales strategy.", 28, "books", "non_fiction", "book"),
    ("Exam Prep Workbook", "Educational workbook with structured practice for focused study.", 21, "books", "educational", "workbook"),
    ("Hero Comic Issue", "Collectible comic issue with bold artwork and fast-paced story.", 16, "books", "comics", "comic"),
    ("Home Style Magazine", "Magazine covering interiors, decor ideas and product styling.", 14, "books", "magazine", "magazine"),
    ("Adjustable Dumbbell Set", "Compact strength training set for home fitness and conditioning.", 95, "others", "sports", "fitness"),
    ("Wooden Puzzle Toy", "Durable puzzle toy for creative play and problem solving.", 25, "others", "toys", "toy"),
    ("Daily Grooming Kit", "Personal care kit with travel-friendly grooming essentials.", 32, "others", "beauty", "grooming"),
    ("Car Phone Mount", "Stable automotive phone mount for navigation and hands-free driving.", 20, "others", "automotive", "auto"),
    ("Ergo Desk Stand", "Office stand for laptop/tablet positioning and cleaner workspace setup.", 37, "others", "office", "office"),
]

REAL_IMAGE_POOL = [
    "acer.jpg", "Dell.jpg", "hp_envy.jpg", "Best-Student-Laptops-in-Pakistan.jpg", "lenovo.jpg",
    "Oppo-Reno-11-5G-a.jpg", "samsung.jpg", "xiamoi.jpg", "all-matepad-11-5-s.jpg", "canon.jpg",
    "nikon.jpg", "sony.jpg", "type_c_charger.jpg", "Gaming_mouse.jpg", "gm_3.jpg",
    "IMG-20251210-WA0007.jpg", "IMG-20251210-WA0008.jpg", "IMG-20251210-WA0009.jpg",
    "IMG-20251210-WA0010.jpg", "IMG-20251210-WA0011.jpg", "IMG-20251210-WA0012.jpg",
    "IMG-20251210-WA0013.jpg", "IMG-20251210-WA0014.jpg", "IMG-20251210-WA0015.jpg",
    "IMG-20251210-WA0016.jpg", "IMG-20251210-WA0017.jpg", "IMG-20251210-WA0018.jpg",
    "IMG-20251210-WA0019.jpg", "IMG-20251210-WA0020.jpg", "IMG-20251210-WA0021.jpg",
    "IMG-20251210-WA0022.jpg", "IMG-20251210-WA0023.jpg", "IMG-20251210-WA0024.jpg",
    "IMG-20251210-WA0025.jpg", "IMG-20251210-WA0026.jpg", "IMG-20251210-WA0027.jpg",
    "IMG-20251210-WA0028.jpg", "IMG-20251210-WA0029.jpg", "IMG-20251210-WA0030.jpg",
    "IMG-20251210-WA0031.jpg", "IMG-20251210-WA0032.jpg", "IMG-20251210-WA0033.jpg",
    "IMG-20251210-WA0034.jpg", "IMG-20251210-WA0036.jpg", "IMG-20251210-WA0037.jpg",
    "IMG-20251210-WA0038.jpg", "IMG-20251210-WA0039.jpg", "IMG-20251210-WA0040.jpg",
    "ChatGPT_Image_Aug_15_2025_05_42_46_PM.png", "Copilot_20250820_220925.png",
]

IMAGE_BY_ICON = {
    "laptop": ["acer.jpg", "Dell.jpg", "hp_envy.jpg", "Best-Student-Laptops-in-Pakistan.jpg", "lenovo.jpg"],
    "phone": ["Oppo-Reno-11-5G-a.jpg", "samsung.jpg", "xiamoi.jpg", "s1.jpg", "s2.jpeg"],
    "tablet": ["all-matepad-11-5-s.jpg", "all-matepad-11-5-s_qdAaOWR.jpg", "all-matepad-11-5-s_qWt7GQB.jpg"],
    "earbuds": ["sony.jpg", "sony_QD5c0ni.jpg", "sony_rlQZvvt.jpg"],
    "speaker": ["Gaming_mouse.jpg", "gm_3.jpg", "type_c_charger.jpg"],
    "camera": ["canon.jpg", "nikon.jpg", "canon_GCX36XX.jpg", "canon_r15q0OR.jpg"],
    "shirt": ["IMG-20251210-WA0007.jpg", "IMG-20251210-WA0008.jpg", "IMG-20251210-WA0009.jpg"],
    "jacket": ["IMG-20251210-WA0010.jpg", "IMG-20251210-WA0011.jpg"],
    "dress": ["IMG-20251210-WA0012.jpg", "IMG-20251210-WA0013.jpg"],
    "hoodie": ["IMG-20251210-WA0014.jpg", "IMG-20251210-WA0015.jpg"],
    "blazer": ["IMG-20251210-WA0016.jpg", "IMG-20251210-WA0017.jpg"],
    "shoes": ["s3.jpeg", "s3_bc8FDI4.jpeg", "IMG-20251210-WA0018.jpg"],
    "boots": ["IMG-20251210-WA0019.jpg", "IMG-20251210-WA0020.jpg"],
    "bag": ["IMG-20251210-WA0021.jpg", "IMG-20251210-WA0022.jpg"],
    "jewelry": ["IMG-20251210-WA0023.jpg", "IMG-20251210-WA0024.jpg"],
    "ring": ["IMG-20251210-WA0025.jpg", "IMG-20251210-WA0026.jpg"],
    "chair": ["IMG-20251210-WA0027.jpg", "IMG-20251210-WA0028.jpg"],
    "table": ["IMG-20251210-WA0029.jpg", "IMG-20251210-WA0030.jpg"],
    "kitchen": ["IMG-20251210-WA0031.jpg", "IMG-20251210-WA0032.jpg"],
    "cookware": ["IMG-20251210-WA0033.jpg", "IMG-20251210-WA0034.jpg"],
    "bedding": ["IMG-20251210-WA0036.jpg", "IMG-20251210-WA0037.jpg"],
    "pillow": ["IMG-20251210-WA0038.jpg", "IMG-20251210-WA0039.jpg"],
    "lamp": ["Copilot_20250806_214806.png", "Copilot_20250820_220925.png"],
    "decor": ["ChatGPT_Image_Aug_15_2025_05_42_46_PM.png", "IMG_2690-scaled.jpg"],
    "purifier": ["image-removebg-preview.png", "Copilot_20250806_214806.png"],
    "kettle": ["IMG-20251210-WA0040.jpg", "Screenshot_2026-04-18_153247.png"],
    "book": ["artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg", "defaultimage.png"],
    "novel": ["artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg", "defaultimage.png"],
    "comic": ["artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg", "ChatGPT_Image_Aug_20_2025_06_57_37_PM.png"],
    "magazine": ["ChatGPT_Image_Aug_20_2025_06_57_37_PM.png", "defaultimage.png"],
    "workbook": ["defaultimage.png", "artworks-SUztm4uP3kiZuVc2-2ixXww-t500x500.jpg"],
    "fitness": ["gloves.png", "gloves_FkljMAY.png"],
    "toy": ["Copilot_20250806_025245.png", "Copilot_20250806_025245_7MW8nBd.png"],
    "beauty": ["WhatsApp_Image_2025-05-13_at_19.47.11.jpeg", "IMG-20251210-WA0026.jpg"],
    "grooming": ["WhatsApp_Image_2025-05-13_at_19.47.11.jpeg", "IMG-20251210-WA0025.jpg"],
    "auto": ["kb1.jpg", "kb2.jpg"],
    "office": ["mb1.jpg", "mb1_7gRSETR.jpg"],
}


def pick_existing_image(icon, index):
    media_products = Path(settings.MEDIA_ROOT) / "products"
    icon_existing = [name for name in IMAGE_BY_ICON.get(icon, []) if (media_products / name).exists()]
    if icon_existing:
        return icon_existing[index % len(icon_existing)]
    fallback_existing = [name for name in REAL_IMAGE_POOL if (media_products / name).exists()]
    if fallback_existing:
        return fallback_existing[index % len(fallback_existing)]
    return None


def svg_for_product(name, category, icon, palette_index):
    primary, soft = PALETTES[palette_index % len(PALETTES)]
    safe_name = name.replace("&", "&amp;")
    safe_category = category.replace("&", "&amp;").upper()
    return dedent(f"""\
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
          <rect width="900" height="700" rx="58" fill="{soft}"/>
          <circle cx="735" cy="118" r="92" fill="{primary}" opacity="0.14"/>
          <circle cx="156" cy="590" r="118" fill="{primary}" opacity="0.10"/>
          <rect x="120" y="112" width="660" height="472" rx="54" fill="#ffffff" opacity="0.82"/>
          <rect x="190" y="185" width="520" height="250" rx="42" fill="{primary}" opacity="0.12"/>
          <text x="450" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" fill="{primary}">{icon}</text>
          <text x="450" y="493" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#07142f">{safe_name}</text>
          <text x="450" y="545" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="{primary}">{safe_category}</text>
        </svg>
    """)


class Command(BaseCommand):
    help = "Seed 50 recommendation demo products across akif1 and ad1 stores."

    def handle(self, *args, **options):
        owners = [
            User.objects.get(username="akif1"),
            User.objects.get(username="ad1"),
        ]
        for owner in owners:
            owner.is_active = True
            owner.user_type = "exporter"
            owner.set_password("Exporter@123")
            owner.save(update_fields=["is_active", "user_type", "password"])

        media_dir = Path(settings.MEDIA_ROOT) / "products" / "recommendation_demo"
        media_dir.mkdir(parents=True, exist_ok=True)

        created = 0
        updated = 0
        for index, item in enumerate(PRODUCTS):
            owner = owners[0] if index < 25 else owners[1]
            name, description, price, category, subcategory, icon = item
            real_image_name = pick_existing_image(icon, index)
            if real_image_name and (Path(settings.MEDIA_ROOT) / "products" / real_image_name).exists():
                image_path = f"products/{real_image_name}"
            else:
                file_name = f"{owner.username}_{index + 1:02d}_{name.lower().replace(' ', '_').replace('/', '_')}.svg"
                file_path = media_dir / file_name
                file_path.write_text(svg_for_product(name, category, icon, index), encoding="utf-8")
                image_path = f"products/recommendation_demo/{file_name}"

            product, was_created = Product.objects.update_or_create(
                owner=owner,
                name=name,
                defaults={
                    "description": description,
                    "price": price,
                    "category": category,
                    "subcategory": subcategory,
                    "image": image_path,
                    "is_active": True,
                },
            )
            ProductImage.objects.update_or_create(
                product=product,
                order=0,
                defaults={"image": image_path},
            )
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS(f"Seeded recommendation demo products. Created: {created}, updated: {updated}."))
        self.stdout.write(self.style.SUCCESS("Both exporters are active. Demo password for akif1 and ad1: Exporter@123"))
