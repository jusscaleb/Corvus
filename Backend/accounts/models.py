from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator


'''

class ProfilePictureStorage(S3Boto3Storage):
    bucket_name ='profile-picture'
    file_overwrite = False

'''
    
class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email Required")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

    def get_by_natural_key(self, email):
        return self.get(email=email)

class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.CharField(blank=False, max_length=256, unique=True, default="", primary_key=True)   
    username = models.CharField(blank=False, max_length=256, unique=True);
    full_name = models.CharField(blank=False, max_length=256, default="")
    email = models.EmailField(unique=True)
    LANGUAGE_CHOICES = [
        ("english", "English"),
        ("shona", "Shona"),
        ("ndebele", "Ndebele"),
    ]
    preffered_language = models.CharField(blank=True, max_length=16, choices=LANGUAGE_CHOICES, default="english")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)


    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'username']

    def __str__(self):
        return self.email



