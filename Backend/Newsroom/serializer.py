import uuid
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, Member

User = get_user_model()


class GroupMemberUserSerializer(serializers.ModelSerializer):
    """Minimal representation of a user inside a group."""
    class Meta:
        model = User
        fields = ['user_id', 'username', 'full_name', 'email']


class MemberSerializer(serializers.ModelSerializer):
    """Serializes the membership relation."""
    member = GroupMemberUserSerializer(read_only=True)

    class Meta:
        model = Member
        fields = ['id', 'member', 'group']
        read_only_fields = ['id', 'member', 'group']


class AddMemberSerializer(serializers.Serializer):
    """Validates the input payload to add a member."""
    user_id = serializers.CharField(required=True)

    def validate_user_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User does not exist.")
        return value


class GroupSerializer(serializers.ModelSerializer):
    """Serializes Group data."""
    member_number = serializers.IntegerField(read_only=True)
    memberships = MemberSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = [
            'group_id',
            'group_name',
            'group_description',
            'member_number',
            'memberships',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['group_id', 'member_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        if not validated_data.get('group_id'):
            validated_data['group_id'] = str(uuid.uuid4())
        return super().create(validated_data)
