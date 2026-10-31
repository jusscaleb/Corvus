# Saiph — Autonomous AI Agent for Corvus

**Name:** Saiph  
**Engine:** LangGraph StateGraph + Groq (`llama-3.3-70b-versatile`)  
**Architecture:** Pure HTTP client communicating with Corvus Backend REST APIs  
**Memory & History:** MongoDB (`corvus_chats`)  

---

## 1. Overview

**Saiph** is the unified intelligence layer of the Corvus newsroom platform. Rather than a chain of disconnected models, Saiph operates as an **autonomous agent** capable of:
1. **Conversational Fluidity**: Conversing naturally as a friendly, intelligent chatbot about any general subject.
2. **Contextual Reasoning**: Detecting when a user wants to inspect, create, or modify newsroom content.
3. **Tool Execution**: Formulating and executing authorized HTTP requests against the Corvus Django REST API on behalf of the authenticated user.
4. **Multilingual Understanding**: Interacting seamlessly across English, Shona, and Ndebele.

---

## 2. Architecture & Control Flow

Saiph runs an autonomous ReAct loop built with **LangGraph**:

```
                       User Prompt + JWT Token
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   LangGraph State     │
                     │ (Messages + JWT Token)│
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  Saiph Reasoning LLM │
                     │ llama-3.3-70b (Groq)  │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        [General Chat Query]           [Action / Task Query]
                 │                               │
                 ▼                               ▼
         Returns Direct Answer             Selects Tool &
                 │                       Generates Tool Calls
                 │                               │
                 │                               ▼
                 │                    ┌───────────────────────┐
                 │                    │   Pure HTTP Tool      │
                 │                    │    (httpx client)     │
                 │                    └──────────┬────────────┘
                 │                               │
                 │                        HTTP Request with
                 │                        Bearer JWT Token
                 │                               │
                 │                               ▼
                 │                    ┌───────────────────────┐
                 │                    │  Corvus Django API    │
                 │                    │ (Port 8000 /api/...)  │
                 │                    └──────────┬────────────┘
                 │                               │
                 │                        HTTP Response
                 │                               │
                 │                               ▼
                 │                    Sends Tool Observation
                 │                    Back into Saiph Brain
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                     Final Formulated Response
                     (Persisted to MongoDB)
```

---

## 3. Tool Catalog (`Agent/tools.py`)

Saiph interacts with Corvus exclusively through standard HTTP endpoints, respecting the user's role and permissions:

### Newsroom Tools
| Tool Name | Backend Endpoint | Purpose |
|---|---|---|
| `list_newsroom_groups` | `GET /api/newsroom/groups/` | Fetches all editorial desks/groups the user belongs to. |
| `get_group_members` | `GET /api/newsroom/groups/<id>/members/` | Lists reporters and editors on a specific desk. |

### Editorial & Article Tools
| Tool Name | Backend Endpoint | Purpose |
|---|---|---|
| `list_articles_in_group` | `GET /api/project/groups/<id>/articles/` | Lists stories and active drafts within a newsroom. |
| `get_article_details` | `GET /api/project/articles/<id>/` | Retrieves an article's branches and author info. |
| `get_branch_draft_content` | `GET /api/project/branches/<id>/` | Reads the full text of a draft branch. |
| `create_article_branch` | `POST /api/project/articles/<id>/branches/` | Forks a new branch for alternate drafts/investigations. |
| `update_branch_content` | `PATCH /api/project/branches/<id>/` | Edits and refines draft content. |

### Profile & Identity Tools
| Tool Name | Backend Endpoint | Purpose |
|---|---|---|
| `get_user_profile` | `GET /api/auth/profile/` | Reads user preferences (e.g. preferred language). |

---

## 4. Standalone Execution & Usage

### Running Locally via CLI
Saiph can be run standalone via the interactive terminal interface:

```powershell
# From the project root
python -m Agent.main
```

### Programmatic Invocation
```python
from Agent import run_agent

response = run_agent(
    user_message="List the active articles in my Newsroom desk",
    token="<user_jwt_access_token>",
    chat_history=[
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi! How can I assist you with your stories today?"}
    ]
)
print(response)
```

---

## 5. Environment Variables (`Agent/config.py`)

Configured in `.env`:

| Key | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | API key from Groq console | *Required* |
| `GROQ_MODEL` | Reasoning LLM model identifier | `llama-3.3-70b-versatile` |
| `BACKEND_BASE_URL` | Corvus Django REST API root | `http://127.0.0.1:8000/api` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `MONGO_DB_NAME` | MongoDB database name | `corvus_chats` |
