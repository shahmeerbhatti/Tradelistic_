from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0002_store_seller_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='bank_profile_linked',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='has_certificate_of_origin_support',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='ntn',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='product_category',
            field=models.CharField(choices=[('general', 'General Goods'), ('food_agriculture', 'Food / Agriculture'), ('chemicals', 'Chemicals'), ('machinery_industrial', 'Machinery / Industrial Goods'), ('textiles', 'Textiles'), ('electronics', 'Electronics')], default='general', max_length=40),
        ),
        migrations.AddField(
            model_name='store',
            name='psw_registered',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='strn',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
