# Corvus

A collaborative, branch-driven editorial newsroom platform for modern journalism and multilingual reporting.

---

## Overview

Corvus is an editorial workflow management platform built to help journalists, editors, and investigation desks collaborate asynchronously. It brings Git-like branching workflows to written journalism, allowing writers to draft alternate angles, check sources, and review edits before merging into canonical stories.

---

## Project Structure

```
Corvus/
├── Backend/      # Django REST backend (Auth, Newsrooms, Projects, AI)
├── Frontend/     # Modern web application client
├── BACKEND.md    # Detailed backend architecture and API specification
└── Readme.md     # General project overview and quick start
```

---

## Quick Start

### Backend

For complete architecture, data models, and API endpoints, see [BACKEND.md](file:///c:/Users/caleb/SCXRPIUS/Corvus/BACKEND.md).

```powershell
cd Backend
python manage.py migrate
python manage.py runserver
```

Run test suite:
```powershell
python manage.py test
```

### Frontend

*In development.*
