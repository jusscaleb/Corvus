# Changelog

All notable backend changes are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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


