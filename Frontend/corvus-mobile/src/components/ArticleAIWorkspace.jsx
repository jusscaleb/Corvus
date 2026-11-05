import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import MarkdownRenderer from './MarkdownRenderer';
import { useToast } from '../context/ToastContext';
import {
  generateArticleMindmap,
  generateArticleBoard,
  toggleArticleBoardItem,
  runArticleAIReview,
  fetchAgentChat,
  sendAgentMessage,
  saveAgentMemory,
  deleteAgentMemory,
} from '../services/api';

// ─── Crisp Vector Icons ───────────────────────────────────────────────────────

export function SparklesIcon({ size = 14, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </Svg>
  );
}

export function MindmapNodeIcon({ size = 14, color = '#0284c7' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="5" r="3" />
      <Circle cx="5" cy="19" r="3" />
      <Circle cx="19" cy="19" r="3" />
      <Line x1="10.5" y1="7.5" x2="6.5" y2="16.5" />
      <Line x1="13.5" y1="7.5" x2="17.5" y2="16.5" />
    </Svg>
  );
}

export function BoardPinIcon({ size = 14, color = '#ea580c' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Line x1="3" y1="9" x2="21" y2="9" />
      <Line x1="9" y1="21" x2="9" y2="9" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 14, color = '#16a34a' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Polyline points="9 12 11 14 15 10" />
    </Svg>
  );
}

// ─── 1. Article Mindmap View ──────────────────────────────────────────────────

const CATEGORY_PALETTE = {
  angle: { badgeBg: '#dcfce7', badgeText: '#166534', border: '#86efac', label: 'STORY ANGLE' },
  timeline: { badgeBg: '#dbeafe', badgeText: '#1e40af', border: '#93c5fd', label: 'STRUCTURE & FLOW' },
  evidence: { badgeBg: '#fef3c7', badgeText: '#92400e', border: '#fcd34d', label: 'EVIDENCE & DATA' },
  stakeholder: { badgeBg: '#f3e8ff', badgeText: '#6b21a8', border: '#d8b4fe', label: 'STAKEHOLDERS & QUESTIONS' },
  question: { badgeBg: '#ffe4e6', badgeText: '#9f1239', border: '#fda4af', label: 'OPEN QUESTION' },
};

export function ArticleMindmapSection({
  articleId,
  branchId,
  mindmap,
  loading: externalLoading,
  onRegenerate,
  onMindmapUpdated,
  onInsertNodeNote,
  onInsertLeafToDraft,
  colors: externalColors,
}) {
  const theme = useTheme();
  const { showToast } = useToast();
  const colors = externalColors || theme.colors;
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = Boolean(externalLoading || internalLoading);
  const insertCallback = onInsertNodeNote || onInsertLeafToDraft;

  const handleRefreshMindmap = async () => {
    if (onRegenerate) {
      onRegenerate();
      return;
    }
    if (!articleId || loading) return;
    setInternalLoading(true);
    try {
      const data = await generateArticleMindmap(articleId, branchId);
      const nextMindmap = data?.mindmap || data;
      if (onMindmapUpdated) onMindmapUpdated(nextMindmap);
      showToast({ message: '✦ Saiph AI generated an updated story mindmap!', type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not generate mindmap.', type: 'error' });
    } finally {
      setInternalLoading(false);
    }
  };

  const resolvedMindmap = mindmap?.mindmap || mindmap;
  const nodes = resolvedMindmap?.nodes || [];
  const root = resolvedMindmap?.root || { title: 'Article Mindmap', subtitle: 'Visual concept map of your story' };

  useEffect(() => {
    if (nodes.length === 0 && articleId && !loading) {
      handleRefreshMindmap();
    }
  }, [articleId]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
    <View style={[s.sectionWrap, { borderColor: colors.line, backgroundColor: colors.cardBg }]}>
      {/* Top Banner */}
      <View style={[s.sectionHeaderBar, { borderBottomColor: colors.line, backgroundColor: colors.sidebarBg }]}>
        <View style={{ flex: 1 }}>
          <View style={s.eyebrowRow}>
            <MindmapNodeIcon size={13} color={colors.forest} />
            <Text style={[s.eyebrowText, { color: colors.forest }]}>SAIPH VISUAL ARCHITECT • MINDMAP</Text>
          </View>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Story Concept & Investigation Map</Text>
          <Text style={[s.sectionSubtitle, { color: colors.muted }]}>
            Click any branch or child node to inspect notes or insert it into your draft.
          </Text>
        </View>
        <Pressable
          onPress={handleRefreshMindmap}
          disabled={loading}
          style={[s.primaryActionBtn, { backgroundColor: colors.forest }, loading && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Regenerate AI Mindmap"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <SparklesIcon size={12} color="#fff" />
              <Text style={s.primaryActionBtnText}>Refresh Mindmap</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Central Root Hub */}
      <View style={s.mindmapCanvas}>
        <View style={[s.rootHubCard, { backgroundColor: colors.forest, borderColor: colors.forest }]}>
          <Text style={s.rootHubEyebrow}>CENTRAL THESIS / STORY ROOT</Text>
          <Text style={s.rootHubTitle}>{root.title}</Text>
          {!!root.subtitle && <Text style={s.rootHubSubtitle}>{root.subtitle}</Text>}
        </View>

        {/* Connector Stem */}
        <View style={s.stemContainer}>
          <View style={[s.verticalStem, { backgroundColor: colors.forest }]} />
          <View style={[s.horizontalBus, { backgroundColor: colors.line }]} />
        </View>

        {/* Branch Nodes Grid */}
        <View style={s.mindmapGrid}>
          {nodes.map((node, idx) => {
            const palette = CATEGORY_PALETTE[node.category] || CATEGORY_PALETTE.angle;
            const isSelected = selectedNodeId === node.id;
            return (
              <View
                key={node.id || idx}
                style={[
                  s.mindmapBranchCard,
                  {
                    backgroundColor: colors.paper,
                    borderColor: isSelected ? colors.forest : palette.border || colors.line,
                  },
                ]}
              >
                <Pressable onPress={() => setSelectedNodeId(isSelected ? null : node.id)}>
                  <View style={s.branchCardHeader}>
                    <View style={[s.categoryPill, { backgroundColor: palette.badgeBg }]}>
                      <Text style={[s.categoryPillText, { color: palette.badgeText }]}>
                        {palette.label}
                      </Text>
                    </View>
                    <Text style={[s.branchIndexText, { color: colors.muted }]}>0{idx + 1}</Text>
                  </View>

                  <Text style={[s.branchNodeTitle, { color: colors.ink }]}>{node.label}</Text>
                  {!!node.summary && (
                    <Text style={[s.branchNodeSummary, { color: colors.muted }]}>{node.summary}</Text>
                  )}
                </Pressable>

                {/* Child Leaves */}
                <View style={[s.childLeavesList, { borderTopColor: colors.line }]}>
                  {(node.children || []).map((child, cIdx) => (
                    <View
                      key={child.id || cIdx}
                      style={[s.childLeafRow, { backgroundColor: colors.cardBg, borderColor: colors.line }]}
                    >
                      <View style={[s.leafDot, { backgroundColor: colors.forest }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.childLeafLabel, { color: colors.ink }]}>{child.label}</Text>
                        {!!child.note && child.note !== child.label && (
                          <Text style={[s.childLeafNote, { color: colors.muted }]}>{child.note}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
    </ScrollView>
  );
}

// ─── 2. Editorial Board View (Suggestions & Sources) ──────────────────────────

export function ArticleBoardSection({
  articleId,
  branchId,
  board,
  boardItems,
  loading: externalLoading,
  onRegenerate,
  onBoardUpdated,
  onToggleItem,
  onApplySnippet,
  colors: externalColors,
}) {
  const theme = useTheme();
  const { showToast } = useToast();
  const colors = externalColors || theme.colors;
  const [filter, setFilter] = useState('all');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = Boolean(externalLoading || internalLoading);
  const allItems = Array.isArray(boardItems) ? boardItems : Array.isArray(board) ? board : [];
  // Exclude generic suggestion boxes, keeping strictly verified research sources & public records
  const items = allItems.filter((item) => item.kind !== 'suggestion');

  const handleRefreshBoard = async () => {
    if (onRegenerate) {
      onRegenerate();
      return;
    }
    if (!articleId || loading) return;
    setInternalLoading(true);
    try {
      const res = await generateArticleBoard(articleId, branchId);
      const nextItems = Array.isArray(res?.board)
        ? res.board
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];
      if (onBoardUpdated) onBoardUpdated(nextItems.filter((i) => i.kind !== 'suggestion'));
      showToast({ message: '✦ Saiph AI generated brand-new verified sources!', type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not generate sources.', type: 'error' });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleToggleItem = async (itemId, nextApplied) => {
    if (onToggleItem) {
      onToggleItem(itemId, nextApplied);
      return;
    }
    if (!articleId) return;
    try {
      const res = await toggleArticleBoardItem(articleId, { itemId, applied: nextApplied });
      const nextItems = Array.isArray(res?.board)
        ? res.board
        : Array.isArray(res?.items)
          ? res.items
          : null;
      if (nextItems && onBoardUpdated) {
        onBoardUpdated(nextItems.filter((i) => i.kind !== 'suggestion'));
      }
    } catch (err) {
      showToast({ message: 'Could not update board item status.', type: 'error' });
    }
  };

  useEffect(() => {
    if (items.length === 0 && articleId && !loading) {
      handleRefreshBoard();
    }
  }, [articleId]);

  const recordCount = items.filter((i) => (i.category || '').toLowerCase().includes('record') || (i.category || '').toLowerCase().includes('audit')).length;
  const gazetteCount = items.filter((i) => (i.category || '').toLowerCase().includes('gazette')).length;
  const dataCount = items.filter((i) => (i.category || '').toLowerCase().includes('data')).length;

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    return (item.category || '').toLowerCase().includes(filter);
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
    <View style={[s.sectionWrap, { borderColor: colors.line, backgroundColor: colors.cardBg }]}>
      <View style={[s.sectionHeaderBar, { borderBottomColor: colors.line, backgroundColor: colors.sidebarBg }]}>
        <View style={{ flex: 1 }}>
          <View style={s.eyebrowRow}>
            <BoardPinIcon size={13} color={colors.orange} />
            <Text style={[s.eyebrowText, { color: colors.orange }]}>SAIPH RESEARCH DESK • VERIFIED SOURCES</Text>
          </View>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Suggestions & Verified Source Leads</Text>
          <Text style={[s.sectionSubtitle, { color: colors.muted }]}>
            Primary public records, archives, and official datasets to corroborate your investigation.
          </Text>
        </View>
        <Pressable
          onPress={handleRefreshBoard}
          disabled={loading}
          style={[s.primaryActionBtn, { backgroundColor: colors.forest }, loading && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Refresh Board Sources"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <SparklesIcon size={12} color="#fff" />
              <Text style={s.primaryActionBtnText}>Refresh Board</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={[s.boardFilterBar, { borderBottomColor: colors.line }]}>
        {[
          { id: 'all', label: `All Sources (${items.length})` },
          { id: 'record', label: `Records & Audits (${recordCount})` },
          { id: 'gazette', label: `Gazettes (${gazetteCount})` },
          { id: 'data', label: `Datasets (${dataCount})` },
        ].map((tab) => {
          const active = filter === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setFilter(tab.id)}
              style={[
                s.filterChip,
                { borderColor: active ? colors.forest : colors.line },
                active && { backgroundColor: colors.forest },
              ]}
            >
              <Text style={[s.filterChipText, { color: active ? '#fff' : colors.ink }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Board Cards */}
      <View style={s.boardGrid}>
        {filtered.map((item) => {
          const isSource = item.kind === 'source';
          return (
            <View
              key={item.id}
              style={[
                s.boardCard,
                {
                  backgroundColor: colors.paper,
                  borderColor: item.applied ? '#10b981' : colors.line,
                  opacity: item.applied ? 0.78 : 1,
                },
              ]}
            >
              <View style={s.boardCardTopRow}>
                <View
                  style={[
                    s.categoryPill,
                    { backgroundColor: isSource ? '#dbeafe' : '#fef3c7' },
                  ]}
                >
                  <Text
                    style={[
                      s.categoryPillText,
                      { color: isSource ? '#1e40af' : '#92400e' },
                    ]}
                  >
                    {isSource ? `SOURCE • ${item.category || 'REFERENCE'}` : `SUGGESTION • ${item.category || 'EDITORIAL'}`}
                  </Text>
                </View>

                {item.priority === 'high' && !item.applied && (
                  <View style={s.highPriorityBadge}>
                    <Text style={s.highPriorityText}>HIGH IMPACT</Text>
                  </View>
                )}
              </View>

              <Text style={[s.boardCardTitle, { color: colors.ink }]}>{item.title}</Text>
              <Text style={[s.boardCardDetail, { color: colors.muted }]}>{item.detail}</Text>

              <View style={s.boardCardFooter}>
                <Pressable
                  onPress={() => handleToggleItem(item.id, !item.applied)}
                  style={[
                    s.boardDoneBtn,
                    {
                      borderColor: item.applied ? '#10b981' : colors.line,
                      backgroundColor: item.applied ? '#dcfce7' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.boardDoneBtnText,
                      { color: item.applied ? '#166534' : colors.ink },
                    ]}
                  >
                    {item.applied ? '✓ Completed' : 'Mark Done'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
    </ScrollView>
  );
}

// ─── 3. AI Review, Plagiarism Check, AI Check & Simple Improvements View ──────

export function ArticleReviewSection({
  articleId,
  branchId,
  review,
  loading: externalLoading,
  onRunReview,
  onReviewUpdated,
  colors: externalColors,
}) {
  const theme = useTheme();
  const { showToast } = useToast();
  const colors = externalColors || theme.colors;
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = Boolean(externalLoading || internalLoading);

  const handleTriggerReview = async () => {
    if (onRunReview) {
      onRunReview();
      return;
    }
    if (!articleId || loading) return;
    setInternalLoading(true);
    try {
      const data = await runArticleAIReview(articleId, branchId);
      if (onReviewUpdated) onReviewUpdated(data);
      showToast({
        message: '✦ Saiph AI completed Plagiarism, AI-Writing & Editorial Review!',
        type: 'info',
      });
    } catch (err) {
      showToast({ message: err?.message || 'Could not run AI review.', type: 'error' });
    } finally {
      setInternalLoading(false);
    }
  };

  const plag = review?.plagiarism || {};
  const aiCheck = review?.ai_detection || {};
  const improvements = review?.improvements || [];

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
    <View style={[s.sectionWrap, { borderColor: colors.line, backgroundColor: colors.cardBg }]}>
      <View style={[s.sectionHeaderBar, { borderBottomColor: colors.line, backgroundColor: colors.sidebarBg }]}>
        <View style={{ flex: 1 }}>
          <View style={s.eyebrowRow}>
            <ShieldCheckIcon size={13} color={colors.forest} />
            <Text style={[s.eyebrowText, { color: colors.forest }]}>
              SAIPH INTEGRITY & STYLE CHECK • PLAGIARISM + AI DETECTOR
            </Text>
          </View>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>
            Editorial Review, Plagiarism & AI-Writing Check
          </Text>
          <Text style={[s.sectionSubtitle, { color: colors.muted }]}>
            Checks originality, flags robotic AI phrasing, and explains where to improve in simple terms.
          </Text>
        </View>
        <Pressable
          onPress={handleTriggerReview}
          disabled={loading}
          style={[s.primaryActionBtn, { backgroundColor: colors.forest }, loading && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Run Plagiarism and AI Review"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <SparklesIcon size={12} color="#fff" />
              <Text style={s.primaryActionBtnText}>
                {review ? 'Re-Run Full Check' : 'Run Review & Checks'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {!review ? (
        <View style={s.emptyReviewBox}>
          <Text style={[s.emptyReviewTitle, { color: colors.ink }]}>
            Ready to review your article
          </Text>
          <Text style={[s.emptyReviewSub, { color: colors.muted }]}>
            Click "Run Review & Checks" above. Saiph will scan your draft for plagiarism against other newsroom stories, check if any sentences sound like AI, and give you simple, step-by-step ways to make your story stronger.
          </Text>
          <Pressable
            onPress={handleTriggerReview}
            disabled={loading}
            style={[s.primaryActionBtn, { backgroundColor: colors.forest, marginTop: 10 }]}
          >
            <SparklesIcon size={12} color="#fff" />
            <Text style={s.primaryActionBtnText}>Start Review Now</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.reviewBody}>
          {/* Plain-English Coach Summary */}
          <View style={[s.coachBanner, { backgroundColor: colors.paper, borderColor: colors.forest }]}>
            <Text style={[s.coachEyebrow, { color: colors.forest }]}>SAIPH'S SIMPLE SUMMARY</Text>
            <Text style={[s.coachText, { color: colors.ink }]}>{review.coach_summary}</Text>
          </View>

          {/* 3 Score Cards: Overall Quality, Originality (Plagiarism), Human Tone (AI Check) */}
          <View style={s.scoreRow}>
            {/* Quality Score */}
            <View style={[s.scoreCard, { backgroundColor: colors.paper, borderColor: colors.line }]}>
              <Text style={[s.scoreLabel, { color: colors.muted }]}>OVERALL STORY SCORE</Text>
              <Text style={[s.scoreBig, { color: colors.forest }]}>{review.quality_score}/100</Text>
              <Text style={[s.scoreVerdict, { color: colors.ink }]}>
                {review.word_count} words on branch "{review.branch_name || 'main'}"
              </Text>
            </View>

            {/* Plagiarism / Originality */}
            <View style={[s.scoreCard, { backgroundColor: colors.paper, borderColor: colors.line }]}>
              <Text style={[s.scoreLabel, { color: colors.muted }]}>PLAGIARISM CHECK</Text>
              <Text
                style={[
                  s.scoreBig,
                  { color: (plag.score || 0) < 15 ? '#16a34a' : (plag.score || 0) < 35 ? '#d97706' : '#dc2626' },
                ]}
              >
                {plag.originality_score ?? 100 - (plag.score || 0)}% Original
              </Text>
              <Text style={[s.scoreVerdict, { color: colors.ink }]}>
                {plag.verdict} ({plag.score || 0}% overlap)
              </Text>
              <Text style={[s.scoreNote, { color: colors.muted }]}>{plag.summary}</Text>
            </View>

            {/* AI Detection */}
            <View style={[s.scoreCard, { backgroundColor: colors.paper, borderColor: colors.line }]}>
              <Text style={[s.scoreLabel, { color: colors.muted }]}>AI-WRITING CHECK</Text>
              <Text
                style={[
                  s.scoreBig,
                  { color: (aiCheck.ai_probability || 0) < 35 ? '#16a34a' : (aiCheck.ai_probability || 0) < 60 ? '#d97706' : '#dc2626' },
                ]}
              >
                {aiCheck.human_score ?? 100 - (aiCheck.ai_probability || 0)}% Human Tone
              </Text>
              <Text style={[s.scoreVerdict, { color: colors.ink }]}>
                {aiCheck.verdict} ({aiCheck.ai_probability || 0}% AI probability)
              </Text>
              <Text style={[s.scoreNote, { color: colors.muted }]}>{aiCheck.summary}</Text>
            </View>
          </View>

          {/* Flagged Plagiarism Matches (if any) */}
          {Array.isArray(plag.matches) && plag.matches.length > 0 && (
            <View style={[s.alertBox, { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }]}>
              <Text style={s.alertTitle}>Overlap Found with Other Articles:</Text>
              {plag.matches.map((m, idx) => (
                <Text key={idx} style={s.alertItem}>
                  • <Text style={{ fontWeight: '700' }}>{m.title}</Text> ({m.similarity_percent}% match) — "{m.sample_match}"
                </Text>
              ))}
            </View>
          )}

          {/* Flagged Robotic / AI Phrases (if any) */}
          {Array.isArray(aiCheck.flagged_phrases) && aiCheck.flagged_phrases.length > 0 && (
            <View style={[s.alertBox, { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }]}>
              <Text style={s.alertTitle}>Robotic / Cliché Phrases to Replace:</Text>
              <Text style={s.alertItem}>
                Try removing or simplifying: {aiCheck.flagged_phrases.map((p) => `"${p}"`).join(', ')}
              </Text>
            </View>
          )}

          {/* Simple Step-by-Step Improvements */}
          <Text style={[s.improvementsHeader, { color: colors.ink }]}>
            Where to Improve (In Simple Terms)
          </Text>
          <View style={s.improvementsList}>
            {improvements.map((tip, idx) => (
              <View
                key={idx}
                style={[s.improvementCard, { backgroundColor: colors.paper, borderColor: colors.line }]}
              >
                <View style={s.improvementHeaderRow}>
                  <View style={[s.stepNumberBadge, { backgroundColor: colors.forest }]}>
                    <Text style={s.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={[s.improvementArea, { color: colors.ink }]}>{tip.area}</Text>
                </View>

                <Text style={[s.improvementProblem, { color: colors.ink }]}>
                  <Text style={{ fontWeight: '700' }}>What's happening: </Text>
                  {tip.problem}
                </Text>
                <Text style={[s.improvementFix, { color: colors.forest }]}>
                  <Text style={{ fontWeight: '700' }}>How to fix it: </Text>
                  {tip.how_to_fix}
                </Text>


              </View>
            ))}
          </View>
        </View>
      )}
    </View>
    </ScrollView>
  );
}

// ─── 4. 1-to-1 AI Agent Modal / Drawer (With Short & Long-Term Memory) ────────

const RESERVED_BRANCH_WORDS = new Set([
  'a', 'an', 'new', 'the', 'branch', 'it', 'this', 'another',
  'mindmap', 'board', 'review', 'draft', 'editor', 'chat', 'memory',
  'yes', 'no', 'ok', 'okay', 'sure', 'thanks', 'help', 'hi', 'hello',
]);

export function resolveClientBranchIntent(userText = '', replyText = '', branches = [], activeBranch = 'main') {
  const cleanUser = String(userText || '').trim();
  const cleanReply = String(replyText || '').trim();
  const existingNames = new Set(
    (Array.isArray(branches) ? branches : []).map((b) =>
      String(typeof b === 'string' ? b : b?.name || '').toLowerCase()
    ).filter(Boolean)
  );
  existingNames.add('main');

  const nextAutoName = () => {
    let idx = 2;
    while (existingNames.has(`draft-v${idx}`)) {
      idx += 1;
    }
    return `draft-v${idx}`;
  };

  let targetName = null;

  // 1. Explicit "switch to a new branch" / "create a new branch [called X]"
  const newBranchMatch =
    cleanUser.match(/(?:switch|change|move|go|jump|checkout)\s+(?:to\s+)?(?:a\s+|an\s+)?new\s+branch(?:\s+(?:called|named|as)\s+[`"'\*]*([a-zA-Z0-9_-]+)[`"'\*]*)?/i) ||
    cleanUser.match(/(?:create|fork|make|start)\s+(?:a\s+|an\s+)?(?:new\s+)?branch(?:\s+(?:called|named|as)?\s*[`"'\*]*([a-zA-Z0-9_-]+)[`"'\*]*)?/i);

  if (newBranchMatch) {
    const candidate = (newBranchMatch[1] || '').trim().toLowerCase();
    targetName = candidate && !RESERVED_BRANCH_WORDS.has(candidate) ? candidate : nextAutoName();
  }

  // 2. Explicit "switch to [branch] X" / "checkout X"
  if (!targetName) {
    const switchMatch = cleanUser.match(
      /(?:switch|change|move|go|jump|checkout)\s+(?:back\s+)?(?:to\s+|into\s+|on\s+)?(?:the\s+)?(?:branch\s+)?[`"'\*]*([a-zA-Z0-9_-]+)[`"'\*]*/i
    );
    if (switchMatch) {
      const candidate = switchMatch[1].trim().toLowerCase();
      if (candidate && !RESERVED_BRANCH_WORDS.has(candidate)) {
        targetName = candidate;
      }
    }
  }

  // 3. Reply text claims a branch was created or switched (truthfulness safety net)
  if (!targetName && cleanReply) {
    const replyMatch =
      cleanReply.match(/(?:created|forked)\s+(?:a\s+)?(?:new\s+)?branch\s+(?:called|named)?\s*[`"'\*]+([a-zA-Z0-9_-]+)[`"'\*]+/i) ||
      cleanReply.match(/switched\s+(?:the\s+workspace\s+)?to\s+(?:branch\s+)?[`"'\*]+([a-zA-Z0-9_-]+)[`"'\*]+/i);
    if (replyMatch) {
      const candidate = replyMatch[1].trim().toLowerCase();
      if (candidate && !RESERVED_BRANCH_WORDS.has(candidate)) {
        targetName = candidate;
      }
    }
  }

  // 4. Bare branch slug (e.g. user replied "draft-v2" or "main")
  if (!targetName) {
    const bareMatch = cleanUser.match(/^[`"'\*]*([a-zA-Z0-9_-]{2,40})[`"'\*]*$/);
    if (bareMatch) {
      const candidate = bareMatch[1].trim().toLowerCase();
      if (
        !RESERVED_BRANCH_WORDS.has(candidate) &&
        (existingNames.has(candidate) || /^draft-v\d+$/i.test(candidate) || candidate.includes('-'))
      ) {
        targetName = candidate;
      }
    }
  }

  if (!targetName) return null;
  const normalized = targetName.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!normalized) return null;

  if (existingNames.has(normalized)) {
    return { action: 'switch', branchName: normalized };
  }
  return { action: 'create', branchName: normalized };
}

export function SaiphAgentModal({
  visible,
  onClose,
  article = null, // { id, title, branchId }
  articleId: propArticleId = null,
  branchId: propBranchId = null,
  articleTitle = null,
  activeBranch = 'main',
  branches = [],
  onSelectBranch = null,
  onCreateBranch = null,
  onWorkspaceUpdated = () => {},
  onInsertToDraft = null,
  onJumpToSection = null,
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [tab, setTab] = useState('chat'); // 'chat' | 'memory'
  const [messages, setMessages] = useState([]);
  const [memories, setMemories] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New explicit memory input
  const [newMemoryFact, setNewMemoryFact] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('fact');
  const [savingMemory, setSavingMemory] = useState(false);

  const scrollRef = useRef(null);
  const articleId = propArticleId || article?.id || null;
  const branchId = propBranchId || article?.branchId || null;
  const resolvedArticle = article || (articleId ? { id: articleId, title: articleTitle || 'Current Article', branchId } : null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoadingHistory(true);
    fetchAgentChat(articleId)
      .then((data) => {
        if (cancelled) return;
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        setMemories(Array.isArray(data?.memories) ? data.memories : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, articleId]);

  const handleSend = async (presetPrompt = null) => {
    const text = (presetPrompt ?? input).trim();
    if (!text || sending) return;

    const optimisticUserMsg = {
      message_id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    if (!presetPrompt) setInput('');
    setSending(true);

    try {
      const res = await sendAgentMessage({
        content: text,
        articleId,
        branchId,
      });

      const ws = res.workspace || {};
      const assistantActions = Array.isArray(res.actions_taken) ? [...res.actions_taken] : [];

      if (Object.keys(ws).length > 0) {
        onWorkspaceUpdated(ws);
      } else if (resolvedArticle) {
        const branchIntent = resolveClientBranchIntent(text, res.reply, branches, activeBranch);
        if (branchIntent) {
          if (branchIntent.action === 'switch' && onSelectBranch) {
            await onSelectBranch(branchIntent.branchName);
            assistantActions.push(`switched_branch:${branchIntent.branchName}`);
          } else if (branchIntent.action === 'create' && onCreateBranch) {
            await onCreateBranch(branchIntent.branchName, activeBranch || 'main');
            assistantActions.push(`created_branch:${branchIntent.branchName}`);
          }
        }
      }

      const assistantMsg = {
        message_id: res.message_id || `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        actions_taken: assistantActions,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (Array.isArray(res.memories)) {
        setMemories(res.memories);
      }
    } catch (err) {
      showToast({ message: err?.message || 'Saiph could not respond right now.', type: 'error' });
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  };

  const handleAddMemory = async () => {
    const clean = newMemoryFact.trim();
    if (!clean || savingMemory) return;
    setSavingMemory(true);
    try {
      const created = await saveAgentMemory({
        fact: clean,
        category: newMemoryCategory,
        articleId,
      });
      setMemories((prev) => [created, ...prev]);
      setNewMemoryFact('');
      showToast({ message: 'Saved to Saiph long-term memory.', type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not save memory.', type: 'error' });
    } finally {
      setSavingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      await deleteAgentMemory(memoryId);
      setMemories((prev) => prev.filter((m) => m.memory_id !== memoryId));
      showToast({ message: 'Memory removed.', type: 'info' });
    } catch (err) {
      showToast({ message: err?.message || 'Could not remove memory.', type: 'error' });
    }
  };

  const quickPrompts = resolvedArticle
    ? [
        { label: 'Write Full Draft', prompt: 'Write a draft for this article based on the headline and summary.' },
        { label: '+ New Branch', prompt: 'Switch to a new branch' },
        ...(activeBranch && activeBranch !== 'main'
          ? [{ label: 'Switch to Main', prompt: 'Switch to branch main' }]
          : []),
        { label: 'Expand Draft', prompt: 'Expand this draft with a new section and deeper analysis.' },
        { label: 'Check Plagiarism & AI', prompt: 'Review my article, check for plagiarism and AI phrasing, and tell me how to improve in simple terms.' },
        { label: 'Build Mindmap', prompt: 'Generate a mindmap for this article.' },
        { label: 'Suggest Sources', prompt: 'Update the board with editorial suggestions and sources for this story.' },
      ]
    : [
        { label: 'Write New Article', prompt: 'Write an article about municipal water infrastructure contracts and budget audits.' },
        { label: 'Remember my style', prompt: 'Remember that I prefer clear, punchy sentences under 20 words and AP style.' },
      ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[s.agentDrawer, { backgroundColor: colors.cardBg, borderColor: colors.line }]}>
          {/* Header */}
          <View style={[s.agentHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[s.agentAvatar, { backgroundColor: colors.forest }]}>
                <SparklesIcon size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.agentEyebrow, { color: colors.orange }]}>1-ON-1 EDITORIAL AI PARTNER</Text>
                <Text style={[s.agentTitle, { color: colors.ink }]} numberOfLines={1}>
                  Saiph AI {resolvedArticle ? `• ${resolvedArticle.title}` : '• Workspace'}
                </Text>
                <Text style={[s.agentMeta, { color: colors.muted }]} numberOfLines={1}>
                  {resolvedArticle
                    ? `Active branch: ${activeBranch} • ${memories.length} saved memories`
                    : `Global Editorial Memory (${memories.length} notes)`}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={[s.closeModalBtn, { backgroundColor: colors.note }]}>
              <Text style={[s.closeModalBtnText, { color: colors.ink }]}>✕</Text>
            </Pressable>
          </View>

          {/* Sub-Tabs: 1-to-1 Chat vs Memory Bank */}
          <View style={[s.agentTabsRow, { borderBottomColor: colors.line, backgroundColor: colors.sidebarBg }]}>
            <Pressable
              onPress={() => setTab('chat')}
              style={[
                s.agentTabBtn,
                tab === 'chat' && [s.agentTabBtnActive, { borderBottomColor: colors.forest }],
              ]}
            >
              <Text style={[s.agentTabText, { color: tab === 'chat' ? colors.forest : colors.muted }]}>
                1-to-1 Conversation
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('memory')}
              style={[
                s.agentTabBtn,
                tab === 'memory' && [s.agentTabBtnActive, { borderBottomColor: colors.forest }],
              ]}
            >
              <Text style={[s.agentTabText, { color: tab === 'memory' ? colors.forest : colors.muted }]}>
                Agent Memory ({memories.length})
              </Text>
            </Pressable>
          </View>

          {tab === 'chat' ? (
            <>
              {/* Quick Action Chips */}
              <View style={[s.quickChipsBar, { borderBottomColor: colors.line }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 14 }}>
                  {quickPrompts.map((qp, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSend(qp.prompt)}
                      disabled={sending}
                      style={[s.quickChip, { backgroundColor: colors.paper, borderColor: colors.line }]}
                    >
                      <SparklesIcon size={10} color={colors.forest} />
                      <Text style={[s.quickChipText, { color: colors.ink }]}>{qp.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Messages Scroll */}
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={s.chatMessagesList}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
              >
                {loadingHistory ? (
                  <ActivityIndicator color={colors.forest} style={{ marginTop: 24 }} />
                ) : messages.length === 0 ? (
                  <View style={[s.welcomeAgentCard, { backgroundColor: colors.paper, borderColor: colors.line }]}>
                    <Text style={[s.welcomeAgentTitle, { color: colors.ink }]}>
                      Hi! I'm Saiph, your 1-on-1 article agent.
                    </Text>
                    <Text style={[s.welcomeAgentBody, { color: colors.muted }]}>
                      I remember key facts across sessions and can do everything for your article:
                      {'\n'}• Generate or rewrite drafts from a short summary
                      {'\n'}• Build interactive Mindmaps & curate your Board with sources
                      {'\n'}• Run plagiarism & AI-writing checks and explain how to improve in simple terms
                      {'\n'}• Fork branches (e.g. "Create a branch called water-audit")
                      {'\n'}• Save facts when you say "Remember that..."
                    </Text>
                  </View>
                ) : (
                  messages.map((m) => {
                    const isUser = m.role === 'user';
                    return (
                      <View
                        key={m.message_id}
                        style={[s.chatBubbleWrap, isUser ? s.chatBubbleWrapUser : s.chatBubbleWrapAi]}
                      >
                        <Text style={[s.chatSenderLabel, { color: colors.muted }]}>
                          {isUser ? 'You' : 'Saiph AI'}
                        </Text>
                        <View
                          style={[
                            s.chatBubble,
                            isUser
                              ? { backgroundColor: colors.forest }
                              : { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
                          ]}
                        >
                          <MarkdownRenderer
                            content={m.content}
                            isUser={isUser}
                            customColors={colors}
                          />

                          {/* Actions Taken Pills */}
                          {Array.isArray(m.actions_taken) && m.actions_taken.length > 0 && (
                            <View style={s.actionsTakenList}>
                              {m.actions_taken.map((act, idx) => {
                                const targetSec =
                                  act.type === 'mindmap_generated'
                                    ? 'mindmap'
                                    : act.type === 'board_updated'
                                      ? 'board'
                                      : act.type === 'review_completed'
                                        ? 'review'
                                        : act.type === 'draft_updated' || act.type === 'article_created'
                                          ? 'article'
                                          : null;
                                return (
                                  <Pressable
                                    key={idx}
                                    onPress={() => targetSec && onJumpToSection && onJumpToSection(targetSec)}
                                    style={s.actionTakenPill}
                                  >
                                    <Text style={s.actionTakenText}>
                                      ✓ {act.label}{targetSec && onJumpToSection ? ' (View →)' : ''}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          )}

                          {/* One-click Insert Reply into Draft */}
                          {!isUser && resolvedArticle && onInsertToDraft && (
                            <View style={{ marginTop: 8, flexDirection: 'row' }}>
                              <Pressable
                                onPress={() => onInsertToDraft(m.content)}
                                style={[s.leafInsertBtn, { borderColor: colors.line, backgroundColor: colors.cardBg }]}
                              >
                                <Text style={[s.leafInsertBtnText, { color: colors.forest }]}>
                                  + Insert Reply into Draft
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Composer */}
              <View style={[s.chatComposer, { borderTopColor: colors.line, backgroundColor: colors.headerBg }]}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => handleSend()}
                  placeholder={
                    article
                      ? `Ask Saiph about "${article.title}" or say "Remember that..."`
                      : 'Ask Saiph anything or say "Remember that..."'
                  }
                  placeholderTextColor={colors.muted}
                  style={[s.chatInput, { color: colors.ink, backgroundColor: colors.inputBg, borderColor: colors.line }]}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={() => handleSend()}
                  disabled={sending || !input.trim()}
                  style={[
                    s.sendBtn,
                    { backgroundColor: colors.forest },
                    (sending || !input.trim()) && { opacity: 0.5 },
                  ]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.sendBtnText}>Send</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* ─── Memory Bank Tab ─── */
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.memoryListWrap}>
              <View style={[s.addMemoryCard, { backgroundColor: colors.paper, borderColor: colors.line }]}>
                <Text style={[s.addMemoryLabel, { color: colors.ink }]}>
                  SAVE A FACT OR PREFERENCE TO SAIPH'S LONG-TERM MEMORY
                </Text>
                <Text style={[s.addMemoryHint, { color: colors.muted }]}>
                  Saiph automatically recalls these notes whenever working on {article ? `"${article.title}"` : 'your stories'}.
                </Text>

                <View style={s.memoryCatRow}>
                  {[
                    { id: 'fact', label: 'Verified Fact' },
                    { id: 'source', label: 'Source' },
                    { id: 'style', label: 'Style Rule' },
                    { id: 'goal', label: 'Story Goal' },
                  ].map((c) => {
                    const active = newMemoryCategory === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setNewMemoryCategory(c.id)}
                        style={[
                          s.memCatChip,
                          { borderColor: active ? colors.forest : colors.line },
                          active && { backgroundColor: colors.forest },
                        ]}
                      >
                        <Text style={[s.memCatChipText, { color: active ? '#fff' : colors.ink }]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    value={newMemoryFact}
                    onChangeText={setNewMemoryFact}
                    onSubmitEditing={handleAddMemory}
                    placeholder="e.g. Auditor-General confirmed $14M contract value on Tuesday..."
                    placeholderTextColor={colors.muted}
                    style={[s.chatInput, { flex: 1, color: colors.ink, backgroundColor: colors.inputBg, borderColor: colors.line }]}
                  />
                  <Pressable
                    onPress={handleAddMemory}
                    disabled={savingMemory || !newMemoryFact.trim()}
                    style={[
                      s.sendBtn,
                      { backgroundColor: colors.forest },
                      (savingMemory || !newMemoryFact.trim()) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={s.sendBtnText}>Save</Text>
                  </Pressable>
                </View>
              </View>

              {memories.length === 0 ? (
                <Text style={[s.emptyMemText, { color: colors.muted }]}>
                  No memories saved yet. Add a note above or tell Saiph "Remember that..." in chat.
                </Text>
              ) : (
                memories.map((mem) => (
                  <View
                    key={mem.memory_id}
                    style={[s.memoryItemCard, { backgroundColor: colors.paper, borderColor: colors.line }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.memoryItemBadge, { color: colors.forest }]}>
                        {(mem.category || 'fact').toUpperCase()} • {mem.scope === 'article' ? 'THIS STORY' : 'GLOBAL'}
                      </Text>
                      <Text style={[s.memoryItemFact, { color: colors.ink }]}>{mem.fact}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteMemory(mem.memory_id)}
                      style={s.deleteMemBtn}
                      accessibilityLabel="Delete memory"
                    >
                      <Text style={{ color: colors.muted, fontWeight: '700' }}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sectionWrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
    flexWrap: 'wrap',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 7,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Mindmap
  mindmapCanvas: {
    padding: 18,
    alignItems: 'center',
  },
  rootHubCard: {
    width: '100%',
    maxWidth: 520,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  rootHubEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rootHubTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: 3,
  },
  rootHubSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  stemContainer: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  verticalStem: {
    width: 2,
    height: 18,
  },
  horizontalBus: {
    width: '72%',
    height: 2,
  },
  mindmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    width: '100%',
    marginTop: 10,
  },
  mindmapBranchCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 250,
    borderWidth: 1.5,
    borderRadius: 9,
    padding: 14,
  },
  branchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  branchIndexText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  branchNodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  branchNodeSummary: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  childLeavesList: {
    borderTopWidth: 1,
    paddingTop: 9,
    gap: 7,
  },
  childLeafRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  leafDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  childLeafLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  childLeafNote: {
    fontSize: 11,
    marginTop: 1,
  },
  leafInsertBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  leafInsertBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Board
  boardFilterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  boardGrid: {
    padding: 16,
    gap: 12,
  },
  boardCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  boardCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  highPriorityBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highPriorityText: {
    color: '#991b1b',
    fontSize: 9,
    fontWeight: '800',
  },
  boardCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  boardCardDetail: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  snippetBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  snippetLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  snippetText: {
    fontSize: 12,
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  boardCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  boardInsertBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  boardInsertBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  boardDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  boardDoneBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Review
  emptyReviewBox: {
    padding: 28,
    alignItems: 'center',
  },
  emptyReviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyReviewSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 520,
  },
  reviewBody: {
    padding: 16,
    gap: 14,
  },
  coachBanner: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 14,
  },
  coachEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  coachText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scoreCard: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  scoreBig: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  scoreVerdict: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreNote: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  alertTitle: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '800',
  },
  alertItem: {
    color: '#78350f',
    fontSize: 12,
    lineHeight: 17,
  },
  improvementsHeader: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'serif',
    marginTop: 4,
  },
  improvementsList: {
    gap: 10,
  },
  improvementCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  improvementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  improvementArea: {
    fontSize: 14,
    fontWeight: '700',
  },
  improvementProblem: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  improvementFix: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  exampleBox: {
    marginTop: 4,
    padding: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  exampleText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },

  // 1-to-1 AI Agent Drawer
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  agentDrawer: {
    width: '100%',
    maxWidth: 460,
    height: '100%',
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 14,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  agentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  agentMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  closeModalBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  agentTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  agentTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  agentTabBtnActive: {
    borderBottomWidth: 2,
  },
  agentTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickChipsBar: {
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chatMessagesList: {
    padding: 14,
    gap: 12,
  },
  welcomeAgentCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  welcomeAgentTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  welcomeAgentBody: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  chatBubbleWrap: {
    maxWidth: '88%',
  },
  chatBubbleWrapUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  chatBubbleWrapAi: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  chatSenderLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  chatBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionsTakenList: {
    marginTop: 8,
    gap: 4,
  },
  actionTakenPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionTakenText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '700',
  },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  memoryListWrap: {
    padding: 14,
    gap: 10,
  },
  addMemoryCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  addMemoryLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  addMemoryHint: {
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 8,
  },
  memoryCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memCatChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  memCatChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyMemText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 20,
  },
  memoryItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 11,
    gap: 8,
  },
  memoryItemBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  memoryItemFact: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  deleteMemBtn: {
    padding: 6,
  },
});
