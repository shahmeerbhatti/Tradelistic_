from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from products.models import Product
from transactions.models import Review, Sale


REVIEW_TEMPLATES = [
    (5, "Excellent quality", "Product matched the listing and felt reliable for trade use."),
    (5, "Very useful", "Clean packaging, strong value and exactly what my import order needed."),
    (4, "Good marketplace pick", "Good product overall. Photos and details helped with the buying decision."),
    (5, "Recommended", "Smooth purchase experience and the product quality looks ready for resale."),
    (4, "Solid option", "Fair price, practical quality and useful for testing repeat demand."),
    (5, "Great finish", "The item has a polished finish and works well for our catalog needs."),
]


class Command(BaseCommand):
    help = "Seed verified demo reviews for active products so stars, recommendations and exporter analytics have data."

    def handle(self, *args, **options):
        User = get_user_model()
        reviewers = []
        for index in range(1, 9):
            username = f"demo_importer_{index:02d}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@tradelistic.demo",
                    "first_name": "Demo",
                    "last_name": f"Importer {index}",
                    "user_type": "importer",
                    "city": "Karachi",
                    "state_country": "Pakistan",
                    "is_active": True,
                },
            )
            if created:
                user.set_password("Importer@123")
            user.user_type = "importer"
            user.is_active = True
            user.save()
            reviewers.append(user)

        products = list(Product.objects.filter(is_active=True).select_related("owner").order_by("id"))
        sales_created = 0
        reviews_created = 0

        for product_index, product in enumerate(products):
            wanted_reviewers = [
                reviewers[product_index % len(reviewers)],
                reviewers[(product_index + 3) % len(reviewers)],
                reviewers[(product_index + 5) % len(reviewers)],
            ]

            for review_index, reviewer in enumerate(wanted_reviewers):
                template = REVIEW_TEMPLATES[(product_index + review_index) % len(REVIEW_TEMPLATES)]
                rating, title, comment = template
                quantity = 1 + ((product_index + review_index) % 3)
                total_amount = Decimal(product.price or 0) * Decimal(quantity)

                sale, sale_created = Sale.objects.get_or_create(
                    customer=reviewer,
                    product=product,
                    order_id=f"DEMO-REV-{product.id}-{reviewer.id}",
                    defaults={
                        "quantity": quantity,
                        "unit_price": product.price or Decimal("0.00"),
                        "total_amount": total_amount,
                        "shipping_cost": Decimal("0.00"),
                        "tax_amount": Decimal("0.00"),
                        "service_fee": Decimal("0.00"),
                        "final_total": total_amount,
                        "customer_name": reviewer.get_full_name() or reviewer.username,
                        "customer_email": reviewer.email,
                        "customer_phone": "",
                        "shipping_address_line1": "Demo Importer Address",
                        "shipping_address_line2": "",
                        "shipping_city": reviewer.city or "Karachi",
                        "shipping_state": "Sindh",
                        "shipping_country": reviewer.state_country or "Pakistan",
                        "shipping_postal_code": "00000",
                        "payment_method": "stripe_demo",
                        "payment_status": "completed",
                        "order_status": "delivered",
                        "delivered_at": timezone.now(),
                        "notes": "Demo sale for review/recommendation testing.",
                    },
                )
                sales_created += int(sale_created)

                _, review_created = Review.objects.get_or_create(
                    user=reviewer,
                    product=product,
                    defaults={
                        "sale": sale,
                        "sales_id": sale.sales_id,
                        "rating": rating,
                        "title": title,
                        "comment": comment,
                        "verified_purchase": True,
                        "is_approved": True,
                    },
                )
                reviews_created += int(review_created)

        self.stdout.write(self.style.SUCCESS(
            f"Demo review seed complete. Products: {len(products)}, sales created: {sales_created}, reviews created: {reviews_created}."
        ))
        self.stdout.write(self.style.SUCCESS("Demo importer password: Importer@123"))
