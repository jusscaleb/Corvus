import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
  web: 'http://localhost:8000',
  default: 'http://192.168.88.206:8081',
});

let currentTokens = { access: null, refresh: null };
let currentUser = null;

export const authStorage = {
  getTokens: () => currentTokens,
  setTokens: (tokens) => {
    currentTokens = { ...currentTokens, ...tokens };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('corvus_tokens', JSON.stringify(currentTokens));
      } catch (e) { }
    }
  },
  getUser: () => currentUser,
  setUser: (user) => {
    currentUser = user; 0
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('corvus_user', JSON.stringify(currentUser));
      } catch (e) { }
    }
  },
  clear: () => {
    currentTokens = { access: null, refresh: null };
    currentUser = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('corvus_tokens');
        window.localStorage.removeItem('corvus_user');
      } catch (e) { }
    }
  },
  init: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('corvus_tokens');
        if (saved) currentTokens = JSON.parse(saved);
        const userSaved = window.localStorage.getItem('corvus_user');
        if (userSaved) currentUser = JSON.parse(userSaved);
      } catch (e) { }
    }
  },
};

authStorage.init();

export async function apiRequest(endpoint, { method = 'GET', body = null, requireAuth = false } = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth && currentTokens.access) {
    headers['Authorization'] = `Bearer ${currentTokens.access}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error(`Unable to connect to server. Check connection to ${API_BASE_URL}`);
  }

  // Prevent refresh loops if the refresh endpoint itself returns 401
  const isRefreshEndpoint = endpoint === '/api/auth/token/refresh/';
  if (response.status === 401 && requireAuth && currentTokens.refresh && !isRefreshEndpoint) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${currentTokens.access}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = data?.detail || data?.message;
    if (!message && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        const formattedVal = Array.isArray(val) ? val.join(', ') : val;
        message = `${firstKey}: ${formattedVal}`;
      }
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login/', {
    method: 'POST',
    body: { email, password },
  });

  if (data?.access) {
    authStorage.setTokens({ access: data.access, refresh: data.refresh });
  }

  try {
    const profile = await apiRequest('/api/auth/profile/', { requireAuth: true });
    authStorage.setUser(profile);
    return { ...data, user: profile };
  } catch (err) {
    return data;
  }
}

export async function register({ username, email, full_name, password, password_confirm }) {
  const data = await apiRequest('/api/auth/register/', {
    method: 'POST',
    body: {
      username,
      email,
      full_name: full_name || username,
      password,
      password_confirm: password_confirm || password,
    },
  });

  if (data?.tokens) {
    authStorage.setTokens(data.tokens);
  }
  if (data?.user) {
    authStorage.setUser(data.user);
  }

  return data;
}

export async function refreshToken() {
  if (!currentTokens.refresh) return false;
  try {
    const data = await apiRequest('/api/auth/token/refresh/', {
      method: 'POST',
      body: { refresh: currentTokens.refresh },
    });
    if (data?.access) {
      authStorage.setTokens({ access: data.access });
      return true;
    }
  } catch (e) {
    authStorage.clear();
  }
  return false;
}

// â”€â”€â”€ User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function searchUsers(query = '') {
  return await apiRequest(`/api/auth/users/?search=${encodeURIComponent(query)}`, {
    requireAuth: true,
  });
}

// â”€â”€â”€ Newsrooms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchNewsrooms() {
  return await apiRequest('/api/newsroom/groups/', { requireAuth: true });
}

export async function createNewsroom({ name, description = '', member_ids = [] }) {
  return await apiRequest('/api/newsroom/groups/', {
    method: 'POST',
    requireAuth: true,
    body: { group_name: name, group_description: description, member_ids },
  });
}

// â”€â”€â”€ Articles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchArticles() {
  return await apiRequest('/api/project/articles/', { requireAuth: true });
}

export async function createArticle({ groupId, title, content = '', summary = '' }) {
  // If groupId is provided, post to group endpoint. Otherwise post to personal user articles endpoint.
  const endpoint = groupId
    ? `/api/project/groups/${groupId}/articles/`
    : '/api/project/articles/';

  const article = await apiRequest(endpoint, {
    method: 'POST',
    requireAuth: true,
    body: { title },
  });

  const mainBranch = article.branches?.find((b) => b.is_main) || article.branches?.[0];
  if (mainBranch && (content || summary)) {
    try {
      const updatedBranch = await apiRequest(`/api/project/branches/${mainBranch.branch_id}/`, {
        method: 'PATCH',
        requireAuth: true,
        body: { content, branch_description: summary },
      });
      article.branches = [updatedBranch];
    } catch (err) {
      console.warn('Could not update initial branch content:', err);
    }
  }

  return article;
}

export async function updateArticle(articleId, { title }) {
  return await apiRequest(`/api/project/articles/${articleId}/`, {
    method: 'PATCH',
    requireAuth: true,
    body: { title },
  });
}

export async function deleteArticle(articleId) {
  return await apiRequest(`/api/project/articles/${articleId}/`, {
    method: 'DELETE',
    requireAuth: true,
  });
}

export async function updateBranchContent(branchId, { content, summary }) {
  const body = {};
  if (content !== undefined) body.content = content;
  if (summary !== undefined) body.branch_description = summary;

  return await apiRequest(`/api/project/branches/${branchId}/`, {
    method: 'PATCH',
    requireAuth: true,
    body,
  });
}

// Push a branch â€“ makes it public and notifies newsroom members
export async function pushBranch(branchId) {
  // The backend endpoint will set is_public=true and broadcast a notification
  return await apiRequest(`/api/project/branches/${branchId}/push/`, {
    method: 'POST',
    requireAuth: true,
  });
}

// Publish an article to the public user site portal
export async function publishArticle(articleId, action = 'publish') {
  return await apiRequest(`/api/project/articles/${articleId}/publish/`, {
    method: 'POST',
    requireAuth: true,
    body: { action },
  });
}

// Diff a branch against its latest remote version (simple string diff placeholder)
export async function diffBranch(branchId) {
  return await apiRequest(`/api/project/branches/${branchId}/diff/`, {
    method: 'GET',
    requireAuth: true,
  });
}

// List an article's branches (backend hides other people's private branches)
export async function fetchBranches(articleId) {
  return await apiRequest(`/api/project/articles/${articleId}/branches/`, { requireAuth: true });
}

// Fork a new branch. It starts private (is_public=false) until it is pushed.
export async function createBranch(articleId, { name, description = '', content = '' }) {
  return await apiRequest(`/api/project/articles/${articleId}/branches/`, {
    method: 'POST',
    requireAuth: true,
    body: { branch_name: name, branch_description: description, content },
  });
}

// â”€â”€â”€ Chats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchInbox() {
  return await apiRequest('/api/chats/inbox/', { requireAuth: true });
}

export async function createOrGetDirectChat(recipient_id) {
  return await apiRequest('/api/chats/conversations/', {
    method: 'POST',
    requireAuth: true,
    body: { type: 'direct', recipient_id },
  });
}

export async function fetchMessages(conversation_id, { limit = 30, before = null } = {}) {
  let endpoint = `/api/chats/conversations/${conversation_id}/messages/?limit=${limit}`;
  if (before) endpoint += `&before=${encodeURIComponent(before)}`;
  return await apiRequest(endpoint, { requireAuth: true });
}

export async function sendChatMessage(conversation_id, content) {
  return await apiRequest(`/api/chats/conversations/${conversation_id}/messages/`, {
    method: 'POST',
    requireAuth: true,
    body: { content },
  });
}


export async function fetchActiveVoiceSessions() {
  return await apiRequest('/api/newsroom/voice/active/', { requireAuth: true });
}

// â”€â”€â”€ Saiph AI Article Agent & Workspace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function generateArticleDraft({ title = '', brief = '', category = 'Investigative Report' } = {}) {
  return await apiRequest('/api/ai/generate-draft/', {
    method: 'POST',
    requireAuth: true,
    body: { title, brief, category },
  });
}

export async function fetchArticleAIWorkspace(articleId, branchId = null) {
  const qs = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';
  return await apiRequest(`/api/ai/articles/${articleId}/workspace/${qs}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function generateArticleMindmap(articleId, branchId = null) {
  return await apiRequest(`/api/ai/articles/${articleId}/mindmap/`, {
    method: 'POST',
    requireAuth: true,
    body: branchId ? { branch_id: branchId } : {},
  });
}

export async function generateArticleBoard(articleId, branchId = null) {
  return await apiRequest(`/api/ai/articles/${articleId}/board/`, {
    method: 'POST',
    requireAuth: true,
    body: branchId ? { branch_id: branchId } : {},
  });
}

export async function toggleArticleBoardItem(articleId, { itemId, applied = true }) {
  return await apiRequest(`/api/ai/articles/${articleId}/board/`, {
    method: 'PATCH',
    requireAuth: true,
    body: { item_id: itemId, applied },
  });
}

export async function runArticleAIReview(articleId, branchId = null) {
  return await apiRequest(`/api/ai/articles/${articleId}/review/`, {
    method: 'POST',
    requireAuth: true,
    body: branchId ? { branch_id: branchId } : {},
  });
}

export async function fetchAgentChat(articleId = null) {
  const qs = articleId ? `?article_id=${encodeURIComponent(articleId)}` : '';
  return await apiRequest(`/api/ai/chat/${qs}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function sendAgentMessage({ content, articleId = null, branchId = null }) {
  return await apiRequest('/api/ai/chat/', {
    method: 'POST',
    requireAuth: true,
    body: {
      content,
      article_id: articleId || null,
      branch_id: branchId || null,
    },
  });
}

export async function fetchAgentMemories(articleId = null) {
  const qs = articleId ? `?article_id=${encodeURIComponent(articleId)}` : '';
  return await apiRequest(`/api/ai/memories/${qs}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function saveAgentMemory({ fact, category = 'fact', articleId = null }) {
  return await apiRequest('/api/ai/memories/', {
    method: 'POST',
    requireAuth: true,
    body: {
      fact,
      category,
      article_id: articleId || null,
    },
  });
}

export async function deleteAgentMemory(memoryId) {
  return await apiRequest(`/api/ai/memories/${memoryId}/`, {
    method: 'DELETE',
    requireAuth: true,
  });
}



// â”€â”€â”€ Public Portal & Lead Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchPublicArticles(lang = 'EN') {
  try {
    const langParam = lang && lang.toUpperCase() !== 'EN' ? `?lang=${encodeURIComponent(lang.toLowerCase())}` : '';
    return await apiRequest(`/api/project/public/${langParam}`, { method: 'GET', requireAuth: false });
  } catch (err) {
    return [];
  }
}

export async function fetchArticleTranslation(articleId, targetLang = 'sn') {
  return await apiRequest(
    `/api/project/articles/${encodeURIComponent(articleId)}/translate/?lang=${encodeURIComponent(targetLang.toLowerCase())}`,
    { method: 'GET', requireAuth: false }
  );
}

export async function submitLead({ headline, details, desk = 'General News', urgency = 'Lead Tip', contact_info = 'Anonymous', is_anonymous = false, location = '' }) {
  return await apiRequest('/api/project/leads/', {
    method: 'POST',
    requireAuth: false,
    body: {
      headline,
      details,
      desk,
      urgency,
      contact_info,
      is_anonymous,
      location,
    },
  });
}

export async function fetchUserPosts() {
  try {
    return await apiRequest('/api/project/articles/', { method: 'GET', requireAuth: true });
  } catch (err) {
    return [];
  }
}
