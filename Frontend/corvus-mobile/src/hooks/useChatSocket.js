import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL, authStorage } from '../services/api';

/**
 * useChatSocket
 *
 * Opens a persistent WebSocket connection to the Django Channels ChatConsumer
 * for a given conversation. Surfaces real-time chat messages and voice call
 * status notifications to the caller via callbacks.
 *
 * @param {string|null} conversationId - Active conversation/room id, or null to disconnect.
 * @param {object}      callbacks
 * @param {function}    callbacks.onChatMessage   - Called with a parsed message object when a chat message arrives.
 * @param {function}    callbacks.onVoiceStatus   - Called with { status, initiator_name, room_id } on voice events.
 */
export function useChatSocket(conversationId, { onChatMessage, onVoiceStatus } = {}) {
  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef     = useRef(true);

  // Keep callback refs fresh so the WebSocket closure never captures stale functions
  const onChatMessageRef = useRef(onChatMessage);
  const onVoiceStatusRef = useRef(onVoiceStatus);
  useEffect(() => { onChatMessageRef.current = onChatMessage; }, [onChatMessage]);
  useEffect(() => { onVoiceStatusRef.current = onVoiceStatus; }, [onVoiceStatus]);

  const buildUrl = useCallback(() => {
    if (!conversationId) return null;

    let base    = API_BASE_URL || 'http://localhost:8000';
    let scheme  = base.startsWith('https') ? 'wss://' : 'ws://';
    let host    = base.replace(/^https?:\/\//, '');
    const token = authStorage.getTokens()?.access;

    let url = `${scheme}${host}/ws/chat/${encodeURIComponent(conversationId)}/`;
    if (token) url += `?access_token=${encodeURIComponent(token)}`;

    return url;
  }, [conversationId]);

  const connect = useCallback(() => {
    // Close any existing socket first
    if (wsRef.current) {
      try { wsRef.current.close(1000); } catch (_) {}
      wsRef.current = null;
    }

    const url = buildUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // Clear any pending reconnect timer on successful open
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (!msg || !msg.type) return;

        if (msg.type === 'voice_call_status' && onVoiceStatusRef.current) {
          onVoiceStatusRef.current(msg);
          return;
        }

        if (msg.type === 'chat_message' && onChatMessageRef.current) {
          onChatMessageRef.current(msg);
        }
      };

      ws.onerror = (err) => {
        console.warn('[useChatSocket] Chat WS error:', err?.message || err);
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        // Do not auto-reconnect on clean close or auth failure
        if (event.code === 1000 || event.code === 4401) return;
        // Attempt a reconnect after 3 s on unexpected closure
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current && conversationId) connect();
        }, 3000);
      };
    } catch (err) {
      console.warn('[useChatSocket] Error initializing WebSocket:', err);
    }
  }, [buildUrl, conversationId]);

  // Open socket whenever conversationId changes, close when it clears
  useEffect(() => {
    mountedRef.current = true;

    if (conversationId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        try { wsRef.current.close(1000); } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [conversationId, connect]);
}

export default useChatSocket;
