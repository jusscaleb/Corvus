# Changelog

All notable changes to the frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [8.6.3] - 2026-11-04

### Added

- **Offline Newsroom SMS Wire & Phone Number Check Modal (`PhonePromptModal.jsx`, `MainScreen.jsx`, `NewsroomHeader.jsx`, `AuthContext.jsx`, `services/api.js`)**:
  - Added automatic phone-number check (`shouldPromptForPhoneNumber`) in `MainScreen.jsx` that detects when an authenticated user has not yet provided a phone number (`user.phone_number`) and opens `PhonePromptModal`.
  - Built `PhonePromptModal.jsx` with a 160-character SMS dispatch preview card, one-tap country code chips (`+263`, `+27`, `+254`, `+44`, `+1`), E.164 validation (`hasValidPhoneNumber`, `formatPhoneForApi`), and `PATCH /api/auth/profile/` integration (`updateUserProfile`).
  - Added an **SMS Wire / Add SMS #** status pill in `NewsroomHeader.jsx` so reporters can see whether offline SMS alerts are active and update their phone number anytime.
  - Updated branch push notifications in `MainScreen.jsx` (`handleExecuteCommand('push')`) to report how many newsroom colleagues are receiving the AI-summarized offline SMS.
  - Added Feature 14 unit tests in `Frontend/corvus-mobile/test.jsx` covering `PhonePromptModal`, `shouldPromptForPhoneNumber`, `hasValidPhoneNumber`, and `updateUserProfile`.

## [6.6.3] - 2026-11-04

### Added

- **Saiph AI 1-to-1 Editorial Agent & Workspace (`ArticleAIWorkspace.jsx`, `NewsroomHeader.jsx`, `ArticleHeader.jsx`, `MainScreen.jsx`, `services/api.js`)**:
  - Added global **✦ Saiph AI** button in `NewsroomHeader.jsx` and article-level **Ask Saiph AI** button in `ArticleHeader.jsx` opening the 1-to-1 `SaiphAgentModal` drawer with short-term conversation history and long-term **Agent Memory** (`fact`, `style`, `source`, `goal`).
  - Added **✦ Saiph AI Draft Assistant** inside `CreateArticleModal.jsx` to generate structured article drafts from a brief summary (`generateArticleDraft`).
  - Added dedicated article workspace tabs in `ArticleHeader.jsx` and `MainScreen.jsx`:
    - **Mindmap (`ArticleMindmapSection`)**: Interactive visual story concept map with categorized nodes (`angle`, `source`, `question`, `risk`, `timeline`) and one-click **+ Draft** leaf insertion.
    - **Board (`ArticleBoardSection`)**: Curated editorial suggestions and verified source leads with category filtering and resolved status toggling (`toggleBoardItemResolved`).
    - **AI Review & Check (`ArticleReviewSection`)**: Quality score, plagiarism overlap check, AI-writing cliché/burstiness detection, and plain-English improvement cards (`area`, `problem`, `how_to_fix`).
- **Robust Branch Switching & Multi-Task Execution via Messaging (`ArticleAIWorkspace.jsx`, `MainScreen.jsx`)**:
  - Added `resolveClientBranchIntent` and full `handleAIWorkspaceUpdated` synchronization (`switched_branch`, `created_branch`, `branches`, `pushed_branch`, `updated_title`, `open_section`, `updated_content`) so single-turn commands (*"switch to a new branch"*, *"switch to main"*), multi-turn branch naming (*"draft-v2"*), and draft/headline edits immediately update the active branch and editor.
- **True WYSIWYG Rich Text Editor & Direct Word Tools Ribbon (`RichTextEditor.jsx`, `ArticleHeader.jsx`, `MainScreen.jsx`, `utils/pdfExporter.js`)**:
  - Moved all **Word Tools** (`Bold`, `Italic`, `Underline`, `H1`, `H2`, `Bullets`, `Quote`, `Code`) out of the dropdown into a dedicated second-row toolbar ribbon in `ArticleHeader.jsx` with live active-state highlighting (`activeFormats`).
  - Built `RichTextEditor.jsx` (`contentToRichHtml`, `richHtmlToMarkdown`, `stripRichFormatting`, `toggleActiveFormatState`) so text is styled visually without raw markdown characters (`#`, `**`, `*`, `---`) and active inline tools format newly typed text while toggled on.
- **Article Deletion (`MainScreen.jsx`, `AppIcons.jsx`, `services/api.js`)**:
  - Added `deleteArticle(articleId)` (`DELETE /api/project/articles/<id>/`), a **Delete Story** button in the article action bar, a quick-delete trash button in the sidebar `ARTICLES` list, and a confirmation modal.
- **Frontend Node Unit Test Suite & GitHub Actions CI (`Frontend/corvus-mobile/test.jsx`, `.github/workflows/frontend-ci.yml`)**:
  - Added 13 comprehensive frontend unit tests runnable via `node --test test.jsx` covering AST syntax verification across all `src/` files, Auth API, 1-to-1 AI Chat, Agent Memory, AI Draft Generation, Mindmap, Editorial Board, Plagiarism/AI Review, WYSIWYG Word Tools, Articles/Branches/Deletion, Newsrooms/DMs, Voice/PDF utilities, and AI Branch Switching.
  - Added `.github/workflows/frontend-ci.yml` to run `node --test test.jsx` automatically on GitHub Actions pushes and pull requests.

### Fixed

- **Textbox Input Clearing & Background Sync Re-Renders (`CreateArticleModal.jsx`, `MainScreen.jsx`, `RichTextEditor.jsx`)**:
  - Restricted the form-reset `useEffect` in `CreateArticleModal.jsx` to depend solely on `[visible]` instead of `[visible, newsrooms]`, preventing the 5-second background newsroom poll from wiping typed text while the modal is open.
  - Updated `syncNewsroomArticles` in `MainScreen.jsx` to preserve existing `articles`, `newsrooms`, and `selectedItem` state references when polled data is unchanged, and anchored the content crossfade `useEffect` to `[selectedItem?.id]`.
  - Added an active-focus guard (`document.activeElement === domRef.current`) in `RichTextEditor.jsx` and functional state updates in `MainScreen.jsx` so external re-renders never overwrite the live `contentEditable` DOM while typing.
- **React Native Web Nested `<button>` DOM Errors & Animation Warnings (`MainScreen.jsx`, `ArticleAIWorkspace.jsx`, `CreateArticleModal.jsx`, `CreateNewsroomModal.jsx`, `NewDMModal.jsx`)**:
  - Refactored `SelectableRow` in `MainScreen.jsx` and branch cards in `ArticleMindmapSection` so row selection and action `<Pressable>` buttons are siblings inside a `<View>` rather than nested `<button>` elements.
  - Set `useNativeDriver: Platform.OS !== 'web'` across modal and screen animations to eliminate Web console warnings.

## [5.6.0] - 2026-11-03

### Added

- **Article Branch Creation, Switching & Version Control Wiring (`ArticleHeader.jsx`, `MainScreen.jsx`, `services/api.js`)**:
  - Added `fetchBranches(articleId)` and `createBranch(articleId, { name, description, content })` in `services/api.js` alongside `pushBranch` and `diffBranch`.
  - Built an inline **+ New branch** composer inside the `ArticleHeader` branch dropdown with live slug preview (spaces converted to hyphens), duplicate/empty validation, inline error feedback, and support for branching directly from an in-progress draft without overwriting the source branch.
  - Added visibility badges (**MAIN**, **SHARED**, 🔒 **PRIVATE**) on each branch item in the dropdown and a lock indicator on the header tab when viewing a private branch.
  - Wired live branch loading, safe branch switching (warns before discarding unsaved edits), branch-specific saving, **Push changes** (`POST /api/project/branches/<id>/push/`), and **Check status** in `MainScreen.jsx`.
- **Shared Newsroom Article Sync & Smart Desk Defaults (`CreateArticleModal.jsx`, `MainScreen.jsx`)**:
  - Updated `CreateArticleModal` to accept `defaultGroupId` and default to the currently active newsroom (or the reporter's first newsroom) instead of *Personal Draft*, ensuring newsroom stories are shared with the desk by default.
  - Added a 5-second background sync in `MainScreen.jsx` that refreshes articles and newsrooms so stories filed by any colleague in a newsroom appear automatically for all members in that newsroom without interrupting active editing.

### Fixed

- **API Service Syntax & Main Branch Selection (`services/api.js`, `MainScreen.jsx`)**:
  - Removed an orphaned duplicate block at the end of `updateBranchContent` / `diffBranch` in `services/api.js` that caused a Babel `'return' outside of function` syntax error.
  - Fixed article list normalization in `MainScreen.jsx` to select `a.branches.find((b) => b.is_main)` rather than assuming `branches[0]` is always `main`.

## [5.5.2] - 2026-11-03

### Added

- **Global Voice Session Multitasking & Root Overlay Architecture**:
  - Decoupled `useVoiceChat` room state (`activeVoiceRoom`) from `selectedItem`, allowing journalists to remain connected to an ongoing voice call while simultaneously navigating articles, reviewing branches, opening PDFs, or switching newsroom desks.
  - Lifted `<VoiceCallInviteBanner>` from inside individual chat panes to the top-level workspace (`styles.page`), enabling incoming call notifications to appear globally across all views.
  - Added dynamic conversation identification to the invite banner (e.g., *"Voice in Investigative Desk — Munashe Caleb opened a live voice channel"*).
  - Implemented background Global Voice Session Monitor polling `GET /api/newsroom/voice/active/` across all user newsrooms and direct messages every 3.5s with zero extra socket overhead.
  - Enabled one-tap **Join** from anywhere in the app, connecting directly to the target voice room without forcing view displacement.

## [5.4.2] - 2026-11-02

### Fixed

- **Voice Call Notification Banner Routing Logic**:
  - Filtered incoming `voice_call_status` messages so the call invite banner is strictly presented to **opposing participants** (peers), never to the user who started the session.
  - Added `initiatedVoiceCallRef` tracking on client session start to suppress self-invites during WebRTC connection setup.
  - Wired auto-dismissal of the invite banner when `voiceChat.isConnected` becomes active or when call ends.
  - Enhanced active conversation polling loop (every 3.5s) to query `fetchActiveVoiceSessions()` as a fallback guarantee so opposing users reliably receive the invite banner even if WebSocket connection is delayed.

## [5.4.1] - 2026-11-02

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
