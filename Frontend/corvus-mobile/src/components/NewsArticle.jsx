import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { fetchPublicArticles } from '../services/api';
import { t, getTranslatedArticle, getCategoryTranslation } from '../services/userSiteTranslations';

const CATEGORIES = [
  'All',
  'Local News',
  'Technology',
  'Transit',
  'Environment',
  'Education',
  'Politics',
];

const INITIAL_ARTICLES = [
  {
    id: 'art-1',
    title: 'Investigation: Water Distribution Infrastructure and Urban Supply Deficits',
    category: 'Local News',
    author: 'Nyasha Moyo',
    authorRole: 'Senior Investigative Reporter',
    date: 'Nov 4, 2026',
    time: '08:45 AM',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    caption: 'Water distribution trunk lines undergoing emergency pipe replacement along the eastern corridor.',
    excerpt: 'An in-depth inquiry into municipal water trunk lines reveals recurring maintenance backlogs, unannounced pressure reductions, and community-led contingency responses across metropolitan wards.',
    content: `Residents across eastern metropolitan districts have experienced extended potable water supply interruptions over the past six weeks, prompting municipal authorities to convene emergency hearings with engineering inspectors.

Field audits conducted across three distribution zones documented recurring pressure drops at critical pumping junctures. Engineers attributed the primary bottleneck to aged cast-iron piping installed over four decades ago that has deteriorated under seasonal soil expansion.

According to municipal logbooks reviewed by Corvus, scheduled maintenance for the primary booster station was postponed twice in the preceding fiscal quarter due to supply chain delays for replacement pressure valves. In response, local resident coalitions have mobilized independent water-testing committees and shared logistics for regional tanker distribution.

The municipal engineering council announced that a targeted rehabilitation project will commence within the fortnight, prioritizing health facility supply lines and residential secondary mains before expanding to outer feeder grids.`,
    sources: 'Verified municipal maintenance logs, district engineer testimonies, and independent water purity assays conducted on Nov 2, 2026.',
  },
  {
    id: 'art-2',
    title: 'Regional Agricultural AI and Sensor Systems Reshape Smallholder Crop Forecasting',
    category: 'Technology',
    author: 'Kudakwashe Shumba',
    authorRole: 'Technology & Agribusiness Desk',
    date: 'Nov 3, 2026',
    time: '11:15 AM',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
    caption: 'Agronomists deploying low-power soil moisture sensors at a cooperative demonstration plot.',
    excerpt: 'Collaborative pilots combining edge computing sensors and multilingual SMS advisory feeds are empowering regional farming cooperatives to anticipate dry spells and optimize harvest yields.',
    content: `A decentralized consortium of regional agricultural researchers has deployed low-cost sensor nodes across twenty-two cooperative farming belts, bringing predictive microclimate modeling directly to rural smallholders.

The sensor network continuously tracks soil moisture saturation, ambient canopy temperatures, and relative humidity, transmitting telemetry over lightweight cellular packets to an open analytics repository. Agronomists translate these algorithmic models into actionable crop guidance disseminated in Shona, Ndebele, and English.

During the recent transition into the early planting cycle, cooperative members utilizing the predictive bulletins adjusted sowing dates by eleven days, mitigating initial seedling heat stress. The project leaders plan to expand the sensor network to include livestock waterhole monitoring before the upcoming dry interval.`,
    sources: 'Regional Agronomy Collaborative Report 2026; field surveys across Mashonaland and Matabeleland cooperative stations.',
  },
  {
    id: 'art-3',
    title: 'Commuter Rail Line Modernization: Electrification Feasibility and Route Timetables',
    category: 'Transit',
    author: 'Sipho Ndlovu',
    authorRole: 'Urban Infrastructure Reporter',
    date: 'Nov 3, 2026',
    time: '02:30 PM',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1515165562839-978bbcf18277?auto=format&fit=crop&w=1200&q=80',
    caption: 'Commuter rail terminus during early morning passenger boarding trials.',
    excerpt: 'Transport ministry planners release preliminary environmental and route assessments for high-capacity suburban electric train sets aimed at alleviating arterial highway congestion.',
    content: `Urban commuter corridors are poised for major operational restructuring under a modernized passenger rail overhaul submitted to the transport board this week.

The proposal outlines the phased introduction of dual-mode electric-diesel trainsets designed to operate on high-density radial lines connecting suburban population centres with core commercial districts. Estimated passenger capacity is projected to triple current diesel locomotive throughput while cutting average commute intervals by twenty-four minutes.

Financial feasibility audits indicate capital expenditure will be partially amortized through clean mobility development grants. Public consultations regarding station park-and-ride facilities and feeder minibus interchange points are scheduled across civic centres throughout the month.`,
    sources: 'Ministry of Transport Preliminary Railway Feasibility Dossier (Ref: TR-2026-088).',
  },
  {
    id: 'art-4',
    title: 'Reforestation Corridors Restore Watershed Ecology in Eastern Mountain Reserves',
    category: 'Environment',
    author: 'Chipo Mutasa',
    authorRole: 'Environmental Affairs Editor',
    date: 'Nov 2, 2026',
    time: '10:00 AM',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    caption: 'Native canopy saplings planted along riparian buffer zones to stabilize vulnerable riverbanks.',
    excerpt: 'Community-led forestry reserves report documented recovery of indigenous tree canopies and reduced soil runoff along vulnerable headwater tributaries.',
    content: `Five years after severe illegal logging depleted upper watershed catchments, a coordinated ecological rehabilitation program has restored continuous vegetative cover across 1,800 hectares of highland reserve terrain.

Community forest scouts working in partnership with conservation botanists planted more than 140,000 indigenous saplings, with an emphasis on taproot species that stabilize steep escarpment soils. Aerial lidar surveys confirmed that sediment runoff into downstream irrigation reservoirs has dropped by thirty-two percent since project inception.

Water quality testing at riverside collection stations indicates a measurable stabilization of year-round streamflow, ensuring dependable water access for downstream horticultural growers even during seasonal dry periods.`,
    sources: 'Eastern Highlands Watershed Conservation Conservancy annual ecological audit, October 2026.',
  },
  {
    id: 'art-5',
    title: 'Bilingual Digital Curricula Rolled Out Across Regional Primary School Classrooms',
    category: 'Education',
    author: 'Thabani Khumalo',
    authorRole: 'Education Policy Desk',
    date: 'Nov 1, 2026',
    time: '01:20 PM',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    caption: 'Primary school learners engaging with localized digital reading applications.',
    excerpt: 'Classroom pilot programs integrating vernacular language instruction alongside scientific literacy demonstrate marked gains in student retention and foundational numeracy.',
    content: `An educational curriculum initiative featuring simultaneous instruction in Shona, Ndebele, and English has been introduced across forty-eight pilot primary schools following successful regional testing.

Pedagogical researchers noted that children introduced to scientific and mathematical terminology in their primary home language before transitioning to standardized technical English showed a forty percent faster concept acquisition rate than traditional single-medium classrooms.

The education ministry plans to provide solar-rechargeable classroom tablets loaded with open educational courseware to an additional one hundred rural schools before the start of the upcoming academic calendar.`,
    sources: 'National Curriculum Development Institute pedagogical review; field assessments across pilot districts.',
  },
  {
    id: 'art-6',
    title: 'Parliamentary Committee Demands Transparency in Regional Mineral Concession Pacts',
    category: 'Politics',
    author: 'Farai Marange',
    authorRole: 'Parliamentary Bureau Chief',
    date: 'Oct 31, 2026',
    time: '04:10 PM',
    readTime: '7 min read',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    caption: 'Parliamentary committee chambers during public hearings on extractives governance.',
    excerpt: 'Legislators table a bipartisan resolution requiring full public disclosure of royalty schedules, community trust distributions, and environmental compliance bonds.',
    content: `In a landmark legislative session, the Parliamentary Portfolio Committee on Mines and Energy voted unanimously to mandate public registry publication for all extractive resource concessions exceeding ten million dollars in valuation.

The resolution mandates that concession contracts include itemized fiscal schedules detailing corporate tax contributions, surface rentals, and direct allocations earmarked for surrounding community development trusts. Lawmakers emphasized that historical ambiguities surrounding revenue-sharing mechanisms have disadvantaged district councils attempting to fund road and health infrastructure.

Industry representatives present during the legislative debate expressed conditional endorsement, provided that fiscal disclosures maintain standard confidentiality protections for proprietary geological exploration models.`,
    sources: 'Parliamentary Hansard Official Records; Committee on Mines and Energy Report No. 14.',
  },
];

export default function NewsArticles({ selectedLang = 'EN', setSelectedLang }) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Responsive column calculation
  // Desktop (>= 992px): 3 columns
  // Tablet (640px - 991px): 2 columns
  // Mobile (< 640px): 1 column
  const isDesktop = width >= 992;
  const isTablet = width >= 640 && width < 992;
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  // Load published articles dynamically from existing backend
  useEffect(() => {
    let isMounted = true;
    async function loadBackendArticles() {
      try {
        setLoading(true);
        const backendData = await fetchPublicArticles();
        if (isMounted && Array.isArray(backendData) && backendData.length > 0) {
          // Normalize backend articles to match card view
          const formatted = backendData.map((item, index) => {
            const mainBranch = item.branches?.find((b) => b.is_main) || item.branches?.[0] || {};
            const content = mainBranch.content || '';
            const excerpt = mainBranch.branch_description || content.slice(0, 160) || 'Editorial report currently published on Corvus.';
            return {
              id: item.article_id || `backend-${index}`,
              title: item.title || 'Untitled Report',
              category: item.group_name || 'Investigation',
              author: item.author?.full_name || item.author?.username || 'Editorial Desk',
              authorRole: 'Corvus Contributor',
              date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 4, 2026',
              time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              readTime: `${Math.max(3, Math.ceil((content.length || 500) / 450))} min read`,
              excerpt: excerpt,
              content: content || excerpt,
              sources: 'Published via Corvus newsroom desk verification workflow.',
            };
          });

          // Prepend backend articles so they appear at the top, followed by curated baseline stories
          setArticles([...formatted, ...INITIAL_ARTICLES]);
        }
      } catch (err) {
        // Fallback smoothly to baseline editorial stories
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBackendArticles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter articles by category and search query
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Related articles for the detail view
  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    return articles
      .filter((a) => a.id !== selectedArticle.id)
      .slice(0, 3);
  }, [articles, selectedArticle]);

  const styles = makeStyles(colors, isDark);

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: INDIVIDUAL ARTICLE DETAIL
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedArticle) {
    return (
      <ScrollView style={styles.detailContainer} contentContainerStyle={styles.detailContentContainer}>
        {/* Back navigation */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedArticle(null)}
          accessibilityRole="button"
          accessibilityLabel="Back to news articles"
        >
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>{t('backToDispatches', selectedLang)}</Text>
        </TouchableOpacity>

        {/* Category & Kicker */}
        <View style={styles.detailCategoryRow}>
          <Text style={styles.detailCategoryBadge}>{detailArticle.category.toUpperCase()}</Text>
          <Text style={styles.detailTimeBadge}>
            {detailArticle.date} • {detailArticle.time}
          </Text>
        </View>

        {/* Headline */}
        <Text style={styles.detailHeadline}>{detailArticle.title}</Text>

        {/* Byline and author info */}
        <View style={styles.bylineBox}>
          <View style={styles.bylineAvatar}>
            <Text style={styles.bylineAvatarText}>
              {detailArticle.author.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.bylineInfo}>
            <Text style={styles.bylineAuthor}>{t('bylinePrefix', selectedLang)} {detailArticle.author}</Text>
            <Text style={styles.bylineRole}>
              {detailArticle.authorRole || 'Investigative Journalist'} • {detailArticle.readTime}
            </Text>
          </View>
        </View>

        {/* Featured Image if available */}
        {detailArticle.imageUrl && (
          <View style={styles.detailImageContainer}>
            <Image
              source={{ uri: detailArticle.imageUrl }}
              style={styles.detailImage}
              resizeMode="cover"
            />
            {detailArticle.caption && (
              <Text style={styles.detailImageCaption}>
                PHOTO DESK: {detailArticle.caption}
              </Text>
            )}
          </View>
        )}

        {/* Full Article Content */}
        <View style={styles.detailBodyContainer}>
          {detailArticle.content.split('\n\n').map((paragraph, index) => (
            <Text key={index} style={styles.detailParagraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Source verification block */}
        {detailArticle.sources && (
          <View style={styles.sourcesBox}>
            <Text style={styles.sourcesHeading}>{t('sourcesHeading', selectedLang)}</Text>
            <Text style={styles.sourcesText}>{detailArticle.sources}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Related Articles Section */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedHeading}>{t('relatedHeading', selectedLang)}</Text>
          <View style={[styles.relatedGrid, isDesktop && styles.relatedGridDesktop]}>
            {relatedArticles.map((rel) => (
              <TouchableOpacity
                key={rel.id}
                style={styles.relatedCard}
                onPress={() => {
                  setSelectedArticle(rel);
                }}
              >
                <Text style={styles.relatedCategory}>{rel.category.toUpperCase()}</Text>
                <Text style={styles.relatedTitle} numberOfLines={2}>
                  {rel.title}
                </Text>
                <Text style={styles.relatedMeta}>
                  By {rel.author} • {rel.readTime}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Back Action */}
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 28 }]}
          onPress={() => setSelectedArticle(null)}
        >
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>{t('backToDispatches', selectedLang)}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: MAIN NEWS ARTICLES PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Editorial Kicker */}
      <View style={styles.editionBanner}>
        <View style={styles.editionLeft}>
          <Text style={styles.editionTitle}>{t('newsBannerKicker', selectedLang)}</Text>
          <Text style={styles.editionSubtitle}>{t('newsBannerSubtitle', selectedLang)}</Text>
        </View>
        <Text style={styles.editionIssue}>CORVUS GAZETTE • ISSUE 2026.11</Text>
      </View>

      <View style={styles.mainDivider} />

      {/* Search and Category Filter Section */}
      <View style={styles.controlsSection}>
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder', selectedLang)}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search articles"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Dropdown / Selector */}
        <View style={styles.categoryFilterRow}>
          <Text style={styles.filterLabel}>{t('deskLabel', selectedLang).toUpperCase()}:</Text>
          <View style={styles.categoryDropdownWrapper}>
            <TouchableOpacity
              style={styles.categoryDropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              accessibilityRole="combobox"
              accessibilityLabel="Select news category"
            >
              <Text style={styles.categoryDropdownText}>{getCategoryTranslation(selectedCategory, selectedLang)}</Text>
              <Text style={styles.dropdownArrow}>{showCategoryDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.categoryMenu}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryMenuItem,
                      selectedCategory === cat && styles.categoryMenuItemActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryMenuItemText,
                        selectedCategory === cat && styles.categoryMenuItemTextActive,
                      ]}
                    >
                      {getCategoryTranslation(cat, selectedLang)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Category Pills for quick selection */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsContainer}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                {getCategoryTranslation(cat, selectedLang)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loading state indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.forest} size="small" />
          <Text style={styles.loadingText}>Fetching latest dispatches from newsrooms...</Text>
        </View>
      )}

      {/* Empty state when no articles match */}
      {filteredArticles.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIconText}>📰</Text>
          </View>
          <Text style={styles.emptyHeadline}>{t('noArticlesFound', selectedLang)}</Text>
          <Text style={styles.emptySubtitle}>
            We could not find any stories matching "{searchQuery}" under the "{selectedCategory}" desk.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Responsive Three-Column Grid on Desktop */}
      <View style={styles.articlesGrid}>
        {filteredArticles.map((article) => {
          // Card width calculations based on column layout
          const cardWidthStyle =
            numColumns === 3
              ? { width: '31.8%', marginHorizontal: '0.75%', marginBottom: 20 }
              : numColumns === 2
              ? { width: '48.5%', marginHorizontal: '0.75%', marginBottom: 18 }
              : { width: '100%', marginBottom: 16 };

          return (
            <TouchableOpacity
              key={article.id}
              style={[styles.articleCard, cardWidthStyle]}
              activeOpacity={0.88}
              onPress={() => setSelectedArticle(article)}
              accessibilityRole="article"
            >
              {/* Card Header: Category & Date */}
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{article.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.cardDate}>{article.date}</Text>
              </View>

              {/* Headline */}
              <Text style={styles.cardHeadline} numberOfLines={3}>
                {article.title}
              </Text>

              {/* Summary / Excerpt */}
              <Text style={styles.cardExcerpt} numberOfLines={4}>
                {article.excerpt}
              </Text>

              {/* Card Footer: Author & Read Time */}
              <View style={styles.cardFooter}>
                <View style={styles.authorBox}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {t('bylinePrefix', selectedLang)} {article.author}
                  </Text>
                </View>
                <Text style={styles.readTimeText}>{article.readTime}</Text>
              </View>

              {/* Read Action Button */}
              <View style={styles.cardActionRow}>
                <Text style={styles.readActionText}>Read Full Article →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
  const line = colors.line || '#E0DED6';
  const borderDark = '#1A1A1A';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paper,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },

    // Edition Topline Banner
    editionBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingBottom: 10,
      flexWrap: 'wrap',
      gap: 8,
    },
    editionLeft: {
      flexShrink: 1,
    },
    editionTitle: {
      fontFamily: 'serif',
      fontSize: 22,
      fontWeight: '800',
      color: ink,
      letterSpacing: 1.2,
    },
    editionSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: muted,
      letterSpacing: 0.8,
      marginTop: 2,
    },
    editionIssue: {
      fontSize: 11,
      fontWeight: '700',
      color: forest,
      letterSpacing: 0.5,
    },
    mainDivider: {
      height: 2,
      backgroundColor: ink,
      marginBottom: 16,
    },

    // Controls: Search & Category Dropdown
    controlsSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
      zIndex: 20,
    },
    searchContainer: {
      flex: 1,
      minWidth: 260,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: ink,
      marginLeft: 8,
      padding: 0,
      fontFamily: 'System',
    },
    searchClearBtn: {
      paddingHorizontal: 6,
    },
    searchClearText: {
      color: muted,
      fontSize: 13,
    },
    categoryFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 25,
    },
    filterLabel: {
      fontFamily: 'serif',
      fontSize: 13,
      fontWeight: '700',
      color: ink,
      marginRight: 8,
      letterSpacing: 0.5,
    },
    categoryDropdownWrapper: {
      position: 'relative',
      zIndex: 30,
    },
    categoryDropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 150,
    },
    categoryDropdownText: {
      fontSize: 13,
      fontWeight: '600',
      color: ink,
    },
    dropdownArrow: {
      fontSize: 10,
      color: ink,
      marginLeft: 8,
    },
    categoryMenu: {
      position: 'absolute',
      top: 40,
      right: 0,
      width: 170,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      elevation: 6,
      zIndex: 50,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    categoryMenuItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    categoryMenuItemActive: {
      backgroundColor: colors.note || '#EAE5D5',
    },
    categoryMenuItemText: {
      fontSize: 13,
      color: ink,
    },
    categoryMenuItemTextActive: {
      fontWeight: '700',
      color: forest,
    },

    // Category Quick Pills
    categoryPillsContainer: {
      flexDirection: 'row',
      paddingBottom: 14,
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: cardBg,
      borderRadius: 2,
    },
    categoryPillActive: {
      borderColor: forest,
      backgroundColor: forest,
    },
    categoryPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: muted,
    },
    categoryPillTextActive: {
      color: '#FFFFFF',
    },

    // Loading State
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 24,
      marginVertical: 12,
    },
    emptyIconBox: {
      marginBottom: 12,
    },
    emptyIconText: {
      fontSize: 36,
    },
    emptyHeadline: {
      fontFamily: 'serif',
      fontSize: 20,
      fontWeight: '700',
      color: ink,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: muted,
      textAlign: 'center',
      maxWidth: 480,
      lineHeight: 20,
      marginBottom: 16,
    },
    resetButton: {
      backgroundColor: forest,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 2,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    // Grid Layout
    articlesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: '-0.75%',
      marginTop: 4,
    },

    // Article Card
    articleCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      padding: 16,
      justifyContent: 'space-between',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardBadge: {
      borderWidth: 1,
      borderColor: forest,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 1,
    },
    cardBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: forest,
      letterSpacing: 0.8,
    },
    cardDate: {
      fontSize: 11,
      color: muted,
      fontWeight: '500',
    },
    cardHeadline: {
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '700',
      color: ink,
      lineHeight: 24,
      marginBottom: 8,
    },
    cardExcerpt: {
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
      paddingTop: 10,
      marginBottom: 10,
    },
    authorBox: {
      flex: 1,
      marginRight: 8,
    },
    authorName: {
      fontSize: 12,
      fontWeight: '700',
      color: ink,
    },
    readTimeText: {
      fontSize: 11,
      color: muted,
      fontStyle: 'italic',
    },
    cardActionRow: {
      alignSelf: 'flex-start',
    },
    readActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: forest,
      letterSpacing: 0.3,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // INDIVIDUAL ARTICLE DETAIL VIEW STYLES
    // ─────────────────────────────────────────────────────────────────────────
    detailContainer: {
      flex: 1,
      backgroundColor: paper,
    },
    detailContentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      maxWidth: 820,
      width: '100%',
      alignSelf: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: borderDark,
      backgroundColor: cardBg,
      borderRadius: 2,
      marginBottom: 18,
    },
    backButtonArrow: {
      fontSize: 14,
      fontWeight: '700',
      color: ink,
      marginRight: 6,
    },
    backButtonText: {
      fontSize: 11,
      fontWeight: '800',
      color: ink,
      letterSpacing: 0.8,
    },
    detailCategoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    detailCategoryBadge: {
      fontSize: 12,
      fontWeight: '800',
      color: forest,
      letterSpacing: 1,
      borderBottomWidth: 2,
      borderBottomColor: forest,
      paddingBottom: 2,
    },
    detailTimeBadge: {
      fontSize: 12,
      color: muted,
      fontWeight: '600',
    },
    detailHeadline: {
      fontFamily: 'serif',
      fontSize: 30,
      fontWeight: '800',
      color: ink,
      lineHeight: 38,
      letterSpacing: -0.3,
      marginBottom: 16,
    },
    bylineBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: line,
      paddingVertical: 12,
      marginBottom: 20,
    },
    bylineAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: forest,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    bylineAvatarText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
    bylineInfo: {
      flex: 1,
    },
    bylineAuthor: {
      fontSize: 15,
      fontWeight: '700',
      color: ink,
    },
    bylineRole: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },
    detailImageContainer: {
      marginBottom: 24,
      borderWidth: 1,
      borderColor: borderDark,
      backgroundColor: cardBg,
    },
    detailImage: {
      width: '100%',
      height: 340,
    },
    detailImageCaption: {
      padding: 10,
      fontSize: 11,
      fontStyle: 'italic',
      color: muted,
      borderTopWidth: 1,
      borderTopColor: line,
      lineHeight: 16,
    },
    detailBodyContainer: {
      marginBottom: 24,
    },
    detailParagraph: {
      fontSize: 16,
      lineHeight: 26,
      color: ink,
      marginBottom: 18,
      fontFamily: 'System',
    },
    sourcesBox: {
      backgroundColor: colors.note || '#EAE5D5',
      borderLeftWidth: 4,
      borderLeftColor: forest,
      padding: 14,
      marginBottom: 24,
    },
    sourcesHeading: {
      fontFamily: 'serif',
      fontSize: 12,
      fontWeight: '800',
      color: forestDark,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    sourcesText: {
      fontSize: 13,
      lineHeight: 19,
      color: ink,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: borderDark,
      marginVertical: 20,
    },
    relatedSection: {
      marginTop: 8,
    },
    relatedHeading: {
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: '800',
      color: ink,
      letterSpacing: 0.8,
      marginBottom: 14,
    },
    relatedGrid: {
      flexDirection: 'column',
      gap: 12,
    },
    relatedGridDesktop: {
      flexDirection: 'row',
      gap: 12,
    },
    relatedCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      padding: 14,
    },
    relatedCategory: {
      fontSize: 10,
      fontWeight: '800',
      color: forest,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    relatedTitle: {
      fontFamily: 'serif',
      fontSize: 14,
      fontWeight: '700',
      color: ink,
      lineHeight: 19,
      marginBottom: 6,
    },
    relatedMeta: {
      fontSize: 11,
      color: muted,
    },
  });
}
