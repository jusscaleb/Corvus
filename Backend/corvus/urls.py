"""
URL configuration for corvus project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/newsroom/', include('Newsroom.urls')),
    path('api/project/', include('Project.urls')),
    path('api/chats/', include('chats.urls')),
    path('api/ai/', include('AI.urls')),
]
