# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-11-02

### Added

- **Voice Chat UI Implementation**
  -Include a phone icon and an AI toggle.

- **Newsroom Creation Workflow & Modal (`CreateNewsroomModal.jsx`)**:
  - Added '+' trigger on the Newsrooms sidebar and mobile drawer to create newsroom desks.
  - Implemented live colleague search by username (`@username`) and full name.
  - Enforced 3-person minimum requirement (creator + at least 2 colleagues) with visual status indicators and quota validation.
  - Added selectable chips with one-tap removal.
  - Connected directly to `POST /api/newsroom/groups/` with auto-selection and workspace refresh.
  - Added client-side exclusion defense ensuring the authenticated user's own account is never shown in search results.
- **Direct Messaging Modal (`NewDMModal.jsx`)**:
  - Added '+' trigger on Direct Messages section and mobile drawer.
  - Live colleague directory search by username.
  - Automatically initializes or retrieves existing direct conversation threads via `createOrGetDirectChat()`.
  - Added client-side exclusion defense preventing the searcher from initiating direct chats with themselves.
- **Live User-User (EE) & User-Group (EE) Chat Integration (`MainScreen.jsx`)**:
  - Connected real-time chat logs and polling for active direct message and newsroom group channels.
  - Optimistic message delivery with instant UI rendering and backend synchronization via `sendChatMessage()`.
  - Added connection badges distinguishing `USER-USER (EE)` direct correspondence from `USER-GROUP (EE)` group channels.

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
  - Native Stack flow with auth route protections.
  - Centralized Axios/fetch authorization headers across API clients.

## [2.0.0] - 2026-10-31

### Added

- Dual MongoDB and relational API data transport bindings.
- Real-time WebSocket connection to Daphne ASGI server (`ws/chat/<conversation_id>/`).
- Autonomous Saiph AI message streaming and rendering in chat history.
