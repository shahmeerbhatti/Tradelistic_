from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_productoffer_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
