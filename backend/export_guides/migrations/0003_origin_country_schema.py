from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('export_guides', '0002_seed_export_guides'),
    ]

    operations = [
        migrations.RenameField(
            model_name='exportguide',
            old_name='country_code',
            new_name='exporter_country_code',
        ),
        migrations.RenameField(
            model_name='exportguide',
            old_name='country_name',
            new_name='exporter_country_name',
        ),
        migrations.RenameField(
            model_name='exportguide',
            old_name='documents_required',
            new_name='standard_export_documents',
        ),
        migrations.RenameField(
            model_name='exportguide',
            old_name='licenses_registrations',
            new_name='government_registrations',
        ),
        migrations.RemoveField(
            model_name='exportguide',
            name='buyer_importer_requirements',
        ),
        migrations.AddField(
            model_name='exportguide',
            name='export_declaration_process',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='exportguide',
            name='export_licences_permits',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterModelOptions(
            name='exportguide',
            options={'ordering': ['exporter_country_name']},
        ),
    ]
