from django.db import models

# Create your models here.
class Article(models.Model):
    article_id = models.CharField(blank=False, max_length=256, unique=True, default="", primary_key=True)
    title = models.CharField(blank=False, max_length=256, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    group = models.ForeignKey(
        'Newsroom.Group',
        on_delete=models.CASCADE,
        related_name='articles',
    )
    def __str__(self):
        return self.title

class Branch(models.Model):
    branch_id = models.CharField(blank=False, max_length=256, unique=True, default="", primary_key=True)
    branch_name = models.CharField(blank=False, max_length=256, unique=True)
    branch_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='branches',
    )
    def __str__(self):
        return self.branch_name
