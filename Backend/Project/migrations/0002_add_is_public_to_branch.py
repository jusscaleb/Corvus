from django.db import migrations, models
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Migration(migrations.Migration):
    dependencies = [
        ('Project', '0001_initial'),  # adjust if the initial migration name differs
    ]
    operations = [
        migrations.AddField(
            model_name='branch',
            name='is_public',
            field=models.BooleanField(default=False),
        ),
    ]

