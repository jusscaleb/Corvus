import { useState, useRef, useEffect, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsroomHeader from './NewsroomHeader';
import CreateNewsroomModal from './CreateNewsroomModal';
import NewDMModal from './NewDMModal';
import CreateArticleModal from './CreateArticleModal';
import BranchDiffModal from './BranchDiffModal';
import MarkdownRenderer from './MarkdownRenderer';
import PhonePromptModal, { shouldPromptForPhoneNumber } from './PhonePromptModal';
import { LockIcon, UsersIcon, EditIcon, FilePdfIcon, PrinterIcon, EyeIcon, SaveIcon, TrashIcon, FileTextIcon } from './AppIcons';
import { exportArticleToPdf, openPdfDocument } from '../utils/pdfExporter';
import { useTheme } from '../context/ThemeContext';
import { VoiceChatProvider, ChatScreenHeader } from './VoiceChat';
import useVoiceChat from '../hooks/useVoiceChat';
import VoiceBar from './VoiceBar';
import VoiceCallInviteBanner from './VoiceCallInviteBanner';
import useChatSocket from '../hooks/useChatSocket';
import ArticleHeader from './ArticleHeader';
import RichTextEditor, {
  DEFAULT_ACTIVE_FORMATS,
  stripRichFormatting,
  toggleActiveFormatState,
} from './RichTextEditor';
import {
  ArticleMindmapSection,
  ArticleBoardSection,
  ArticleReviewSection,
  SaiphAgentModal,
} from './ArticleAIWorkspace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchNewsrooms,
  fetchInbox,
  fetchArticles,
  fetchMessages,
  sendChatMessage,
  updateArticle,
  deleteArticle,
  updateBranchContent,
  fetchBranches,
  createBranch,
  pushBranch,
  publishArticle,
  fetchActiveVoiceSessions,
  fetchArticleAIWorkspace,
  fetchArticleTranslation,
} from '../services/api';
import { computeBranchDiff, canMergeBranch } from '../services/branchDiffUtil';
import {
  isNetworkOnline,
  saveOfflineDraft,
  getOfflineDraft,
  queueOfflineAction,
  flushOfflineQueue,
  getArticlePeerApprovals,
  addArticlePeerApproval,
  subscribeToNetworkStatus,
} from '../services/offlineSync';

// --- Sub-components -----------------------------------------------------------

function SymbolIcon({ symbol, color, size = 18 }) {
  return (
    <Text accessibilityElementsHidden style={{ color, fontSize: size, fontWeight: '700' }}>
      {symbol}
    </Text>
  );
}

function SectionHeading({
  title,
  count,
  onToggle,
  toggleLabel,
  onAdd,
  addLabel,
  expanded = true,
  styles,
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.headingTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>
        )}
      </View>
      <View style={styles.headingActionsRow}>
        {onAdd && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel || `Create ${title}`}
            onPress={onAdd}
            style={styles.panelAddBtn}
          >
            <Text style={styles.panelAddText}>+</Text>
          </Pressable>
        )}
        {onToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toggleLabel}
            onPress={onToggle}
            style={styles.panelToggle}
          >
            <Text style={styles.panelToggleText}>{expanded ? '−' : '+'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SelectableRow({ item, selected, onPress, onDelete, compact = false, styles, colors }) {
  const latestMessage = item.type === 'chat' ? item.lastMessage : item.timestamp;
  const isArticle = item.type === 'article';
  const initials = item.avatar || (item.title ? item.title.slice(0, 2).toUpperCase() : '•');

  return (
    <View
      style={[
        styles.selectableRow,
        selected && styles.selectableRowSelected,
        compact && styles.selectableRowCompact,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          minWidth: 0,
        }}
      >
        <View style={[styles.rowSymbol, selected && styles.rowSymbolSelected]}>
          {isArticle ? (
            <FileTextIcon size={14} color={selected ? (colors?.selectedText || '#ffffff') : (colors?.forest || '#315E4A')} />
          ) : (
            <Text style={[styles.rowSymbolText, selected && styles.rowSymbolTextSelected]}>{initials}</Text>
          )}
        </View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={compact ? 1 : 2} style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={[styles.rowMeta, selected && styles.rowMetaSelected]}>
            {latestMessage || '—'}
          </Text>
        </View>
        {item.unread > 0 && !selected && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </Pressable>
      {onDelete && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
          onPress={() => onDelete(item)}
          style={{
            padding: 6,
            borderRadius: 6,
            marginLeft: 4,
            opacity: selected ? 0.95 : 0.65,
          }}
        >
          <TrashIcon size={13} color={selected ? '#ffffff' : (colors?.muted || '#64748b')} />
        </Pressable>
      )}
    </View>
  );
}

// --- Empty state --------------------------------------------------------------

function EmptyState({ icon, title, subtitle, actionLabel, onAction, styles }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.emptyActionBtn}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// --- Rich Markdown / Word Tools Renderer -------------------------------------

function renderInlineFormatted(text, colors) {
  if (!text) return null;
  // Tokenize ***bold-italic***, **bold**, __bold__, _underline_, *italic*, and `code`
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*|`[^`]+`)/g;
  const parts = String(text).split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <Text key={idx} style={{ fontWeight: '800', fontStyle: 'italic', color: colors.ink }}>
          {part.slice(3, -3)}
        </Text>
      );
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      return (
        <Text key={idx} style={{ fontWeight: '800', color: colors.ink }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <Text key={idx} style={{ textDecorationLine: 'underline', color: colors.ink }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={idx} style={{ fontStyle: 'italic', color: colors.ink }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text
          key={idx}
          style={{
            fontFamily: 'monospace',
            backgroundColor: colors.note || '#f1f5f9',
            color: colors.forest,
            paddingHorizontal: 4,
            borderRadius: 3,
            fontSize: 14,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={idx}>{part}</Text>;
  });
}

function FormattedArticleBody({ content, colors, styles }) {
  return <MarkdownRenderer content={content} customColors={colors} />;
}

// --- Main screen --------------------------------------------------------------

export default function MainScreen() {
  return (
    <VoiceChatProvider>
      <MainScreenContent />
    </VoiceChatProvider>
  );
}

function MainScreenContent() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const wide = width >= 1080;

  // Workspace selection & panel states
  const [selectedItem, setSelectedItem] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [chatLogs, setChatLogs] = useState({});
  const [sendingMessage, setSendingMessage] = useState(false);

  // Voice call invite notification state
  const [activeVoiceCallInvite, setActiveVoiceCallInvite] = useState(null);

  // Live data states
  const [articles, setArticles] = useState([]);
  const [newsrooms, setNewsrooms] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Modals
  const [createNewsroomModalOpen, setCreateNewsroomModalOpen] = useState(false);
  const [newDMModalOpen, setNewDMModalOpen] = useState(false);
  const [createArticleModalOpen, setCreateArticleModalOpen] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const [activeBranch, setActiveBranch] = useState('main');
  const [articleBranches, setArticleBranches] = useState([]); // raw branch objects for the open story

  // Saiph AI Article Workspace & Word Tools Selection States
  const [articleSection, setArticleSection] = useState('article'); // 'article' | 'mindmap' | 'board' | 'review'
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phonePromptDismissed, setPhonePromptDismissed] = useState(false);
  const [aiWorkspace, setAiWorkspace] = useState({ mindmap: null, board: [], review: null });
  const [activeBranchDiff, setActiveBranchDiff] = useState(null);
  const [activeFormats, setActiveFormats] = useState(DEFAULT_ACTIVE_FORMATS);
  const richEditorRef = useRef(null);

  // Branch Comparison, Approvals, Language & Offline States
  const [selectedArticleLang, setSelectedArticleLang] = useState('ENG');
  const [cachedTranslations, setCachedTranslations] = useState({});
  const [articleApprovals, setArticleApprovals] = useState([]);
  const [isOffline, setIsOffline] = useState(!isNetworkOnline());

  // Dedicated active voice room state { id, title } – persists across view navigation
  // Network connectivity listener for offline storage & reconnection auto-sync
  useEffect(() => {
    const unsub = subscribeToNetworkStatus(async (online) => {
      setIsOffline(!online);
      if (online) {
        showToast({ message: '✦ Reconnected to newsroom server!', type: 'info' });
        try {
          const res = await flushOfflineQueue({
            saveArticle: async ({ branchId, content, summary }) => {
              if (branchId) await updateBranchContent(branchId, content, summary);
            },
            pushBranch: async (branchId) => {
              if (branchId) await pushBranch(branchId);
            },
          });
          if (res.synced > 0) {
            showToast({ message: `✦ Synced ${res.synced} offline update(s) to newsroom!`, type: 'success' });
          }
        } catch (_) {}
      } else {
        showToast({ message: 'Offline mode: Edits will be saved to local storage.', type: 'info' });
      }
    });
    return unsub;
  }, [showToast]);

  // Load newsroom peer approvals for active story
  useEffect(() => {
    if (selectedItem?.type === 'article' && selectedItem?.id) {
      getArticlePeerApprovals(selectedItem.id).then((approvals) => {
        setArticleApprovals(approvals || []);
      });
    }
  }, [selectedItem?.id]);

  // Prompt the user to provide a phone number for offline SMS dispatches if they haven't yet
  useEffect(() => {
    if (!loadingInitial && shouldPromptForPhoneNumber(user, phonePromptDismissed)) {
      setPhoneModalOpen(true);
    }
  }, [user, loadingInitial, phonePromptDismissed]);

  // Dedicated active voice room state { id, title } – persists across view navigation
  // (allows users to browse/edit articles, switch channels, and multitask while remaining on voice)
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);

  // Voice session room ID – stays anchored to activeVoiceRoom during an ongoing call
  const currentVoiceRoomId = activeVoiceRoom?.id || selectedItem?.id || 'newsroom-general';
  const voiceChat = useVoiceChat(currentVoiceRoomId, user, { autoJoin: false });

  // Derived from selectedItem — used for chat polling & chat WebSocket
  const activeConversationId = selectedItem?.type === 'chat' ? selectedItem.id : null;

  // Tracks if THIS client initiated the voice session to prevent showing self-invite banners
  const initiatedVoiceCallRef = useRef(false);

  // Auto-dismiss invite banner if user joins or is connected to the voice call
  useEffect(() => {
    if (voiceChat.isConnected) {
      setActiveVoiceCallInvite(null);
    }
  }, [voiceChat.isConnected]);

  // Real-time chat WebSocket – delivers voice_call_status events sent by
  // the backend VoiceSignalingConsumer through ChatConsumer to all channel members
  useChatSocket(activeConversationId, {
    onVoiceStatus: (msg) => {
      const myUserId = user?.user_id || user?.id || user?.pk;
      const isInitiator = String(msg.initiator_id) === String(myUserId) || initiatedVoiceCallRef.current;

      if (msg.status === 'started') {
        // Only show invite banner to the OPPOSING user — NEVER to the initiator
        if (!isInitiator && !voiceChat.isConnected && !voiceChat.isConnecting) {
          const matched = newsrooms.find((n) => String(n.id) === String(msg.room_id)) ||
                          directMessages.find((d) => String(d.id) === String(msg.room_id));
          setActiveVoiceCallInvite({
            ...msg,
            room_title: matched?.title || selectedItem?.title || 'Voice channel',
          });
        }
      } else if (msg.status === 'ended') {
        setActiveVoiceCallInvite(null);
        initiatedVoiceCallRef.current = false;
        if (activeVoiceRoom?.id === msg.room_id) {
          voiceChat.disconnect();
          setActiveVoiceRoom(null);
        }
      }
    },
    onChatMessage: (msg) => {
      // Future: use for real-time chat instead of polling
    },
  });

  // -- Global Voice Session Monitor ------------------------------------------
  // Polls active voice calls across all of the user's newsrooms & DMs so invitations
  // appear globally from anywhere, allowing the user to browse articles or perform
  // other tasks while receiving incoming voice session alerts.
  useEffect(() => {
    let isMounted = true;

    async function checkGlobalVoiceSessions() {
      // Don't poll if already in a voice call
      if (voiceChat.isConnected || voiceChat.isConnecting) {
        return;
      }

      try {
        const activeSessions = await fetchActiveVoiceSessions();
        if (!isMounted || !activeSessions) return;

        const myUserId = user?.user_id || user?.id || user?.pk;

        // Build index of all rooms the user has access to
        const userRooms = new Map();
        newsrooms.forEach((n) => userRooms.set(String(n.id), { id: n.id, title: n.title, type: 'group' }));
        directMessages.forEach((d) => userRooms.set(String(d.id), { id: d.id, title: d.title, type: 'direct' }));

        // Check if any active session is in a room the user belongs to
        let foundInvite = null;
        for (const [roomId, session] of Object.entries(activeSessions)) {
          if (userRooms.has(String(roomId)) && session.participant_count > 0) {
            const isInitiator = String(session.initiator_id) === String(myUserId) || initiatedVoiceCallRef.current;
            if (!isInitiator) {
              const roomInfo = userRooms.get(String(roomId));
              foundInvite = {
                type: 'voice_call_status',
                status: 'started',
                room_id: roomId,
                initiator_id: session.initiator_id,
                initiator_name: session.initiator_name || 'Colleague',
                room_title: roomInfo?.title || 'Newsroom desk',
              };
              break;
            }
          }
        }

        if (foundInvite) {
          setActiveVoiceCallInvite(foundInvite);
        } else if (activeVoiceCallInvite && !initiatedVoiceCallRef.current) {
          setActiveVoiceCallInvite(null);
        }
      } catch (e) {
        // Voice session check fallback
      }
    }

    checkGlobalVoiceSessions();
    const interval = setInterval(checkGlobalVoiceSessions, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, newsrooms, directMessages, voiceChat.isConnected, voiceChat.isConnecting, activeVoiceCallInvite]);

  // Handler to join an active voice call from anywhere in the app
  const handleJoinVoiceCall = useCallback(() => {
    if (!activeVoiceCallInvite) return;
    const targetRoom = {
      id: activeVoiceCallInvite.room_id,
      title: activeVoiceCallInvite.room_title || 'Voice Channel',
    };
    initiatedVoiceCallRef.current = false;
    setActiveVoiceCallInvite(null);
    setActiveVoiceRoom(targetRoom);
    voiceChat.connect(targetRoom.id);
    showToast({ message: `Joining ${targetRoom.title} voice...`, type: 'info' });
  }, [activeVoiceCallInvite, voiceChat, showToast]);

  // -- Branches of the open story -----------------------------------------
  const selectedArticleId = selectedItem?.type === 'article' ? selectedItem.id : null;

  useEffect(() => {
    setActiveBranch('main');
    setArticleSection('article');
    if (!selectedArticleId) {
      setArticleBranches([]);
      setAiWorkspace({ mindmap: null, board: [], review: null });
      return;
    }
    let cancelled = false;
    fetchBranches(selectedArticleId)
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setArticleBranches(list);
        const main = list.find((b) => b.is_main);
        if (main) setActiveBranch(main.branch_name);
      })
      .catch(() => {
        if (!cancelled) showToast({ message: 'Could not load branches for this story.', type: 'error' });
      });

    fetchArticleAIWorkspace(selectedArticleId)
      .then((ws) => {
        if (cancelled || !ws) return;
        const rawMindmap = ws.mindmap || ws.mindmap_data;
        const rawBoard = ws.board || ws.board_items;
        const rawReview = ws.review || ws.last_review;
        setAiWorkspace({
          mindmap: rawMindmap && Object.keys(rawMindmap).length ? rawMindmap : null,
          board: Array.isArray(rawBoard) ? rawBoard : [],
          review: rawReview && Object.keys(rawReview).length ? rawReview : null,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  // Main first, then oldest â†’ newest, shaped for the ArticleHeader dropdown
  const branchMenuItems = articleBranches.length
    ? [...articleBranches]
        .sort((a, b) => (b.is_main - a.is_main) || String(a.created_at).localeCompare(String(b.created_at)))
        .map((b) => ({ id: b.branch_id, name: b.branch_name, isMain: b.is_main, isPublic: b.is_public }))
    : ['main'];

  // Load a branch's text into the reader/editor
  const showBranchInEditor = useCallback((branch) => {
    if (!branch) return;
    const content = branch.content || '';
    const summary = branch.branch_description || content.slice(0, 160);
    setActiveBranch(branch.branch_name);
    setSelectedItem((prev) =>
      prev && prev.type === 'article' ? { ...prev, branchId: branch.branch_id, content, summary } : prev
    );
    setEditContent(content);
    setEditSummary(summary);
    richEditorRef.current?.resetContent?.(content);
  }, []);

  const handleSelectBranch = useCallback((branchName) => {
    if (branchName === activeBranch) return;
    if (isEditingArticle) {
      showToast({ message: 'Save or cancel your edits before switching branches.', type: 'error' });
      return;
    }
    const branch = articleBranches.find((b) => b.branch_name === branchName);
    if (!branch) return;
    showBranchInEditor(branch);
    showToast({ message: `Switched to ${branchName}`, type: 'info' });
  }, [activeBranch, isEditingArticle, articleBranches, showBranchInEditor, showToast]);

  // Throws on failure so ArticleHeader can show the error inline in the form
  const handleCreateBranch = useCallback(async (name) => {
    if (!selectedArticleId) throw new Error('Open a story first.');
    const source = articleBranches.find((b) => b.branch_name === activeBranch);
    // If you're mid-edit, your unsaved draft goes into the new branch and the source stays untouched
    const created = await createBranch(selectedArticleId, {
      name,
      description: isEditingArticle ? editSummary : source?.branch_description || '',
      content: isEditingArticle ? editContent : source?.content || '',
    });
    setArticleBranches((prev) => [...prev, created]);
    setIsEditingArticle(false);
    showBranchInEditor(created);
    showToast({
      message: `Created ${created.branch_name} from ${activeBranch}. Only you can see it until you push.`,
      type: 'info',
    });
  }, [selectedArticleId, articleBranches, activeBranch, isEditingArticle, editContent, editSummary, showBranchInEditor, showToast]);

  const handleExecuteCommand = useCallback(async (cmdId) => {
    const current = articleBranches.find((b) => b.branch_name === activeBranch);

    if (cmdId === 'publish' || cmdId === 'unpublish') {
      if (!selectedItem?.id) return;
      if (isEditingArticle) {
        showToast({ message: 'Save your edits before publishing.', type: 'error' });
        return;
      }
      try {
        const action = cmdId === 'unpublish' || selectedItem.is_published ? 'unpublish' : 'publish';

        if (action === 'publish') {
          // Gate 1: AI Review Passed Check
          const review = aiWorkspace.review;
          if (!review || (review.quality_score !== undefined && review.quality_score < 60) || (review.plagiarism && review.plagiarism.score >= 35)) {
            setArticleSection('review');
            showToast({
              message: '✦ Editorial Quality Gate: Article must pass Saiph AI Review before publishing to the public portal.',
              type: 'error',
            });
            return;
          }

          // Gate 2: 2 Newsroom Peer Approvals Check
          if (selectedItem?.groupId && articleApprovals.length < 2) {
            showToast({
              message: `✦ Peer Approval Gate: Requires approval from at least 2 other journalists before publishing (Current: ${articleApprovals.length}/2).`,
              type: 'error',
            });
            return;
          }
        }

        const res = await publishArticle(selectedItem.id, action);
        const isNowPublished = res.is_published;
        setSelectedItem((prev) => ({ ...prev, is_published: isNowPublished }));
        setArticles((prev) =>
          prev.map((a) => (a.article_id === selectedItem.id ? { ...a, is_published: isNowPublished } : a))
        );
        showToast({
          message: isNowPublished
            ? 'Article published! It is now live on the public user site.'
            : 'Article unpublished from public user site.',
          type: 'success',
        });
      } catch (err) {
        showToast({ message: err?.message || 'Failed to update publishing status.', type: 'error' });
      }
      return;
    }

    if (cmdId === 'push') {
      if (!current) return;
      if (!selectedItem?.groupId) {
        showToast({ message: 'This is a personal story – there is no newsroom to share it with.', type: 'info' });
        return;
      }
      if (current.is_main || current.is_public) {
        showToast({ message: `${activeBranch} is already shared with your newsroom.`, type: 'info' });
        return;
      }
      if (isEditingArticle) {
        showToast({ message: 'Save your edits before pushing.', type: 'error' });
        return;
      }
      try {
        const updated = await pushBranch(current.branch_id);
        setArticleBranches((prev) => prev.map((b) => (b.branch_id === updated.branch_id ? updated : b)));
        showToast({ message: `Pushed ${activeBranch} – your newsroom can now see it.`, type: 'info' });
        const smsCount = updated?.sms_notification?.recipient_count || 0;
        const smsSuffix =
          smsCount > 0
            ? ` • Saiph AI is texting a 160-char SMS summary to ${smsCount} colleague${smsCount === 1 ? '' : 's'}.`
            : '';
        showToast({ message: `Pushed ${activeBranch} – your newsroom can now see it.${smsSuffix}`, type: 'info' });
      } catch (err) {
        showToast({ message: err?.message || 'Push failed. Try again.', type: 'error' });
      }
      return;
    }

    if (cmdId === 'status') {
      const visibility = !current || current.is_main
        ? 'main line, shared'
        : current.is_public
          ? 'shared with newsroom'
          : 'private – only you can see it';
      const unsaved = isEditingArticle &&
        (editContent !== (selectedItem?.content || '') || editSummary !== (selectedItem?.summary || ''));
      showToast({
        message: `${activeBranch}: ${visibility}. ${unsaved ? 'You have unsaved edits.' : 'No unsaved edits.'}`,
        type: 'info',
      });
      return;
    }

    if (cmdId === 'diff') {
      const base = articleBranches.find((b) => b.branch_name === activeBranch) || { branch_name: activeBranch, content: editContent || selectedItem?.content || '' };
      const comp = articleBranches.find((b) => b.branch_name === 'main' && b.branch_name !== activeBranch) || articleBranches.find((b) => b.branch_name !== activeBranch);
      if (comp) {
        setActiveBranchDiff(computeBranchDiff(base, comp));
      } else {
        showToast({ message: 'Only 1 branch exists on this story. Create another branch to compare.', type: 'info' });
      }
      return;
    }

    const labels = {
      pull: 'Pulled latest branch updates.',
      commit: 'Saved local branch snapshot.',
    };
    showToast(labels[cmdId] || `Executed ${cmdId}`, 'info');
  }, [articleBranches, activeBranch, selectedItem, isEditingArticle, editContent, editSummary, showToast]);

  const handleCompareBranches = useCallback((baseName, compareName) => {
    const base = articleBranches.find((b) => b.branch_name === baseName) || { branch_name: baseName, content: editContent || selectedItem?.content || '' };
    const comp = articleBranches.find((b) => b.branch_name === compareName);
    if (!comp) {
      showToast({ message: `Branch "${compareName}" not found.`, type: 'error' });
      return;
    }
    setActiveBranchDiff(computeBranchDiff(base, comp));
  }, [articleBranches, editContent, selectedItem, showToast]);

  const handleMergeBranch = useCallback(async (compareBranch, baseBranch) => {
    const targetBranch = articleBranches.find((b) => b.branch_name === (baseBranch?.branch_name || activeBranch));
    const sourceBranch = articleBranches.find((b) => b.branch_name === compareBranch?.branch_name);
    if (!targetBranch || !sourceBranch) {
      showToast({ message: 'Branches could not be located for merging.', type: 'error' });
      return;
    }
    const mergedContent = sourceBranch.content || '';
    setEditContent(mergedContent);
    setIsEditingArticle(true);
    if (isNetworkOnline()) {
      try {
        await updateBranchContent(targetBranch.branch_id, mergedContent, targetBranch.branch_description || '');
        setArticleBranches((prev) =>
          prev.map((b) => (b.branch_id === targetBranch.branch_id ? { ...b, content: mergedContent } : b))
        );
        showToast({ message: `✦ Merged "${sourceBranch.branch_name}" into "${targetBranch.branch_name}"!`, type: 'success' });
      } catch (err) {
        await saveOfflineDraft(selectedItem?.id, targetBranch.branch_name, { content: mergedContent });
        showToast({ message: 'Saved merged draft to offline storage.', type: 'info' });
      }
    } else {
      await saveOfflineDraft(selectedItem?.id, targetBranch.branch_name, { content: mergedContent });
      await queueOfflineAction('save_article', { branchId: targetBranch.branch_id, content: mergedContent });
      showToast({ message: '✦ Merged locally! Saved to offline storage.', type: 'info' });
    }
  }, [articleBranches, activeBranch, selectedItem, showToast]);

  const handleRequestMergePermission = useCallback((compareBranch) => {
    const creator = compareBranch?.created_by;
    const authorName = creator?.username || creator?.first_name || 'author';
    showToast({
      message: `✦ Merge permission requested from @${authorName}.`,
      type: 'info',
    });
  }, [showToast]);

  const handleSelectArticleLanguage = useCallback(async (langCode) => {
    setSelectedArticleLang(langCode);
    if (!selectedItem?.id) return;

    if (langCode === 'ENG') {
      const activeObj = articleBranches.find((b) => b.branch_name === activeBranch);
      setEditContent(activeObj?.content || selectedItem?.content || '');
      showToast({ message: '✦ Switched to original English article.', type: 'info' });
      return;
    }

    const cacheKey = `${selectedItem.id}_${langCode}`;
    if (cachedTranslations[cacheKey]) {
      const cached = cachedTranslations[cacheKey];
      setEditContent(cached.content);
      showToast({ message: `✦ Loaded DB cached ${langCode === 'SNA' ? 'ChiShona' : 'isiNdebele'} translation.`, type: 'info' });
      return;
    }

    showToast({ message: `✦ Translating article to ${langCode === 'SNA' ? 'ChiShona' : 'isiNdebele'} via Saiph AI...`, type: 'info' });
    try {
      const res = await fetchArticleTranslation(selectedItem.id, langCode === 'SNA' ? 'sn' : 'nd');
      const translatedContent = res.translated_content || res.content || '';
      const translatedTitle = res.translated_title || res.title || '';
      const transObj = { title: translatedTitle, content: translatedContent };
      setCachedTranslations((prev) => ({ ...prev, [cacheKey]: transObj }));
      setEditContent(translatedContent);
      showToast({ message: `✦ Article translated to ${langCode === 'SNA' ? 'ChiShona' : 'isiNdebele'} and cached in DB!`, type: 'success' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not fetch translation.', type: 'error' });
    }
  }, [selectedItem, activeBranch, articleBranches, cachedTranslations, showToast]);

  const handleGrantPeerApproval = useCallback(async () => {
    if (!selectedItem?.id || !user) return;
    const updated = await addArticlePeerApproval(selectedItem.id, user);
    setArticleApprovals(updated);
    showToast({ message: `✦ Approved article! (${updated.length}/2 Peer Approvals recorded)`, type: 'success' });
  }, [selectedItem, user, showToast]);

  const canApproveCurrentArticle = Boolean(
    user && selectedItem?.groupId && !articleApprovals.some((a) => a.userId === (user.id || user.user_id || user.username))
  );

  const handleApplyFormat = useCallback((action) => {
    if (!isEditingArticle) {
      setEditContent(selectedItem?.content || '');
      setEditSummary(selectedItem?.summary || '');
      setIsEditingArticle(true);
    }

    if (articleSection !== 'article') {
      setArticleSection('article');
      setActiveFormats((prev) => toggleActiveFormatState(prev, action));
      setTimeout(() => {
        richEditorRef.current?.toggleFormat?.(action);
      }, 30);
      return;
    }

    if (richEditorRef.current?.toggleFormat) {
      richEditorRef.current.toggleFormat(action);
    } else {
      setActiveFormats((prev) => toggleActiveFormatState(prev, action));
    }
  }, [articleSection, isEditingArticle, selectedItem]);

  const handleInsertSnippetIntoDraft = useCallback((snippetText) => {
    if (!snippetText) return;
    setArticleSection('article');
    const baseText = isEditingArticle ? editContent : (selectedItem?.content || '');
    const nextContent = baseText ? `${baseText.trimEnd()}\n\n${snippetText}` : snippetText;
    setEditContent(nextContent);
    if (!isEditingArticle) {
      setEditSummary(selectedItem?.summary || '');
      setIsEditingArticle(true);
    }
    showToast({ message: 'Inserted into your article draft!', type: 'info' });
  }, [isEditingArticle, editContent, selectedItem, showToast]);

  const handleAIWorkspaceUpdated = useCallback((res) => {
    if (!res) return;
    setAiWorkspace((prev) => ({
      mindmap: res.mindmap || prev.mindmap,
      board: res.board || prev.board,
      review: res.review || prev.review,
    }));
    if (res.open_section) {
      setArticleSection(res.open_section);
    }
    if (res.created_article) {
      const newArt = res.created_article;
      setArticles((prev) => [newArt, ...prev.filter((a) => a.id !== newArt.id)]);
      setSelectedItem(newArt);
      setEditTitle(newArt.title || '');
      setEditContent(newArt.content || '');
      setEditSummary(newArt.summary || '');
      setArticleSection('article');
      showToast({
        message: `✦ Saiph AI created and drafted "${newArt.title}"!`,
        type: 'info',
      });
    }
    if (res.updated_title && selectedArticleId) {
      setEditTitle(res.updated_title);
      setSelectedItem((prev) =>
        prev && prev.type === 'article' ? { ...prev, title: res.updated_title } : prev
      );
      setArticles((prev) =>
        prev.map((a) => (a.id === selectedArticleId ? { ...a, title: res.updated_title } : a))
      );
      showToast({
        message: `✦ Saiph AI updated headline to "${res.updated_title}".`,
        type: 'info',
      });
    }
    if (Array.isArray(res.branches) && res.branches.length > 0) {
      setArticleBranches(res.branches);
    }
    const targetSwitchedBranch = res.switched_branch || res.created_branch;
    if (targetSwitchedBranch) {
      setArticleBranches((prev) => {
        const exists = prev.some((b) => b.branch_id === targetSwitchedBranch.branch_id);
        return exists
          ? prev.map((b) => (b.branch_id === targetSwitchedBranch.branch_id ? targetSwitchedBranch : b))
          : [...prev, targetSwitchedBranch];
      });
      setIsEditingArticle(false);
      showBranchInEditor(targetSwitchedBranch);
      richEditorRef.current?.resetContent?.(targetSwitchedBranch.content || '');
      showToast({
        message: res.created_branch
          ? `✦ Saiph AI created & switched to branch "${targetSwitchedBranch.branch_name}".`
          : `✦ Saiph AI switched to branch "${targetSwitchedBranch.branch_name}".`,
        type: 'info',
      });
    }
        if (res.branch_diff) {
      setActiveBranchDiff(res.branch_diff);
      showToast({
        message: `Branch Diff: ${res.branch_diff.compare_branch?.branch_name} vs ${res.branch_diff.base_branch?.branch_name} (${res.branch_diff.stats?.similarity_percent}% similarity)`,
        type: 'info',
      });
    }
    if (res.pushed_branch) {
      setArticleBranches((prev) =>
        prev.map((b) => (b.branch_id === res.pushed_branch.branch_id ? res.pushed_branch : b))
      );
      showToast({
        message: `✦ Saiph AI pushed branch "${res.pushed_branch.branch_name}" to newsroom.`,
        type: 'info',
      });
    }
    const nextContent = res.updated_content || res.updated_branch?.content;
    const nextSummary = res.updated_summary || res.updated_branch?.summary;
    if (nextContent) {
      const targetBranchName = res.updated_branch?.branch_name || targetSwitchedBranch?.branch_name || activeBranch;
      setEditContent(nextContent);
      if (nextSummary) setEditSummary(nextSummary);
      richEditorRef.current?.resetContent?.(nextContent);
      setSelectedItem((prev) =>
        prev && prev.type === 'article'
          ? { ...prev, content: nextContent, summary: nextSummary || prev.summary }
          : prev
      );
      setArticleBranches((prev) =>
        prev.map((b) =>
          b.branch_name === targetBranchName
            ? { ...b, content: nextContent, branch_description: nextSummary || b.branch_description }
            : b
        )
      );
      setArticles((prev) =>
        prev.map((a) =>
          a.id === selectedArticleId
            ? { ...a, content: nextContent, summary: nextSummary || a.summary }
            : a
        )
      );
    }
  }, [activeBranch, selectedArticleId, showBranchInEditor, showToast]);

  // -- Animated values for expanding & retracting panels -----------
  const leftAnim = useRef(new Animated.Value(1)).current;
  const rightAnim = useRef(new Animated.Value(1)).current;
  const restoreAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const drawerSlideAnim = useRef(new Animated.Value(300)).current;
  const drawerBackdropAnim = useRef(new Animated.Value(0)).current;

  // -- Initial Live Data Loading ----------------------------------
  const loadWorkspaceData = useCallback(async () => {
    try {
      const [groupsRes, inboxRes, articlesRes] = await Promise.allSettled([
        fetchNewsrooms(),
        fetchInbox(),
        fetchArticles(),
      ]);

      if (groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value)) {
        setNewsrooms(
          groupsRes.value.map((g) => ({
            id: g.group_id,
            type: 'chat',
            chatType: 'group',
            title: g.group_name,
            tagline: g.group_description || 'Newsroom desk channel',
            subscribers: `${g.member_number || 1} members`,
            avatar: g.group_name.slice(0, 2).toUpperCase(),
            avatar: g.group_name.slice(0, 2).toUpperCase(),
          }))
        );
      }

      if (inboxRes.status === 'fulfilled' && Array.isArray(inboxRes.value)) {
        setDirectMessages(
          inboxRes.value.filter((c) => c.type === 'direct').map((c) => {
            const other = (c.other_participants && c.other_participants[0]) || {};
            const title =
              c.type === 'direct'
                ? other.full_name || other.username || 'Colleague'
                : c.title || 'Conversation';
            return {
              id: c.conversation_id || c._id,
              type: 'chat',
              chatType: c.type,
              title,
              role: c.type === 'direct' ? `@${other.username || 'reporter'}` : 'Newsroom group',
              avatar: title.slice(0, 2).toUpperCase(),
              status: 'online',
              lastMessage: c.last_message?.content || 'No messages yet',
              time: c.last_message?.created_at
                ? new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent',
              unread: 0,
              otherUser: other,
            };
          })
        );
      }

      if (articlesRes.status === 'fulfilled' && Array.isArray(articlesRes.value)) {
        setArticles(formatArticlesList(articlesRes.value));
      }
    } catch (err) {
      console.log('Error loading workspace data:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  const formatArticlesList = useCallback((rawList) => {
    return rawList.map((a) => {
      const mainBranch = a.branches?.find((b) => b.is_main) || a.branches?.[0];
      const isPersonal = !a.group && !a.group_name;
      const groupId = typeof a.group === 'string' ? a.group : a.group?.group_id;
      return {
        id: a.article_id,
        type: 'article',
        title: a.title,
        category: isPersonal ? 'Personal Draft' : (a.group_name || 'Newsroom Desk'),
        isPersonal,
        groupId: groupId || null,
        branchId: mainBranch?.branch_id,
        timestamp: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Draft',
        author: a.author_name || a.author?.full_name || a.author?.username || 'Reporter',
        authorId: a.author?.user_id,
        readTime: `${a.branch_count || 1} branch${a.branch_count !== 1 ? 'es' : ''}`,
        avatar: a.title ? a.title.slice(0, 2).toUpperCase() : 'AR',
        summary: mainBranch?.branch_description || mainBranch?.content?.slice(0, 160) || 'Editorial draft in progress...',
        content: mainBranch?.content || 'Draft content in progress...',
      };
    });
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // -- Live Newsroom Article & Group Sync -------------------------
  // Periodically refreshes articles and newsrooms so stories filed by any
  // colleague in a newsroom appear automatically for all members in that newsroom.
  useEffect(() => {
    let isMounted = true;
    const syncNewsroomArticles = async () => {
      try {
        const [articlesData, groupsData] = await Promise.all([
          fetchArticles(),
          fetchNewsrooms(),
        ]);
        if (!isMounted) return;
        if (Array.isArray(articlesData)) {
          const next = formatArticlesList(articlesData);
          setArticles((prev) => {
            const unchanged =
              prev.length === next.length &&
              prev.every(
                (a, idx) =>
                  a.id === next[idx].id &&
                  a.title === next[idx].title &&
                  a.readTime === next[idx].readTime &&
                  a.category === next[idx].category &&
                  a.summary === next[idx].summary &&
                  a.content === next[idx].content
              );
            return unchanged ? prev : next;
          });
          // Keep currently selected article metadata fresh if we aren't actively editing it
          if (!isEditingArticle && !isEditingTitle) {
            setSelectedItem((prev) => {
              if (!prev || prev.type !== 'article') return prev;
              const updated = next.find((item) => item.id === prev.id);
              if (!updated) return prev;
              if (
                prev.title === updated.title &&
                prev.readTime === updated.readTime &&
                prev.category === updated.category
              ) {
                return prev;
              }
              return { ...prev, title: updated.title, readTime: updated.readTime, category: updated.category };
            });
          }
        }
        if (Array.isArray(groupsData)) {
          setNewsrooms(
            groupsData.map((g) => ({
              id: g.group_id,
              type: 'chat',
              chatType: 'group',
              title: g.group_name,
              tagline: g.group_description || 'Newsroom desk channel',
              subscribers: `${g.member_number || 1} members`,
              avatar: g.group_name.slice(0, 2).toUpperCase(),
              avatar: g.group_name.slice(0, 2).toUpperCase(),
            }))
          );
          const nextGroups = groupsData.map((g) => ({
            id: g.group_id,
            type: 'chat',
            chatType: 'group',
            title: g.group_name,
            tagline: g.group_description || 'Newsroom desk channel',
            subscribers: `${g.member_number || 1} members`,
            symbol: '▤',
            avatar: g.group_name.slice(0, 2).toUpperCase(),
          }));
          setNewsrooms((prev) => {
            const unchanged =
              prev.length === nextGroups.length &&
              prev.every(
                (g, idx) =>
                  g.id === nextGroups[idx].id &&
                  g.title === nextGroups[idx].title &&
                  g.tagline === nextGroups[idx].tagline &&
                  g.subscribers === nextGroups[idx].subscribers
              );
            return unchanged ? prev : nextGroups;
          });
        }
      } catch {
        // Ignore transient background sync errors
      }
    };

    const interval = setInterval(syncNewsroomArticles, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [formatArticlesList, isEditingArticle, isEditingTitle]);

  // -- Poll messages & active voice call status for active chat conversation --
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    async function pollChatAndVoice() {
      try {
        const res = await fetchMessages(activeConversationId);
        if (res?.messages && isMounted) {
          const formatted = res.messages.map((m) => {
            const isMe = String(m.sender_id) === String(user?.user_id);
            return {
              sender: isMe ? 'You' : m.sender_type === 'ai' ? 'Corvus Wire' : 'Colleague',
              text: m.content,
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent',
              rawId: m.message_id || m._id,
            };
          });
          setChatLogs((prev) => ({
            ...prev,
            [activeConversationId]: formatted,
          }));
        }
      } catch {
        // Chat service might be offline or empty
      }

      // Check active voice calls in this room as fallback to WebSocket push
      try {
        const activeSessions = await fetchActiveVoiceSessions();
        if (isMounted && activeSessions) {
          const currentSession = activeSessions[activeConversationId];
          const myUserId = user?.user_id || user?.id || user?.pk;
          if (currentSession && currentSession.participant_count > 0) {
            const isInitiator = String(currentSession.initiator_id) === String(myUserId) || initiatedVoiceCallRef.current;
            if (!isInitiator && !voiceChat.isConnected && !voiceChat.isConnecting) {
              setActiveVoiceCallInvite({
                type: 'voice_call_status',
                status: 'started',
                room_id: activeConversationId,
                initiator_id: currentSession.initiator_id,
                initiator_name: currentSession.initiator_name || 'Colleague',
              });
            }
          } else if (!currentSession && !initiatedVoiceCallRef.current) {
            setActiveVoiceCallInvite(null);
          }
        }
      } catch {
        // Active voice sessions check fallback
      }
    }

    pollChatAndVoice();
    const interval = setInterval(pollChatAndVoice, 3500); // 3.5-second live poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeConversationId, user?.user_id, voiceChat.isConnected, voiceChat.isConnecting]);

  // Animate left sidebar collapse / expand
  useEffect(() => {
    if (leftOpen) {
      Animated.spring(leftAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(leftAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [leftOpen]);

  // Animate right sidebar collapse / expand
  useEffect(() => {
    if (rightOpen) {
      Animated.spring(rightAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(rightAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [rightOpen]);

  // Animate restore bar appearance when at least one sidebar is retracted
  const hasRetractedSidebar = !leftOpen || !rightOpen;
  useEffect(() => {
    Animated.spring(restoreAnim, {
      toValue: hasRetractedSidebar ? 1 : 0,
      tension: 70,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [hasRetractedSidebar]);

  const useNativeDriver = Platform.OS !== 'web';

  // Subtle content crossfade when switching active item
  useEffect(() => {
    contentFadeAnim.setValue(0.7);
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  // Drawer modal entry / exit animations
  useEffect(() => {
    if (drawer) {
      drawerSlideAnim.setValue(300);
      drawerBackdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(drawerBackdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver,
        }),
        Animated.spring(drawerSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer]);

  function closeDrawer() {
    Animated.parallel([
      Animated.timing(drawerBackdropAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver,
      }),
      Animated.timing(drawerSlideAnim, {
        toValue: 300,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
    ]).start(() => setDrawer(null));
  }

  function selectItem(item) {
    setSelectedItem(item);
    if (drawer) closeDrawer();
    setReplyText('');
    if (item?.type === 'article') {
      const nextContent = item.content || '';
      setEditTitle(item.title || '');
      setEditContent(nextContent);
      setEditSummary(item.summary || '');
      setIsEditingArticle(false);
      setIsEditingTitle(false);
      richEditorRef.current?.resetContent?.(nextContent);
    }
  }

  async function handleSaveArticleTitle() {
    const cleanTitle = editTitle.trim();
    if (!cleanTitle || !selectedItem?.id) return;
    setSavingArticle(true);
    try {
      await updateArticle(selectedItem.id, { title: cleanTitle });
      setArticles((prev) =>
        prev.map((a) => (a.id === selectedItem.id ? { ...a, title: cleanTitle } : a))
      );
      setSelectedItem((prev) => ({ ...prev, title: cleanTitle }));
      setIsEditingTitle(false);
      showToast({ message: 'Headline updated.', type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not update headline.', type: 'error' });
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleSaveArticleContent() {
    if (!selectedItem?.branchId) {
      showToast({ message: 'No editable branch found.', type: 'error' });
      return;
    }
    setSavingArticle(true);
    try {
      await updateBranchContent(selectedItem.branchId, {
        content: editContent,
        summary: editSummary,
      });
      const savedBranch = articleBranches.find((b) => b.branch_id === selectedItem.branchId);
      setArticleBranches((prev) =>
        prev.map((b) =>
          b.branch_id === selectedItem.branchId
            ? { ...b, content: editContent, branch_description: editSummary }
            : b
        )
      );
      // The story card in the sidebar always previews main, so only refresh it for main
      if (!savedBranch || savedBranch.is_main) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === selectedItem.id
              ? { ...a, content: editContent, summary: editSummary }
              : a
          )
        );
      }
      setSelectedItem((prev) => ({
        ...prev,
        content: editContent,
        summary: editSummary,
      }));
      setIsEditingArticle(false);
      showToast({ message: `Saved to ${activeBranch}.`, type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not save article content.', type: 'error' });
    } finally {
      setSavingArticle(false);
    }
  }

  async function sendMessage() {
    const text = replyText.trim();
    if (!text || !selectedItem || selectedItem.type !== 'chat' || sendingMessage) return;

    // Optimistic UI append
    const optimisticMsg = { sender: 'You', text, time: 'Just now' };
    setChatLogs((current) => ({
      ...current,
      [selectedItem.id]: [...(current[selectedItem.id] || []), optimisticMsg],
    }));
    setReplyText('');
    setSendingMessage(true);

    try {
      await sendChatMessage(selectedItem.id, text);
    } catch (err) {
      showToast({ message: 'Message delivery failed.', type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  }

  // -- Modal Creation Callbacks ------------------------------------
  function handleArticleCreated(newArticle) {
    setArticles((prev) => [newArticle, ...prev]);
    selectItem(newArticle);
    loadWorkspaceData();
  }

  function handleNewsroomCreated(newGroup) {
    const item = {
      id: newGroup.group_id,
      type: 'chat',
      chatType: 'group',
      title: newGroup.group_name,
      tagline: newGroup.group_description || 'Newsroom desk channel',
      subscribers: `${newGroup.member_number || 3} members`,
      avatar: g.group_name.slice(0, 2).toUpperCase(),
      avatar: newGroup.group_name.slice(0, 2).toUpperCase(),
    };
    setNewsrooms((prev) => [item, ...prev]);
    selectItem(item);
    loadWorkspaceData();
  }

  function handleDMCreated(conv) {
    const other = conv.targetUser || (conv.other_participants && conv.other_participants[0]) || {};
    const title = other.full_name || other.username || 'Colleague';
    const item = {
      id: conv.conversation_id || conv._id,
      type: 'chat',
      chatType: 'direct',
      title,
      role: `@${other.username || 'reporter'}`,
      avatar: title.slice(0, 2).toUpperCase(),
      status: 'online',
      lastMessage: conv.last_message?.content || 'Correspondence initiated',
      time: 'Just now',
      unread: 0,
      otherUser: other,
    };
    setDirectMessages((prev) => {
      const exists = prev.some((d) => d.id === item.id);
      return exists ? prev : [item, ...prev];
    });
    selectItem(item);
  }

  async function handleConfirmDeleteArticle() {
    if (!articleToDelete?.id || deletingArticle) return;
    const targetId = articleToDelete.id;
    const targetTitle = articleToDelete.title || 'Story';
    setDeletingArticle(true);
    try {
      await deleteArticle(targetId);
      setArticles((prev) => {
        const remaining = prev.filter((a) => a.id !== targetId);
        if (selectedItem?.type === 'article' && selectedItem?.id === targetId) {
          const nextArt = remaining[0] || null;
          setSelectedItem(nextArt);
          if (nextArt) {
            setEditTitle(nextArt.title || '');
            setEditContent(nextArt.content || '');
            setEditSummary(nextArt.summary || '');
          }
          setIsEditingArticle(false);
          setIsEditingTitle(false);
        }
        return remaining;
      });
      setArticleToDelete(null);
      showToast({ message: `Deleted story "${targetTitle}".`, type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not delete article.', type: 'error' });
    } finally {
      setDeletingArticle(false);
    }
  }

  function renderArticleList() {
    if (loadingInitial) {
      return <ActivityIndicator color={colors.forest} style={{ paddingVertical: 20 }} />;
    }
    if (articles.length === 0) {
      return (
        <EmptyState
          icon="◎"
          title="No articles yet"
          subtitle="Newsroom investigative pieces and stories will appear here."
          styles={styles}
        />
      );
    }
    return articles.map((item) => (
      <SelectableRow
        key={item.id}
        item={item}
        selected={selectedItem?.id === item.id}
        onPress={() => selectItem(item)}
        onDelete={(art) => setArticleToDelete(art)}
        styles={styles}
        colors={colors}
      />
    ));
  }

  function renderChatList(items, emptyTitle, emptySubtitle, onAction, actionLabel) {
    if (loadingInitial) {
      return <ActivityIndicator color={colors.forest} style={{ paddingVertical: 20 }} />;
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon="◇"
          title={emptyTitle}
          subtitle={emptySubtitle}
          actionLabel={actionLabel}
          onAction={onAction}
          styles={styles}
        />
      );
    }
    return items.map((item) => (
      <SelectableRow
        compact
        key={item.id}
        item={item}
        selected={selectedItem?.id === item.id}
        onPress={() => selectItem(item)}
        styles={styles}
      />
    ));
  }

  function renderPickerContent() {
    if (drawer === 'articles') {
      return (
        <>
          <SectionHeading
            title="Articles"
            count={articles.length}
            onAdd={() => {
              closeDrawer();
              setCreateArticleModalOpen(true);
            }}
            addLabel="Draft new story or PDF"
            styles={styles}
          />
          {renderArticleList()}
        </>
      );
    }
    if (drawer === 'messages') {
      return (
        <>
          <SectionHeading
            title="Direct messages"
            count={directMessages.length}
            onAdd={() => {
              closeDrawer();
              setNewDMModalOpen(true);
            }}
            addLabel="Start new direct message"
            styles={styles}
          />
          {renderChatList(
            directMessages,
            'No messages',
            'Start an end-to-end conversation with a colleague.',
            () => {
              closeDrawer();
              setNewDMModalOpen(true);
            },
            '+ New Conversation'
          )}
        </>
      );
    }
    return (
      <>
        <SectionHeading
          title="Newsrooms"
          count={newsrooms.length}
          onAdd={() => {
            closeDrawer();
            setCreateNewsroomModalOpen(true);
          }}
          addLabel="Establish newsroom"
          styles={styles}
        />
        {renderChatList(
          newsrooms,
          'No newsrooms',
          'A newsroom requires at least 3 colleagues to establish.',
          () => {
            closeDrawer();
            setCreateNewsroomModalOpen(true);
          },
          '+ Launch Newsroom'
        )}
      </>
    );
  }

  function renderCenterPane() {
    if (!selectedItem) {
      return (
        <Animated.View style={[styles.welcomePane, { opacity: contentFadeAnim }]}>
          <View style={{ marginBottom: 16 }}><FileTextIcon size={46} color={colors?.forest || '#315E4A'} /></View>
          <Text style={styles.welcomeTitle}>The Newsroom Workspace</Text>
          <Text style={styles.welcomeSubtitle}>
            Select an article, join a collaborative newsroom desk, or start an end-to-end direct correspondence.
          </Text>
          <View style={styles.welcomeActions}>
            <Pressable
              onPress={() => setCreateArticleModalOpen(true)}
              style={styles.welcomePrimaryBtn}
            >
              <Text style={styles.welcomePrimaryBtnText}>+ Draft Story or Attach PDF</Text>
            </Pressable>
            <Pressable
              onPress={() => setCreateNewsroomModalOpen(true)}
              style={styles.welcomeSecondaryBtn}
            >
              <Text style={styles.welcomeSecondaryBtnText}>+ Establish Newsroom (3+ People)</Text>
            </Pressable>
            <Pressable
              onPress={() => setNewDMModalOpen(true)}
              style={styles.welcomeSecondaryBtn}
            >
              <Text style={styles.welcomeSecondaryBtnText}>+ New Direct Message</Text>
            </Pressable>
            <Pressable
              onPress={() => setAiModalOpen(true)}
              style={styles.welcomeSecondaryBtn}
            >
              <Text style={styles.welcomeSecondaryBtnText}>✦ Ask Saiph AI Agent</Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    if (selectedItem.type === 'article') {
      let pdfData = null;
      try {
        if (typeof selectedItem.content === 'string' && selectedItem.content.trim().startsWith('{')) {
          const parsed = JSON.parse(selectedItem.content);
          if (parsed && parsed.isPdfFile) {
            pdfData = parsed;
          }
        }
      } catch (e) {}

      const isPersonal = selectedItem.isPersonal || !selectedItem.groupId;
      const targetNewsroom = newsrooms.find((g) => g.id === selectedItem.groupId);

      return (
        <Animated.View style={[{ flex: 1 }, { opacity: contentFadeAnim }]}>
          {isOffline && (
            <View style={{ backgroundColor: '#fef3c7', paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#fde68a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={{ fontSize: 11.5, color: '#92400e', fontWeight: '700' }}>⚡ Offline Mode</Text>
              <Text style={{ fontSize: 11.5, color: '#b45309' }}>— Drafts are saved to local storage and will sync automatically when reconnected.</Text>
            </View>
          )}
          <ArticleHeader
            activeBranch={activeBranch}
            branches={branchMenuItems}
            isPublished={!!selectedItem?.is_published}
            onSelectBranch={handleSelectBranch}
            onCreateBranch={handleCreateBranch}
            onExecuteCommand={handleExecuteCommand}
            onCompareBranch={(compareName) => handleCompareBranches(activeBranch, compareName)}
            selectedLanguage={selectedArticleLang}
            onSelectLanguage={handleSelectArticleLanguage}
            peerApprovals={articleApprovals}
            canApprove={canApproveCurrentArticle}
            onGrantApproval={handleGrantPeerApproval}
            onApplyFormat={handleApplyFormat}
            activeFormats={activeFormats}
            activeSection={articleSection}
            onSelectSection={setArticleSection}
            onOpenAIAgent={() => setAiModalOpen(true)}
            boardCount={aiWorkspace.board?.length || 0}
            reviewScore={aiWorkspace.review?.quality_score ?? null}
          />
          {articleSection === 'mindmap' ? (
            <ArticleMindmapSection
              articleId={selectedItem.id}
              branchId={selectedItem.branchId}
              mindmap={aiWorkspace.mindmap}
              onMindmapUpdated={(nextMindmap) =>
                setAiWorkspace((prev) => ({ ...prev, mindmap: nextMindmap }))
              }
              onInsertLeafToDraft={handleInsertSnippetIntoDraft}
            />
          ) : articleSection === 'board' ? (
            <ArticleBoardSection
              articleId={selectedItem.id}
              branchId={selectedItem.branchId}
              boardItems={aiWorkspace.board}
              onBoardUpdated={(nextBoard) =>
                setAiWorkspace((prev) => ({ ...prev, board: nextBoard }))
              }
              onApplySnippet={handleInsertSnippetIntoDraft}
            />
          ) : articleSection === 'review' ? (
            <ArticleReviewSection
              articleId={selectedItem.id}
              branchId={selectedItem.branchId}
              review={aiWorkspace.review}
              onReviewUpdated={(nextReview) =>
                setAiWorkspace((prev) => ({ ...prev, review: nextReview }))
              }
            />
          ) : (
            <ScrollView contentContainerStyle={styles.articleScroll} keyboardShouldPersistTaps="always">
            {/* Header / Category & Actions Line */}
            <View style={styles.articleHeaderLine}>
              <View style={[styles.articleCategory, isPersonal && styles.articleCategoryPersonal, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                {isPersonal ? (
                  <LockIcon size={10} color={colors.paper} />
                ) : (
                  <UsersIcon size={10} color={colors.paper} />
                )}
                <Text style={styles.articleCategoryText}>
                  {isPersonal ? 'PERSONAL DRAFT' : `${targetNewsroom?.title?.toUpperCase() || 'NEWSROOM'} DESK`}
                </Text>
              </View>
              <Text style={styles.articleMeta}>{selectedItem.timestamp}</Text>
              <Text style={styles.articleMeta}>{selectedItem.readTime}</Text>

              <View style={{ flex: 1 }} />

              {/* Action buttons bar */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {!pdfData && (
                  isEditingArticle ? (
                    <>
                      <Pressable
                        onPress={() => {
                          const origContent = selectedItem.content || '';
                          setIsEditingArticle(false);
                          setEditContent(origContent);
                          setEditSummary(selectedItem.summary || '');
                          setActiveFormats(DEFAULT_ACTIVE_FORMATS);
                          richEditorRef.current?.resetContent?.(origContent);
                        }}
                        style={styles.articleCancelEditBtn}
                      >
                        <Text style={styles.articleCancelEditBtnText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveArticleContent}
                        disabled={savingArticle}
                        style={styles.articleSaveBtn}
                      >
                        {savingArticle ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <SaveIcon size={12} color="#FFF" style={{ marginRight: 5 }} />
                            <Text style={styles.articleSaveBtnText}>Save Story</Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setEditContent(selectedItem.content || '');
                        setEditSummary(selectedItem.summary || '');
                        setIsEditingArticle(true);
                        setTimeout(() => richEditorRef.current?.focus?.(), 20);
                      }}
                      style={styles.articleActionBtn}
                    >
                      <EditIcon size={12} color={colors.ink} style={{ marginRight: 5 }} /><Text style={styles.articleActionBtnText}>Edit Story</Text>
                    </Pressable>
                  )
                )}

                {pdfData ? (
                  <Pressable
                    onPress={() => openPdfDocument(pdfData.fileName, pdfData.dataUrl)}
                    style={styles.articleActionBtn}
                  >
                    <FilePdfIcon size={12} color={colors.ink} style={{ marginRight: 5 }} /><Text style={styles.articleActionBtnText}>Open PDF</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => exportArticleToPdf({
                      ...selectedItem,
                      content: isEditingArticle ? editContent : selectedItem.content,
                      summary: isEditingArticle ? editSummary : selectedItem.summary,
                    })}
                    style={styles.articleActionBtn}
                  >
                    <PrinterIcon size={12} color={colors.ink} style={{ marginRight: 5 }} /><Text style={styles.articleActionBtnText}>Save as PDF</Text>
                  </Pressable>
                )}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete Story"
                  onPress={() => setArticleToDelete(selectedItem)}
                  style={[
                    styles.articleActionBtn,
                    { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' },
                  ]}
                >
                  <TrashIcon size={12} color="#dc2626" style={{ marginRight: 5 }} />
                  <Text style={[styles.articleActionBtnText, { color: '#dc2626' }]}>Delete Story</Text>
                </Pressable>
              </View>
            </View>

            {/* Editable or Display Headline */}
            {isEditingTitle ? (
              <View style={styles.titleEditRow}>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  onSubmitEditing={handleSaveArticleTitle}
                  autoFocus
                  style={styles.titleInput}
                />
                <Pressable
                  onPress={handleSaveArticleTitle}
                  disabled={savingArticle}
                  style={styles.titleSaveBtn}
                >
                  <Text style={styles.titleSaveBtnText}>Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsEditingTitle(false);
                    setEditTitle(selectedItem.title || '');
                  }}
                  style={styles.titleCancelBtn}
                >
                  <Text style={styles.titleCancelBtnText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.titleRow}>
                <Text style={styles.articleTitle}>{selectedItem.title}</Text>
                <Pressable
                  onPress={() => setIsEditingTitle(true)}
                  style={styles.editTitleMiniBtn}
                >
                  <EditIcon size={10} color={colors.muted} style={{ marginRight: 4 }} /><Text style={styles.editTitleMiniText}>Edit Headline</Text>
                </Pressable>
              </View>
            )}

            {/* Authorship Row (Personal vs Newsroom Members) */}
            <View style={styles.authorRow}>
              <View style={[styles.authorAvatar, isPersonal && styles.authorAvatarPersonal]}>
                {isPersonal ? (
                  <Text style={[styles.authorInitial, styles.authorInitialPersonal]}>
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </Text>
                ) : (
                  <UsersIcon size={16} color={colors.ink} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.authorName}>
                  {isPersonal
                    ? `${user?.full_name || user?.username || 'You'} (Personal Draft)`
                    : `Reported by ${selectedItem.author || 'Reporter'} • ${targetNewsroom?.title || 'Newsroom'} Desk`}
                </Text>
                <Text style={styles.authorRole}>
                  {isPersonal
                    ? 'Private Workspace • Only visible to you'
                    : `Collaborative Investigation • ${targetNewsroom?.subscribers || 'Desk Members'}`}
                </Text>
              </View>
            </View>

            {/* PDF File Banner */}
            {pdfData ? (
              <View style={styles.pdfArticleBanner}>
                <View style={styles.pdfBannerBadge}>
                  <Text style={styles.pdfBannerBadgeText}>PDF ARCHIVE</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.pdfBannerTitle}>{pdfData.fileName}</Text>
                  <Text style={styles.pdfBannerMeta}>
                    Document Size: {pdfData.fileSize} • Secured in newsroom archive
                  </Text>
                </View>
                <Pressable
                  onPress={() => openPdfDocument(pdfData.fileName, pdfData.dataUrl)}
                  style={styles.pdfViewButton}
                >
                  <EyeIcon size={13} color="#FFF" style={{ marginRight: 5 }} /><Text style={styles.pdfViewButtonText}>View PDF</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Lead Summary (Editable or Display) */}
            {!pdfData && (
              isEditingArticle ? (
                <View style={styles.editSummaryBlock}>
                  <Text style={styles.editSectionLabel}>LEAD SUMMARY / SCOPE</Text>
                  <TextInput
                    value={editSummary}
                    onChangeText={setEditSummary}
                    placeholder="Editorial lead summary..."
                    placeholderTextColor={colors.muted}
                    multiline
                    style={styles.editSummaryInput}
                  />
                </View>
              ) : selectedItem.summary ? (
                <View style={styles.summaryBox}>
                  <MarkdownRenderer content={selectedItem.summary} customColors={colors} />
                </View>
              ) : null
            )}

            {/* Article Body (True WYSIWYG Rich Text Editor — no raw markdown symbols) */}
            {!pdfData && (
              <View style={styles.editBodyBlock}>
                <View style={styles.editBodyLabelRow}>
                  <Text style={styles.editSectionLabel}>ARTICLE COPY / REPORT</Text>
                  <Text style={styles.editBodyCount}>
                    {stripRichFormatting(isEditingArticle ? editContent : selectedItem.content).length} chars •{' '}
                    {stripRichFormatting(isEditingArticle ? editContent : selectedItem.content)
                      ? stripRichFormatting(isEditingArticle ? editContent : selectedItem.content).split(/\s+/).length
                      : 0}{' '}
                    words
                  </Text>
                </View>
                <RichTextEditor
                  ref={richEditorRef}
                  value={isEditingArticle ? editContent : (selectedItem.content || '')}
                  onChangeText={(nextMd) => {
                    setIsEditingArticle((wasEditing) => {
                      if (!wasEditing) {
                        setEditSummary((prevSum) => prevSum || selectedItem.summary || '');
                      }
                      return true;
                    });
                    setEditContent(nextMd);
                  }}
                  onEditStart={() => {
                    setIsEditingArticle((wasEditing) => {
                      if (!wasEditing) {
                        setEditContent((prevContent) => prevContent || selectedItem.content || '');
                        setEditSummary((prevSum) => prevSum || selectedItem.summary || '');
                      }
                      return true;
                    });
                  }}
                  onActiveFormatsChange={setActiveFormats}
                  placeholder="Start writing your story..."
                  colors={colors}
                  minHeight={360}
                />
              </View>
            )}
          </ScrollView>
          )}
        </Animated.View>
      );
    }

    // Chat view (User-User EE Direct Message or User-Group EE Newsroom Desk)
    const isDirect = selectedItem.chatType === 'direct';

    return (
      <Animated.View style={[styles.chatPane, { opacity: contentFadeAnim }]}>
        <ChatScreenHeader
          title={selectedItem.title}
          subtitle={selectedItem.tagline || selectedItem.role || 'Group channel'}
          avatar={selectedItem.avatar || selectedItem.title?.slice(0, 2)}
          memberCount={selectedItem.subscribers || selectedItem.status}
          onOpenVoiceCall={() => {
            if (voiceChat.isConnected && activeVoiceRoom?.id === selectedItem?.id) {
              initiatedVoiceCallRef.current = false;
              voiceChat.disconnect();
              setActiveVoiceRoom(null);
              showToast({ message: 'Left voice channel.', type: 'info' });
            } else {
              if (!selectedItem?.id) return;
              initiatedVoiceCallRef.current = true;
              setActiveVoiceCallInvite(null);
              setActiveVoiceRoom({
                id: selectedItem.id,
                title: selectedItem.title || 'Newsroom Voice Channel',
              });
              voiceChat.connect(selectedItem.id);
              showToast({ message: 'Connecting to live newsroom voice...', type: 'info' });
            }
          }}
        />

        <ScrollView contentContainerStyle={styles.messageList}>
          {(chatLogs[selectedItem.id] || []).map((message, index) => {
            const isMe = message.sender === 'You';
            return (
              <View
                key={message.rawId || `${selectedItem.id}-${index}`}
                style={[styles.messageRow, isMe && styles.messageRowMe]}
              >
                <Text style={styles.messageSender}>{message.sender}</Text>
                <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
                  <MarkdownRenderer
                    content={message.text}
                    isUser={isMe}
                    customColors={colors}
                  />
                </View>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
            );
          })}
          {(chatLogs[selectedItem.id] || []).length === 0 && (
            <View style={styles.emptyChatHint}>
              <Text style={styles.emptyChatText}>
                {isDirect
                  ? 'No direct messages yet. Send a note to begin correspondence.'
                  : 'Welcome to the newsroom desk channel. Introduce your story!'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Write a newsroom message"
            onChangeText={setReplyText}
            onSubmitEditing={sendMessage}
            placeholder={`Message ${selectedItem.title}...`}
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.composerInput}
            value={replyText}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={sendMessage}
            disabled={sendingMessage || !replyText.trim()}
            style={[
              styles.sendButton,
              (!replyText.trim() || sendingMessage) && styles.sendButtonDisabled,
            ]}
          >
            {sendingMessage ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <SymbolIcon symbol="↑" color={colors.white} size={20} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // -- Left Sidebar with Animated Expand/Retract --------------------
  const leftSidebarWidth = leftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });
  const leftSidebarOpacity = leftAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.2, 1],
  });
  const leftSidebarTranslateX = leftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-35, 0],
  });

  const animatedLeftSidebar = (
    <Animated.View
      style={[
        styles.sidebarWrapper,
        {
          width: leftSidebarWidth,
          opacity: leftSidebarOpacity,
          transform: [{ translateX: leftSidebarTranslateX }],
        },
      ]}
    >
      <View style={styles.leftSidebar}>
        <SectionHeading
          title="Articles"
          count={articles.length}
          expanded={leftOpen}
          onToggle={() => setLeftOpen(false)}
          toggleLabel="Collapse articles panel"
          onAdd={() => setCreateArticleModalOpen(true)}
          addLabel="Draft new story or PDF"
          styles={styles}
        />
        <ScrollView contentContainerStyle={styles.sidebarList}>
          {renderArticleList()}
        </ScrollView>
      </View>
    </Animated.View>
  );

  // -- Right Sidebar with Animated Expand/Retract -------------------
  const rightSidebarWidth = rightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 290],
  });
  const rightSidebarOpacity = rightAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.2, 1],
  });
  const rightSidebarTranslateX = rightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [35, 0],
  });

  const animatedRightSidebar = (
    <Animated.View
      style={[
        styles.sidebarWrapper,
        {
          width: rightSidebarWidth,
          opacity: rightSidebarOpacity,
          transform: [{ translateX: rightSidebarTranslateX }],
        },
      ]}
    >
      <View style={styles.rightSidebar}>
        {/* Newsrooms Section with '+' Add Button */}
        <View style={styles.sidebarSection}>
          <SectionHeading
            title="Newsrooms"
            count={newsrooms.length}
            expanded={rightOpen}
            onToggle={() => setRightOpen(false)}
            toggleLabel="Collapse newsrooms panel"
            onAdd={() => setCreateNewsroomModalOpen(true)}
            addLabel="Create new newsroom desk"
            styles={styles}
          />
          <ScrollView contentContainerStyle={styles.sidebarList}>
            {renderChatList(
              newsrooms,
              'No newsrooms',
              'A newsroom requires at least 3 people.',
              () => setCreateNewsroomModalOpen(true),
              '+ Launch Newsroom'
            )}
          </ScrollView>
        </View>

        {/* Direct Messages Section with '+' Add Button */}
        <View style={styles.dmSection}>
          <SectionHeading
            title="Direct messages"
            count={directMessages.length}
            onAdd={() => setNewDMModalOpen(true)}
            addLabel="New direct message"
            styles={styles}
          />
          <ScrollView contentContainerStyle={styles.sidebarList}>
            {renderChatList(
              directMessages,
              'No messages',
              'Start an end-to-end correspondence.',
              () => setNewDMModalOpen(true),
              '+ Message Colleague'
            )}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );

  // -- Restore Bar with Animated Height & Opacity ------------------
  const restoreBarHeight = restoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 48],
  });
  const restoreBarOpacity = restoreAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <NewsroomHeader
        mode="app"
        onOpenAI={() => setAiModalOpen(true)}
        onOpenPhonePrompt={() => setPhoneModalOpen(true)}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.page}>
          {/* -- Global Voice Call Invite Banner (appears anywhere in the app) -- */}
          <VoiceCallInviteBanner
            invite={activeVoiceCallInvite}
            onJoin={handleJoinVoiceCall}
            onDismiss={() => setActiveVoiceCallInvite(null)}
          />

          {!wide && (
            <View style={styles.mobileTabsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileTabs}>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('articles')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Articles ({articles.length})</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('newsrooms')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Newsrooms ({newsrooms.length})</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('messages')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Direct messages ({directMessages.length})</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}

          <View style={styles.workspace}>
            {wide && animatedLeftSidebar}
            <View style={styles.centerPane}>
              {wide && (
                <Animated.View
                  style={[
                    styles.restoreBarAnimated,
                    {
                      height: restoreBarHeight,
                      opacity: restoreBarOpacity,
                    },
                  ]}
                >
                  <View style={styles.restoreBarContent}>
                    {!leftOpen && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setLeftOpen(true)}
                        style={styles.restoreButton}
                      >
                        <Text style={styles.restoreButtonText}>+ Articles</Text>
                      </Pressable>
                    )}
                    {!rightOpen && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setRightOpen(true)}
                        style={styles.restoreButton}
                      >
                        <Text style={styles.restoreButtonText}>+ Newsrooms</Text>
                      </Pressable>
                    )}
                  </View>
                </Animated.View>
              )}
              {renderCenterPane()}
            </View>
            {wide && animatedRightSidebar}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Animated Bottom Drawer Sheet for Mobile */}
      <Modal
        transparent
        animationType="none"
        visible={Boolean(drawer)}
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0,0,0,0.45)',
                opacity: drawerBackdropAnim,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close selection panel"
              onPress={closeDrawer}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                transform: [{ translateY: drawerSlideAnim }],
              },
            ]}
          >
            <View style={styles.drawerHandleBar}>
              <View style={styles.drawerHandle} />
            </View>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>
                {drawer === 'articles'
                  ? 'Articles'
                  : drawer === 'messages'
                  ? 'Direct messages'
                  : 'Newsrooms'}
              </Text>
              <Pressable accessibilityRole="button" onPress={closeDrawer} style={styles.drawerClose}>
                <Text style={styles.drawerCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerList}>
              {renderPickerContent()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Create Newsroom Modal (Minimum 3 Members) */}
      <CreateNewsroomModal
        visible={createNewsroomModalOpen}
        onClose={() => setCreateNewsroomModalOpen(false)}
        onCreated={handleNewsroomCreated}
      />

      {/* New Direct Message Modal */}
      <NewDMModal
        visible={newDMModalOpen}
        onClose={() => setNewDMModalOpen(false)}
        onCreated={handleDMCreated}
      />

      {/* Create Article / PDF Modal */}
            <BranchDiffModal
        visible={!!activeBranchDiff}
        diff={activeBranchDiff}
        currentUser={user}
        onClose={() => setActiveBranchDiff(null)}
        onSwitchBranch={(bName) => {
          const found = articleBranches.find((b) => b.branch_name === bName);
          if (found) {
            showBranchInEditor(found);
          }
        }}
        onMergeBranch={handleMergeBranch}
        onRequestPermission={handleRequestMergePermission}
      />
      <CreateArticleModal
        visible={createArticleModalOpen}
        onClose={() => setCreateArticleModalOpen(false)}
        onCreated={handleArticleCreated}
        newsrooms={newsrooms}
        defaultGroupId={
          selectedItem?.type === 'chat' && selectedItem?.chatType === 'group'
            ? selectedItem.id
            : selectedItem?.type === 'article' && selectedItem?.groupId
              ? selectedItem.groupId
              : newsrooms[0]?.id || ''
        }
      />

      {/* 1-to-1 Saiph AI Agent Modal with Memory & Autonomous Actions */}
      <SaiphAgentModal
        visible={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        articleId={selectedArticleId}
        branchId={selectedItem?.branchId}
        articleTitle={selectedItem?.title}
        activeBranch={activeBranch}
        branches={articleBranches}
        onSelectBranch={handleSelectBranch}
        onCreateBranch={handleCreateBranch}
        onWorkspaceUpdated={handleAIWorkspaceUpdated}
        onInsertToDraft={handleInsertSnippetIntoDraft}
        onJumpToSection={(sec) => {
          setArticleSection(sec);
          setAiModalOpen(false);
        }}
      />

      {/* Offline SMS Phone Number Check & Prompt Modal */}
      <PhonePromptModal
        visible={phoneModalOpen}
        onClose={() => {
          setPhoneModalOpen(false);
          setPhonePromptDismissed(true);
        }}
        onSaved={() => {
          setPhoneModalOpen(false);
          setPhonePromptDismissed(true);
        }}
      />

      {/* Delete Article Confirmation Modal */}
      <Modal
        visible={Boolean(articleToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingArticle && setArticleToDelete(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onPress={() => !deletingArticle && setArticleToDelete(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: colors.card || colors.paper || '#ffffff',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.line || '#e2e8f0',
              padding: 22,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrashIcon size={17} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#dc2626', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                  EDITORIAL ARCHIVE • PERMANENT ACTION
                </Text>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800', fontFamily: 'serif' }}>
                  Delete Story?
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.ink, fontSize: 14, lineHeight: 21 }}>
              Are you sure you want to permanently delete{' '}
              <Text style={{ fontWeight: '800' }}>"{articleToDelete?.title}"</Text> and all of its branches,
              mindmaps, and editorial board notes? This cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <Pressable
                accessibilityRole="button"
                disabled={deletingArticle}
                onPress={() => setArticleToDelete(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.line || '#cbd5e1',
                  backgroundColor: colors.paper,
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm delete story"
                disabled={deletingArticle}
                onPress={handleConfirmDeleteArticle}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: '#dc2626',
                }}
              >
                {deletingArticle ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <TrashIcon size={13} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
                      Delete Permanently
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Real-time WebRTC Newsroom Voice Overlay Bar */}
      <VoiceBar
        voiceChat={voiceChat}
        roomTitle={activeVoiceRoom?.title || selectedItem?.title || 'Newsroom Voice Channel'}
        onDisconnect={() => {
          initiatedVoiceCallRef.current = false;
          setActiveVoiceRoom(null);
          showToast({ message: 'Disconnected from voice session.', type: 'info' });
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.paper },
    keyboardView: { flex: 1 },
    page: { flex: 1, width: '100%', minHeight: 0 },
    mobileTabsBar: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    mobileTabs: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    mobileTab: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: 11,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 5,
      backgroundColor: colors.cardBg,
    },
    mobileTabText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    workspace: { flex: 1, minHeight: 0, flexDirection: 'row', backgroundColor: colors.cardBg, overflow: 'hidden' },
    sidebarWrapper: {
      overflow: 'hidden',
      height: '100%',
    },
    leftSidebar: {
      width: 260,
      height: '100%',
      padding: 12,
      borderRightWidth: 1,
      borderRightColor: colors.line,
      backgroundColor: colors.sidebarBg,
    },
    rightSidebar: {
      width: 290,
      height: '100%',
      padding: 12,
      borderLeftWidth: 1,
      borderLeftColor: colors.line,
      backgroundColor: colors.sidebarBg,
    },
    sidebarSection: { flex: 1, minHeight: 0 },
    dmSection: {
      height: 250,
      minHeight: 160,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: 8,
    },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      marginBottom: 8,
    },
    headingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headingActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    panelToggle: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      backgroundColor: colors.note,
    },
    panelToggleText: { color: colors.ink, fontSize: 17, fontWeight: '700' },
    panelAddBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      backgroundColor: colors.forest,
    },
    panelAddText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 18,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionCount: { color: colors.orange, fontFamily: 'monospace', fontSize: 10 },
    sidebarList: { gap: 7, paddingBottom: 8 },
    selectableRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      padding: 9,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 5,
      backgroundColor: colors.cardBg,
    },
    selectableRowCompact: { minHeight: 54, padding: 7 },
    selectableRowSelected: { borderColor: colors.selectedBg, backgroundColor: colors.selectedBg },
    rowSymbol: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.note,
    },
    rowSymbolSelected: { backgroundColor: 'rgba(255,255,255,0.18)' },
    rowSymbolText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
    rowSymbolTextSelected: { color: colors.selectedText },
    rowCopy: { flex: 1, minWidth: 0, gap: 4 },
    rowTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 13, fontWeight: '700' },
    rowTitleSelected: { color: colors.selectedText },
    rowMeta: { color: colors.muted, fontSize: 10 },
    rowMetaSelected: { color: 'rgba(255,255,255,0.65)' },
    unreadBadge: {
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
      backgroundColor: colors.orange,
    },
    unreadText: { color: colors.white, fontSize: 9, fontWeight: '800' },
    centerPane: { flex: 1, minWidth: 0, backgroundColor: colors.paper },
    restoreBarAnimated: {
      overflow: 'hidden',
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    restoreBarContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
    },
    restoreButton: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 4,
      backgroundColor: colors.cardBg,
    },
    restoreButtonText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    welcomePane: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    welcomeIcon: {
      fontSize: 42,
      marginBottom: 16,
      color: colors.muted,
    },
    welcomeTitle: {
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 360,
    },
    welcomeActions: {
      marginTop: 22,
      gap: 10,
      alignItems: 'center',
    },
    welcomePrimaryBtn: {
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 6,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomePrimaryBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    welcomeSecondaryBtn: {
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeSecondaryBtnText: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 12,
    },
    emptyIcon: {
      fontSize: 28,
      color: colors.muted,
      marginBottom: 8,
    },
    emptyTitle: {
      color: colors.ink,
      fontWeight: '700',
      fontSize: 13,
      marginBottom: 4,
      textAlign: 'center',
    },
    emptySubtitle: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyActionBtn: {
      marginTop: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: colors.forest,
    },
    emptyActionText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    articleScroll: { width: '100%', maxWidth: 840, alignSelf: 'center', padding: 22, paddingBottom: 40 },
    articleHeaderLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 9,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    articleCategory: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 3,
      backgroundColor: colors.ink,
    },
    articleCategoryText: { color: colors.paper, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    articleCategoryPersonal: { backgroundColor: colors.forest },
    authorAvatarPersonal: { backgroundColor: colors.forest },
    authorInitialPersonal: { color: '#FFFFFF' },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
      marginTop: 19,
      flexWrap: 'wrap',
    },
    titleEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
    },
    titleInput: {
      flex: 1,
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.forest,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
      backgroundColor: colors.inputBg,
    },
    titleSaveBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.forest,
      borderRadius: 6,
    },
    titleSaveBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    titleCancelBtn: {
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    titleCancelBtnText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: '700',
    },
    editTitleMiniBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: colors.note,
    },
    editTitleMiniText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    articleSaveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 6,
      backgroundColor: colors.forest,
    },
    articleSaveBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    articleCancelEditBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 6,
      backgroundColor: colors.note,
    },
    articleCancelEditBtnText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '600',
    },
    editSummaryBlock: {
      marginTop: 18,
      gap: 6,
    },
    editSectionLabel: {
      color: colors.orange,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },
    editSummaryInput: {
      minHeight: 64,
      padding: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontStyle: 'italic',
      fontSize: 14,
      lineHeight: 20,
    },
    editBodyBlock: {
      marginTop: 20,
      gap: 6,
    },
    editBodyLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    editBodyCount: {
      fontSize: 10,
      color: colors.muted,
      fontFamily: 'monospace',
    },
    editBodyInput: {
      minHeight: 280,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 15,
      lineHeight: 25,
      fontFamily: 'serif',
    },
    articleMeta: { color: colors.muted, fontSize: 10 },
    articleTitle: {
      marginTop: 19,
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 36,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 18,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    authorAvatar: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: colors.note,
    },
    authorInitial: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    authorName: { color: colors.ink, fontSize: 12, fontWeight: '700' },
    authorRole: { marginTop: 3, color: colors.muted, fontSize: 10 },
    summaryBox: {
      marginTop: 18,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.orange,
      backgroundColor: colors.note,
    },
    summaryText: {
      color: colors.muted,
      fontFamily: 'serif',
      fontSize: 14,
      fontStyle: 'italic',
      lineHeight: 21,
    },
    articleBody: { marginTop: 20, color: colors.ink, fontFamily: 'serif', fontSize: 15, lineHeight: 25 },
    articleActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    articleActionBtnText: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '700',
    },
    pdfArticleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      marginTop: 18,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.note,
    },
    pdfBannerBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 4,
      backgroundColor: colors.orange,
    },
    pdfBannerBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },
    pdfBannerTitle: {
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 15,
      fontWeight: '700',
    },
    pdfBannerMeta: {
      color: colors.muted,
      fontSize: 11,
    },
    pdfViewButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: colors.forest,
    },
    pdfViewButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    chatPane: { flex: 1, minHeight: 0, backgroundColor: colors.cardBg },
    chatHeader: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    chatAvatar: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: colors.ink,
    },
    chatAvatarDirect: {
      backgroundColor: colors.forest,
    },
    chatAvatarText: { color: colors.paper, fontSize: 13, fontWeight: '800' },
    chatHeadingCopy: { flex: 1, minWidth: 0 },
    chatTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    chatSubtitle: { marginTop: 3, color: colors.muted, fontSize: 11 },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.note,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    badgeDotDirect: { backgroundColor: colors.forest },
    badgeDotGroup: { backgroundColor: colors.blue },
    memberCount: { color: colors.ink, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
    messageList: { flexGrow: 1, gap: 12, padding: 14 },
    messageRow: { maxWidth: '84%', alignSelf: 'flex-start', gap: 4 },
    messageRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    messageSender: { paddingHorizontal: 3, color: colors.muted, fontSize: 9 },
    messageBubble: {
      padding: 10,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 7,
      backgroundColor: colors.sidebarBg,
    },
    messageBubbleMe: { borderColor: colors.ink, backgroundColor: colors.ink },
    messageText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
    messageTextMe: { color: colors.paper },
    messageTime: { color: colors.muted, fontSize: 9 },
    emptyChatHint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
    emptyChatText: { color: colors.muted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    composerInput: {
      flex: 1,
      minHeight: 42,
      maxHeight: 96,
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 5,
      color: colors.ink,
      fontSize: 13,
      backgroundColor: colors.inputBg,
    },
    sendButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5,
      backgroundColor: colors.forest,
    },
    sendButtonDisabled: {
      backgroundColor: colors.line,
    },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
    drawerPanel: {
      maxHeight: '80%',
      paddingHorizontal: 16,
      paddingBottom: 24,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      backgroundColor: colors.sidebarBg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    drawerHandleBar: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: 10,
    },
    drawerHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.line,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      marginBottom: 8,
    },
    drawerTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
    drawerClose: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 },
    drawerCloseText: { color: colors.orange, fontSize: 12, fontWeight: '700' },
    drawerList: { paddingBottom: 16 },
  });
}
