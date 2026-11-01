import uuid
from django.conf import settings
from django.db import models


def generate_uuid():
    return str(uuid.uuid4())


class ChatConversation(models.Model):
    """
    Message history itself lives in MongoDB for high-throughput append-only performance.
    """
    CONVERSATION_TYPES = (
        ("direct", "Direct Message (User to User)"),
        ("group", "Group Channel (User to Group)"),
        ("ai", "AI Assistant (User to AI)"),
    )

    conversation_id = models.CharField(primary_key=True, max_length=256, default=generate_uuid, editable=False)
    type = models.CharField(max_length=10, choices=CONVERSATION_TYPES)
    title = models.CharField(max_length=256, blank=True, default="")

    # For 'group' chats: points to the Newsroom Group relation
    newsroom_group = models.ForeignKey(
        'Newsroom.Group',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_conversations",
    )

    # For 'direct' and 'ai' chats: relational participant links
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="chat_conversations",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self):
        return f"{self.get_type_display()} ({self.conversation_id[:8]})"
