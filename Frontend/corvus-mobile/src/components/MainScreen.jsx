import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsroomHeader from './NewsroomHeader';
import { colors } from '../theme/colors';

const articles = [
  {
    id: 'art-1',
    type: 'article',
    title: 'Weed Outbreak Spreads Across Agricultural Sectors',
    category: 'Agriculture',
    timestamp: '10 mins ago',
    author: 'Elena Rostova',
    readTime: '4 min read',
    symbol: '◎',
    summary: 'A fast-propagating botanical species is impacting regional crop yields, prompting immediate research and specialized containment strategies across rural districts.',
    content: `Agricultural researchers and regional farming councils have issued a joint bulletin regarding a rapid outbreak of an unseasonably aggressive weed strain.\n\nFirst detected near the eastern river basins, the invasive flora exhibits unprecedented resilience to standard organic control methods. Local environmental teams are collaborating with botanical specialists to implement eco-friendly containment zones.\n\nKey highlights:\n• 35% higher propagation rate than seasonal averages.\n• Local agricultural units deploying targeted biological mitigation.\n• Public advisory issued for home gardeners and commercial nurseries alike.`,
  },
  {
    id: 'art-2',
    type: 'article',
    title: 'Rise in Fuel Prices Triggers Global Logistics Shift',
    category: 'Economy',
    timestamp: '1 hour ago',
    author: 'Marcus Vance',
    readTime: '6 min read',
    symbol: '↗',
    summary: 'Surging crude rates spark supply chain adaptations, accelerating adoption of alternative transport fuels and electric freight fleets.',
    content: `Energy markets experienced significant volatility early Tuesday morning as global Brent crude prices reached new quarterly highs. The escalation has immediately impacted logistics providers and consumer supply lines.\n\nIn response, major freight carriers are accelerating transitions to hybrid-electric long-haul vehicles and optimizing routing algorithms to reduce fuel consumption.\n\nIndustry takeaways:\n• Diesel and gasoline retail rates up 8.4% week-over-week.\n• Supply chain operators adopting AI-driven fleet routing.\n• Renewable transport investments receive record venture backing this quarter.`,
  },
  {
    id: 'art-3',
    type: 'article',
    title: 'Autonomous Transit Pilot Expands to Downtown Grid',
    category: 'Transport',
    timestamp: '3 hours ago',
    author: 'Sarah Lin',
    readTime: '3 min read',
    symbol: '▤',
    summary: 'Municipal authorities clear self-driving shuttle fleets for unrestricted daylight operations in the urban core.',
    content: `The Department of Transportation announced the second phase of its smart city initiative, opening all major downtown arteries to level-four autonomous shuttle buses.\n\nEarly passenger sentiment indices show a high confidence score, with no safety incidents logged during the six-month preliminary test loop.`,
  },
];

const newsrooms = [
  {
    id: 'nr-life',
    type: 'chat',
    title: 'Life Newsroom',
    tagline: 'Modern Living, Wellness & Urban Architecture',
    subscribers: '14.2k members',
    symbol: '♡',
    avatar: 'LF',
    chatHistory: [
      { sender: 'Clara Oswald', text: 'Minimalist Architecture in Small Spaces design notes are ready.', time: '2h ago' },
      { sender: 'Dr. Aris Thorne', text: 'Just uploaded the research for the 20-minute daily reset routine.', time: '1h ago' },
    ],
  },
  {
    id: 'nr-culture',
    type: 'chat',
    title: 'Culture Newsroom',
    tagline: 'Arts, Cinema, Philosophy & Contemporary Design',
    subscribers: '28.9k members',
    symbol: '✦',
    avatar: 'CL',
    chatHistory: [
      { sender: 'Julian Sterling', text: 'Vinyl production numbers hit a 30-year high!', time: '30m ago' },
      { sender: 'Sora Takahashi', text: 'Drafting the post on Neo-Brutalist UI designs.', time: '15m ago' },
    ],
  },
  {
    id: 'nr-breaking',
    type: 'chat',
    title: 'Breaking Newsroom',
    tagline: 'Urgent Wire Updates & Live Event Coverage',
    subscribers: '98.5k members',
    symbol: '!',
    avatar: 'BR',
    chatHistory: [
      { sender: 'Corvus Wire', text: 'ISS thrusters fired for 180 seconds to clear orbital debris.', time: 'Just now' },
    ],
  },
  {
    id: 'nr-gossip',
    type: 'chat',
    title: 'Gossip Newsroom',
    tagline: 'Unfiltered Discussions, Rumors & Tech Whispers',
    subscribers: '41.1k members',
    symbol: '◇',
    avatar: 'GS',
    chatHistory: [
      { sender: 'Insider X', text: 'Three lead scientists just left for an unannounced stealth AI project.', time: '1h ago' },
    ],
  },
];

const directMessages = [
  {
    id: 'dm-1',
    type: 'chat',
    title: 'Sarah Jenkins',
    role: 'Senior Editor',
    avatar: 'SJ',
    status: 'online',
    time: '12:42 PM',
    lastMessage: 'Did you review the draft for the fuel price story?',
    unread: 2,
    chatHistory: [
      { sender: 'Sarah Jenkins', text: 'Hey, welcome to the Corvus news desk!', time: '10:15 AM' },
      { sender: 'You', text: 'Thanks Sarah! Setting up my dashboard feeds right now.', time: '10:18 AM' },
      { sender: 'Sarah Jenkins', text: 'Did you review the draft for the fuel price story?', time: '12:42 PM' },
    ],
  },
  {
    id: 'dm-2',
    type: 'chat',
    title: 'Alex Rivera',
    role: 'Lead Visual Designer',
    avatar: 'AR',
    status: 'offline',
    time: '11:15 AM',
    lastMessage: 'The monochrome sketch wireframe layout looks slick!',
    unread: 0,
    chatHistory: [
      { sender: 'Alex Rivera', text: 'The monochrome sketch wireframe layout looks slick!', time: '11:15 AM' },
      { sender: 'You', text: 'Appreciate it Alex! Kept the exact structure from the original sketch.', time: '11:20 AM' },
    ],
  },
  {
    id: 'dm-3',
    type: 'chat',
    title: 'Devon Miles',
    role: 'Data Analyst',
    avatar: 'DM',
    status: 'online',
    time: 'Yesterday',
    lastMessage: 'Sent you the traffic metrics for the Newsrooms section.',
    unread: 0,
    chatHistory: [
      { sender: 'Devon Miles', text: 'Sent you the traffic metrics for the Newsrooms section.', time: 'Yesterday' },
    ],
  },
];

function SymbolIcon({ symbol, color = colors.ink, size = 18 }) {
  return <Text accessibilityElementsHidden style={[styles.symbol, { color, fontSize: size }]}>{symbol}</Text>;
}

function SectionHeading({ title, count, onToggle, toggleLabel, expanded = true }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>}
      {onToggle && (
        <Pressable accessibilityRole="button" accessibilityLabel={toggleLabel} onPress={onToggle} style={styles.panelToggle}>
          <Text style={styles.panelToggleText}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function SelectableRow({ item, selected, onPress, compact = false }) {
  const latestMessage = item.type === 'chat' ? item.lastMessage : item.timestamp;
  const symbol = item.symbol || item.avatar?.slice(0, 1) || '•';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.selectableRow, selected && styles.selectableRowSelected, compact && styles.selectableRowCompact]}
    >
      <View style={[styles.rowSymbol, selected && styles.rowSymbolSelected]}>
        <Text style={[styles.rowSymbolText, selected && styles.rowSymbolTextSelected]}>{symbol}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={compact ? 1 : 2} style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, selected && styles.rowMetaSelected]}>
          {latestMessage}
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

export default function MainScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1080;
  const [selectedItem, setSelectedItem] = useState(articles[0]);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [chatLogs, setChatLogs] = useState(() => Object.fromEntries(
    [...newsrooms, ...directMessages].map((item) => [item.id, item.chatHistory])
  ));
  function selectItem(item) {
    setSelectedItem(item);
    setDrawer(null);
    setReplyText('');
  }

  function sendMessage() {
    const text = replyText.trim();
    if (!text || selectedItem.type !== 'chat') return;
    setChatLogs((current) => ({
      ...current,
      [selectedItem.id]: [...(current[selectedItem.id] || []), { sender: 'You', text, time: 'Just now' }],
    }));
    setReplyText('');
  }

  function renderArticleList() {
    return articles.map((item) => (
      <SelectableRow
        key={item.id}
        item={item}
        selected={selectedItem.id === item.id}
        onPress={() => selectItem(item)}
      />
    ));
  }

  function renderChatList(items) {
    return items.map((item) => (
      <SelectableRow
        compact
        key={item.id}
        item={item}
        selected={selectedItem.id === item.id}
        onPress={() => selectItem(item)}
      />
    ));
  }

  function renderPickerContent() {
    if (drawer === 'articles') {
      return (
        <>
          <SectionHeading title="Articles" count={articles.length} />
          {renderArticleList()}
        </>
      );
    }

    return (
      <>
        <SectionHeading title={drawer === 'messages' ? 'Direct messages' : 'Newsrooms'} />
        {renderChatList(drawer === 'messages' ? directMessages : newsrooms)}
      </>
    );
  }

  const leftSidebar = (
    <View style={styles.leftSidebar}>
      <SectionHeading
        title="Articles"
        count={articles.length}
        expanded={leftOpen}
        onToggle={() => setLeftOpen(false)}
        toggleLabel="Collapse articles panel"
      />
      <ScrollView contentContainerStyle={styles.sidebarList}>
        {renderArticleList()}
      </ScrollView>
    </View>
  );

  const rightSidebar = (
    <View style={styles.rightSidebar}>
      <View style={styles.sidebarSection}>
        <SectionHeading
          title="Newsrooms"
          expanded={rightOpen}
          onToggle={() => setRightOpen(false)}
          toggleLabel="Collapse newsrooms panel"
        />
        <ScrollView contentContainerStyle={styles.sidebarList}>
          {renderChatList(newsrooms)}
        </ScrollView>
      </View>
      <View style={styles.dmSection}>
        <Pressable accessibilityRole="button" onPress={() => setDrawer('messages')} style={styles.dmHeading}>
          <SectionHeading title="Direct messages" count={directMessages.length} />
          <Text style={styles.mobileLink}>View</Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.sidebarList}>
          {renderChatList(directMessages)}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <NewsroomHeader mode="app" />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            {wide && leftOpen && leftSidebar}
            <View style={styles.centerPane}>
              {wide && (!leftOpen || !rightOpen) && (
                <View style={styles.restoreBar}>
                  {!leftOpen && (
                    <Pressable accessibilityRole="button" onPress={() => setLeftOpen(true)} style={styles.restoreButton}>
                      <Text style={styles.restoreButtonText}>+ Articles</Text>
                    </Pressable>
                  )}
                  {!rightOpen && (
                    <Pressable accessibilityRole="button" onPress={() => setRightOpen(true)} style={styles.restoreButton}>
                      <Text style={styles.restoreButtonText}>+ Newsrooms</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {selectedItem.type === 'article' ? (
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
                      <Text style={styles.authorInitial}>{selectedItem.author.charAt(0)}</Text>
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
              ) : (
                <View style={styles.chatPane}>
                  <View style={styles.chatHeader}>
                    <View style={styles.chatAvatar}>
                      <Text style={styles.chatAvatarText}>{selectedItem.avatar || selectedItem.title.slice(0, 2)}</Text>
                    </View>
                    <View style={styles.chatHeadingCopy}>
                      <Text style={styles.chatTitle}>{selectedItem.title}</Text>
                      <Text style={styles.chatSubtitle}>{selectedItem.tagline || selectedItem.role || 'Group channel'}</Text>
                    </View>
                    <Text style={styles.memberCount}>{selectedItem.subscribers || selectedItem.status}</Text>
                  </View>
                  <ScrollView contentContainerStyle={styles.messageList}>
                    {(chatLogs[selectedItem.id] || []).map((message, index) => {
                      const isMe = message.sender === 'You';
                      return (
                        <View key={`${selectedItem.id}-${index}`} style={[styles.messageRow, isMe && styles.messageRowMe]}>
                          <Text style={styles.messageSender}>{message.sender}</Text>
                          <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
                            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{message.text}</Text>
                          </View>
                          <Text style={styles.messageTime}>{message.time}</Text>
                        </View>
                      );
                    })}
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
                    <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={sendMessage} style={styles.sendButton}>
                      <SymbolIcon symbol="↑" color={colors.white} size={20} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
            {wide && rightOpen && rightSidebar}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal transparent animationType="slide" visible={Boolean(drawer)} onRequestClose={() => setDrawer(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close selection panel" onPress={() => setDrawer(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{drawer === 'articles' ? 'Articles' : drawer === 'messages' ? 'Direct messages' : 'Newsrooms'}</Text>
              <Pressable accessibilityRole="button" onPress={() => setDrawer(null)} style={styles.drawerClose}>
                <Text style={styles.drawerCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerList}>{renderPickerContent()}</ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F3EF' },
  keyboardView: { flex: 1 },
  page: { flex: 1, width: '100%', minHeight: 0 },
  mobileTabsBar: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#D5D5D0', backgroundColor: '#F8F8F5' },
  mobileTabs: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  mobileTab: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 5, backgroundColor: '#FFFFFF' },
  mobileTabText: { color: '#333333', fontSize: 11, fontWeight: '700' },
  workspace: { flex: 1, minHeight: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  leftSidebar: { width: 260, padding: 12, borderRightWidth: 1, borderRightColor: '#D5D5D0', backgroundColor: '#F8F8F5' },
  rightSidebar: { width: 286, padding: 12, borderLeftWidth: 1, borderLeftColor: '#D5D5D0', backgroundColor: '#F8F8F5' },
  sidebarSection: { flex: 1, minHeight: 0 },
  dmSection: { height: 230, minHeight: 140, borderTopWidth: 1, borderTopColor: '#D5D5D0', paddingTop: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D5D5D0', marginBottom: 8 },
  panelToggle: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#ECECE7' },
  panelToggleText: { color: '#333333', fontSize: 17, fontWeight: '700' },
  sectionTitle: { color: '#222222', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCount: { color: '#A43D2B', fontFamily: 'monospace', fontSize: 10 },
  sidebarList: { gap: 7, paddingBottom: 8 },
  selectableRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 5, backgroundColor: '#FFFFFF' },
  selectableRowCompact: { minHeight: 54, padding: 7 },
  selectableRowSelected: { borderColor: '#222222', backgroundColor: '#222222' },
  rowSymbol: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#EFEFEB' },
  rowSymbolSelected: { backgroundColor: '#FFFFFF' },
  rowSymbolText: { color: '#333333', fontSize: 15, fontWeight: '700' },
  rowSymbolTextSelected: { color: '#222222' },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { color: '#222222', fontFamily: 'serif', fontSize: 13, fontWeight: '700' },
  rowTitleSelected: { color: '#FFFFFF' },
  rowMeta: { color: '#777777', fontSize: 10 },
  rowMetaSelected: { color: '#D8D8D3' },
  unreadBadge: { minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#A43D2B' },
  unreadText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  centerPane: { flex: 1, minWidth: 0, backgroundColor: '#F7F7F4' },
  restoreBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D5D5D0', backgroundColor: '#F8F8F5' },
  restoreButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 4, backgroundColor: '#FFFFFF' },
  restoreButtonText: { color: '#444444', fontSize: 10, fontWeight: '700' },
  articleScroll: { width: '100%', maxWidth: 840, alignSelf: 'center', padding: 22, paddingBottom: 40 },
  articleHeaderLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E1E1DD' },
  articleCategory: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 3, backgroundColor: '#222222' },
  articleCategoryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  articleMeta: { color: '#777777', fontSize: 10 },
  articleTitle: { marginTop: 19, color: '#171717', fontFamily: 'serif', fontSize: 30, fontWeight: '700', lineHeight: 36 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E1E1DD' },
  authorAvatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#E8E8E2' },
  authorInitial: { color: '#333333', fontSize: 14, fontWeight: '700' },
  authorName: { color: '#222222', fontSize: 12, fontWeight: '700' },
  authorRole: { marginTop: 3, color: '#777777', fontSize: 10 },
  summaryBox: { marginTop: 18, padding: 14, borderLeftWidth: 3, borderLeftColor: '#A43D2B', backgroundColor: '#ECECE7' },
  summaryText: { color: '#454545', fontFamily: 'serif', fontSize: 14, fontStyle: 'italic', lineHeight: 21 },
  articleBody: { marginTop: 20, color: '#333333', fontFamily: 'serif', fontSize: 15, lineHeight: 25 },
  chatPane: { flex: 1, minHeight: 0, backgroundColor: '#FFFFFF' },
  chatHeader: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#D5D5D0', backgroundColor: '#F8F8F5' },
  chatAvatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#222222' },
  chatAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  chatHeadingCopy: { flex: 1, minWidth: 0 },
  chatTitle: { color: '#222222', fontSize: 14, fontWeight: '700' },
  chatSubtitle: { marginTop: 4, color: '#777777', fontSize: 10 },
  memberCount: { maxWidth: 85, color: '#777777', fontFamily: 'monospace', fontSize: 9, textAlign: 'right' },
  messageList: { flexGrow: 1, gap: 12, padding: 14 },
  messageRow: { maxWidth: '84%', alignSelf: 'flex-start', gap: 4 },
  messageRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageSender: { paddingHorizontal: 3, color: '#777777', fontSize: 9 },
  messageBubble: { padding: 10, borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 7, backgroundColor: '#F8F8F5' },
  messageBubbleMe: { borderColor: '#222222', backgroundColor: '#222222' },
  messageText: { color: '#222222', fontSize: 12, lineHeight: 18 },
  messageTextMe: { color: '#FFFFFF' },
  messageTime: { color: '#999999', fontSize: 9 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#D5D5D0', backgroundColor: '#FFFFFF' },
  composerInput: { flex: 1, minHeight: 42, maxHeight: 96, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 5, color: '#222222', fontSize: 12 },
  sendButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#222222' },
  mobileLink: { color: '#A43D2B', fontSize: 10, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  drawerPanel: { maxHeight: '78%', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#F8F8F5' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#D5D5D0', marginBottom: 8 },
  drawerTitle: { color: '#222222', fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  drawerClose: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 },
  drawerCloseText: { color: '#A43D2B', fontSize: 12, fontWeight: '700' },
});
