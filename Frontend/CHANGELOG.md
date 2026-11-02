# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-11-02

### Added

- **Native Mobile PDF Export & Storage (`pdfExporter.js`)**:
  - Implemented mobile document generation using `expo-print` to render styled editorial articles to PDF on device.
  - Automatically creates and manages a local `Corvus/` directory inside `FileSystem.documentDirectory`.
  - Saves exported PDFs into the `Corvus/` directory using sanitized filenames (`<Title>_<YYYY-MM-DD>.pdf`).
  - Integrated `expo-sharing` to present native OS sharing and file-saving dialogs (save to Files, Drive, print, or share).

### Fixed

- **Android Cross-Storage Move Rejection (`pdfExporter.js`)**:
  - Replaced atomic filesystem `moveAsync` with stream-based `copyAsync` plus cache cleanup (`deleteAsync`). Resolves Android `java.io.IOException: Location ... isn't movable` exception caused by partition boundary moves from `cache/Print/` to app document storage.
  - Added duplicate destination file check prior to copy to ensure repeatable exports do not collide.
  - Added format-aware handling in `openPdfDocument` supporting base64 data URIs, remote HTTP/HTTPS downloads via `downloadAsync`, and local file URIs via `copyAsync`.

- **Expo FileSystem Runtime Deprecation (`pdfExporter.js`)**:
  - Updated `expo-file-system` imports to `expo-file-system/legacy` for Expo SDK 54+ compatibility, resolving runtime deprecation exceptions when calling `getInfoAsync`, `makeDirectoryAsync`, `moveAsync`, and `writeAsStringAsync`.

## [3.3.0] - 2026-11-02

### Added

- **In-App Article Editor & Live Content Saving (`MainScreen.jsx`, `api.js`)**:
  - Implemented an editorial in-app story editor allowing reporters to compose and refine draft copy directly inside the reading pane.
  - Added live word and character counters that recalculate in real-time as text is typed.
  - Added `💾 Save Story` action which patches content and lead summary to the branch via `PATCH /api/project/branches/<branch_id>/`.
  - Added cancel safeguards to safely discard unsaved revisions.

- **Editable Story Headlines (`MainScreen.jsx`, `api.js`)**:
  - Added `✏️ Edit Headline` trigger enabling reporters to update article titles on the fly.
  - Dispatches title changes via `PATCH /api/project/articles/<article_id>/` and updates local state without page reload.

- **Personal (Private) vs Newsroom Desk Articles (`CreateArticleModal.jsx`, `MainScreen.jsx`)**:
  - Added `🔒 Personal Draft (Only You)` scope in the article creation modal alongside collaborative newsroom desks.
  - Automatically identifies whether an article is personal or group-assigned.
  - Displays appropriate authorship badges and bylines:
    - Personal: `🔒 PERSONAL DRAFT`, showing user as sole author with private workspace indicator.
    - Newsroom: `👥 [DESK] DESK`, showing author plus newsroom desk colleagues and subscriber count.

- **Prototype PDF Storage & Export Engine (`pdfExporter.js`, `CreateArticleModal.jsx`)**:
  - Added dual-mode creation in `CreateArticleModal`: Write story copy or attach an existing investigative PDF document.
  - Added PDF file upload supporting drag-and-drop and native file picking up to 15MB.
  - Implemented zero-dependency printable newspaper styling with Corvus masthead, classification stamps, bylines, and justified columns.
  - Added `🖨 Save as PDF` trigger leveraging native print dialogs to export crisp PDF documents.
  - Added dedicated `PDF ARCHIVE` cards in reader allowing users to view and download attached PDF documents.

- **Dedicated SVG Icon System (`AppIcons.jsx`)**:
  - Created standalone SVG vector icons (`LockIcon`, `UsersIcon`, `EditIcon`, `FileTextIcon`, `FilePdfIcon`, `PrinterIcon`, `EyeIcon`, `SaveIcon`, `PaperclipIcon`, `CalendarIcon`, `ClipboardIcon`, `AlertTriangleIcon`).
  - Replaced all non-keyboard UI emojis across the application with clean, theme-aware vector icons.

## [3.2.1] - 2026-11-02

### Fixed

- **`api.js` — Restored missing API exports after file truncation**:
  - Re-added all domain-specific exports that were lost during a previous URL-change edit: `searchUsers`, `fetchNewsrooms`, `createNewsroom`, `fetchArticles`, `fetchInbox`, `createOrGetDirectChat`, `fetchMessages`, `sendChatMessage`.
  - Corrected mobile API base URL port from `8081` to `8000` (Django backend port).
  - Resolved `Search error: (0 , _servicesApi.searchUsers) is not a function` crash in `CreateNewsroomModal`.
  - **Duplicate chat header row removed (`MainScreen.jsx`)**:
  - The `chatHeader` View (showing avatar, title, and `USER-GROUP (EE)` / `USER-USER (EE)` badge) was rendering as a second header row below `ChatScreenHeader`, duplicating the newsroom name on screen.
  - Removed the redundant block entirely; `ChatScreenHeader` alone now serves as the conversation header.

- **Newsroom appearing in Direct Messages (`MainScreen.jsx`)**:
  - `fetchInbox` returns all conversations including group-type ones seeded when a newsroom is created.
  - The inbox response was being mapped to `directMessages` without filtering, causing newsroom group conversations to appear in the DM list.
  - Added `.filter((c) => c.type === 'direct')` before `.map()` so only direct conversations populate the DM section.

### Changed

- **Newsroom Chat Screen (`app/(app)/chat/index.jsx`) — Keyboard & Composer Overhaul**:
  - Fixed Android keyboard hiding the text input: `KeyboardAvoidingView` now uses `behavior="height"` on Android (was `undefined`) and `behavior="padding"` on iOS, with correct per-platform `keyboardVerticalOffset`.
  - Applied `useSafeAreaInsets` to the composer bottom padding to respect home-bar and notch geometry.
  - Added `keyboardShouldPersistTaps="handled"` on the message list to prevent accidental keyboard dismissal on message tap.
  - Implemented **optimistic message send**: message appears instantly in the list (faded, `sending` state), confirmed on API success, and marked `⚠ Failed — tap to retry` on error with one-tap retry support.
  - Replaced the flat composer bar with a **custom composer toolbar** featuring:
    - Spring-animated sliding panel (opens/closes with the `+` / `✕` round button).
    - Quick-emoji strip (👍 ❤️ 🔥 ✅ ⚠️ 📌 🎯 💬) that inserts into draft and re-focuses the input.
    - Placeholder action pills: Attach, Schedule, Template — ready to wire up.
    - Character counter that appears after 80 characters and turns orange past 500.
    - Round pill-style `TextInput` and send arrow button matching modern messenger conventions.

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
