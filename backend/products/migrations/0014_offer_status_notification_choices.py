from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0013_offer_importer_response_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[
                ('offer_created', 'Offer Created'),
                ('offer_accepted', 'Offer Accepted'),
                ('offer_rejected', 'Offer Rejected'),
                ('offer_countered', 'Offer Countered'),
                ('offer_importer_countered', 'Importer Countered'),
                ('offer_importer_accepted', 'Importer Accepted'),
                ('offer_importer_rejected', 'Importer Rejected'),
                ('offer_paid', 'Offer Paid'),
                ('general', 'General'),
            ], default='general', max_length=32),
        ),
        migrations.AlterField(
            model_name='productoffer',
            name='status',
            field=models.CharField(choices=[
                ('pending', 'Pending'),
                ('accepted', 'Accepted'),
                ('rejected', 'Rejected'),
                ('countered', 'Countered'),
                ('importer_countered', 'Importer Countered'),
                ('importer_accepted', 'Importer Accepted'),
                ('importer_rejected', 'Importer Rejected'),
                ('paid', 'Paid'),
            ], default='pending', max_length=20),
        ),
    ]
