// Corvus Offline Storage & Reconnection Sync Engine
// Safely buffers drafts, branch edits, and outbox actions in local storage when offline,
// and automatically uploads/syncs them when internet connectivity is restored.

import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_PREFIX = 'corvus_offline_draft_';
const QUEUE_KEY = 'corvus_offline_action_queue';
const APPROVALS_PREFIX = 'corvus_peer_approvals_';

// In-memory fallback for test runners / environments without persistent storage
const memoryStore = new Map();

// Check if browser/runtime is currently online
export function isNetworkOnline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

// ─── Local Storage Primitives (Dual Web localStorage, AsyncStorage & Memory Store) ──

async function getStorageItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return JSON.parse(val);
    }
    if (memoryStore.has(key)) {
      return JSON.parse(memoryStore.get(key));
    }
    const asyncVal = await AsyncStorage.getItem(key);
    if (asyncVal) return JSON.parse(asyncVal);
    return null;
  } catch (err) {
    if (memoryStore.has(key)) {
      return JSON.parse(memoryStore.get(key));
    }
    return null;
  }
}

async function setStorageItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    memoryStore.set(key, serialized);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    }
    await AsyncStorage.setItem(key, serialized);
  } catch (err) {
    // Memory store was already populated
  }
}

async function removeStorageItem(key) {
  try {
    memoryStore.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    await AsyncStorage.removeItem(key);
  } catch (err) {
    // Memory store was already removed
  }
}

// ─── 1. Offline Draft Buffer ──────────────────────────────────────────────────

export async function saveOfflineDraft(articleId, branchName, draft) {
  if (!articleId) return;
  const key = `${DRAFT_PREFIX}${articleId}_${branchName || 'main'}`;
  const payload = {
    articleId,
    branchName: branchName || 'main',
    title: draft.title || '',
    content: draft.content || '',
    summary: draft.summary || '',
    savedAt: new Date().toISOString(),
    isOffline: !isNetworkOnline(),
  };
  await setStorageItem(key, payload);
  return payload;
}

export async function getOfflineDraft(articleId, branchName) {
  if (!articleId) return null;
  const key = `${DRAFT_PREFIX}${articleId}_${branchName || 'main'}`;
  return await getStorageItem(key);
}

export async function clearOfflineDraft(articleId, branchName) {
  if (!articleId) return;
  const key = `${DRAFT_PREFIX}${articleId}_${branchName || 'main'}`;
  await removeStorageItem(key);
}

// ─── 2. Offline Action Queue (Outbox) ──────────────────────────────────────────

export async function queueOfflineAction(actionType, payload) {
  const queue = (await getStorageItem(QUEUE_KEY)) || [];
  const item = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: actionType, // 'save_article' | 'push_branch' | 'commit_branch' | 'peer_approval'
    payload,
    timestamp: new Date().toISOString(),
  };
  queue.push(item);
  await setStorageItem(QUEUE_KEY, queue);
  return item;
}

export async function getQueuedOfflineActions() {
  return (await getStorageItem(QUEUE_KEY)) || [];
}

export async function clearQueuedOfflineActions() {
  await removeStorageItem(QUEUE_KEY);
}

// ─── 3. Reconnection Auto-Sync / Flush ────────────────────────────────────────

export async function flushOfflineQueue(apiHandlers = {}) {
  const queue = await getQueuedOfflineActions();
  if (!queue.length) return { synced: 0, failed: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === 'save_article' && apiHandlers.saveArticle) {
        await apiHandlers.saveArticle(item.payload);
        synced += 1;
      } else if (item.type === 'push_branch' && apiHandlers.pushBranch) {
        await apiHandlers.pushBranch(item.payload.branchId);
        synced += 1;
      } else if (item.type === 'peer_approval' && apiHandlers.recordApproval) {
        await apiHandlers.recordApproval(item.payload);
        synced += 1;
      } else {
        synced += 1;
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    await setStorageItem(QUEUE_KEY, remaining);
  } else {
    await clearQueuedOfflineActions();
  }

  return { synced, failed: remaining.length };
}

// ─── 4. Peer Approvals Storage (Newsroom Collaboration Gate) ──────────────────

export async function getArticlePeerApprovals(articleId) {
  if (!articleId) return [];
  const key = `${APPROVALS_PREFIX}${articleId}`;
  return (await getStorageItem(key)) || [];
}

export async function addArticlePeerApproval(articleId, user) {
  if (!articleId || !user) return [];
  const key = `${APPROVALS_PREFIX}${articleId}`;
  const existing = (await getStorageItem(key)) || [];
  const userId = user.id || user.user_id || user.username;
  const alreadyApproved = existing.some((a) => a.userId === userId);
  if (!alreadyApproved) {
    existing.push({
      userId,
      username: user.username || 'journalist',
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Newsroom Colleague',
      approvedAt: new Date().toISOString(),
    });
    await setStorageItem(key, existing);
  }
  return existing;
}

// ─── 5. Network Connectivity Listener ─────────────────────────────────────────

export function subscribeToNetworkStatus(onStatusChange) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
