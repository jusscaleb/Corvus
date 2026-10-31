from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Group, Member
from .serializer import (
    GroupSerializer,
    MemberSerializer,
    AddMemberSerializer,
)

User = get_user_model()


class GroupListCreateView(APIView):
    """
    GET: List all newsroom groups the authenticated user is a member of.
    POST: Create a new newsroom group and add creator as the first member.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = Group.objects.filter(memberships__member=request.user).distinct()
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                group = serializer.save()
                Member.objects.create(member=request.user, group=group)

            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDetailView(APIView):
    """
    GET: Retrieve group details.
    PATCH: Update group description / name.
    DELETE: Delete group.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, group_id, user):
        return get_object_or_404(Group, pk=group_id, memberships__member=user)

    def get(self, request, group_id):
        group = self.get_object(group_id, request.user)
        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, group_id):
        group = self.get_object(group_id, request.user)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, group_id):
        group = self.get_object(group_id, request.user)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMemberListCreateView(APIView):
    """
    GET: List all members of a specific group.
    POST: Add a member to the group via user_id.
    """
    permission_classes = [IsAuthenticated]

    def get_group(self, group_id, user):
        return get_object_or_404(Group, pk=group_id, memberships__member=user)

    def get(self, request, group_id):
        group = self.get_group(group_id, request.user)
        members = Member.objects.filter(group=group).select_related('member')
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, group_id):
        group = self.get_group(group_id, request.user)
        serializer = AddMemberSerializer(data=request.data)
        if serializer.is_valid():
            user_to_add = User.objects.get(pk=serializer.validated_data['user_id'])
            
            member, created = Member.objects.get_or_create(member=user_to_add, group=group)
            if not created:
                return Response(
                    {"detail": "User is already a member of this group."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupMemberDeleteView(APIView):
    """
    DELETE: Remove a member from the group.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, group_id, user_id):
        get_object_or_404(Group, pk=group_id, memberships__member=request.user)
        member = get_object_or_404(Member, group_id=group_id, member_id=user_id)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
