# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-01

### Added

- Backend API client and authentication service (src/services/api.js):
  - JWT token and user session persistence with automated token refresh on expired access tokens.
  - Django REST Framework error parsing for user-facing feedback banners and alerts.
- Live authentication integration:
  - Connected sign-in screen to POST /api/auth/login/ with profile retrieval.
  - Connected sign-up screen to POST /api/auth/register/ supporting full reporter credentials.
- Interactive states:
  - Integrated loading indicators and disabled states on PrimaryButton to prevent duplicate submissions during network calls.
  - Added inline error alert banners on login and registration forms.

## [1.0.0] - 2026-11-01

### Added

- Editorial design system and UI components:
  - Custom buttons (PrimaryButton), styled inputs (TextField), and shared layout primitives.
  - EditorialAuthPage component providing split desktop/web and responsive mobile newspaper/editorial layout.
- Reporter authentication screens:
  - Sign-in screen (/login) with email/password authentication and responsive desktop/mobile viewports.
  - Sign-up screen (/signup) with complete reporter onboarding fields (username, email, phone number, password).
- Editorial home and main workspace screens (/main_screen):
  - Newsroom header with navigation, language toggle, and privacy policy links.
  - Responsive screen layouts adapting cleanly across web and mobile platforms.