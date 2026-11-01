# Changelog

All notable backend changes are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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
- Conversational AI service (`AI/groq_service.py`) with `meta-llama/llama-prompt-guard-2-22m` security filtering and Groq 

## [1.0.0] - 2026-10-30

### Added

- Set up the Django backend project with admin, ASGI, and WSGI entry points.
- Add the Accounts app with a custom email-based user model and initial
  migration.
- Add Newsroom group and membership model scaffolding and Project article and
  branch model scaffolding.
- Add backend dependency declarations for Django, REST framework, JWT, Channels,
  CORS, PostgreSQL, MongoDB, and Groq integrations.
- User authentication flow using Django REST Framework and SimpleJWT.
- Newsroom group and member management with group creation, listing, member addition, and deletion.
- Project article and branch management with scoped group permissions, automatic root branch seeding, and draft content editing.



