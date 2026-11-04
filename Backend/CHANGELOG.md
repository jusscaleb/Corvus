# Changelog

All notable backend changes are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## [8.6.3] - 2026-11-04

### Added

- **AI-Summarized Offline SMS Dispatch via Twilio (`Project/sms_service.py`, `Project/views.py`, `AI/article_agent.py`, `accounts/models.py`, `accounts/serializer.py`, `corvus/settings.py`)**:
  - Added `phone_number` field (`0002_user_phone_number` migration) to `accounts.User` and E.164 normalization/validation (`normalize_phone_number`) on `UserRegistrationSerializer` and `UserProfileSerializer`.
  - Created `Project/sms_service.py` (`notify_newsroom_branch_published`, `summarize_branch_for_sms`, `send_twilio_sms`, `get_newsroom_sms_recipients`):
    - Fetches recipient phone numbers for all newsroom members (excluding the branch publisher) in a single `O(1)` SQL query (`values_list('member__phone_number', flat=True)`).
    - Short-circuits immediately when no newsroom members have phone numbers configured (0 AI calls, 0 Twilio calls).
    - Calls `chat_with_groq` once (`O(1)` AI call per branch push) to summarize the newly published branch into a `<= 160`-character plain-text SMS with an instant deterministic fallback.
    - Dispatches SMS messages asynchronously in a background daemon thread using a connection-pooled `requests.Session` against the Twilio REST API (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) so `BranchPushView.post` returns `200 OK` without blocking on network I/O.
  - Hooked `notify_newsroom_branch_published` into `BranchPushView.post` (`POST /api/project/branches/<branch_id>/push/`) and Saiph AI's conversational branch push action in `AI/article_agent.py`.
  - Added 3 unit tests in `Project/tests.py` verifying profile phone number normalization/validation, AI-summarized Twilio SMS dispatch on branch push, and empty-recipient short-circuiting.

## [4.3.1] - 2026-11-03

### Added

- **Article Branch Version Control & Visibility (`Project/models.py`, `Project/views.py`, `Project/urls.py`, `Project/serializer.py`)**:
  - Added `is_public = models.BooleanField(default=False)` to `Branch` (`0002_add_is_public_to_branch` and `0004_merge_20261103_0114` migrations) so forked drafts start private to their creator until pushed.
  - Added `POST /api/project/branches/<branch_id>/push/` (`BranchPushView`) allowing the branch creator to publish a private branch (`is_public=True`) and broadcast a `branch_pushed` notification to the newsroom channel group via Django Channels.
  - Added `GET /api/project/branches/<branch_id>/diff/` (`BranchDiffView`) returning `{ "diff": branch.content }` for authorized readers.
  - Added `group_name` to `ArticleSerializer` and ordered article list responses by `-updated_at` so shared newsroom stories display their desk name and surface newest updates first for all members in that newsroom.
  - Added branch-name validation in `BranchSerializer` (rejects blank names and names containing whitespace) and case-insensitive uniqueness checks (`branch_name_taken` + `IntegrityError` guard) returning `400 Bad Request` on duplicate branch names or renames.
- **Expanded Version Control & Privacy Test Suite (`Project/tests.py`)**:
  - Added 11 new unit tests (17 total in `Project`) covering branch push, diff retrieval, private branch hiding in article and branch lists, duplicate/whitespace branch name validation, creator-only push permissions, private branch read/edit/delete protection, constant-query-count (`O(1)`) article list prefetching, and shared newsroom article visibility across all group members.

### Fixed

- **Private Branch Leakage & N+1 Query Prevention (`Project/views.py`, `Project/serializer.py`)**:
  - Replaced unfiltered `prefetch_related('branches')` with `visible_branches_prefetch(request.user)` (`Q(is_main=True) | Q(is_public=True) | Q(created_by=user)`), preventing unpushed branches from leaking through `GET /api/project/articles/` or `branch_count` while keeping list serialization at a constant query count.
  - Restricted `ArticleSerializer.branches` in list/detail payloads to the root `main` preview branch and gated `get_accessible_branch` so non-creators cannot read, patch, delete, or diff someone else's private branch.
  - Restricted `BranchPushView` to the branch creator (must still be a member of the newsroom) and made `is_public` read-only on `BranchSerializer` so visibility changes cannot bypass the push endpoint.
  - Cleaned up duplicated class/method definitions in `Project/models.py`, `Project/serializer.py`, `Project/views.py`, `Project/urls.py`, and `Project/tests.py`.

## [3.3.1] - 2026-11-02

### Added

- **Django Channels WebRTC Voice Signaling Server (`VoiceSignalingConsumer`, `Newsroom/routing.py`, `corvus/asgi.py`)**:
  - Implemented asynchronous ASGI WebSocket signaling consumer under `ws/rooms/<room_id>/voice/` for low-latency, full-duplex multi-user newsroom voice sessions.
  - Handled complete WebRTC signaling exchange over JSON payloads:
    - `join_room`: Broadcasts new peer announcement (`user_joined`) to the room's multicast channel group.
    - `offer`: Relays targeted `RTCSessionDescription` SDP offers between peers without echo loops.
    - `answer`: Relays targeted SDP answers directly to the offering peer.
    - `ice_candidate`: Relays targeted `RTCIceCandidate` packets for trickle-ICE connection establishment.
    - `speaking_state`: Multi-casts real-time speaking / mute activity states to all active peers for UI indicator synchronisation.
    - `leave_room` & `disconnect`: Automatically notifies remaining room participants (`user_left`) and safely discards group channels.
  - Non-blocking authentication supporting SimpleJWT access tokens via query string (`?access_token=...`) as well as test/guest session identifiers.
  - Integrated `Newsroom.routing.websocket_urlpatterns` into `corvus/asgi.py`.
- **Asynchronous Unit Test Suite for Voice Signaling (`Newsroom/tests.py`)**:
  - Added 4 automated asynchronous integration tests using `channels.testing.WebsocketCommunicator`:
    - `test_voice_signaling_unauthenticated_connection_rejected`: Validates rejection with 4401 on missing credentials.
    - `test_voice_signaling_peer_join_and_notification`: Validates presence broadcasting across peers.
    - `test_voice_signaling_offer_answer_and_ice_relay`: Verifies end-to-end targeted SDP and ICE trickle relays.
    - `test_voice_signaling_speaking_state_and_disconnect`: Confirms real-time speaking status and disconnection notifications.

## [2.3.1] - 2026-11-02

### Added

- **Personal (User-Only) Article Creation (`POST /api/project/articles/`)**:
  - Added `post` handler in `UserArticleListView` enabling authenticated reporters to draft private investigative articles and notes without requiring assignment to a newsroom desk.
  - Automatically provisions root `main` branch with description `Personal editorial draft`.
  - Updated `Article.group` ForeignKey in `Project/models.py` to allow `null=True, blank=True` (`0003_alter_article_group` migration).
  - Updated article string representation to safely display `'Personal'` when `group` is `None`.

### Fixed

- **Article & Branch Access Checks for Personal Drafts (`Project/views.py`)**:
  - Updated `ArticleDetailView.get_article`, `ArticleBranchListCreateView.get_article`, and `BranchDetailView.get_branch` to grant access if `article.author == request.user`, resolving `403 Forbidden` and `AttributeError` for personal drafts without a group.

## [2.3.0] - 2026-11-02

### Added

- `GET /api/auth/users/?search=<query>` via `UserSearchView`:
  - Enables colleague search by username or full name for newsroom invitations and direct messages.
  - Strict self-exclusion excluding by both `user_id=request.user.user_id` and `email=request.user.email`.
  - Privacy and credential protection: removed private `email` from query filters and serialized response payload (only public `user_id`, `username`, and `full_name` are returned).
  - Automatically filters out inactive accounts and caps results at 25 for database efficiency.
- Newsroom 3-Member Creation Rule & Auto-Provisioning (`Newsroom/views.py`):
  - Updated `GroupListCreateView.post` to accept `member_ids`.
  - Enforced minimum 3-member requirement (creator + at least 2 other colleagues).
  - Automatically adds all selected members and initializes the associated group `ChatConversation`.
- Direct Conversation Deduplication (`chats/views.py`):
  - Updated `ConversationListCreateView.post` to check for and return existing direct conversations between two users instead of creating duplicates.
- Comprehensive Unit Test Coverage:

## [2.1.0] - 2026-11-01

### Added

- `GET /api/project/articles/` via `UserArticleListView`:
  - Retrieves all articles across all newsrooms the authenticated user belongs to, plus authored articles.
  - Optimized with `select_related('group', 'author')` and `prefetch_related('branches')` to prevent N+1 queries.
- `GET /api/chats/inbox/` via `InboxView`:
  - Serves direct message and newsroom conversations for the user's inbox with hydrated participant profiles (`user_id`, `username`, `full_name`) and last message previews.
  - Performs batch participant resolution in O(1) database queries.

## [2.0.0] - 2026-10-31

### Added

- Dual database architecture combining relational RDBMS (SQLite/PostgreSQL) and NoSQL (MongoDB):
  - RDBMS `ChatConversation` model tracking conversation types (`direct`, `group`, `ai`), newsroom group relations, and participants.
  - High-performance, append-only MongoDB chat history store with compound indexation and cursor-based pagination.
- Real-time ASGI WebSocket communication powered by Django Channels & Daphne:
  - WebSocket routing under `ws/chat/<conversation_id>/`.
  - `ChatConsumer` with JWT query string authentication, MongoDB message persistence, and live channel layer broadcasting.
- REST API endpoints for conversations and message history (`/api/chats/conversations/` and `/api/chats/conversations/<id>/messages/`).
- Automated integration with Saiph (autonomous LangGraph AI Agent) within `/api/chats/conversations/<id>/messages/` to generate contextual replies and persist them to MongoDB.
- Conversational AI service (`AI/groq_service.py`) with `meta-llama/llama-prompt-guard-2-22m` security filtering and Groq.

## [1.0.0] - 2026-10-30

### Added

- Set up the Django backend project with admin, ASGI, and WSGI entry points.
- Add the Accounts app with a custom email-based user model and initial migrations.
- Implemented user registration, login, JWT token refresh, profile endpoint, and password reset flows.
