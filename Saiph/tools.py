import httpx
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from .config import BACKEND_BASE_URL, TAVILY_API_KEY


def _resolve_token(token: str = "", config: RunnableConfig = None) -> str:
    """
    Retrieves the JWT access token from LangGraph's RunnableConfig (`configurable.token`)
    first so the LLM never has to generate or expose raw JWTs, while keeping backward
    compatibility if a caller passes `token` directly.
    """
    if config and isinstance(config, dict):
        cfg_token = config.get("configurable", {}).get("token")
        if cfg_token:
            return cfg_token
    return token or ""


def _get_headers(token: str = "", config: RunnableConfig = None):
    resolved = _resolve_token(token, config)
    headers = {"Content-Type": "application/json"}
    if resolved:
        headers["Authorization"] = f"Bearer {resolved}"
    return headers


# 1. Newsroom Tools
@tool
def list_newsroom_groups(token: str = "", config: RunnableConfig = None) -> str:
    """Fetches all newsroom groups the authenticated user belongs to."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get("/newsroom/groups/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_group_members(group_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Lists all team members belonging to a specific newsroom group."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get(f"/newsroom/groups/{group_id}/members/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


# 2. Editorial Project Tools
@tool
def list_articles_in_group(group_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Lists all editorial articles and active drafts inside a specific newsroom group."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get(f"/project/groups/{group_id}/articles/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_article_details(article_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Retrieves full details and branch list for a given article."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get(f"/project/articles/{article_id}/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_branch_draft_content(branch_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Reads the current written draft text and status of an article branch."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get(f"/project/branches/{branch_id}/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def create_article_branch(article_id: str, branch_name: str, branch_description: str = "", token: str = "", config: RunnableConfig = None) -> str:
    """Forks a new editorial draft branch for an article."""
    payload = {
        "branch_name": branch_name,
        "branch_description": branch_description,
        "content": "",
    }
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.post(f"/project/articles/{article_id}/branches/", json=payload)
        if res.status_code == 201:
            return f"Successfully created branch '{branch_name}': {res.json()}"
        return f"Error {res.status_code}: {res.text}"


@tool
def update_branch_content(branch_id: str, content: str, token: str = "", config: RunnableConfig = None) -> str:
    """Updates/edits the draft content of an existing article branch."""
    payload = {"content": content}
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.patch(f"/project/branches/{branch_id}/", json=payload)
        if res.status_code == 200:
            return f"Successfully updated branch draft: {res.json()}"
        return f"Error {res.status_code}: {res.text}"


# 3. AI Editorial Workspace, Mindmap, Board, Review & Memory Tools
@tool
def generate_draft_from_summary(title: str, brief: str, token: str = "", config: RunnableConfig = None) -> str:
    """Generates a full journalistic article draft from a brief summary."""
    payload = {"title": title, "brief": brief}
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=15.0) as client:
        res = client.post("/ai/generate-draft/", json=payload)
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def generate_article_mindmap_tool(article_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Generates an AI Mindmap of themes, angles, and evidence for an article."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=15.0) as client:
        res = client.post(f"/ai/articles/{article_id}/mindmap/", json={})
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def generate_article_board_tool(article_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Generates editorial suggestions and source leads on the article's Board."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=15.0) as client:
        res = client.post(f"/ai/articles/{article_id}/board/", json={})
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def review_article_plagiarism_and_ai_tool(article_id: str, token: str = "", config: RunnableConfig = None) -> str:
    """Runs plagiarism check, AI-writing detection, and plain-language improvement review on an article."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=15.0) as client:
        res = client.post(f"/ai/articles/{article_id}/review/", json={})
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def save_agent_memory_tool(fact: str, category: str = "fact", article_id: str = None, token: str = "", config: RunnableConfig = None) -> str:
    """Saves a key fact, source, or editorial preference to Saiph's long-term memory."""
    payload = {"fact": fact, "category": category, "article_id": article_id}
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.post("/ai/memories/", json=payload)
        if res.status_code in (200, 201):
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


# 4. User Profile Tool
@tool
def get_user_profile(token: str = "", config: RunnableConfig = None) -> str:
    """Retrieves current user details and multilingual preferences (english, shona, ndebele)."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token, config), timeout=10.0) as client:
        res = client.get("/auth/profile/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


# 5. Live Zimbabwe Web Search Tool (Tavily)
@tool
def search_zimbabwe_web_tool(query: str) -> str:
    """
    Searches the live web for verified facts, recent news, official gazettes, and statistics strictly focused on Zimbabwe.
    Always use this tool when the user asks about current events, external sources, statistics, or real-world verification in Zimbabwe.
    """
    clean_q = (query or "").strip()
    if not clean_q:
        return "Please provide a search query."
    
    # Enforce Zimbabwe geographical context
    if "zimbabwe" not in clean_q.lower() and not any(k in clean_q.lower() for k in ("harare", "bulawayo", "mutare", "gweru")):
        clean_q = f"{clean_q} Zimbabwe"

    if not TAVILY_API_KEY:
        return "Tavily web search API key is not configured."

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_API_KEY,
                    "query": clean_q,
                    "search_depth": "basic",
                    "max_results": 5,
                }
            )
            if res.status_code == 200:
                results = res.json().get("results", [])
                if not results:
                    return f"No verified web results found in Zimbabwe for: '{clean_q}'"
                formatted = []
                for idx, r in enumerate(results, 1):
                    formatted.append(
                        f"[{idx}] {r.get('title')} ({r.get('published_date', 'Recent')})\n"
                        f"    URL: {r.get('url')}\n"
                        f"    Summary: {r.get('content')}"
                    )
                return "\n\n".join(formatted)
            return f"Search error ({res.status_code}): {res.text}"
    except Exception as e:
        return f"Web search request failed: {e}"


ALL_AGENT_TOOLS = [
    search_zimbabwe_web_tool,
    list_newsroom_groups,
    get_group_members,
    list_articles_in_group,
    get_article_details,
    get_branch_draft_content,
    create_article_branch,
    update_branch_content,
    generate_draft_from_summary,
    generate_article_mindmap_tool,
    generate_article_board_tool,
    review_article_plagiarism_and_ai_tool,
    save_agent_memory_tool,
    get_user_profile,
]
