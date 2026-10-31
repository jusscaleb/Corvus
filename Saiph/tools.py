import httpx
from langchain_core.tools import tool
from .config import BACKEND_BASE_URL


def _get_headers(token: str = ""):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


# 1. Newsroom Tools
@tool
def list_newsroom_groups(token: str) -> str:
    """Fetches all newsroom groups the authenticated user belongs to."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get("/newsroom/groups/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_group_members(token: str, group_id: str) -> str:
    """Lists all team members belonging to a specific newsroom group."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get(f"/newsroom/groups/{group_id}/members/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


# 2. Editorial Project Tools
@tool
def list_articles_in_group(token: str, group_id: str) -> str:
    """Lists all editorial articles and active drafts inside a specific newsroom group."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get(f"/project/groups/{group_id}/articles/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_article_details(token: str, article_id: str) -> str:
    """Retrieves full details and branch list for a given article."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get(f"/project/articles/{article_id}/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def get_branch_draft_content(token: str, branch_id: str) -> str:
    """Reads the current written draft text and status of an article branch."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get(f"/project/branches/{branch_id}/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


@tool
def create_article_branch(token: str, article_id: str, branch_name: str, branch_description: str = "") -> str:
    """Forks a new editorial draft branch for an article."""
    payload = {
        "branch_name": branch_name,
        "branch_description": branch_description,
        "content": "",
    }
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.post(f"/project/articles/{article_id}/branches/", json=payload)
        if res.status_code == 201:
            return f"Successfully created branch '{branch_name}': {res.json()}"
        return f"Error {res.status_code}: {res.text}"


@tool
def update_branch_content(token: str, branch_id: str, content: str) -> str:
    """Updates/edits the draft content of an existing article branch."""
    payload = {"content": content}
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.patch(f"/project/branches/{branch_id}/", json=payload)
        if res.status_code == 200:
            return f"Successfully updated branch draft: {res.json()}"
        return f"Error {res.status_code}: {res.text}"


# 3. User Profile Tool
@tool
def get_user_profile(token: str) -> str:
    """Retrieves current user details and multilingual preferences (english, shona, ndebele)."""
    with httpx.Client(base_url=BACKEND_BASE_URL, headers=_get_headers(token), timeout=10.0) as client:
        res = client.get("/auth/profile/")
        if res.status_code == 200:
            return str(res.json())
        return f"Error {res.status_code}: {res.text}"


ALL_AGENT_TOOLS = [
    list_newsroom_groups,
    get_group_members,
    list_articles_in_group,
    get_article_details,
    get_branch_draft_content,
    create_article_branch,
    update_branch_content,
    get_user_profile,
]
