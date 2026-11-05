import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NewsArticles from './NewsArticle';
import SubmitLead from './SubmitLead';
import Posts from './Posts';
import { t, LANGUAGES } from '../services/userSiteTranslations';

const NAV_TABS = [
  { key: 'news', label: 'NEWS ARTICLES' },
  { key: 'submit', label: 'SUBMIT A LEAD' },
  { key: 'posts', label: 'POSTS' },
];


export default function UserSite() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState('news');
  const [selectedLang, setSelectedLang] = useState('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User-submitted leads from current session
  const [submissions, setSubmissions] = useState([]);

  const handleAddSubmission = (newLead) => {
    setSubmissions((prev) => [newLead, ...prev]);
    setActiveTab('posts');
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg || colors.paper}
      />

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PUBLIC-FACING EDITORIAL HEADER                                      */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {/* Left: Brand Wordmark + Language Selector */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setActiveTab('news')}
              activeOpacity={0.8}
              style={styles.brandContainer}
            >
              <Text style={styles.brandTitle}>CORVUS</Text>
              <Text style={styles.brandKicker}>{t('brandKicker', selectedLang)}</Text>
            </TouchableOpacity>

            <View style={styles.brandDivider} />

            {/* Language Selector Dropdown */}
            <View style={styles.langSelectorWrapper}>
              <TouchableOpacity
                style={styles.langSelectorBtn}
                onPress={() => setShowLangMenu(!showLangMenu)}
                accessibilityRole="combobox"
                accessibilityLabel="Select language"
              >
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.ink || '#1A1A1A'} strokeWidth="2">
                  <Path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </Svg>
                <Text style={styles.langSelectorText}>{selectedLang}</Text>
                <Text style={styles.dropdownCaret}>{showLangMenu ? 'â–²' : 'â–¼'}</Text>
              </TouchableOpacity>

              {showLangMenu && (
                <View style={styles.langMenu}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langMenuItem,
                        selectedLang === lang.code && styles.langMenuItemActive,
                      ]}
                      onPress={() => {
                        setSelectedLang(lang.code);
                        setShowLangMenu(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.langMenuItemText,
                          selectedLang === lang.code && styles.langMenuItemTextActive,
                        ]}
                      >
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Right: Desktop Navigation + Workspace Link */}
          {!isMobile ? (
            <View style={styles.headerRight}>
              <View style={styles.navRow}>
                {NAV_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.navTab, isActive && styles.navTabActive]}
                      onPress={() => setActiveTab(tab.key)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                        {tab.key === 'news' ? t('navNews', selectedLang) : tab.key === 'submit' ? t('navSubmit', selectedLang) : t('navPosts', selectedLang)}
                      </Text>
                      {isActive && <View style={styles.navTabIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Workspace / Reporter Entry Point */}
              <View style={styles.authActionBox}>
                {user ? (
                  <TouchableOpacity
                    style={styles.workspaceBtn}
                    onPress={() => router.push('/main_screen')}
                    accessibilityRole="button"
                    accessibilityLabel="Enter newsroom workspace"
                  >
                    <Text style={styles.workspaceBtnText}>{t('workspaceBtn', selectedLang)}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={() => router.push('/login')}
                    accessibilityRole="button"
                    accessibilityLabel="Reporter sign in"
                  >
                    <Text style={styles.signInBtnText}>{t('signInBtn', selectedLang)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Mobile Hamburger Toggle */
            <TouchableOpacity
              style={styles.hamburgerBtn}
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              accessibilityRole="button"
              accessibilityLabel="Toggle navigation menu"
            >
              <Text style={styles.hamburgerIcon}>{mobileMenuOpen ? 'âœ•' : 'â˜°'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Responsive Mobile Drawer Menu */}
        {isMobile && mobileMenuOpen && (
          <View style={styles.mobileNavMenu}>
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.mobileNavItem, isActive && styles.mobileNavItemActive]}
                  onPress={() => {
                    setActiveTab(tab.key);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Text style={[styles.mobileNavText, isActive && styles.mobileNavTextActive]}>
                    {tab.key === 'news' ? t('navNews', selectedLang) : tab.key === 'submit' ? t('navSubmit', selectedLang) : t('navPosts', selectedLang)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.mobileDivider} />

            {/* Mobile Language Selector */}
            <View style={styles.mobileLangRow}>
              <Text style={styles.mobileLangLabel}>{t('languageLabel', selectedLang)}</Text>
              <View style={styles.mobileLangOptions}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.mobileLangPill,
                      selectedLang === lang.code && styles.mobileLangPillActive,
                    ]}
                    onPress={() => {
                      setSelectedLang(lang.code);
                    }}
                  >
                    <Text
                      style={[
                        styles.mobileLangPillText,
                        selectedLang === lang.code && styles.mobileLangPillTextActive,
                      ]}
                    >
                      {lang.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.mobileDivider} />

            {/* Mobile Auth Button */}
            {user ? (
              <TouchableOpacity
                style={styles.mobileWorkspaceBtn}
                onPress={() => {
                  setMobileMenuOpen(false);
                  router.push('/main_screen');
                }}
              >
                <Text style={styles.mobileWorkspaceBtnText}>{t('openWorkspaceBtn', selectedLang)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.mobileSignInBtn}
                onPress={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.mobileSignInBtnText}>{t('signInBtn', selectedLang)}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* ACTIVE PAGE CONTENT RENDERER                                        */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.body}>
        {activeTab === 'news' && (
          <NewsArticles
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
          />
        )}

        {activeTab === 'submit' && (
          <SubmitLead
            selectedLang={selectedLang}
            onSubmitLead={handleAddSubmission}
          />
        )}

        {activeTab === 'posts' && (
          <Posts
            selectedLang={selectedLang}
            submissions={submissions}
            onNavigateTab={setActiveTab}
          />
        )}
      </View>
    </SafeAreaView>
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
    safeArea: {
      flex: 1,
      backgroundColor: paper,
    },
    header: {
      backgroundColor: paper,
      borderBottomWidth: 1.5,
      borderBottomColor: borderDark,
      zIndex: 100,
    },
    headerInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    brandContainer: {
      flexDirection: 'column',
    },
    brandTitle: {
      fontFamily: 'serif',
      fontSize: 26,
      fontWeight: '900',
      color: ink,
      letterSpacing: 2,
      lineHeight: 28,
    },
    brandKicker: {
      fontSize: 9,
      fontWeight: '800',
      color: forest,
      letterSpacing: 1.2,
      marginTop: 1,
    },
    brandDivider: {
      width: 1,
      height: 28,
      backgroundColor: borderDark,
    },

    // Language Selector
    langSelectorWrapper: {
      position: 'relative',
      zIndex: 110,
    },
    langSelectorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 8,
      paddingVertical: 5,
      gap: 6,
    },
    langSelectorText: {
      fontSize: 12,
      fontWeight: '800',
      color: ink,
      letterSpacing: 0.5,
    },
    dropdownCaret: {
      fontSize: 9,
      color: ink,
    },
    langMenu: {
      position: 'absolute',
      top: 34,
      left: 0,
      width: 140,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      elevation: 6,
      zIndex: 120,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    langMenuItem: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    langMenuItemActive: {
      backgroundColor: note,
    },
    langMenuItemText: {
      fontSize: 12,
      color: ink,
      fontWeight: '600',
    },
    langMenuItemTextActive: {
      color: forest,
      fontWeight: '800',
    },

    // Desktop Header Right
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navTab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      position: 'relative',
    },
    navTabActive: {
      // subtle active background or clean serif styling
    },
    navTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: muted,
      letterSpacing: 0.8,
    },
    navTabTextActive: {
      color: ink,
      fontWeight: '800',
    },
    navTabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 12,
      right: 12,
      height: 2.5,
      backgroundColor: forest,
    },

    // Auth Action Buttons
    authActionBox: {
      marginLeft: 4,
    },
    workspaceBtn: {
      backgroundColor: forest,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: forestDark,
    },
    workspaceBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    signInBtn: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 2,
    },
    signInBtnText: {
      color: ink,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    // Mobile Hamburger
    hamburgerBtn: {
      padding: 6,
      borderWidth: 1,
      borderColor: borderDark,
      backgroundColor: cardBg,
      borderRadius: 2,
    },
    hamburgerIcon: {
      fontSize: 20,
      color: ink,
      lineHeight: 20,
    },
    mobileNavMenu: {
      backgroundColor: cardBg,
      borderTopWidth: 1,
      borderTopColor: borderDark,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    mobileNavItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    mobileNavItemActive: {
      backgroundColor: note,
      paddingHorizontal: 8,
    },
    mobileNavText: {
      fontSize: 13,
      fontWeight: '700',
      color: muted,
      letterSpacing: 0.8,
    },
    mobileNavTextActive: {
      color: ink,
      fontWeight: '800',
    },
    mobileDivider: {
      height: 1,
      backgroundColor: line,
      marginVertical: 12,
    },
    mobileLangRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    mobileLangLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: ink,
    },
    mobileLangOptions: {
      flexDirection: 'row',
      gap: 6,
    },
    mobileLangPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: line,
      borderRadius: 2,
    },
    mobileLangPillActive: {
      backgroundColor: forest,
      borderColor: forest,
    },
    mobileLangPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: ink,
    },
    mobileLangPillTextActive: {
      color: '#FFFFFF',
    },
    mobileWorkspaceBtn: {
      backgroundColor: forest,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 2,
      marginTop: 6,
    },
    mobileWorkspaceBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    mobileSignInBtn: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 2,
      marginTop: 6,
    },
    mobileSignInBtnText: {
      color: ink,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    body: {
      flex: 1,
    },
  });
}
