from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_product_subcategory'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductOffer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('offered_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('counter_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('note', models.TextField(blank=True)),
                ('exporter_note', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected'), ('countered', 'Countered')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('exporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_offers', to=settings.AUTH_USER_MODEL)),
                ('importer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_offers', to=settings.AUTH_USER_MODEL)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offers', to='products.product')),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('offer_created', 'Offer Created'), ('offer_accepted', 'Offer Accepted'), ('offer_rejected', 'Offer Rejected'), ('offer_countered', 'Offer Countered'), ('general', 'General')], default='general', max_length=32)),
                ('title', models.CharField(max_length=160)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_notifications', to=settings.AUTH_USER_MODEL)),
                ('offer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='products.productoffer')),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='products.product')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['importer', '-updated_at'], name='products_pr_import_f74df5_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['exporter', '-updated_at'], name='products_pr_export_2d2390_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['product', 'status'], name='products_pr_product_792f6c_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', 'is_read', '-created_at'], name='products_no_recipie_2a3739_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['offer', '-created_at'], name='products_no_offer_i_3fa34d_idx'),
        ),
    ]
