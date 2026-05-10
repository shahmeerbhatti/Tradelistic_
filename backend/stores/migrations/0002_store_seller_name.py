from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='seller_name',
            field=models.CharField(blank=True, help_text='Seller display name', max_length=255),
        ),
    ]
