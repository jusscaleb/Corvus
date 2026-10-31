from django.db import models

# Create your models here.
class Group(models.Model):
    group_id = models.CharField(blank=False, max_length=256, unique=True, default="", primary_key=True)
    group_name = models.CharField(blank=False, max_length=256, unique=True)
    group_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    @property
    def member_number(self):
        return self.memberships.count()

    def __str__(self):
        return self.group_name


class Member(models.Model):
    member = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='group_memberships',
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('member', 'group'),
                name='unique_member_group_membership',
            ),
        ]

    def __str__(self):
        return f'{self.member} in {self.group}'
