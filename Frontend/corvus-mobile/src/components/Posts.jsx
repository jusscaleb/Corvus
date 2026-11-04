import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserPosts } from '../services/api';

const STATUS_TABS = [
  'My Posts',
  'Drafts',
  'Submitted',
  'Under Review',
  'Published',
  'Rejected',
];

export default function Posts({ submissions = [], onNavigateTab }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('My Posts');
  const [backendArticles, setBackendArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Load articles from backend for authenticated user
  useEffect(() => {
    let isMounted = true;
    async function loadUserContent() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await fetchUserPosts();
        if (isMounted && Array.isArray(data)) {
          // Normalize backend articles into post records
          const normalized = data.map((art) => {
            const mainBranch = art.branches?.find((b) => b.is_main) || art.branches?.[0] || {};
            let status = 'Draft';
            if (mainBranch.status === 'in_review') status = 'Under Review';
            else if (mainBranch.status === 'merged' || mainBranch.is_public) status = 'Published';
            else if (mainBranch.status === 'draft') status = 'Draft';

            return {
              id: art.article_id,
              headline: art.title || 'Untitled Story',
              details: mainBranch.content || mainBranch.branch_description || 'Editorial workspace draft.',
              category: art.group_name || 'General News',
              urgency: 'Newsroom Draft',
              status: status,
              submittedDate: art.created_at
                ? new Date(art.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent',
              submittedAt: art.created_at
                ? new Date(art.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '12:00 PM',
              location: 'Editorial Newsroom',
              contactInfo: user.email || user.username,
              isBackendArticle: true,
            };
          });
          setBackendArticles(normalized);
        }
      } catch (err) {
        // Silently retain local session submissions
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserContent();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combine user's submitted leads from session + backend articles
  const allPosts = useMemo(() => {
    const sessionPosts = submissions.map((sub) => ({
      ...sub,
      status: sub.status || 'Under Review',
    }));
    return [...sessionPosts, ...backendArticles];
  }, [submissions, backendArticles]);

  // Filter posts based on active status tab
  const filteredPosts = useMemo(() => {
    if (activeTab === 'My Posts') return allPosts;
    return allPosts.filter((post) => {
      if (activeTab === 'Drafts') return post.status === 'Draft';
      if (activeTab === 'Submitted') return post.status === 'Submitted' || post.status === 'Under Review';
      if (activeTab === 'Under Review') return post.status === 'Under Review';
      if (activeTab === 'Published') return post.status === 'Published';
      if (activeTab === 'Rejected') return post.status === 'Rejected';
      return true;
    });
  }, [allPosts, activeTab]);

  const styles = makeStyles(colors, isDark);

  // Helper for status badge styling
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Published':
        return {
          borderColor: colors.forest || '#315E4A',
          backgroundColor: '#E4EAE0',
          textColor: colors.forestDark || '#244735',
        };
      case 'Under Review':
        return {
          borderColor: colors.orange || '#C84B31',
          backgroundColor: '#F4E4DB',
          textColor: '#A03820',
        };
      case 'Submitted':
        return {
          borderColor: colors.blue || '#2096FF',
          backgroundColor: '#E6F2FF',
          textColor: '#0B68C2',
        };
      case 'Rejected':
        return {
          borderColor: '#991B1B',
          backgroundColor: '#FDF2F2',
          textColor: '#991B1B',
        };
      case 'Draft':
      default:
        return {
          borderColor: colors.muted || '#6B6860',
          backgroundColor: colors.note || '#EAE5D5',
          textColor: colors.ink || '#1A1A1A',
        };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Page Header */}
      <View style={styles.headerBlock}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerDash} />
          <Text style={styles.kickerText}>SUBMISSION & EDITORIAL STATUS</Text>
        </View>
        <Text style={styles.pageTitle}>Posts</Text>
        <Text style={styles.pageSubtitle}>
          Track the review status of stories, drafts, and investigative leads submitted to the editorial desk.
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Guest notice if not authenticated */}
      {!user && (
        <View style={styles.guestNotice}>
          <Text style={styles.guestNoticeTitle}>GUEST INTAKE SESSION</Text>
          <Text style={styles.guestNoticeText}>
            Showing stories and leads submitted during this session. To manage collaborative drafts and
            participate in newsroom discussions, sign in to your reporter account.
          </Text>
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.guestSignInBtnText}>Reporter Sign In →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.statusTab, isActive && styles.statusTabActive]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.statusTabText, isActive && styles.statusTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.forest} size="small" />
          <Text style={styles.loadingText}>Syncing submission records with desk...</Text>
        </View>
      )}

      {/* Empty State */}
      {filteredPosts.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIcon}>📋</Text>
          </View>
          <Text style={styles.emptyHeadline}>No submissions in "{activeTab}"</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Drafts'
              ? 'You have no unsent drafts saved at this time.'
              : activeTab === 'Under Review'
              ? 'No investigative leads are currently queued under editorial review.'
              : activeTab === 'Published'
              ? 'No stories have reached published status yet.'
              : 'You have not submitted any stories or leads yet.'}
          </Text>
          {onNavigateTab && (
            <TouchableOpacity
              style={styles.submitNewBtn}
              onPress={() => onNavigateTab('submit')}
            >
              <Text style={styles.submitNewBtnText}>Submit a Lead Now →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Posts List */}
      <View style={styles.postsList}>
        {filteredPosts.map((post) => {
          const badgeStyle = getStatusBadgeStyle(post.status);

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Card Topline: Desk & Status Badge */}
              <View style={styles.cardTopline}>
                <View style={styles.deskTagRow}>
                  <Text style={styles.deskTagText}>{(post.category || 'GENERAL').toUpperCase()}</Text>
                  {post.urgency && (
                    <Text style={styles.urgencyTag}>• {post.urgency.toUpperCase()}</Text>
                  )}
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: badgeStyle.borderColor,
                      backgroundColor: badgeStyle.backgroundColor,
                    },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: badgeStyle.textColor }]}>
                    {post.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Post Title */}
              <Text style={styles.postHeadline}>{post.headline}</Text>

              {/* Origin / Location Tag */}
              {post.location && post.location !== 'Unspecified Location' && (
                <Text style={styles.locationTag}>📍 Origin: {post.location}</Text>
              )}

              {/* Details Excerpt */}
              <Text style={styles.postExcerpt} numberOfLines={3}>
                {post.details}
              </Text>

              {/* Card Footer: Metadata & Actions */}
              <View style={styles.cardFooter}>
                <View style={styles.metaInfo}>
                  <Text style={styles.metaDate}>
                    {post.submittedDate || 'Today'} • {post.submittedAt || ''}
                  </Text>
                  <Text style={styles.metaSource}>
                    Source: {post.isAnonymous ? 'Anonymous' : (post.contactInfo || 'Confidential')}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedPost(post)}
                  >
                    <Text style={styles.viewDetailsBtnText}>View Details</Text>
                  </TouchableOpacity>

                  {user && post.isBackendArticle && (
                    <TouchableOpacity
                      style={styles.workspaceBtn}
                      onPress={() => router.push('/main_screen')}
                    >
                      <Text style={styles.workspaceBtnText}>Open in Workspace ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Modal: View Full Post Details */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalCategory}>
                  {(selectedPost?.category || 'NEWS DESK').toUpperCase()} • {selectedPost?.urgency}
                </Text>
                <Text style={styles.modalTitle}>{selectedPost?.headline}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Review Status:</Text>
                <Text style={styles.modalMetaValue}>{selectedPost?.status}</Text>
              </View>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Filed On:</Text>
                <Text style={styles.modalMetaValue}>
                  {selectedPost?.submittedDate} at {selectedPost?.submittedAt}
                </Text>
              </View>

              {selectedPost?.location && (
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Origin / Location:</Text>
                  <Text style={styles.modalMetaValue}>{selectedPost.location}</Text>
                </View>
              )}

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Source Identity:</Text>
                <Text style={styles.modalMetaValue}>
                  {selectedPost?.isAnonymous ? 'Anonymous Tipster' : (selectedPost?.contactInfo || 'Confidential')}
                </Text>
              </View>

              {selectedPost?.evidenceNotes && (
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Attached Notes:</Text>
                  <Text style={styles.modalMetaValue}>{selectedPost.evidenceNotes}</Text>
                </View>
              )}

              <View style={styles.modalDivider} />

              <Text style={styles.modalDetailsLabel}>FULL STORY TRANSMISSION:</Text>
              <Text style={styles.modalDetailsText}>{selectedPost?.details}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setSelectedPost(null)}
              >
                <Text style={styles.modalDoneBtnText}>Close Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors, isDark) {
  const paper = colors.paper || '#F7F4ED';
  const cardBg = colors.white || '#FFFFFF';
  const ink = colors.ink || '#1A1A1A';
  const muted = colors.muted || '#6B6860';
  const forest = colors.forest || '#315E4A';
  const forestDark = colors.forestDark || '#244735';
  const borderDark = '#1A1A1A';
  const line = colors.line || '#E0DED6';
  const note = colors.note || '#EAE5D5';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paper,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      maxWidth: 880,
      width: '100%',
      alignSelf: 'center',
    },
    headerBlock: {
      marginBottom: 14,
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    kickerDash: {
      width: 16,
      height: 2,
      backgroundColor: forest,
      marginRight: 6,
    },
    kickerText: {
      fontSize: 11,
      fontWeight: '800',
      color: forest,
      letterSpacing: 1,
    },
    pageTitle: {
      fontFamily: 'serif',
      fontSize: 32,
      fontWeight: '800',
      color: ink,
      lineHeight: 38,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontSize: 14,
      color: muted,
      lineHeight: 20,
      marginTop: 4,
    },
    divider: {
      height: 2,
      backgroundColor: ink,
      marginBottom: 20,
    },

    // Guest Notice
    guestNotice: {
      backgroundColor: note,
      borderWidth: 1,
      borderColor: borderDark,
      borderLeftWidth: 4,
      borderLeftColor: forest,
      padding: 14,
      marginBottom: 20,
      borderRadius: 2,
    },
    guestNoticeTitle: {
      fontFamily: 'serif',
      fontSize: 12,
      fontWeight: '800',
      color: forestDark,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    guestNoticeText: {
      fontSize: 12,
      color: ink,
      lineHeight: 18,
      marginBottom: 8,
    },
    guestSignInBtn: {
      alignSelf: 'flex-start',
    },
    guestSignInBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: forest,
      textDecorationLine: 'underline',
    },

    // Status Filter Tabs
    tabsContainer: {
      flexDirection: 'row',
      paddingBottom: 16,
      gap: 8,
    },
    statusTab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: borderDark,
      backgroundColor: cardBg,
      borderRadius: 2,
    },
    statusTabActive: {
      backgroundColor: forest,
      borderColor: forest,
    },
    statusTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: ink,
      letterSpacing: 0.4,
    },
    statusTabTextActive: {
      color: '#FFFFFF',
    },

    // Loading State
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      color: muted,
      fontStyle: 'italic',
    },

    // Empty State
    emptyContainer: {
      paddingVertical: 48,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      marginVertical: 12,
    },
    emptyIconBox: {
      marginBottom: 10,
    },
    emptyIcon: {
      fontSize: 34,
    },
    emptyHeadline: {
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '700',
      color: ink,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: muted,
      textAlign: 'center',
      maxWidth: 440,
      lineHeight: 19,
      marginBottom: 16,
    },
    submitNewBtn: {
      backgroundColor: forest,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 2,
    },
    submitNewBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    // Posts List & Cards
    postsList: {
      gap: 16,
    },
    postCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      padding: 18,
    },
    cardTopline: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
      gap: 8,
    },
    deskTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    deskTagText: {
      fontSize: 11,
      fontWeight: '800',
      color: ink,
      letterSpacing: 0.6,
    },
    urgencyTag: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.orange || '#C84B31',
    },
    statusBadge: {
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 2,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    postHeadline: {
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '700',
      color: ink,
      lineHeight: 24,
      marginBottom: 6,
    },
    locationTag: {
      fontSize: 12,
      color: muted,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    postExcerpt: {
      fontSize: 13,
      color: muted,
      lineHeight: 19,
      marginBottom: 14,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: line,
      paddingTop: 12,
      flexWrap: 'wrap',
      gap: 10,
    },
    metaInfo: {
      flexShrink: 1,
    },
    metaDate: {
      fontSize: 11,
      color: ink,
      fontWeight: '600',
    },
    metaSource: {
      fontSize: 11,
      color: muted,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    viewDetailsBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: borderDark,
      backgroundColor: cardBg,
      borderRadius: 2,
    },
    viewDetailsBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: ink,
    },
    workspaceBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: forest,
      borderRadius: 2,
    },
    workspaceBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 620,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      maxHeight: '85%',
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: borderDark,
    },
    modalCategory: {
      fontSize: 11,
      fontWeight: '800',
      color: forest,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    modalTitle: {
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '800',
      color: ink,
      lineHeight: 24,
      maxWidth: 480,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalCloseText: {
      fontSize: 18,
      color: ink,
      fontWeight: '700',
    },
    modalBody: {
      padding: 18,
    },
    modalMetaRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    modalMetaLabel: {
      width: 140,
      fontSize: 12,
      fontWeight: '700',
      color: muted,
    },
    modalMetaValue: {
      flex: 1,
      fontSize: 12,
      color: ink,
      fontWeight: '600',
    },
    modalDivider: {
      height: 1,
      backgroundColor: line,
      marginVertical: 14,
    },
    modalDetailsLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: muted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    modalDetailsText: {
      fontSize: 14,
      lineHeight: 22,
      color: ink,
    },
    modalFooter: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: line,
      alignItems: 'flex-end',
    },
    modalDoneBtn: {
      backgroundColor: forest,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 2,
    },
    modalDoneBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
