import uuid
from django.db import models


def generate_uuid():
    return str(uuid.uuid4())


class Article(models.Model):
    article_id = models.CharField(primary_key=True,
                                  max_length=256,
                                  default=generate_uuid,
                                  editable=False)
    title = models.CharField(max_length=256)
    group = models.ForeignKey(
        'Newsroom.Group',
        on_delete=models.CASCADE,
        related_name='articles',
        null=True,
        blank=True,
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_articles',
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('group', 'title'),
                name='unique_article_title_per_group',
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.group.group_name if self.group else 'Personal'})"


class Branch(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_review', 'In Review'),
        ('merged', 'Merged'),
    ]

    branch_id = models.CharField(primary_key=True,
                                 max_length=256,
                                 default=generate_uuid,
                                 editable=False)
    branch_name = models.CharField(max_length=256)
    branch_description = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20,
                              choices=STATUS_CHOICES,
                              default='draft')
    is_main = models.BooleanField(default=False)

    # Visibility flag â€“ false = private (only creator sees),
    # true = public (visible to newsroom)
    is_public = models.BooleanField(default=False)

    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='branches',
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_branches',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('article', 'branch_name'),
                name='unique_branch_name_per_article',
            )
        ]

    def __str__(self):
        return f"{self.article.title} -> {self.branch_name}"