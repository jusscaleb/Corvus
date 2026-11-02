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
} from 'react-native';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { lightColors } from '../theme/colors';

// ─── Crisp SVG Icons ──────────────────────────────────────────────────────────

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

function TerminalIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="4 17 10 11 4 5" />
      <Line x1="12" y1="19" x2="20" y2="19" />
    </Svg>
  );
}

function TypeToolsIcon({ size = 14, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="4 7 4 4 20 4 20 7" />
      <Line x1="9" y1="20" x2="15" y2="20" />
      <Line x1="12" y1="4" x2="12" y2="20" />
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

function BoldIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <Path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </Svg>
  );
}

function ItalicIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="4" x2="10" y2="4" />
      <Line x1="14" y1="20" x2="5" y2="20" />
      <Line x1="15" y1="4" x2="9" y2="20" />
    </Svg>
  );
}

function UnderlineIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <Line x1="4" y1="21" x2="20" y2="21" />
    </Svg>
  );
}

function Heading1Icon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h8" />
      <Path d="M4 18V6" />
      <Path d="M12 18V6" />
      <Path d="m17 12 3-2v8" />
    </Svg>
  );
}

function Heading2Icon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h8" />
      <Path d="M4 18V6" />
      <Path d="M12 18V6" />
      <Path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </Svg>
  );
}

function ListIcon({ size = 15, color = '#666' }) {
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

function QuoteIcon({ size = 15, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <Path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    </Svg>
  );
}

function CodeIcon({ size = 15, color = '#666' }) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArticleHeader({
  activeBranch = 'main',
  branches = ['main', 'dev', 'feature/article-draft', 'release/v1.0'],
  onSelectBranch = () => {},
  onExecuteCommand = () => {},
  onApplyFormat = () => {},
}) {
  const [activeModal, setActiveModal] = useState(null); // 'branch' | 'commands' | 'tools' | null
  const [anchorRect, setAnchorRect] = useState(null);
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 680;

  const branchBtnRef = useRef(null);
  const commandsBtnRef = useRef(null);
  const toolsBtnRef = useRef(null);

  let themeColors = lightColors;
  try {
    const theme = useTheme();
    if (theme?.colors) themeColors = theme.colors;
  } catch (_) {
    themeColors = lightColors;
  }

  const branchMeta = {
    main: { tag: 'Default', desc: 'Canonical editorial line', color: '#10b981' },
    dev: { tag: 'Staging', desc: 'Work in progress revisions', color: '#f59e0b' },
    'feature/article-draft': { tag: 'Investigation', desc: 'Draft source angle', color: '#6366f1' },
    'release/v1.0': { tag: 'Publish', desc: 'Reviewed & ready to print', color: '#ec4899' },
  };

  const versionCommands = [
    {
      id: 'pull',
      label: 'Pull latest changes',
      description: 'Fetch new edits and sources from upstream desk',
      badge: 'SYNC',
      Icon: GitPullIcon,
    },
    {
      id: 'status',
      label: 'Check status',
      description: 'Review active draft changes against base branch',
      badge: 'CHECK',
      Icon: ActivityIcon,
    },
    {
      id: 'commit',
      label: 'Save local changes',
      description: 'Snapshot story state into editorial history',
      badge: 'SNAPSHOT',
      Icon: GitCommitIcon,
    },
    {
      id: 'push',
      label: 'Push changes',
      description: 'Transmit draft updates to team newsroom',
      badge: 'UPLOAD',
      Icon: GitPushIcon,
    },
    {
      id: 'diff',
      label: 'View differences',
      description: 'Compare side-by-side modifications with canonical',
      badge: 'COMPARE',
      Icon: GitDiffIcon,
    },
  ];

  // 2-Column Grid Word Tools Menu
  const wordTools = [
    {
      label: 'Bold',
      action: 'bold',
      syntax: '**text**',
      description: 'Strong emphasis for names & key statements',
      Icon: BoldIcon,
    },
    {
      label: 'Italic',
      action: 'italic',
      syntax: '*text*',
      description: 'Subtle slant for terms, book titles & sources',
      Icon: ItalicIcon,
    },
    {
      label: 'Underline',
      action: 'underline',
      syntax: '<u>text</u>',
      description: 'Draw immediate focus to critical details',
      Icon: UnderlineIcon,
    },
    {
      label: 'Heading 1',
      action: 'h1',
      syntax: '# Title',
      description: 'Major section division for primary storylines',
      Icon: Heading1Icon,
    },
    {
      label: 'Heading 2',
      action: 'h2',
      syntax: '## Subtitle',
      description: 'Secondary sub-header for topic breakdowns',
      Icon: Heading2Icon,
    },
    {
      label: 'Bullet List',
      action: 'bullet',
      syntax: '• item',
      description: 'Structured evidence, timeline, or key facts',
      Icon: ListIcon,
    },
    {
      label: 'Blockquote',
      action: 'quote',
      syntax: '> quote',
      description: 'Highlighted callout for witness or expert quotes',
      Icon: QuoteIcon,
    },
    {
      label: 'Inline Code',
      action: 'code',
      syntax: '`code`',
      description: 'Monospace format for data points or references',
      Icon: CodeIcon,
    },
  ];

  const openMenu = (type, ref) => {
    if (activeModal === type) {
      setActiveModal(null);
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

  const closeModal = () => {
    setActiveModal(null);
  };

  // Compute anchored position for dropdown menu popovers
  const getPopoverStyle = () => {
    if (isMobile || !anchorRect) {
      return {
        position: 'absolute',
        top: anchorRect ? Math.max(anchorRect.y, 64) : 74,
        left: 12,
        right: 12,
        maxWidth: 560,
        alignSelf: 'center',
      };
    }

    if (activeModal === 'branch') {
      return {
        position: 'absolute',
        top: anchorRect.y,
        left: Math.max(12, Math.min(anchorRect.x, windowWidth - 340)),
        width: 330,
      };
    }

    if (activeModal === 'commands') {
      return {
        position: 'absolute',
        top: anchorRect.y,
        left: Math.max(12, Math.min(anchorRect.x - 20, windowWidth - 380)),
        width: 360,
      };
    }

    // Word Tools 2-column grid
    return {
      position: 'absolute',
      top: anchorRect.y,
      left: Math.max(12, Math.min(anchorRect.x - 140, windowWidth - 540)),
      width: Math.min(520, windowWidth - 24),
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

        <View style={[styles.divider, { backgroundColor: themeColors.line || '#d1d5db' }]} />

        {/* 3. Word Tools Tab Dropdown Trigger */}
        <TouchableOpacity
          ref={toolsBtnRef}
          style={[
            styles.tabButton,
            activeModal === 'tools' && [
              styles.tabButtonActive,
              { backgroundColor: themeColors.cardBg || '#ffffff', borderColor: themeColors.forest || '#0066cc' },
            ],
          ]}
          onPress={() => openMenu('tools', toolsBtnRef)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open formatting and word tools grid menu"
        >
          <View style={styles.tabIconWrapper}>
            <TypeToolsIcon size={13} color={themeColors.orange || '#ea580c'} />
          </View>
          <Text style={[styles.tabText, { color: themeColors.ink || '#333333' }]}>Word Tools</Text>
          <Text style={[styles.caret, { color: themeColors.muted || '#666666' }]}>
            {activeModal === 'tools' ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Normal Anchored Dropdown Menu Modal */}
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
            {/* ─── BRANCHES DROPDOWN ───────────────────────────────── */}
            {activeModal === 'branch' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <GitBranchIcon size={14} color={themeColors.forest || '#0066cc'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Select Branch</Text>
                  </View>
                  <Text style={[styles.menuSubtitle, { color: themeColors.muted || '#64748b' }]}>
                    Active editorial revision line
                  </Text>
                </View>

                <ScrollView style={{ maxHeight: 300 }}>
                  {branches.map((branch) => {
                    const isCurrent = branch === activeBranch;
                    const meta = branchMeta[branch] || { tag: 'Branch', desc: 'Editorial workline', color: '#64748b' };
                    return (
                      <TouchableOpacity
                        key={branch}
                        style={[
                          styles.branchMenuItem,
                          { borderBottomColor: themeColors.line || '#f8fafc' },
                          isCurrent && [
                            styles.selectedBranchMenuItem,
                            { backgroundColor: themeColors.sidebarBg || '#f8fafc' },
                          ],
                        ]}
                        onPress={() => {
                          onSelectBranch(branch);
                          closeModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.branchIconBadge, { backgroundColor: isCurrent ? (themeColors.cardBg || '#fff') : (themeColors.sidebarBg || '#f1f5f9') }]}>
                          <GitBranchIcon size={14} color={isCurrent ? (themeColors.forest || '#0066cc') : '#64748b'} />
                        </View>
                        <View style={styles.branchCopyCol}>
                          <View style={styles.branchNameRow}>
                            <Text
                              style={[
                                styles.branchNameText,
                                { color: themeColors.ink || '#0f172a' },
                                isCurrent && { fontWeight: '700', color: themeColors.forest || '#0066cc' },
                              ]}
                            >
                              {branch}
                            </Text>
                            <View style={[styles.tagBadge, { backgroundColor: meta.color + '18' }]}>
                              <Text style={[styles.tagBadgeText, { color: meta.color }]}>{meta.tag}</Text>
                            </View>
                          </View>
                          <Text style={[styles.branchDescText, { color: themeColors.muted || '#64748b' }]}>
                            {meta.desc}
                          </Text>
                        </View>
                        {isCurrent && (
                          <View style={styles.checkIconWrapper}>
                            <CheckIcon size={16} color={themeColors.forest || '#10b981'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ─── COMMANDS DROPDOWN ───────────────────────────────── */}
            {activeModal === 'commands' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <TerminalIcon size={14} color={themeColors.ink || '#0f172a'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Version Commands</Text>
                  </View>
                  <Text style={[styles.menuSubtitle, { color: themeColors.muted || '#64748b' }]}>
                    Revision control actions on {activeBranch}
                  </Text>
                </View>

                <ScrollView style={{ maxHeight: 340 }}>
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
                          <CmdIcon size={15} color={themeColors.ink || '#0f172a'} />
                        </View>
                        <View style={styles.cmdCopyCol}>
                          <View style={styles.cmdTitleRow}>
                            <Text style={[styles.cmdLabel, { color: themeColors.ink || '#0f172a' }]}>
                              {cmd.label}
                            </Text>
                            <View style={[styles.cmdTagBadge, { backgroundColor: themeColors.sidebarBg || '#e2e8f0' }]}>
                              <Text style={[styles.cmdTagBadgeText, { color: themeColors.muted || '#475569' }]}>
                                {cmd.badge}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.cmdDescText, { color: themeColors.muted || '#64748b' }]} numberOfLines={1}>
                            {cmd.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ─── WORD TOOLS: ROWS & COLUMNS GRID MENU ─────────────── */}
            {activeModal === 'tools' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <TypeToolsIcon size={15} color={themeColors.orange || '#ea580c'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Text Formatting Tools</Text>
                  </View>
                  <Text style={[styles.menuSubtitle, { color: themeColors.muted || '#64748b' }]}>
                    Select formatting to insert markdown tags into your draft
                  </Text>
                </View>

                <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 4 }}>
                  <View style={styles.gridContainer}>
                    {wordTools.map((tool) => {
                      const ToolIcon = tool.Icon;
                      return (
                        <TouchableOpacity
                          key={tool.action}
                          style={[
                            styles.gridCard,
                            {
                              backgroundColor: themeColors.inputBg || '#ffffff',
                              borderColor: themeColors.line || '#e2e8f0',
                            },
                          ]}
                          onPress={() => {
                            onApplyFormat(tool.action);
                            closeModal();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.toolIconBadge, { backgroundColor: themeColors.sidebarBg || '#f1f5f9' }]}>
                            <ToolIcon size={16} color={themeColors.forest || themeColors.ink || '#0f172a'} />
                          </View>
                          <View style={styles.toolCopy}>
                            <View style={styles.toolTitleRow}>
                              <Text style={[styles.toolTitle, { color: themeColors.ink || '#0f172a' }]}>{tool.label}</Text>
                              <Text style={[styles.toolSyntaxTag, { color: themeColors.muted || '#64748b' }]}>{tool.syntax}</Text>
                            </View>
                            <Text style={[styles.toolDescription, { color: themeColors.muted || '#64748b' }]} numberOfLines={2}>
                              {tool.description}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={[styles.toolsFooter, { borderTopColor: themeColors.line || '#f1f5f9', backgroundColor: themeColors.sidebarBg || '#f8fafc' }]}>
                  <Text style={[styles.toolsFooterTip, { color: themeColors.muted || '#64748b' }]}>
                    💡 In edit mode, click any tool to instantly inject markdown tags into your active story.
                  </Text>
                </View>
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
    paddingVertical: 8,
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
    fontSize: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  menuHeaderBar: {
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  menuHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // ── Branch Menu Styling ──────────────────────────────────────────────────
  branchMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 10,
  },
  selectedBranchMenuItem: {
    backgroundColor: '#f8fafc',
  },
  branchIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  branchCopyCol: {
    flex: 1,
    minWidth: 0,
  },
  branchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  branchNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  branchDescText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  checkIconWrapper: {
    marginLeft: 6,
  },

  // ── Commands Menu Styling ────────────────────────────────────────────────
  cmdMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 10,
  },
  cmdIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cmdCopyCol: {
    flex: 1,
    minWidth: 0,
  },
  cmdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cmdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  cmdTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  cmdTagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#475569',
  },
  cmdDescText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // ── Word Tools 2-Column Grid Styling ─────────────────────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 9,
  },
  toolIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  toolCopy: {
    flex: 1,
    minWidth: 0,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  toolSyntaxTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  toolDescription: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 14,
  },
  toolsFooter: {
    marginTop: 10,
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderRadius: 6,
  },
  toolsFooterTip: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
