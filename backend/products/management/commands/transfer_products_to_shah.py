from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import Product
from stores.models import Store

User = get_user_model()

class Command(BaseCommand):
    help = 'Transfer all products to shah user and Alfalah store'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm the transfer operation',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This command will transfer ALL products to user "shah" and store "Alfalah".\n'
                    'Run with --confirm to proceed.'
                )
            )
            return

        try:
            # Get the shah user
            shah_user = User.objects.get(username='shah')
            self.stdout.write(f'Found user: {shah_user.username} (ID: {shah_user.id})')
            
            # Check if shah has a store
            try:
                shah_store = Store.objects.get(owner=shah_user)
                self.stdout.write(f'Found store: {shah_store.name} (ID: {shah_store.id})')
            except Store.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'User "shah" does not have a store. Please create a store first.'
                    )
                )
                return

            # Get all products not owned by shah
            products_to_transfer = Product.objects.exclude(owner=shah_user)
            total_products = products_to_transfer.count()
            
            if total_products == 0:
                self.stdout.write(
                    self.style.SUCCESS('All products are already owned by shah!')
                )
                return

            self.stdout.write(f'Found {total_products} products to transfer')

            # Show current product owners
            current_owners = products_to_transfer.values_list('owner__username', flat=True).distinct()
            self.stdout.write(f'Current owners: {list(current_owners)}')

            # Transfer products
            updated_count = products_to_transfer.update(owner=shah_user)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully transferred {updated_count} products to user "shah"'
                )
            )

            # Show final stats
            total_shah_products = Product.objects.filter(owner=shah_user).count()
            self.stdout.write(
                self.style.SUCCESS(
                    f'User "shah" now owns {total_shah_products} total products'
                )
            )

        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    'User "shah" not found. Please make sure the user exists.'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error occurred: {str(e)}')
            )