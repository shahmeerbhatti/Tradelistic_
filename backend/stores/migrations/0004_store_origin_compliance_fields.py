from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0003_store_export_compliance_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='abn',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='business_number',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='cds_subscribed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='cers_account_ready',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='company_registration_no',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='customs_account_active',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='customs_agent_assigned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='customs_docs_workflow_ready',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='dcrn',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='eori_gb',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='export_declaration_method',
            field=models.CharField(blank=True, choices=[('', 'Not selected'), ('self', 'Self filing'), ('agent', 'Customs agent')], default='', max_length=20),
        ),
        migrations.AddField(
            model_name='store',
            name='miti_strategic_trade_ready',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='rm_export_program_id',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='ssm_registration_no',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='store',
            name='tradenet_declarant_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='store',
            name='uen',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
