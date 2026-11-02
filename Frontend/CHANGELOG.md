# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [5.5.0] - 2026-11-03

### Added

- **Global Voice Session Multitasking & Root Overlay Architecture**:
  - Decoupled `useVoiceChat` room state (`activeVoiceRoom`) from `selectedItem`, allowing journalists to remain connected to an ongoing voice call while simultaneously navigating articles, reviewing branches, opening PDFs, or switching newsroom desks.
  - Lifted `<VoiceCallInviteBanner>` from inside individual chat panes to the top-level workspace (`styles.page`), enabling incoming call notifications to appear globally across all views.
  - Added dynamic conversation identification to the invite banner (e.g., *"Voice in Investigative Desk — Munashe Caleb opened a live voice channel"*).
  - Implemented background Global Voice Session Monitor polling `GET /api/newsroom/voice/active/` across all user newsrooms and direct messages every 3.5s with zero extra socket overhead.
  - Enabled one-tap **Join** from anywhere in the app, connecting directly to the target voice room without forcing view displacement.

## [5.4.1] - 2026-11-02

### Fixed

- **Voice Call Notification Banner Routing Logic**:
  - Filtered incoming `voice_call_status` messages so the call invite banner is strictly presented to **opposing participants** (peers), never to the user who started the session.
  - Added `initiatedVoiceCallRef` tracking on client session start to suppress self-invites during WebRTC connection setup.
  - Wired auto-dismissal of the invite banner when `voiceChat.isConnected` becomes active or when call ends.
  - Enhanced active conversation polling loop (every 3.5s) to query `fetchActiveVoiceSessions()` as a fallback guarantee so opposing users reliably receive the invite banner even if WebSocket connection is delayed.

## [5.4.0] - 2026-11-02

### Added

- **Voice Call Invite Banner (VoiceCallInviteBanner.jsx)**:
  - Animated slide-down notification banner that appears at the top of the chat pane when a peer starts a voice session in the active conversation.
  - Displays the initiator's name ("X opened a live voice channel") with a join button and a dismiss button.
  - Smooth spring slide-in / timing slide-out animation pair via React Native `Animated` API.
  - Pulsing green live indicator strip along the banner bottom edge signals an active call without text clutter.
  - Auto-dismisses when the backend sends `voice_call_status: ended` or the user joins.
  - Frosted-glass dark theme with emerald accent, consistent with the existing `VoiceBar` design language.

- **Chat WebSocket Hook (useChatSocket.js)**:
  - Lightweight persistent WebSocket hook connecting to `ws/chat/<conversationId>/` on the Django Channels `ChatConsumer`.
  - Surfaces `voice_call_status` push events sent by `VoiceSignalingConsumer` through the chat channel group.
  - Automatically reconnects after unexpected closure (single 3 s retry; no retry on clean close or auth failure).
  - Tears down cleanly on conversation switch or component unmount.

- **MainScreen.jsx — Voice Call Notification Wiring**:
  - `activeVoiceCallInvite` state tracks the current incoming call payload.
  - `useChatSocket` mounted with the active conversation id; `onVoiceStatus` callback populates or clears the invite.
  - `VoiceCallInviteBanner` rendered inside the chat pane directly below `ChatScreenHeader`; `onJoin` calls `voiceChat.connect()` and clears the invite state.
  - `activeConversationId` derived constant hoisted above all hook calls to avoid temporal dead-zone reference.

## [5.3.1] - 2026-11-02

### Added

- **Full-Duplex WebRTC Voice Hook (useVoiceChat.js)**:
  - Implemented custom React WebRTC hook connecting to Django Channels signaling server via WebSockets (\ws/rooms/<room_id>/voice/\).
  - Added full mesh peer network topology managing multi-peer \RTCPeerConnection\ instances for newsroom session participants.
  - Automatic peer discovery, SDP offer/answer creation, and ICE candidate trickling with race-condition queue protection.
  - Native Voice Activity Detection (VAD) via Web Audio API (\AudioContext\ + \AnalyserNode\) calculating real-time audio energy and broadcasting speaker transitions.
  - Mute/Unmute microphone management via track enablement and Deafen/Undeafen incoming audio controls.
  - Full resource teardown on unmount or room leave (closing peer connections, stopping media tracks, disposing audio tags).

- **Anchored Newsroom Voice Bar Overlay (VoiceBar.jsx)**:
  - Floating pill overlay anchored to the newsroom / mind map workspace with frosted-glass backdrop blur styling.
  - Live session badge with pulsing green status dot and room headline.
  - Participant avatar cluster featuring animated glowing emerald speaking halos and live equalizer wave meters.
  - Real-time mute badges (\MicOff\) indicating peer microphone states.
  - Controls for instant Mute/Unmute, Deafen/Undeafen, Disconnect, and minimized dock toggle.

## [4.3.1] - 2026-11-02

- **Article Header**:
  - Implement an Article Header to complete article editing portal layout.
  - Includes: `version control system`, `markdowns`.

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
