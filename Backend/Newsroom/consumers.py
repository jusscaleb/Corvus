import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication

# In-memory registry tracking rooms with active voice calls:
# room_id -> { 'room_id': ..., 'initiator_id': ..., 'initiator_name': ..., 'participants': { user_id: user_name } }
ACTIVE_VOICE_SESSIONS = {}


def get_active_voice_sessions():
    """
    Returns a dictionary of currently active voice rooms and their participants.
    """
    return {
        room_id: {
            'room_id': room_id,
            'initiator_id': session.get('initiator_id'),
            'initiator_name': session.get('initiator_name'),
            'participants': list(session.get('participants', {}).values()),
            'participant_count': len(session.get('participants', {})),
        }
        for room_id, session in ACTIVE_VOICE_SESSIONS.items()
        if len(session.get('participants', {})) > 0
    }


@database_sync_to_async
def get_user_from_token(token):
    """
    Authenticate a user via JWT access token.
    """
    try:
        authenticator = JWTAuthentication()
        validated_token = authenticator.get_validated_token(token)
        return authenticator.get_user(validated_token)
    except Exception:
        return None


class VoiceSignalingConsumer(AsyncWebsocketConsumer):
    """
    Full-duplex WebRTC Signaling Consumer for Corvus Newsroom Voice Sessions.
    Handles peer discovery, SDP offer/answer relaying, and ICE candidate trickling
    across distributed Django Channels channel layers.
    """

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs'].get('room_id', 'general')
        self.room_group_name = f"voice_room_{self.room_id}"

        # Resolve authentication
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('access_token', [None])[0]

        user = None
        if token:
            user = await get_user_from_token(token)
        elif self.scope.get('user') and getattr(self.scope['user'], 'is_authenticated', False):
            user = self.scope['user']

        if user:
            self.user = user
            self.user_id = str(getattr(user, 'pk', getattr(user, 'user_id', 'anonymous')))
            self.user_name = (
                getattr(user, 'full_name', '')
                or (user.get_full_name() if callable(getattr(user, 'get_full_name', None)) else '')
                or getattr(user, 'username', 'Journalist')
            )
        else:
            # Fallback for testing or guest journalist session
            custom_user_id = query_params.get('user_id', [None])[0]
            if custom_user_id:
                self.user = None
                self.user_id = str(custom_user_id)
                self.user_name = query_params.get('user_name', ['Guest Journalist'])[0]
            else:
                # Reject unauthenticated connections
                await self.close(code=4401)
                return

        # Join the room's multicast channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name') and hasattr(self, 'user_id'):
            # Update active sessions registry
            if hasattr(self, 'room_id') and self.room_id in ACTIVE_VOICE_SESSIONS:
                ACTIVE_VOICE_SESSIONS[self.room_id]['participants'].pop(self.user_id, None)
                if len(ACTIVE_VOICE_SESSIONS[self.room_id]['participants']) == 0:
                    ACTIVE_VOICE_SESSIONS.pop(self.room_id, None)
                    # Notify chat channel that the voice call has concluded
                    await self.channel_layer.group_send(
                        f"chat_{self.room_id}",
                        {
                            'type': 'voice_call_status',
                            'message': {
                                'type': 'voice_call_status',
                                'status': 'ended',
                                'room_id': self.room_id,
                            },
                        }
                    )

            # Notify remaining peers in the room that this user has disconnected
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'user_left',
                        'user_id': self.user_id,
                        'user_name': getattr(self, 'user_name', 'Journalist'),
                        'room_id': self.room_id,
                    },
                }
            )

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(self, text_data):
        """
        Handle incoming WebRTC signaling messages from client.
        """
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            await self.send(text_data=json.dumps({'error': 'Invalid JSON format'}))
            return

        msg_type = data.get('type')
        if not msg_type:
            return

        if msg_type == 'join_room':
            # Allow client to refine user_name or user_id if needed
            if data.get('user_name'):
                self.user_name = str(data['user_name'])
            if data.get('user_id'):
                self.user_id = str(data['user_id'])

            # Register in active sessions tracking
            if self.room_id not in ACTIVE_VOICE_SESSIONS:
                ACTIVE_VOICE_SESSIONS[self.room_id] = {
                    'room_id': self.room_id,
                    'initiator_id': self.user_id,
                    'initiator_name': self.user_name,
                    'participants': {},
                }

            is_first_in_call = len(ACTIVE_VOICE_SESSIONS[self.room_id]['participants']) == 0
            ACTIVE_VOICE_SESSIONS[self.room_id]['participants'][self.user_id] = self.user_name

            # If this is the start of a call, notify the chat channel
            if is_first_in_call:
                await self.channel_layer.group_send(
                    f"chat_{self.room_id}",
                    {
                        'type': 'voice_call_status',
                        'message': {
                            'type': 'voice_call_status',
                            'status': 'started',
                            'room_id': self.room_id,
                            'initiator_id': self.user_id,
                            'initiator_name': self.user_name,
                            'participant_count': 1,
                        },
                    }
                )

            # Broadcast new peer announcement to all peers currently in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'user_joined',
                        'user_id': self.user_id,
                        'user_name': self.user_name,
                        'room_id': self.room_id,
                    },
                }
            )

        elif msg_type == 'offer':
            target_id = str(data.get('target_user_id', ''))
            if not target_id or not data.get('sdp'):
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'offer',
                        'sender_user_id': self.user_id,
                        'sender_user_name': self.user_name,
                        'target_user_id': target_id,
                        'sdp': data.get('sdp'),
                        'room_id': self.room_id,
                    },
                }
            )

        elif msg_type == 'answer':
            target_id = str(data.get('target_user_id', ''))
            if not target_id or not data.get('sdp'):
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'answer',
                        'sender_user_id': self.user_id,
                        'sender_user_name': self.user_name,
                        'target_user_id': target_id,
                        'sdp': data.get('sdp'),
                        'room_id': self.room_id,
                    },
                }
            )

        elif msg_type == 'ice_candidate':
            target_id = str(data.get('target_user_id', ''))
            candidate = data.get('candidate')
            if not target_id or candidate is None:
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'ice_candidate',
                        'sender_user_id': self.user_id,
                        'target_user_id': target_id,
                        'candidate': candidate,
                        'room_id': self.room_id,
                    },
                }
            )

        elif msg_type == 'speaking_state':
            # Broadcast speaking / mute state to update speaking indicators in UI
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'speaking_state',
                        'user_id': self.user_id,
                        'user_name': self.user_name,
                        'is_speaking': bool(data.get('is_speaking', False)),
                        'is_muted': bool(data.get('is_muted', False)),
                        'room_id': self.room_id,
                    },
                }
            )

        elif msg_type == 'leave_room':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'voice_signal',
                    'sender_channel': self.channel_name,
                    'message': {
                        'type': 'user_left',
                        'user_id': self.user_id,
                        'user_name': self.user_name,
                        'room_id': self.room_id,
                    },
                }
            )
            await self.close(code=1000)

    async def voice_signal(self, event):
        """
        Handler for group messages. Dispatches signal message to the client
        if this connection is not the sender and matches the target (if targeted).
        """
        # Don't echo message back to the sender connection
        if event.get('sender_channel') == self.channel_name:
            return

        message = event.get('message', {})
        target_user_id = message.get('target_user_id')

        # If targeted to a specific peer, only forward if this connection belongs to the target
        if target_user_id and str(target_user_id) != str(self.user_id):
            return

        await self.send(text_data=json.dumps(message))
