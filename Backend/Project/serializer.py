from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Article, Branch

User = get_user_model()


class ProjectUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'full_name', 'email']


class BranchSerializer(serializers.ModelSerializer):
    created_by = ProjectUserSerializer(read_only=True)

    class Meta:
        model = Branch
        fields = [
            'branch_id',
            'branch_name',
            'branch_description',
            'content',
            'status',
            'is_main',
            'article',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['branch_id', 'article', 'is_main', 'created_by', 'created_at', 'updated_at']


class ArticleSerializer(serializers.ModelSerializer):
    author = ProjectUserSerializer(read_only=True)
    branches = BranchSerializer(many=True, read_only=True)
    branch_count = serializers.IntegerField(source='branches.count', read_only=True)

    class Meta:
        model = Article
        fields = [
            'article_id',
            'title',
            'group',
            'author',
            'branch_count',
            'branches',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['article_id', 'group', 'author', 'created_at', 'updated_at']
