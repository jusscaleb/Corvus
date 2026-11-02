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

  const versionCommands = [
    { id: 'pull', label: 'Pull latest changes', Icon: GitPullIcon },
    { id: 'status', label: 'Check status', Icon: ActivityIcon },
    { id: 'commit', label: 'Save local changes', Icon: GitCommitIcon },
    { id: 'push', label: 'Push changes', Icon: GitPushIcon },
    { id: 'diff', label: 'View differences', Icon: GitDiffIcon },
  ];

  // 2-Column Grid Word Tools Menu: symbol + name only
  const wordTools = [
    { label: 'Bold', action: 'bold', Icon: BoldIcon },
    { label: 'Italic', action: 'italic', Icon: ItalicIcon },
    { label: 'Underline', action: 'underline', Icon: UnderlineIcon },
    { label: 'Heading 1', action: 'h1', Icon: Heading1Icon },
    { label: 'Heading 2', action: 'h2', Icon: Heading2Icon },
    { label: 'Bullet List', action: 'bullet', Icon: ListIcon },
    { label: 'Blockquote', action: 'quote', Icon: QuoteIcon },
    { label: 'Inline Code', action: 'code', Icon: CodeIcon },
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
        maxWidth: 440,
        alignSelf: 'center',
      };
    }

    if (activeModal === 'branch') {
      return {
        position: 'absolute',
        top: anchorRect.y,
        left: Math.max(12, Math.min(anchorRect.x, windowWidth - 260)),
        width: 250,
      };
    }

    if (activeModal === 'commands') {
      return {
        position: 'absolute',
        top: anchorRect.y,
        left: Math.max(12, Math.min(anchorRect.x - 20, windowWidth - 300)),
        width: 270,
      };
    }

    // Word Tools 2-column grid
    return {
      position: 'absolute',
      top: anchorRect.y,
      left: Math.max(12, Math.min(anchorRect.x - 120, windowWidth - 360)),
      width: Math.min(340, windowWidth - 24),
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
                </View>

                <ScrollView style={{ maxHeight: 260 }}>
                  {branches.map((branch) => {
                    const isCurrent = branch === activeBranch;
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
                        <Text
                          style={[
                            styles.branchNameText,
                            { color: themeColors.ink || '#0f172a' },
                            isCurrent && { fontWeight: '700', color: themeColors.forest || '#0066cc' },
                          ]}
                        >
                          {branch}
                        </Text>
                        {isCurrent && (
                          <View style={styles.checkIconWrapper}>
                            <CheckIcon size={15} color={themeColors.forest || '#10b981'} />
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

            {/* ─── WORD TOOLS: ROWS & COLUMNS GRID MENU (SYMBOL + NAME ONLY) ─ */}
            {activeModal === 'tools' && (
              <View>
                <View style={[styles.menuHeaderBar, { borderBottomColor: themeColors.line || '#f1f5f9' }]}>
                  <View style={styles.menuHeaderTitleRow}>
                    <TypeToolsIcon size={15} color={themeColors.orange || '#ea580c'} />
                    <Text style={[styles.menuHeader, { color: themeColors.ink || '#0f172a' }]}>Text Formatting Tools</Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingVertical: 2 }}>
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
                            <ToolIcon size={15} color={themeColors.forest || themeColors.ink || '#0f172a'} />
                          </View>
                          <Text style={[styles.toolTitle, { color: themeColors.ink || '#0f172a' }]} numberOfLines={1}>
                            {tool.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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

  // ── Branch Menu Styling ──────────────────────────────────────────────────
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

  // ── Commands Menu Styling ────────────────────────────────────────────────
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

  // ── Word Tools 2-Column Grid Styling (Symbol + Name only) ────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  toolIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
});
