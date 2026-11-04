import uuid
from django.db import models
from django.conf import settings


def generate_uuid():
    return str(uuid.uuid4())


class ArticleWorkspace(models.Model):
    """
    Stores the AI-generated Mindmap, Editorial Board (suggestions & sources),
    and the latest Review / Plagiarism / AI-Detection report for an Article.
    """
    article = models.OneToOneField(
        'Project.Article',
        on_delete=models.CASCADE,
        related_name='ai_workspace',
        primary_key=True,
    )
    # Structured mindmap JSON: { "root": "...", "nodes": [{ "id", "label", "summary", "category", "children": [...] }] }
    mindmap_data = models.JSONField(default=dict, blank=True)
    # List of board items: [{ "id", "kind": "suggestion"|"source", "title", "detail", "url", "priority", "applied" }]
    board_items = models.JSONField(default=list, blank=True)
    # Latest review / plagiarism / AI check report
    last_review = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Workspace for {self.article_id}"


class AgentMemory(models.Model):
    """
    Long-term memory store for Saiph AI Agent.
    Can be scoped to a specific Article (research facts, verified sources, style rules)
    or globally to a User (editorial tone, language preference, recurring guidelines).
    """
    CATEGORY_CHOICES = [
        ('fact', 'Verified Fact'),
        ('source', 'Source / Reference'),
        ('style', 'Style / Editorial Preference'),
        ('goal', 'Story Angle / Goal'),
    ]

    memory_id = models.CharField(
        primary_key=True,
        max_length=256,
        default=generate_uuid,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agent_memories',
    )
    article = models.ForeignKey(
        'Project.Article',
        on_delete=models.CASCADE,
        related_name='agent_memories',
        null=True,
        blank=True,
    )
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='fact')
    fact = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        scope = self.article.title if self.article else "User Global"
        return f"[{self.category}] ({scope}): {self.fact[:50]}"


class AgentConversationMessage(models.Model):
    """
    Short-term conversational memory for 1-to-1 communication between a reporter
    and Saiph (optionally scoped to a specific article or global workspace).
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    message_id = models.CharField(
        primary_key=True,
        max_length=256,
        default=generate_uuid,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_messages',
    )
    article = models.ForeignKey(
        'Project.Article',
        on_delete=models.CASCADE,
        related_name='ai_messages',
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    actions_taken = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} ({self.user.username}): {self.content[:40]}"
