# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-11-01

### Added

- **Animated Window & Panel Expanding/Retracting (`MainScreen.jsx` & `NewsroomHeader.jsx`)**:
  - Added spring-driven animated width, opacity, and horizontal slide transitions for collapsing/expanding desktop sidebars (Articles panel & Newsrooms/DMs panel).
  - Smooth animated height and fade transitions for the workspace restore bar.
  - Native spring slide-up and backdrop fade animations for the mobile drawer sheet.
  - Scale and translateY spring animations for header dropdown menus (Language picker) and dialog modals.
  - Content fade crossfade transitions when switching active stories or chats in the center pane.
- **Animated Toast Notification System (`ToastContext.jsx`)**:
  - Replaced all blocking native `Alert.alert` calls with smooth, non-intrusive 3-second slide-up toast notifications.
  - Supports `success`, `error`, and `info` status variants with spring entrance and exit animations.
- **Confirmation Modal Component (`ConfirmModal.jsx`)**:
  - Reusable modal dialog with backdrop blur/fade and scale transitions.
  - Applied to the logout flow to prevent accidental session termination.
- **Global Theme Engine (`ThemeContext.jsx` & `colors.js`)**:
  - Complete Light and Dark theme palette support across all screens and components.
  - Interactive theme switcher toggle (☀ / ◑) in the header with persistent state.
- **Client Session Gate & Auto-Auth Check (`AuthContext.jsx`)**:
  - Automated session verification (`GET /api/auth/profile/`) on app startup.
  - Authenticated users automatically bypass splash/login screens and route to `/main_screen`.
  - Unauthenticated route guards redirect unauthorized navigation attempts to `/signup`.
- **Authenticated Navigation Routing**:
  - Tapping the "Corvus" masthead/home brand in authenticated views routes directly to `/main_screen`.

### Changed

- **Clean Newsroom Workspace (`MainScreen.jsx`)**:
  - Removed all hardcoded placeholder data (dummy articles, fake newsrooms, mock direct messages).
  - Added clean empty states with editorial iconography and guidance prompts.
  - Replaced static color definitions with dynamic theme-aware styling.
- **Editorial Auth Pages (`login.jsx`, `signup.jsx`)**:
  - Integrated `useToast` for all validation and network error messaging.
  - Removed non-serialized phone number input from registration form to align with backend contract.

### Fixed

- Fixed JSX string literal formatting errors across auth screens (`login.jsx`, `signup.jsx`).
- Corrected attribute quote escaping in `PrimaryButton.jsx` and `TextField.jsx`.

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
