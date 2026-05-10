from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0012_product_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='productoffer',
            name='importer_requirements',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='productoffer',
            name='importer_response_note',
            field=models.TextField(blank=True),
        ),
    ]
