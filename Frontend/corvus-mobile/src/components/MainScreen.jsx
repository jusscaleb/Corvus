import { useState, useRef, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
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
import { useTheme } from '../context/ThemeContext';
import { VoiceChatProvider, ChatScreenHeader } from './VoiceChat';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SymbolIcon({ symbol, color, size = 18 }) {
  return (
    <Text accessibilityElementsHidden style={{ color, fontSize: size, fontWeight: '700' }}>
      {symbol}
    </Text>
  );
}

function SectionHeading({ title, count, onToggle, toggleLabel, expanded = true, styles }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>
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
  );
}

function SelectableRow({ item, selected, onPress, compact = false, styles }) {
  const latestMessage = item.type === 'chat' ? item.lastMessage : item.timestamp;
  const symbol = item.symbol || item.avatar?.slice(0, 1) || '•';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.selectableRow,
        selected && styles.selectableRowSelected,
        compact && styles.selectableRowCompact,
      ]}
    >
      <View style={[styles.rowSymbol, selected && styles.rowSymbolSelected]}>
        <Text style={[styles.rowSymbolText, selected && styles.rowSymbolTextSelected]}>{symbol}</Text>
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
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle, styles }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MainScreen() {
  return (
    <VoiceChatProvider>
      <MainScreenContent />
    </VoiceChatProvider>
  );
}

function MainScreenContent() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const wide = width >= 1080;

  const [selectedItem, setSelectedItem] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [chatLogs, setChatLogs] = useState({});

  // ── Animated values for expanding & retracting panels ───────────
  const leftAnim = useRef(new Animated.Value(1)).current;
  const rightAnim = useRef(new Animated.Value(1)).current;
  const restoreAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const drawerSlideAnim = useRef(new Animated.Value(300)).current;
  const drawerBackdropAnim = useRef(new Animated.Value(0)).current;

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

  // Subtle content crossfade when switching active item
  useEffect(() => {
    contentFadeAnim.setValue(0.7);
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [selectedItem]);

  // Drawer modal entry / exit animations
  useEffect(() => {
    if (drawer) {
      drawerSlideAnim.setValue(300);
      drawerBackdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(drawerBackdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(drawerSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [drawer]);

  function closeDrawer() {
    Animated.parallel([
      Animated.timing(drawerBackdropAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(drawerSlideAnim, {
        toValue: 300,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setDrawer(null));
  }

  // Live data (empty by default; populated via API)
  const articles = [];
  const newsrooms = [];
  const directMessages = [];

  function selectItem(item) {
    setSelectedItem(item);
    if (drawer) closeDrawer();
    setReplyText('');
  }

  function sendMessage() {
    const text = replyText.trim();
    if (!text || !selectedItem || selectedItem.type !== 'chat') return;
    setChatLogs((current) => ({
      ...current,
      [selectedItem.id]: [
        ...(current[selectedItem.id] || []),
        { sender: 'You', text, time: 'Just now' },
      ],
    }));
    setReplyText('');
  }

  function renderArticleList() {
    if (articles.length === 0) {
      return (
        <EmptyState
          icon="◎"
          title="No articles yet"
          subtitle="Your newsroom stories will appear here."
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
        styles={styles}
      />
    ));
  }

  function renderChatList(items, emptyTitle, emptySubtitle) {
    if (items.length === 0) {
      return (
        <EmptyState
          icon="◇"
          title={emptyTitle}
          subtitle={emptySubtitle}
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
          <SectionHeading title="Articles" count={articles.length} styles={styles} />
          {renderArticleList()}
        </>
      );
    }
    if (drawer === 'messages') {
      return (
        <>
          <SectionHeading title="Direct messages" styles={styles} />
          {renderChatList(directMessages, 'No messages', 'Start a conversation with a colleague.')}
        </>
      );
    }
    return (
      <>
        <SectionHeading title="Newsrooms" styles={styles} />
        {renderChatList(newsrooms, 'No newsrooms', 'Join a newsroom to collaborate with your team.')}
      </>
    );
  }

  function renderCenterPane() {
    if (!selectedItem) {
      return (
        <Animated.View style={[styles.welcomePane, { opacity: contentFadeAnim }]}>
          <Text style={styles.welcomeIcon}>◎</Text>
          <Text style={styles.welcomeTitle}>The Newsroom</Text>
          <Text style={styles.welcomeSubtitle}>
            Select an article, newsroom, or direct message from the panels to get started.
          </Text>
        </Animated.View>
      );
    }

    if (selectedItem.type === 'article') {
      return (
        <Animated.View style={[{ flex: 1 }, { opacity: contentFadeAnim }]}>
          <ScrollView contentContainerStyle={styles.articleScroll}>
            <View style={styles.articleHeaderLine}>
              <View style={styles.articleCategory}>
                <Text style={styles.articleCategoryText}>{selectedItem.category}</Text>
              </View>
              <Text style={styles.articleMeta}>{selectedItem.timestamp}</Text>
              <Text style={styles.articleMeta}>{selectedItem.readTime}</Text>
            </View>
            <Text style={styles.articleTitle}>{selectedItem.title}</Text>
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitial}>{selectedItem.author?.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{selectedItem.author}</Text>
                <Text style={styles.authorRole}>Corvus Senior Correspondent</Text>
              </View>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{selectedItem.summary}</Text>
            </View>
            <Text style={styles.articleBody}>{selectedItem.content}</Text>
          </ScrollView>
        </Animated.View>
      );
    }

    // Chat view
    return (
      <Animated.View style={[styles.chatPane, { opacity: contentFadeAnim }]}>
        <ChatScreenHeader
          title={selectedItem.title}
          subtitle={selectedItem.tagline || selectedItem.role || 'Group channel'}
          avatar={selectedItem.avatar || selectedItem.title?.slice(0, 2)}
          memberCount={selectedItem.subscribers || selectedItem.status}
        />
        <ScrollView contentContainerStyle={styles.messageList}>
          {(chatLogs[selectedItem.id] || []).map((message, index) => {
            const isMe = message.sender === 'You';
            return (
              <View
                key={selectedItem.id + '-' + index}
                style={[styles.messageRow, isMe && styles.messageRowMe]}
              >
                <Text style={styles.messageSender}>{message.sender}</Text>
                <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
                  <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                    {message.text}
                  </Text>
                </View>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
            );
          })}
          {(chatLogs[selectedItem.id] || []).length === 0 && (
            <View style={styles.emptyChatHint}>
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Write a newsroom message"
            onChangeText={setReplyText}
            onSubmitEditing={sendMessage}
            placeholder={'Message ' + selectedItem.title + '...'}
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.composerInput}
            value={replyText}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={sendMessage}
            style={styles.sendButton}
          >
            <SymbolIcon symbol="↑" color={colors.white} size={20} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ── Left Sidebar with Animated Expand/Retract Width & Opacity ───
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
          styles={styles}
        />
        <ScrollView contentContainerStyle={styles.sidebarList}>
          {renderArticleList()}
        </ScrollView>
      </View>
    </Animated.View>
  );

  // ── Right Sidebar with Animated Expand/Retract Width & Opacity ───
  const rightSidebarWidth = rightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 286],
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
        <View style={styles.sidebarSection}>
          <SectionHeading
            title="Newsrooms"
            expanded={rightOpen}
            onToggle={() => setRightOpen(false)}
            toggleLabel="Collapse newsrooms panel"
            styles={styles}
          />
          <ScrollView contentContainerStyle={styles.sidebarList}>
            {renderChatList(newsrooms, 'No newsrooms', 'Join a newsroom to collaborate.')}
          </ScrollView>
        </View>
        <View style={styles.dmSection}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDrawer('messages')}
            style={styles.dmHeading}
          >
            <SectionHeading
              title="Direct messages"
              count={directMessages.length}
              styles={styles}
            />
            <Text style={styles.mobileLink}>View</Text>
          </Pressable>
          <ScrollView contentContainerStyle={styles.sidebarList}>
            {renderChatList(directMessages, 'No messages', 'Start a conversation.')}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );

  // ── Restore Bar with Animated Height & Opacity ──────────────────
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
      <NewsroomHeader mode="app" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.page}>
          {!wide && (
            <View style={styles.mobileTabsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileTabs}>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('articles')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Articles</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('newsrooms')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Newsrooms</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setDrawer('messages')} style={styles.mobileTab}>
                  <Text style={styles.mobileTabText}>Direct messages</Text>
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
      width: 286,
      height: '100%',
      padding: 12,
      borderLeftWidth: 1,
      borderLeftColor: colors.line,
      backgroundColor: colors.sidebarBg,
    },
    sidebarSection: { flex: 1, minHeight: 0 },
    dmSection: {
      height: 230,
      minHeight: 140,
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
    panelToggle: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      backgroundColor: colors.note,
    },
    panelToggleText: { color: colors.ink, fontSize: 17, fontWeight: '700' },
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
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: colors.note,
    },
    rowSymbolSelected: { backgroundColor: 'rgba(255,255,255,0.18)' },
    rowSymbolText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
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
      maxWidth: 320,
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
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: colors.ink,
    },
    chatAvatarText: { color: colors.paper, fontSize: 11, fontWeight: '800' },
    chatHeadingCopy: { flex: 1, minWidth: 0 },
    chatTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    chatSubtitle: { marginTop: 4, color: colors.muted, fontSize: 10 },
    memberCount: { maxWidth: 85, color: colors.muted, fontFamily: 'monospace', fontSize: 9, textAlign: 'right' },
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
    messageText: { color: colors.ink, fontSize: 12, lineHeight: 18 },
    messageTextMe: { color: colors.paper },
    messageTime: { color: colors.muted, fontSize: 9 },
    emptyChatHint: { flex: 1, alignItems: 'center', paddingTop: 40 },
    emptyChatText: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
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
      fontSize: 12,
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
    mobileLink: { color: colors.orange, fontSize: 10, fontWeight: '700' },
    dmHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
