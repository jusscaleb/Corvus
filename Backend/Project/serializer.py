from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Article, Branch, ArticleTranslation, ArticleApproval

User = get_user_model()


def visible_branches_for(article, user):
    """
    Branches of `article` that `user` may see: main, pushed (public), or their own.
    Uses the `visible_branches` prefetch from the list views when present (no extra query),
    otherwise falls back to a single query.
    """
    prefetched = getattr(article, 'visible_branches', None)
    if prefetched is not None:
        return prefetched
    qs = article.branches.select_related('created_by')
    if user is None or not user.is_authenticated:
        return [b for b in qs if b.is_main or b.is_public]
    return [b for b in qs if b.is_main or b.is_public or b.created_by_id == user.pk]


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
            'is_public',
            'article',
            'created_by',
            'created_at',
            'updated_at',
        ]
        # is_public is only changed through the push endpoint
        read_only_fields = ['branch_id', 'article', 'is_main', 'is_public', 'created_by', 'created_at', 'updated_at']

    def validate_branch_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Branch name cannot be blank.")
        if any(ch.isspace() for ch in name):
            raise serializers.ValidationError("Branch names cannot contain spaces. Use hyphens instead.")
        return name


class ArticleSerializer(serializers.ModelSerializer):
    """
    `branches` only contains the main branch (a preview for story lists).
    The full, privacy-filtered list lives at /articles/<id>/branches/.
    `branch_count` counts only branches the requesting user can see.
    """
    author = ProjectUserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.group_name', read_only=True, default=None)
    branches = serializers.SerializerMethodField()
    branch_count = serializers.SerializerMethodField()
    translated_title = serializers.SerializerMethodField()
    translated_content = serializers.SerializerMethodField()
    translated_excerpt = serializers.SerializerMethodField()
    current_lang = serializers.SerializerMethodField()
    approvals_count = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'article_id',
            'title',
            'group',
            'group_name',
            'author',
            'is_published',
            'published_at',
            'branch_count',
            'approvals_count',
            'branches',
            'translated_title',
            'translated_content',
            'translated_excerpt',
            'current_lang',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['article_id', 'group', 'group_name', 'author', 'is_published', 'published_at', 'created_at', 'updated_at']

    def _visible(self, obj):
        # Cache per article so branches + branch_count share one lookup
        cache = self.context.setdefault('_visible_cache', {})
        if obj.pk not in cache:
            request = self.context.get('request')
            cache[obj.pk] = visible_branches_for(obj, getattr(request, 'user', None))
        return cache[obj.pk]

    def _translation_for(self, obj):
        lang = self.context.get('lang')
        if not lang or lang.lower() == 'en':
            return None
        t_cache = self.context.setdefault('_translation_cache', {})
        if obj.pk not in t_cache:
            trans = getattr(obj, 'current_translation', None)
            if trans is None and hasattr(obj, 'translations'):
                trans = obj.translations.filter(language_code__iexact=lang.lower()).first()
            t_cache[obj.pk] = trans
        return t_cache[obj.pk]

    def get_current_lang(self, obj):
        lang = self.context.get('lang')
        return lang.lower() if lang else 'en'

    def get_translated_title(self, obj):
        trans = self._translation_for(obj)
        return trans.title if trans else None

    def get_translated_content(self, obj):
        trans = self._translation_for(obj)
        return trans.content if trans else None

    def get_translated_excerpt(self, obj):
        trans = self._translation_for(obj)
        return trans.excerpt if trans else None

    def get_branches(self, obj):
        main = [b for b in self._visible(obj) if b.is_main]
        return BranchSerializer(main, many=True).data


    def get_approvals_count(self, obj):
        if hasattr(obj, 'approval_count_annotated'):
            return obj.approval_count_annotated
        if 'approvals' in getattr(obj, '_prefetched_objects_cache', {}):
            return len(obj.approvals.all())
        return 0

    def get_branch_count(self, obj):
        return len(self._visible(obj))


class ArticleTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleTranslation
        fields = [
            'translation_id',
            'article',
            'language_code',
            'title',
            'content',
            'excerpt',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['translation_id', 'article', 'created_at', 'updated_at']



class ArticleApprovalSerializer(serializers.ModelSerializer):
    user = ProjectUserSerializer(read_only=True)

    class Meta:
        model = ArticleApproval
        fields = ['approval_id', 'article', 'user', 'approved_at']
        read_only_fields = ['approval_id', 'article', 'user', 'approved_at']
