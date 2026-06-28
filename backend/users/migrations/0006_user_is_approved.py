from django.db import migrations, models


def approve_existing_non_exporters(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.exclude(user_type='exporter').update(is_approved=True)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_user_user_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_approved',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(approve_existing_non_exporters, migrations.RunPython.noop),
    ]
