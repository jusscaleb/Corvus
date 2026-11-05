import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function BranchDiffModal({ visible, diff, onClose, onSwitchBranch }) {
  const { colors } = useTheme();

  if (!visible || !diff) {
    return null;
  }

  const baseName = diff.base_branch?.branch_name || 'main';
  const compareName = diff.compare_branch?.branch_name || 'branch';
  const stats = diff.stats || {};
  const similarity = stats.similarity_percent ?? 100;
  const added = stats.added_lines ?? 0;
  const removed = stats.removed_lines ?? 0;
  const chunks = Array.isArray(diff.chunks) ? diff.chunks : [];
  const isIdentical = similarity === 100 && added === 0 && removed === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors?.card || '#ffffff', borderColor: colors?.border || '#e2e8f0' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors?.border || '#e2e8f0' }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.superTitle, { color: colors?.forest || '#315E4A' }]}>
                BRANCH REVISION COMPARISON
              </Text>
              <View style={styles.branchComparisonRow}>
                <View style={[styles.branchPill, { backgroundColor: colors?.mutedBackground || '#f1f5f9' }]}>
                  <Text style={[styles.branchPillText, { color: colors?.ink || '#0f172a' }]}>{baseName}</Text>
                </View>
                <Text style={{ color: colors?.muted || '#64748b', fontWeight: '800' }}>→</Text>
                <View style={[styles.branchPill, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.branchPillText, { color: '#166534' }]}>{compareName}</Text>
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close diff modal"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors?.mutedBackground || '#f1f5f9' }]}
            >
              <Text style={[styles.closeBtnText, { color: colors?.ink || '#0f172a' }]}>✕</Text>
            </Pressable>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsBar, { backgroundColor: colors?.mutedBackground || '#f8fafc', borderBottomColor: colors?.border || '#e2e8f0' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors?.muted || '#64748b' }]}>Similarity</Text>
              <Text style={[styles.statValue, { color: colors?.ink || '#0f172a' }]}>{similarity}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors?.muted || '#64748b' }]}>Additions</Text>
              <Text style={[styles.statValue, { color: '#16a34a' }]}>+{added} lines</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors?.muted || '#64748b' }]}>Deletions</Text>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>-{removed} lines</Text>
            </View>
            {stats.base_word_count !== undefined && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors?.muted || '#64748b' }]}>Words</Text>
                  <Text style={[styles.statValue, { color: colors?.ink || '#0f172a' }]}>
                    {stats.compare_word_count} vs {stats.base_word_count}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Diff Content */}
          <ScrollView style={styles.diffBody} contentContainerStyle={{ padding: 12 }}>
            {isIdentical ? (
              <View style={styles.identicalNotice}>
                <Text style={[styles.identicalNoticeTitle, { color: colors?.ink || '#0f172a' }]}>
                  Branches are Identical
                </Text>
                <Text style={[styles.identicalNoticeSub, { color: colors?.muted || '#64748b' }]}>
                  "{compareName}" has exactly the same content as "{baseName}". No revisions found.
                </Text>
              </View>
            ) : chunks.length > 0 ? (
              chunks.map((c, i) => {
                if (c.type === 'meta') {
                  return (
                    <View key={i} style={styles.metaLine}>
                      <Text style={styles.metaLineText}>{c.text}</Text>
                    </View>
                  );
                }
                if (c.type === 'added') {
                  return (
                    <View key={i} style={styles.addedLine}>
                      <Text style={styles.addedPrefix}>+</Text>
                      <Text style={styles.addedText}>{c.text || ' '}</Text>
                    </View>
                  );
                }
                if (c.type === 'removed') {
                  return (
                    <View key={i} style={styles.removedLine}>
                      <Text style={styles.removedPrefix}>-</Text>
                      <Text style={styles.removedText}>{c.text || ' '}</Text>
                    </View>
                  );
                }
                return (
                  <View key={i} style={styles.contextLine}>
                    <Text style={styles.contextPrefix}> </Text>
                    <Text style={[styles.contextText, { color: colors?.ink || '#334155' }]}>{c.text || ' '}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={{ color: colors?.muted || '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                {diff.diff_text || 'No raw diff data available.'}
              </Text>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors?.border || '#e2e8f0' }]}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.footerSecondaryBtn, { borderColor: colors?.border || '#cbd5e1' }]}
            >
              <Text style={[styles.footerSecondaryBtnText, { color: colors?.ink || '#0f172a' }]}>Close</Text>
            </Pressable>

            {onSwitchBranch && compareName !== baseName && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onSwitchBranch(compareName);
                  onClose();
                }}
                style={[styles.footerPrimaryBtn, { backgroundColor: colors?.forest || '#315E4A' }]}
              >
                <Text style={styles.footerPrimaryBtnText}>Switch to "{compareName}"</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '85%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  superTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  branchComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  branchPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  branchPillText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  diffBody: {
    flex: 1,
    minHeight: 200,
  },
  metaLine: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginVertical: 4,
  },
  metaLineText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  addedLine: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginVertical: 1,
  },
  addedPrefix: {
    color: '#166534',
    fontWeight: '800',
    fontFamily: 'monospace',
    fontSize: 12,
    width: 16,
  },
  addedText: {
    flex: 1,
    color: '#166534',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  removedLine: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginVertical: 1,
  },
  removedPrefix: {
    color: '#991B1B',
    fontWeight: '800',
    fontFamily: 'monospace',
    fontSize: 12,
    width: 16,
  },
  removedText: {
    flex: 1,
    color: '#991B1B',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    textDecorationLine: 'line-through',
  },
  contextLine: {
    flexDirection: 'row',
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  contextPrefix: {
    fontFamily: 'monospace',
    fontSize: 12,
    width: 16,
  },
  contextText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  identicalNotice: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  identicalNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  identicalNoticeSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerSecondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerPrimaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

