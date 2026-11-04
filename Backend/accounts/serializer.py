import re
import uuid
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str

User = get_user_model()


def normalize_phone_number(raw_value):
    """
    Normalizes a user-provided phone number to compact E.164-friendly format (e.g. +263771234567).
    Allows empty string if the user clears their phone number.
    """
    if raw_value is None:
        return ""
    cleaned = re.sub(r"[\s\-().]", "", str(raw_value).strip())
    if not cleaned:
        return ""
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    if not re.match(r"^\+?[0-9]{7,18}$", cleaned):
        raise serializers.ValidationError(
            "Enter a valid phone number with country code (e.g. +263771234567)."
        )
    return cleaned


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'user_id',
            'username',
            'full_name',
            'email',
            'phone_number',
            'preffered_language',
            'password',
            'password_confirm',
        ]
        read_only_fields = ['user_id']

    def validate_phone_number(self, value):
        return normalize_phone_number(value)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        
        user_id = validated_data.pop('user_id', None) or str(uuid.uuid4())

        user = User.objects.create_user(
            user_id=user_id,
            password=password,
            **validated_data
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id',
            'username',
            'full_name',
            'email',
            'phone_number',
            'preffered_language',
            'is_active',
        ]
        read_only_fields = ['user_id', 'email', 'is_active']

    def validate_phone_number(self, value):
        return normalize_phone_number(value)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def get_user_and_token(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        return user, uid, token


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True, write_only=True)
    token = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uid": "Invalid or expired user ID."})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user