import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Line, Circle, Polyline, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { lightColors } from '../theme/colors';

// --- Crisp SVG Icons ----------------------------------------------------------

function GitBranchIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="6" y1="3" x2="6" y2="15" />
      <Circle cx="18" cy="6" r="3" />
      <Circle cx="6" cy="18" r="3" />
      <Path d="M18 9a9 9 0 0 1-9 9" />
    </Svg>
  );
}

function GlobeIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="2" y1="12" x2="22" y2="12" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

function TerminalIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="4 17 10 11 4 5" />
      <Line x1="12" y1="19" x2="20" y2="19" />
    </Svg>
  );
}

function SparklesIcon({ size = 13, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </Svg>
  );
}

function GitPullIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="8 17 12 21 16 17" />
      <Line x1="12" y1="12" x2="12" y2="21" />
      <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </Svg>
  );
}

function ActivityIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Svg>
  );
}

function GitCommitIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="4" />
      <Line x1="1.05" y1="12" x2="7" y2="12" />
      <Line x1="17.01" y1="12" x2="22.96" y2="12" />
    </Svg>
  );
}

function GitPushIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 7 12 3 8 7" />
      <Line x1="12" y1="3" x2="12" y2="15" />
      <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </Svg>
  );
}

function GitDiffIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="6" cy="6" r="3" />
      <Line x1="6" y1="9" x2="6" y2="15" />
      <Circle cx="18" cy="12" r="3" />
      <Path d="M18 9a9 9 0 0 0-9-9" />
    </Svg>
  );
}

function BoldIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <Path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </Svg>
  );
}

function ItalicIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="4" x2="10" y2="4" />
      <Line x1="14" y1="20" x2="5" y2="20" />
      <Line x1="15" y1="4" x2="9" y2="20" />
    </Svg>
  );
}

function UnderlineIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <Line x1="4" y1="21" x2="20" y2="21" />
    </Svg>
  );
}

function Heading1Icon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h8" />
      <Path d="M4 18V6" />
      <Path d="M12 18V6" />
      <Path d="m17 12 3-2v8" />
    </Svg>
  );
}

function Heading2Icon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h8" />
      <Path d="M4 18V6" />
      <Path d="M12 18V6" />
      <Path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </Svg>
  );
}

function ListIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="8" y1="6" x2="21" y2="6" />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Circle cx="4" cy="6" r="1.5" fill={color} />
      <Circle cx="4" cy="12" r="1.5" fill={color} />
      <Circle cx="4" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

function QuoteIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <Path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    </Svg>
  );
}

function CodeIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 18 22 12 16 6" />
      <Polyline points="8 6 2 12 8 18" />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function LockMiniIcon({ size = 11, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="11" width="16" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

function PlusIcon({ size = 13, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

// Branch names can't contain spaces â€“ turn "water angle" into "water-angle"
const slugifyBranch = (value) => value.trim().replace(/\s+/g, '-');

// --- Main Component -----------------------------------------------------------

export default function ArticleHeader({
  activeBranch = 'main',
  branches = ['main'],
  isPublished = false,
  onSelectBranch = () => {},
  onCreateBranch = null,
  onExecuteCommand = () => {},
  onApplyFormat = () => {},
  activeFormats = {},
  activeSection = 'article', // 'article' | 'mindmap' | 'board' | 'review'
  onSelectSection = null,
  onOpenAIAgent = null,
  boardCount = 0,
  reviewScore = null,
}) {
  const [activeModal, setActiveModal] = useState(null); // 'branch' | 'commands' | null
  const [anchorRect, setAnchorRect] = useState(null);

  // Inline "New branch" form state
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchError, setNewBranchError] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);

  const branchItems = branches.map((b) =>
    typeof b === 'string' ? { name: b, isMain: b === 'main', isPublic: true } : b
  );
  const activeItem = branchItems.find((b) => b.name === activeBranch);
  const activeIsPrivate = !!activeItem && !activeItem.isMain && !activeItem.isPublic;
  const branchSlug = slugifyBranch(newBranchName);
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 680;

  const branchBtnRef = useRef(null);
  const commandsBtnRef = useRef(null);

  let themeColors = lightColors;
  try {
    const theme = useTheme();
    if (theme?.colors) themeColors = theme.colors;
  } catch (_) {
    themeColors = lightColors;
  }

  const versionCommands = [
    {
      id: isPublished ? 'unpublish' : 'publish',
      label: isPublished ? 'Unpublish from Public Portal' : 'Publish to Public Portal',
      Icon: GlobeIcon,
    },
    { id: 'pull', label: 'Pull latest changes', Icon: GitPullIcon },
    { id: 'status', label: 'Check status', Icon: ActivityIcon },
    { id: 'commit', label: 'Save local changes', Icon: GitCommitIcon },
    { id: 'push', label: 'Push changes', Icon: GitPushIcon },
    { id: 'diff', label: 'View differences', Icon: GitDiffIcon },
  ];

  // Exposed directly on the toolbar ribbon (not hidden inside a dropdown)
  const wordTools = [
    { label: 'Bold', action: 'bold', Icon: BoldIcon },
    { label: 'Italic', action: 'italic', Icon: ItalicIcon },
    { label: 'Underline', action: 'underline', Icon: UnderlineIcon },
    { label: 'H1', action: 'h1', Icon: Heading1Icon },
    { label: 'H2', action: 'h2', Icon: Heading2Icon },
    { label: 'Bullets', action: 'bullet', Icon: ListIcon },
    { label: 'Quote', action: 'quote', Icon: QuoteIcon },
    { label: 'Code', action: 'code', Icon: CodeIcon },
  ];

  const sectionTabs = [
    { id: 'article', label: 'Article Draft' },
    { id: 'mindmap', label: 'Mindmap' },
    { id: 'board', label: boardCount > 0 ? `Board (${boardCount})` : 'Board' },
    { id: 'review', label: reviewScore !== null ? `AI Review (${reviewScore})` : 'AI Review & Check' },
  ];

  const openMenu = (type, ref) => {
    if (activeModal === type) {
      closeModal();
      return;
    }
    if (ref?.current?.measureInWindow) {
      ref.current.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y: y + height + 6, width, height });
        setActiveModal(type);
      });
    } else {
      setAnchorRect({ x: 20, y: 100, width: 120, height: 36 });
      setActiveModal(type);
    }
  };

  const resetNewBranchForm = () => {
    setNewBranchOpen(false);
    setNewBranchName('');
    setNewBranchError('');
  };

  const closeModal = () => {
    if (creatingBranch) return;
    setActiveModal(null);
    resetNewBranchForm();
  };

  const submitNewBranch = async () => {
    if (!onCreateBranch || creatingBranch) return;
    const name = branchSlug;
    if (!name) {
      setNewBranchError('Give the branch a name.');
      return;
    }
    if (branchItems.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      setNewBranchError(`"${name}" already exists on this story.`);
      return;
    }
    setCreatingBranch(true);
    setNewBranchError('');
    try {
      await onCreateBranch(name);
      setCreatingBranch(false);
      setActiveModal(null);
      resetNewBranchForm();
    } catch (err) {
      setCreatingBranch(false);
      setNewBranchError(err?.message || 'Could not create the branch. Try again.');
    }
  };

  const getPopoverStyle = () => {
    if (isMobile || !anchorRect) {
      return {
        position: 'absolute',
        top: anchorRect ? Math.max(anchorRect.y, 64) : 74,
        left: 12,
        right: 12,
        maxWidth: 440,
        alignSelf: 'center',
      };
    }

    if (activeModal === 'branch') {
      return {
        position: 'absolute',
        top: anchorRect.y,
        left: Math.max(12, Math.min(anchorRect.x, windowWidth - 260)),
        width: 260,
      };
    }

    return {
      position: 'absolute',
      top: anchorRect.y,
      left: Math.max(12, Math.min(anchorRect.x - 20, windowWidth - 300)),
      width: 270,
    };
  };

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: themeColors.cardBg || '#ffffff',
          borderBottomColor: themeColors.line || '#e2e8f0',
        },
      ]}
    >
      {/* --- ROW 1: Version Control + Article Workspace Section Switcher + 1-to-1 AI Agent Button --- */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: themeColors.sidebarBg || '#f8f9fa' },
        ]}
      >
        {/* 1. Branch Tab Dropdown Trigger */}
        <TouchableOpacity
          ref={branchBtnRef}
          style={[
            styles.tabButton,
            activeModal === 'branch' && [
              styles.tabButtonActive,
              { backgroundColor: themeColors.cardBg || '#ffffff', borderColor: themeColors.forest || '#0066cc' },
            ],
          ]}
          onPress={() => openMenu('branch', branchBtnRef)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Active branch: ${activeBranch}. Click to open branches menu`}
        >
          <View style={styles.tabIconWrapper}>
            <GitBranchIcon size={13} color={themeColors.forest || '#0066cc'} />
          </View>
          <Text style={[styles.tabText, { color: themeColors.ink || '#333333' }]} numberOfLines={1}>
            Branch: <Text style={[styles.tabHighlight, { color: themeColors.forest || '#0066cc' }]}>{activeBranch}</Text>
          </Text>
          {activeIsPrivate && (
            <View style={styles.tabLockWrapper} accessibilityLabel="Private branch">
              <LockMiniIcon size={11} color={themeColors.muted || '#666666'} />
            </View>
          )}
          <Text style={[styles.caret, { color: themeColors.muted || '#666666' }]}>
            {activeModal === 'branch' ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: themeColors.line || '#d1d5db' }]} />

        {/* 2. Commands Tab Dropdown Trigger */}
        <TouchableOpacity
          ref={commandsBtnRef}
          style={[
            styles.tabButton,
            activeModal === 'commands' && [
              styles.tabButtonActive,
              { backgroundColor: themeColors.cardBg || '#ffffff', borderColor: themeColors.forest || '#0066cc' },
            ],
          ]}
          onPress={() => openMenu('commands', commandsBtnRef)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open version commands dropdown menu"
        >
          <View style={styles.tabIconWrapper}>
            <TerminalIcon size={13} color={themeColors.muted || '#666666'} />
          </View>
          <Text style={[styles.tabText, { color: themeColors.ink || '#333333' }]}>Commands</Text>
          <Text style={[styles.caret, { color: themeColors.muted || '#666666' }]}>
            {activeModal === 'commands' ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* 3. Article Sections: Draft | Mindmap | Board | AI Review */}
        {onSelectSection && (
          <>
            <View style={[styles.divider, { backgroundColor: themeColors.line || '#d1d5db' }]} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionTabsRow}
            >
              {sectionTabs.map((sec) => {
                const isCurrent = activeSection === sec.id;
                return (
                  <TouchableOpacity
                    key={sec.id}
                    onPress={() => onSelectSection(sec.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.sectionTabChip,
                      {
                        borderColor: isCurrent ? themeColors.forest || '#0066cc' : themeColors.line || '#cbd5e1',
                        backgroundColor: isCurrent ? themeColors.forest || '#0066cc' : themeColors.cardBg || '#ffffff',
                      },
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isCurrent }}
                  >
                    <Text
                      style={[
                        styles.sectionTabText,
                        { color: isCurrent ? '#ffffff' : themeColors.ink || '#334155' },
                      ]}
                    >
                      {sec.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        <View style={{ flex: 1 }} />

        {/* 4. 1-to-1 Saiph AI Agent Button */}
        {onOpenAIAgent && (
          <TouchableOpacity
            onPress={onOpenAIAgent}
            activeOpacity={0.8}
            style={[styles.aiAgentBtn, { backgroundColor: themeColors.orange || '#ea580c' }]}
            accessibilityRole="button"
            accessibilityLabel="Open 1-on-1 Saiph AI Agent"
          >
            <SparklesIcon size={13} color="#ffffff" />
            <Text style={styles.aiAgentBtnText}>Ask Saiph AI</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- ROW 2: Direct Word Tools Ribbon (Out of the Dropdown!) --- */}
      <View
        style={[
          styles.wordToolsRibbon,
          {
            backgroundColor: themeColors.cardBg || '#ffffff',
            borderTopColor: themeColors.line || '#e2e8f0',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.wordToolsScroll}
        >
          {wordTools.map((tool) => {
            const ToolIcon = tool.Icon;
            const isActive = Boolean(activeFormats && activeFormats[tool.action]);
            return (
              <Pressable
                key={tool.action}
                focusable={false}
                onMouseDown={(e) => {
                  // Prevent browser from blurring the article editor when clicking a Word Tool
                  if (e && typeof e.preventDefault === 'function') e.preventDefault();
                }}
                onPressIn={(e) => {
                  if (e && typeof e.preventDefault === 'function') e.preventDefault();
                }}
                style={({ pressed }) => [
                  styles.wordToolBtn,
                  {
                    backgroundColor:
                      isActive || pressed
                        ? themeColors.forest || '#315E4A'
                        : themeColors.sidebarBg || '#f8fafc',
                    borderColor:
                      isActive || pressed
                        ? themeColors.forest || '#315E4A'
                        : themeColors.line || '#e2e8f0',
                  },
                ]}
                onPress={() => onApplyFormat(tool.action)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Format ${tool.label}`}
              >
                {({ pressed }) => {
                  const highlighted = isActive || pressed;
                  return (
                    <>
                      <ToolIcon
                        size={13}
                        color={highlighted ? '#ffffff' : themeColors.forest || themeColors.ink || '#0f172a'}
                      />
                      <Text
                        style={[
                          styles.wordToolBtnText,
                          {
                            color: highlighted ? '#ffffff' : themeColors.ink || '#0f172a',
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {tool.label}
                      </Text>
                    </>
                  );
                }}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Anchored Dropdown Menu Modal for Branch & Commands */}
      <Modal
        visible={activeModal !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable
            style={[
              styles.dropdownCard,
              getPopoverStyle(),
              {
                backgroundColor: themeColors.cardBg || '#ffffff',
                borderColor: themeColors.line || '#e2e8f0',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* --- BRANCHES DROPDOWN --------------------------------- */}
            {activeModal === 'branch' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <GitBranchIcon size={14} color={themeColors.forest || '#0066cc'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Branches</Text>
                    <Text style={[styles.menuCount, { color: themeColors.muted || '#64748b' }]}>{branchItems.length}</Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
                  {branchItems.map((branch) => {
                    const isCurrent = branch.name === activeBranch;
                    const isPrivate = !branch.isMain && !branch.isPublic;
                    const badgeLabel = branch.isMain ? 'MAIN' : isPrivate ? 'PRIVATE' : 'SHARED';
                    const badgeColor = branch.isMain
                      ? themeColors.forest || '#0066cc'
                      : isPrivate
                        ? themeColors.muted || '#64748b'
                        : '#059669';
                    return (
                      <TouchableOpacity
                        key={branch.id || branch.name}
                        style={[
                          styles.branchMenuItem,
                          { borderBottomColor: themeColors.line || '#f8fafc' },
                          isCurrent && [
                            styles.selectedBranchMenuItem,
                            { backgroundColor: themeColors.sidebarBg || '#f8fafc' },
                          ],
                        ]}
                        onPress={() => {
                          onSelectBranch(branch.name);
                          closeModal();
                        }}
                        activeOpacity={0.7}
                        accessibilityLabel={`${branch.name}, ${badgeLabel.toLowerCase()} branch`}
                      >
                        <View style={styles.branchRowLeft}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.branchNameText,
                              { color: themeColors.ink || '#0f172a' },
                              isCurrent && { fontWeight: '700', color: themeColors.forest || '#0066cc' },
                            ]}
                          >
                            {branch.name}
                          </Text>
                          <View style={[styles.branchBadge, { borderColor: badgeColor }]}>
                            {isPrivate && <LockMiniIcon size={8} color={badgeColor} />}
                            <Text style={[styles.branchBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                          </View>
                        </View>
                        {isCurrent && (
                          <View style={styles.checkIconWrapper}>
                            <CheckIcon size={15} color={themeColors.forest || '#10b981'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* --- New branch: collapsed button → inline form --- */}
                {onCreateBranch && (
                  <View style={[styles.newBranchArea, { borderTopColor: themeColors.line || '#f1f5f9' }]}>
                    {!newBranchOpen ? (
                      <TouchableOpacity
                        style={styles.newBranchTrigger}
                        onPress={() => setNewBranchOpen(true)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Create a new branch"
                      >
                        <PlusIcon size={13} color={themeColors.forest || '#0066cc'} />
                        <Text style={[styles.newBranchTriggerText, { color: themeColors.forest || '#0066cc' }]}>
                          New branch
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        <Text style={[styles.newBranchHint, { color: themeColors.muted || '#64748b' }]}>
                          Starts as a copy of <Text style={styles.newBranchHintStrong}>{activeBranch}</Text>.
                          Only you can see it until you push.
                        </Text>
                        <TextInput
                          value={newBranchName}
                          onChangeText={(t) => {
                            setNewBranchName(t);
                            if (newBranchError) setNewBranchError('');
                          }}
                          onSubmitEditing={submitNewBranch}
                          placeholder="e.g. water-supply-angle"
                          placeholderTextColor={themeColors.muted || '#94a3b8'}
                          autoFocus
                          autoCapitalize="none"
                          autoCorrect={false}
                          maxLength={256}
                          editable={!creatingBranch}
                          returnKeyType="done"
                          accessibilityLabel="New branch name"
                          style={[
                            styles.newBranchInput,
                            {
                              color: themeColors.ink || '#0f172a',
                              backgroundColor: themeColors.inputBg || '#ffffff',
                              borderColor: newBranchError ? '#dc2626' : themeColors.line || '#e2e8f0',
                            },
                          ]}
                        />
                        {!!branchSlug && branchSlug !== newBranchName.trim() && (
                          <Text style={[styles.newBranchPreview, { color: themeColors.muted || '#64748b' }]}>
                            Will be saved as <Text style={styles.newBranchHintStrong}>{branchSlug}</Text>
                          </Text>
                        )}
                        {!!newBranchError && <Text style={styles.newBranchError}>{newBranchError}</Text>}
                        <View style={styles.newBranchActions}>
                          <TouchableOpacity
                            onPress={resetNewBranchForm}
                            disabled={creatingBranch}
                            style={[styles.newBranchCancel, { borderColor: themeColors.line || '#e2e8f0' }]}
                          >
                            <Text style={[styles.newBranchCancelText, { color: themeColors.ink || '#0f172a' }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={submitNewBranch}
                            disabled={creatingBranch || !branchSlug}
                            style={[
                              styles.newBranchCreate,
                              { backgroundColor: themeColors.forest || '#0066cc', opacity: branchSlug ? 1 : 0.5 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Create branch"
                          >
                            {creatingBranch ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Text style={styles.newBranchCreateText}>Create branch</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* --- COMMANDS DROPDOWN --------------------------------- */}
            {activeModal === 'commands' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <TerminalIcon size={14} color={themeColors.ink || '#0f172a'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Version Commands</Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 280 }}>
                  {versionCommands.map((cmd) => {
                    const CmdIcon = cmd.Icon;
                    return (
                      <TouchableOpacity
                        key={cmd.id}
                        style={[styles.cmdMenuItem, { borderBottomColor: themeColors.line || '#f8fafc' }]}
                        onPress={() => {
                          onExecuteCommand(cmd.id);
                          closeModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.cmdIconBadge, { backgroundColor: themeColors.sidebarBg || '#f1f5f9' }]}>
                          <CmdIcon size={14} color={themeColors.ink || '#0f172a'} />
                        </View>
                        <Text style={[styles.cmdLabel, { color: themeColors.ink || '#0f172a' }]}>
                          {cmd.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export { ArticleHeader };
export { ArticleHeader as Header };

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#f8f9fa',
    flexWrap: 'wrap',
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#333333',
  },
  tabHighlight: {
    color: '#0066cc',
    fontWeight: '700',
  },
  caret: {
    fontSize: 9,
    marginLeft: 6,
    color: '#666666',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  sectionTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 1,
  },
  sectionTabChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionTabText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  aiAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiAgentBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // -- Direct Word Tools Ribbon (Exposed on Toolbar) --
  wordToolsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  wordToolsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  wordToolsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  wordToolBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  menuHeaderBar: {
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // -- Branch Menu Styling --------------------------------------------------
  branchMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  selectedBranchMenuItem: {
    backgroundColor: '#f8fafc',
  },
  branchNameText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  checkIconWrapper: {
    marginLeft: 8,
  },
  tabLockWrapper: {
    marginLeft: 5,
  },
  menuCount: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  branchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  branchBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  newBranchArea: {
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 8,
  },
  newBranchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  newBranchTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  newBranchHint: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  newBranchHintStrong: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  newBranchInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  newBranchPreview: {
    fontSize: 11,
    marginTop: 5,
  },
  newBranchError: {
    fontSize: 11.5,
    color: '#dc2626',
    marginTop: 5,
    fontWeight: '600',
  },
  newBranchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  newBranchCancel: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  newBranchCancelText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  newBranchCreate: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBranchCreateText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // -- Commands Menu Styling ------------------------------------------------
  cmdMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 9,
  },
  cmdIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cmdLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
});
