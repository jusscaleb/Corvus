# Changelog

All notable backend changes are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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
