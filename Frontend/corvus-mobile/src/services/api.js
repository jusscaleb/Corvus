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
      } catch (e) {}
    }
  },
  getUser: () => currentUser,
  setUser: (user) => {
    currentUser = user;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('corvus_user', JSON.stringify(currentUser));
      } catch (e) {}
    }
  },
  clear: () => {
    currentTokens = { access: null, refresh: null };
    currentUser = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('corvus_tokens');
        window.localStorage.removeItem('corvus_user');
      } catch (e) {}
    }
  },
  init: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('corvus_tokens');
        if (saved) currentTokens = JSON.parse(saved);
        const userSaved = window.localStorage.getItem('corvus_user');
        if (userSaved) currentUser = JSON.parse(userSaved);
      } catch (e) {}
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
