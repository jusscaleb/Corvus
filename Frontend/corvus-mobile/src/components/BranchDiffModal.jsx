import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { canMergeBranch } from '../services/branchDiffUtil';

export default function BranchDiffModal({
  visible,
  diff,
  currentUser,
  onClose,
  onSwitchBranch,
  onMergeBranch,
  onRequestPermission,
}) {
  const { colors } = useTheme();
  const [merging, setMerging] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState(null);

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

  const handleMergeAttempt = async () => {
    setPermissionNotice(null);
    const permission = canMergeBranch(currentUser, diff.compare_branch);

    if (!permission.allowed) {
      setPermissionNotice({
        type: 'error',
        message: permission.reason || `Permission required from creator (@${permission.creatorName}) to merge this branch.`,
        creatorName: permission.creatorName,
      });
      return;
    }

    if (!onMergeBranch) return;
    setMerging(true);
    try {
      await onMergeBranch(diff.compare_branch, diff.base_branch);
      onClose();
    } catch (err) {
      setPermissionNotice({
        type: 'error',
        message: err?.message || 'Failed to merge branch.',
      });
    } finally {
      setMerging(false);
    }
  };

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

          {/* Creator Permission Alert Banner */}
          {permissionNotice && (
            <View style={[styles.permissionBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <Text style={styles.permissionBannerIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionBannerTitle}>Creator Permission Required</Text>
                <Text style={styles.permissionBannerText}>{permissionNotice.message}</Text>
              </View>
              {onRequestPermission && permissionNotice.creatorName && (
                <Pressable
                  onPress={() => onRequestPermission(diff.compare_branch)}
                  style={styles.requestPermBtn}
                >
                  <Text style={styles.requestPermBtnText}>Request Permission</Text>
                </Pressable>
              )}
            </View>
          )}

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

            {onMergeBranch && compareName !== baseName && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Merge branch ${compareName} into ${baseName}`}
                onPress={handleMergeAttempt}
                disabled={merging}
                style={[
                  styles.mergeBranchBtn,
                  { backgroundColor: '#059669', opacity: merging ? 0.7 : 1 },
                ]}
              >
                {merging ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.mergeBranchBtnText}>
                    Merge "{compareName}" → "{baseName}"
                  </Text>
                )}
              </Pressable>
            )}

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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  superTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  branchComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  branchPillText: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 16,
  },
  statItem: {
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  permissionBannerIcon: {
    fontSize: 18,
  },
  permissionBannerTitle: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '800',
  },
  permissionBannerText: {
    color: '#b91c1c',
    fontSize: 11.5,
    marginTop: 1,
  },
  requestPermBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  requestPermBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  diffBody: {
    flex: 1,
  },
  identicalNotice: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  identicalNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  identicalNoticeSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  metaLine: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginVertical: 2,
  },
  metaLineText: {
    fontFamily: 'monospace',
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  addedLine: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginVertical: 1,
  },
  addedPrefix: {
    color: '#15803d',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    width: 16,
  },
  addedText: {
    color: '#166534',
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
  },
  removedLine: {
    flexDirection: 'row',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginVertical: 1,
  },
  removedPrefix: {
    color: '#b91c1c',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    width: 16,
  },
  removedText: {
    color: '#991b1b',
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
  },
  contextLine: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  contextPrefix: {
    width: 16,
    fontFamily: 'monospace',
  },
  contextText: {
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
    flexWrap: 'wrap',
  },
  footerSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mergeBranchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
  },
  mergeBranchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  footerPrimaryBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 7,
  },
  footerPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
