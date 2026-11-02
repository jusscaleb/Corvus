import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NewsroomHeader from '../../../components/NewsroomHeader';
import { useTheme } from '../../../context/ThemeContext';
import { sendChatMessage, fetchMessages } from '../../../services/api';
import { PaperclipIcon, CalendarIcon, ClipboardIcon } from '../../../components/AppIcons';

// ─── Quick emoji picks shown in the toolbar ────────────────────────────────────
const QUICK_EMOJIS = ['👍', '❤️', '🔥', '✅', '⚠️', '📌', '🎯', '💬'];

// ─── Pending status badge ──────────────────────────────────────────────────────
function StatusDot({ status, colors }) {
  if (status === 'sent') return null;
  return (
    <Text style={{ fontSize: 10, color: status === 'error' ? colors.orange : colors.muted, marginTop: 3 }}>
      {status === 'sending' ? 'Sending…' : 'Failed — tap to retry'}
    </Text>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [conversationId, setConversationId] = useState(null); // set from route params in prod

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const toolbarAnim = useRef(new Animated.Value(0)).current;

  // ── Scroll to bottom whenever messages change ────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // ── Toggle the custom toolbar (slides up/down) ───────────────────────────────
  const toggleToolbar = useCallback(() => {
    const next = !toolbarVisible;
    setToolbarVisible(next);
    Animated.spring(toolbarAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
    if (next) Keyboard.dismiss();
  }, [toolbarVisible, toolbarAnim]);

  // ── Append an emoji to the draft ─────────────────────────────────────────────
  const insertEmoji = useCallback((emoji) => {
    setDraft((prev) => prev + emoji);
    // Collapse toolbar and re-focus input
    setToolbarVisible(false);
    Animated.spring(toolbarAnim, { toValue: 0, useNativeDriver: false }).start();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [toolbarAnim]);

  // ── Optimistic send ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;

    // 1. Clear draft immediately — feels instant
    setDraft('');

    // 2. Add message to list right away with "sending" status
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      role: 'user',
      text,
      status: 'sending', // 'sending' | 'sent' | 'error'
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // 3. Fire the API call in the background
    if (conversationId) {
      try {
        const saved = await sendChatMessage(conversationId, text);
        // Replace temp entry with confirmed server message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: saved?.id ?? tempId, status: 'sent' }
              : m,
          ),
        );
      } catch {
        // Mark as failed — user can retry by tapping
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m)),
        );
      }
    } else {
      // No conversation ID yet (local demo mode) — mark sent immediately
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)),
      );
    }
  }, [draft, conversationId]);

  // ── Retry a failed message ────────────────────────────────────────────────────
  const retryMessage = useCallback(async (msg) => {
    if (msg.status !== 'error') return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: 'sending' } : m)),
    );
    try {
      const saved = await sendChatMessage(conversationId, msg.text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, id: saved?.id ?? m.id, status: 'sent' } : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'error' } : m)),
      );
    }
  }, [conversationId]);

  // ── Toolbar height (animates open) ────────────────────────────────────────────
  const toolbarHeight = toolbarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 108],
  });

  const charCount = draft.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <NewsroomHeader mode="chat" />

      {/*
        KeyboardAvoidingView wraps only the message list + composer.
        - iOS: 'padding' shifts the whole view up by the keyboard height
        - Android: 'height' shrinks the view so the composer stays visible
        keyboardVerticalOffset accounts for the header heights above this view.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 80}
      >
        {/* ── Message list ──────────────────────────────────────────────── */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>◇</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Send a message to begin the newsroom conversation.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            contentContainerStyle={styles.messages}
            data={messages}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <Pressable
                  onPress={() => item.status === 'error' && retryMessage(item)}
                  style={[styles.messageRow, isUser && styles.userRow]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                      item.status === 'sending' && styles.bubbleSending,
                      item.status === 'error' && styles.bubbleError,
                    ]}
                  >
                    {!isUser && <Text style={styles.sender}>CORVUS</Text>}
                    <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                      {item.text}
                    </Text>
                  </View>
                  {isUser && <StatusDot status={item.status} colors={colors} />}
                </Pressable>
              );
            }}
          />
        )}

        {/* ── Composer area ────────────────────────────────────────────── */}
        <View style={[styles.composerArea, { paddingBottom: Math.max(insets.bottom, 8) }]}>

          {/* Sliding custom toolbar */}
          <Animated.View style={[styles.customToolbar, { height: toolbarHeight, overflow: 'hidden' }]}>
            <View style={styles.toolbarInner}>
              <Text style={styles.toolbarLabel}>QUICK REACT</Text>
              <View style={styles.emojiRow}>
                {QUICK_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => insertEmoji(emoji)}
                    style={styles.emojiBtn}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.toolbarActions}>
                <Pressable style={styles.toolbarAction}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><PaperclipIcon size={12} color={colors.ink} /><Text style={styles.toolbarActionText}>Attach</Text></View>
                </Pressable>
                <Pressable style={styles.toolbarAction}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><CalendarIcon size={12} color={colors.ink} /><Text style={styles.toolbarActionText}>Schedule</Text></View>
                </Pressable>
                <Pressable style={styles.toolbarAction}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><ClipboardIcon size={12} color={colors.ink} /><Text style={styles.toolbarActionText}>Template</Text></View>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Composer row */}
          <View style={styles.composerRow}>
            {/* ⊕ button — opens/closes toolbar */}
            <Pressable
              accessibilityLabel="Toolbar"
              accessibilityRole="button"
              onPress={toggleToolbar}
              style={[styles.toolbarToggle, toolbarVisible && styles.toolbarToggleActive]}
            >
              <Text style={[styles.toolbarToggleIcon, toolbarVisible && styles.toolbarToggleIconActive]}>
                {toolbarVisible ? '✕' : '+'}
              </Text>
            </Pressable>

            <TextInput
              ref={inputRef}
              accessibilityLabel="Message"
              multiline
              onChangeText={setDraft}
              onFocus={() => {
                // Collapse toolbar when keyboard appears
                if (toolbarVisible) {
                  setToolbarVisible(false);
                  Animated.spring(toolbarAnim, { toValue: 0, useNativeDriver: false }).start();
                }
              }}
              onSubmitEditing={sendMessage}
              placeholder="Write a message…"
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              blurOnSubmit={false}
              style={styles.composer}
              value={draft}
            />

            {/* Character count — appears when > 80 chars */}
            {charCount > 80 && (
              <Text style={[styles.charCount, charCount > 500 && styles.charCountWarn]}>
                {charCount}
              </Text>
            )}

            <Pressable
              accessibilityLabel="Send message"
              accessibilityRole="button"
              disabled={!draft.trim()}
              onPress={sendMessage}
              style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
            >
              <Text style={styles.sendLabel}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    safeArea: {
      flex: 1,
      backgroundColor: colors.paper,
    },

    // ── Empty state ────────────────────────────────────────────────────────────
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 8,
    },
    emptyIcon: { fontSize: 32, color: colors.muted, marginBottom: 4 },
    emptyTitle: {
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '700',
    },
    emptySubtitle: { color: colors.muted, fontSize: 12, textAlign: 'center' },

    // ── Message list ───────────────────────────────────────────────────────────
    messages: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      padding: 18,
      gap: 14,
    },
    messageRow: { alignItems: 'flex-start' },
    userRow: { alignItems: 'flex-end' },
    bubble: {
      maxWidth: '88%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    assistantBubble: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.line,
    },
    userBubble: { backgroundColor: colors.forest },
    bubbleSending: { opacity: 0.55 },
    bubbleError: { borderWidth: 1, borderColor: colors.orange },
    sender: {
      marginBottom: 6,
      color: colors.orange,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    messageText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    userMessageText: { color: colors.white },

    // ── Composer area (wraps toolbar + row) ───────────────────────────────────
    composerArea: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.paper,
    },

    // ── Sliding custom toolbar ─────────────────────────────────────────────────
    customToolbar: {
      backgroundColor: colors.note,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    toolbarInner: {
      padding: 12,
      gap: 8,
    },
    toolbarLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.muted,
      marginBottom: 2,
    },
    emojiRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    emojiBtn: {
      width: 38,
      height: 38,
      borderRadius: 8,
      backgroundColor: colors.paper,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    emojiText: { fontSize: 20 },
    toolbarActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    toolbarAction: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.paper,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.line,
    },
    toolbarActionText: {
      fontSize: 12,
      color: colors.ink,
      fontWeight: '500',
    },

    // ── Composer row ──────────────────────────────────────────────────────────
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
    },
    toolbarToggle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.note,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbarToggleActive: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    toolbarToggleIcon: {
      fontSize: 20,
      lineHeight: 22,
      color: colors.muted,
      fontWeight: '300',
    },
    toolbarToggleIconActive: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '700',
    },
    composer: {
      flex: 1,
      minHeight: 42,
      maxHeight: 130,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 21,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 15,
    },
    charCount: {
      alignSelf: 'flex-end',
      paddingBottom: 12,
      fontSize: 11,
      color: colors.muted,
      minWidth: 28,
      textAlign: 'center',
    },
    charCountWarn: { color: colors.orange },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.forest,
    },
    sendDisabled: { backgroundColor: colors.line },
    sendLabel: {
      color: colors.white,
      fontSize: 20,
      fontWeight: '700',
      marginTop: -2,
    },
  });
}
