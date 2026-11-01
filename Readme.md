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
├── Backend/      # Django REST backend (Auth, Newsrooms, Projects, MongoDB chats, WebSockets)
├── Saiph/        # Saiph autonomous AI agent (LangGraph, Groq, pure HTTP backend tools)
├── Frontend/     # Modern web application client
├── BACKEND.md    # Detailed backend architecture, database schemas, and API documentation
├── Readme.md     # Project overview and quick start guide
└── Saiph/Saiph.md # Complete documentation for the Saiph AI Agent
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

### 3. Frontend

*In development.*
