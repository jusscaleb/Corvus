from django.urls import path
from .views import (
    GroupListCreateView,
    GroupDetailView,
    GroupMemberListCreateView,
    GroupMemberDeleteView,
)

urlpatterns = [
    path('groups/', GroupListCreateView.as_view(), name='group_list_create'),
    path('groups/<str:group_id>/', GroupDetailView.as_view(), name='group_detail'),
    path('groups/<str:group_id>/members/', GroupMemberListCreateView.as_view(), name='group_members_list_create'),
    path('groups/<str:group_id>/members/<str:user_id>/', GroupMemberDeleteView.as_view(), name='group_member_delete'),
]
