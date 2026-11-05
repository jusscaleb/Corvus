# Changelog

All notable changes to the Saiph AI Agent are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-05

### Added

- **Editorial Branch Diffing (`diff_article_branches`)**:
  - Compares any two article branches or a single branch against `main` (with active branch fallback).
  - Employs Python's built-in `difflib` for unified diff lines, additions/deletions counts, and sequence similarity percentage.
  - Returns structured chunks (`type: "added" | "removed" | "context" | "meta"`) for rich frontend UI rendering.
  - Interactive `BranchDiffModal` component in frontend with stats bar (`+N`, `-N`, similarity %) and color-coded line diffs.
- **Live Tavily Web Search Tool (`search_zimbabwe_web_tool`)**:
  - Integrated with the official `tavily-python` SDK (`TavilyClient`) following official Quickstart specifications.
  - In-memory result caching (10-minute TTL) to optimize API usage and latency.
  - Automatically formats verified source titles, URLs, and snippets for prompt injection.
  - Registered inside `ALL_AGENT_TOOLS` for autonomous ReAct execution by the LangGraph agent.
  - Enforced mandatory verification directive in Saiph system prompt and tool docstrings to eliminate hallucinations and factual errors.
- **Zimbabwe Geolocation & Editorial Constraint**:
  - Updated agent system prompt in `Saiph/graph.py` to enforce strict Zimbabwe reporting, legal frameworks, public institutions, and cultural context.
  - Automatic query normalization to append Zimbabwean contextual anchors to broad queries.
- **Configuration**:
  - Added `TAVILY_API_KEY` environment configuration in `Saiph/config.py`.

## [1.0.0] - 2026-10-31

### Added

- **Saiph (LangGraph StateGraph Agent)**:
  - Autonomous single-agent loop powered by `langgraph` and Groq's `llama-3.3-70b-versatile`.
  - Named **Saiph**: converses fluently on general topics while autonomously reasoning and invoking tools for newsroom workspace operations.
  - Multi-turn conversational memory tracking previous user and assistant messages.
- **Pure HTTP Backend Tools**:
  - Independent tool client using `httpx` connecting directly to the Django REST Backend (`/api/`) using user JWT tokens.
  - Newsroom tools: `list_newsroom_groups`, `get_group_members`.
  - Editorial Project tools: `list_articles_in_group`, `get_article_details`, `get_branch_draft_content`, `create_article_branch`, `update_branch_content`.
  - Profile and preference tool: `get_user_profile` (supporting English, Shona, and Ndebele).
- **Standalone Runner & CLI**:
  - Interactive CLI test loop in `Agent/main.py`.
  - Public interface in `Agent/__init__.py` exposing `run_agent` and `get_agent`.
- **Backend Chat Integration**:
  - Integrated into Django's `/api/chats/conversations/<id>/messages/` endpoint to automatically trigger agent reasoning and persist AI responses to MongoDB for `ai` conversation types.
