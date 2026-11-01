# Corvus

A collaborative, branch-driven editorial newsroom platform for modern journalism and multilingual reporting, powered by **Saiph**, an autonomous AI agent.

---

## Overview

Corvus is an editorial workflow management platform built to help journalists, editors, and investigation desks collaborate asynchronously. It brings Git-like branching workflows to written journalism, allowing writers to draft alternate angles, check sources, and review edits before merging into canonical stories.

The system is augmented by **Saiph**, an autonomous AI agent running on LangGraph and Groq that can engage in natural conversation and take actions across newsrooms and editorial drafts using authorized HTTP calls.

---

## Project Structure

```
Corvus/
├── Backend/                # Django REST backend (Auth, Newsrooms, Projects, MongoDB chats, WebSockets)
├── Saiph/                  # Saiph autonomous AI agent (LangGraph, Groq, pure HTTP backend tools)
├── Frontend/               # Cross-platform frontend clients
│   ├── corvus-mobile/      # React Native & Expo Router client (Web, iOS, Android)
│   └── CHANGELOG.md        # Frontend release notes & version tracking
├── BACKEND.md              # Detailed backend architecture, database schemas, and API documentation
├── README.md               # Project overview and quick start guide
└── Saiph/Saiph.md          # Complete documentation for the Saiph AI Agent
```

---

## Quick Start

### 1. Backend Setup

For complete architecture, data models, and API endpoints, see [BACKEND.md](ROOT_DIR/Corvus/BACKEND.md).

```powershell
cd Backend
.\setup.ps1
python manage.py runserver
```

Run backend test suite:
```powershell
python manage.py test
```

---

### 2. Saiph AI Agent Setup

For Saiph architecture, tool catalog, and execution flow, see [Saiph/Saiph.md](ROOT_DIR/Corvus/Saiph/Saiph.md).

```powershell
cd Saiph
.\setup.ps1
```

Run Saiph in interactive CLI mode:
```powershell
python -m main
```

---

### 3. Frontend Setup (Corvus Mobile & Web)

The frontend is an editorial-first client built with **React Native** and **Expo Router**, targeting Web, Android, and iOS from a single codebase.

#### Key Features

- **Editorial Design System**: Classic broadsheet/newspaper aesthetics with serif headlines, kicker rules, responsive column layouts, and system-wide **Light / Dark theme** support.
- **Live JWT Authentication**: Complete sign-in and reporter onboarding flows communicating with Django REST SimpleJWT endpoints, automated token refresh, and persistent session storage.
- **Smart Session Gating**: Automatic session validation on startup; authenticated users are routed directly to the workspace (`/main_screen`), while unauthenticated users are guided to registration or login.
- **Animated Workspace Windows**: Spring-physics collapsing and expanding sidebars for Articles, Newsrooms, and Direct Messages, complete with a collapsible restore bar and smooth content crossfading.
- **Mobile Adaptive Drawers**: Native slide-up bottom sheets with gesture dismiss and backdrop blur/dimming for mobile viewports.
- **Delightful UX**: 3-second animated slide-up toast notifications (replacing blocking alerts) and accessible confirmation modals.

#### Running the Frontend

Navigate to the mobile app directory and install dependencies:

```powershell
cd Frontend\corvus-mobile
npm install
```

Start the Expo development server:

```powershell
npx expo start
```

From the interactive terminal prompt, you can launch:

- **Web**: Press `w` (runs in browser at `http://localhost:8081`).
- **Android**: Press `a` (runs in Android emulator or device via Expo Go).
- **iOS**: Press `i` (runs in iOS Simulator).

> **API Configuration Note**:
> When testing on Web, API calls target `http://localhost:8000`.
> When testing on a physical mobile device via Expo Go, API calls route to the local network host (`http://10.10.181.65:8000` configured in `src/services/api.js`).
