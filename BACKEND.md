# Backend Architecture & Technical Documentation

**Version:** `1.0.0`  
**Framework:** Django 6.0.6, Django REST Framework, SimpleJWT  
**Runtime:** Python 3.12+ (Virtualenv at `Backend/core`)  

---

## 1. System Overview

The Corvus backend powers a branch-driven, collaborative newsroom system. It is structured into modular Django applications designed for clean separation of concerns:

- **`accounts`**: Authentication, custom user profiles, multilingual preferences, and JWT security.
- **`Newsroom`**: Newsroom desk isolation, member rosters, and collaborative group access control.
- **`Project`**: Articles and version-controlled editorial drafting through branches.
- **`AI`**: Scaffolding for translation and Groq-powered editorial assistants.
- **`corvus`**: Core project settings, ASGI/WSGI entrypoints, and root routing.

---

## 2. Data Models & Database Design

### `accounts.User`
Custom user model extending `AbstractBaseUser` and `PermissionsMixin`.
- **Primary Key**: `user_id` (`CharField(max_length=256, unique=True)`), populated with UUIDs.
- **Authentication**: `email` is the `USERNAME_FIELD`.
- **Fields**: `username`, `full_name`, `preffered_language` (`english`, `shona`, `ndebele`), `is_active`, `is_staff`.

### `Newsroom.Group`
Represents an editorial organization, desk, or investigation unit.
- **Primary Key**: `group_id` (`CharField(max_length=256, unique=True)`).
- **Attributes**: `group_name` (unique), `group_description`, `created_at`, `updated_at`.
- **Dynamic Properties**:
  - `member_number`: Computes `self.memberships.count()` dynamically to eliminate counter desync.

### `Newsroom.Member`
Explicit many-to-many relationship joining `accounts.User` and `Newsroom.Group`.
- **Constraints**: `UniqueConstraint(fields=('member', 'group'), name='unique_member_group_membership')`.

### `Project.Article`
An investigative piece, breaking story, or editorial project belonging to a newsroom group.
- **Primary Key**: `article_id` (`CharField(max_length=256, default=generate_uuid)`).
- **Relations**: `group` (`ForeignKey` to `Newsroom.Group`), `author` (`ForeignKey` to `accounts.User`).
- **Constraints**: `UniqueConstraint(fields=('group', 'title'), name='unique_article_title_per_group')`.

### `Project.Branch`
A specific iteration or revision line of an article (analogous to Git branches).
- **Primary Key**: `branch_id` (`CharField(max_length=256, default=generate_uuid)`).
- **Fields**:
  - `branch_name`: Name of the branch (e.g., `main`, `feature/sources-check`).
  - `branch_description`: Context for the iteration.
  - `content`: Full text / body of the branch draft.
  - `status`: `draft`, `in_review`, `merged`.
  - `is_main`: Boolean flag identifying the canonical root branch.
  - `created_by`: Foreign key to `accounts.User`.
- **Constraints**: `UniqueConstraint(fields=('article', 'branch_name'), name='unique_branch_name_per_article')`.

---

## 3. Security & Authentication

- **Token Authentication**: Handled via `rest_framework_simplejwt`.
  - Header standard: `Authorization: Bearer <access_token>`.
  - Access Token Lifetime: **60 minutes**.
  - Refresh Token Lifetime: **7 days** with rotation support.
- **Newsroom Group Isolation**:
  - Endpoints in `Project` verify that the requesting user exists in `group.memberships` before reading or mutating articles.
  - Non-members receive `403 Forbidden`.
- **Safe Root Branches**:
  - Main branches (`is_main=True`) are protected and cannot be deleted via the API.

---

## 4. Complete API Reference

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Payload / Query | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user and receive JWT pair | `{ username, full_name, email, password, password_confirm, preffered_language }` | `201 Created` + user + tokens |
| `POST` | `/api/auth/login/` | Obtain JWT token pair | `{ email, password }` | `200 OK` (`access`, `refresh`) |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access token | `{ refresh }` | `200 OK` (`access`) |
| `GET` | `/api/auth/profile/` | Fetch authenticated user's profile | *None (Requires Bearer Token)* | `200 OK` (Profile details) |
| `PATCH` | `/api/auth/profile/` | Update profile fields | `{ full_name, preffered_language, username }` | `200 OK` (Updated profile) |
| `POST` | `/api/auth/password-reset/` | Request token for password reset | `{ email }` | `200 OK` (`uid`, `token`) |
| `POST` | `/api/auth/password-reset/confirm/` | Confirm password reset | `{ uid, token, new_password, new_password_confirm }` | `200 OK` |

### Newsroom (`/api/newsroom/`)

| Method | Endpoint | Description | Payload / Query | Response |
|---|---|---|---|---|
| `GET` | `/api/newsroom/groups/` | List all groups the requesting user belongs to | *None* | `200 OK` (Array of groups) |
| `POST` | `/api/newsroom/groups/` | Create group (creator auto-added as member) | `{ group_name, group_description }` | `201 Created` (Group object) |
| `GET` | `/api/newsroom/groups/<group_id>/` | Retrieve group details | *None* | `200 OK` |
| `PATCH` | `/api/newsroom/groups/<group_id>/` | Update group name / description | `{ group_name, group_description }` | `200 OK` |
| `DELETE` | `/api/newsroom/groups/<group_id>/` | Delete newsroom group | *None* | `204 No Content` |
| `GET` | `/api/newsroom/groups/<group_id>/members/` | List all members in the group | *None* | `200 OK` (Array of members) |
| `POST` | `/api/newsroom/groups/<group_id>/members/` | Add member to group | `{ user_id }` | `201 Created` |
| `DELETE` | `/api/newsroom/groups/<group_id>/members/<user_id>/` | Remove member from group | *None* | `204 No Content` |

### Editorial Project & Branches (`/api/project/`)

| Method | Endpoint | Description | Payload / Query | Response |
|---|---|---|---|---|
| `GET` | `/api/project/groups/<group_id>/articles/` | List all articles under newsroom group | *None* | `200 OK` (Array of articles) |
| `POST` | `/api/project/groups/<group_id>/articles/` | Create article (auto-seeds `main` branch) | `{ title }` | `201 Created` (Article + `main` branch) |
| `GET` | `/api/project/articles/<article_id>/` | Get article details and branches | *None* | `200 OK` |
| `PATCH` | `/api/project/articles/<article_id>/` | Update article title | `{ title }` | `200 OK` |
| `DELETE` | `/api/project/articles/<article_id>/` | Delete article and its branches | *None* | `204 No Content` |
| `GET` | `/api/project/articles/<article_id>/branches/` | List all branches of an article | *None* | `200 OK` (Array of branches) |
| `POST` | `/api/project/articles/<article_id>/branches/` | Fork new branch from article | `{ branch_name, branch_description, content }` | `201 Created` |
| `GET` | `/api/project/branches/<branch_id>/` | Get branch draft and status | *None* | `200 OK` |
| `PATCH` | `/api/project/branches/<branch_id>/` | Update branch content / status | `{ content, status, branch_description }` | `200 OK` |
| `DELETE` | `/api/project/branches/<branch_id>/` | Delete branch (blocked on `is_main`) | *None* | `204 No Content` |

---

## 5. Environment Variables & Configuration

Configured via `Backend/.env`:

| Key | Description | Example / Default |
|---|---|---|
| `SECRET_KEY` | Django cryptographic signing key | `django-insecure-...` |
| `DEBUG` | Enable/disable debug mode | `True` / `False` |

---

## 6. Testing

Tests are located within each app's `tests.py` file using DRF's `APITestCase`:

- `accounts/tests.py`: Registration, JWT authentication, profile access permissions, password resets.
- `Newsroom/tests.py`: Creator auto-membership, group isolation, adding/removing members, count accuracy.
- `Project/tests.py`: Article creation with automatic `main` branch, group permission verification, child branch creation, draft content patching.

To run tests:
```powershell
python manage.py test accounts
python manage.py test Newsroom
python manage.py test Project
```
