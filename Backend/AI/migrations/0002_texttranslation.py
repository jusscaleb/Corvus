from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('AI', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TextTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_hash', models.CharField(max_length=64)),
                ('target_language', models.CharField(max_length=16)),
                ('source_text', models.TextField()),
                ('translated_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddConstraint(
            model_name='texttranslation',
            constraint=models.UniqueConstraint(
                fields=('source_hash', 'target_language'),
                name='unique_translation_per_language',
            ),
        ),
        migrations.AddIndex(
            model_name='texttranslation',
            index=models.Index(fields=['target_language', 'source_hash'], name='ai_trans_lang_hash_idx'),
        ),
    ]
