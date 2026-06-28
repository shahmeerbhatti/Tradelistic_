from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('stores', '0003_store_export_compliance_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportGuide',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('country_code', models.CharField(max_length=8, unique=True)),
                ('country_name', models.CharField(max_length=120)),
                ('overview', models.TextField(blank=True)),
                ('documents_required', models.JSONField(blank=True, default=list)),
                ('licenses_registrations', models.JSONField(blank=True, default=list)),
                ('buyer_importer_requirements', models.JSONField(blank=True, default=list)),
                ('company_checklist_rules', models.JSONField(blank=True, default=list)),
                ('warnings', models.JSONField(blank=True, default=list)),
                ('official_sources', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(choices=[('available', 'Available'), ('unavailable', 'Unavailable')], default='available', max_length=20)),
                ('last_updated', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['country_name'],
            },
        ),
        migrations.CreateModel(
            name='CompanyDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(max_length=80)),
                ('file', models.FileField(blank=True, null=True, upload_to='company_documents/')),
                ('file_url', models.URLField(blank=True)),
                ('status', models.CharField(choices=[('uploaded', 'Uploaded'), ('missing', 'Missing'), ('expired', 'Expired')], default='missing', max_length=20)),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='company_documents', to='stores.store')),
            ],
            options={
                'ordering': ['document_type'],
                'unique_together': {('store', 'document_type')},
            },
        ),
        migrations.AddIndex(
            model_name='companydocument',
            index=models.Index(fields=['store', 'document_type'], name='export_guid_store_i_04a30e_idx'),
        ),
        migrations.AddIndex(
            model_name='companydocument',
            index=models.Index(fields=['status'], name='export_guid_status_43d8bd_idx'),
        ),
    ]
