from django.urls import re_path
from .consumers import VoiceSignalingConsumer

websocket_urlpatterns = [
    re_path(r'^ws/rooms/(?P<room_id>[\w-]+)/voice/$', VoiceSignalingConsumer.as_asgi()),
]

