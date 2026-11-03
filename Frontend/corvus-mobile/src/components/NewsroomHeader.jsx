import { useState, useRef, useEffect } from 'react';
import { useRouter, Link } from 'expo-router';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ConfirmModal from './ConfirmModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const languages = [
  { label: 'English', value: 'ENG' },
  { label: 'isiNdebele', value: 'NDE' },
  { label: 'Shona', value: 'SNA' },
];

export default function NewsroomHeader({ mode = 'landing', onOpenAI }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [language, setLanguage] = useState('ENG');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const menuAnim = useRef(new Animated.Value(0)).current;
  const privacyScaleAnim = useRef(new Animated.Value(0.92)).current;
  const privacyOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (languageMenuOpen) {
      Animated.spring(menuAnim, {
        toValue: 1,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [languageMenuOpen]);

  useEffect(() => {
    if (privacyOpen) {
      Animated.parallel([
        Animated.timing(privacyOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(privacyScaleAnim, {
          toValue: 1,
          tension: 85,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(privacyOpacityAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(privacyScaleAnim, {
          toValue: 0.92,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [privacyOpen]);

  const isApp = mode === 'app' || mode === 'chat';

  function handleLogout() {
    setLogoutConfirmOpen(false);
    signOut();
    showToast({ message: 'You have been signed out.', type: 'info' });
    router.replace('/signup');
  }

  function handleBrandPress() {
    if (isApp) {
      router.replace('/main_screen');
    }
  }

  const styles = makeStyles(colors);

  const menuScale = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });
  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <>
      <View style={styles.container}>
        <View
          accessibilityRole="header"
          accessibilityLabel={isApp ? 'App navigation' : 'Main navigation'}
          style={styles.header}
        >
          {isApp ? (
            <Pressable
              accessibilityLabel="Go to Corvus home"
              accessibilityRole="button"
              onPress={handleBrandPress}
              style={styles.brandLink}
            >
              <Text style={styles.brandName}>Corvus</Text>
            </Pressable>
          ) : (
            <Link href="/" asChild>
              <Pressable accessibilityLabel="Go to Corvus home" accessibilityRole="link" style={styles.brandLink}>
                <Text style={styles.brandName}>Corvus</Text>
              </Pressable>
            </Link>
          )}

          <View style={styles.navigation}>
            {/* 1-to-1 Saiph AI Agent Button */}
            {isApp && onOpenAI && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Saiph AI Agent"
                onPress={onOpenAI}
                style={styles.aiHeaderButton}
              >
                <Text style={styles.aiHeaderButtonText}>✦ Saiph AI</Text>
              </Pressable>
            )}

            {/* Language picker */}
            <View style={styles.languageWrapper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Language: ' + language}
                accessibilityState={{ expanded: languageMenuOpen }}
                onPress={() => setLanguageMenuOpen((open) => !open)}
                style={styles.navigationButton}
              >
                <Text style={styles.navigationText}>Language</Text>
                <Text style={[styles.chevron, languageMenuOpen && styles.chevronRotated]}>▼</Text>
              </Pressable>

              {languageMenuOpen && (
                <Animated.View
                  style={[
                    styles.languageMenu,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.line,
                      opacity: menuAnim,
                      transform: [{ scale: menuScale }, { translateY: menuTranslateY }],
                    },
                  ]}
                >
                  {languages.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: language === item.value }}
                      key={item.value}
                      onPress={() => {
                        setLanguage(item.value);
                        setLanguageMenuOpen(false);
                      }}
                      style={styles.languageOption}
                    >
                      <Text style={styles.languageOptionText}>{item.label}</Text>
                      {language === item.value && <Text style={styles.selectedMark}>Selected</Text>}
                    </Pressable>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Privacy policy */}
            <Pressable
              accessibilityRole="button"
              onPress={() => setPrivacyOpen(true)}
              style={styles.navigationButton}
            >
              <Text style={styles.navigationText}>Privacy Policy</Text>
            </Pressable>

            {/* Theme toggle */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onPress={toggleTheme}
              style={styles.themeToggle}
            >
              <Text style={styles.themeIcon}>{isDark ? '☀' : '◑'}</Text>
            </Pressable>

            {/* Logout — only shown when signed in (app mode) */}
            {isApp && user && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setLogoutConfirmOpen(true)}
                style={[styles.navigationButton, styles.logoutBtn]}
              >
                <Text style={styles.logoutText}>Sign out</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Privacy policy modal with expanding/retracting animations */}
      <Modal
        animationType="none"
        onRequestClose={() => setPrivacyOpen(false)}
        transparent
        visible={privacyOpen}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: privacyOpacityAnim }]}>
          <Pressable
            accessibilityLabel="Close privacy policy notice"
            accessibilityRole="button"
            onPress={() => setPrivacyOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.line,
                transform: [{ scale: privacyScaleAnim }],
              },
            ]}
          >
            <Text style={[styles.modalEyebrow, { color: colors.orange }]}>CORVUS / PRIVACY</Text>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>Privacy Policy</Text>
            <Text style={[styles.modalBody, { color: colors.muted }]}>
              A privacy policy has not been published yet. This notice is a placeholder, not a legal policy.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPrivacyOpen(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.ink, textDecorationColor: colors.orange }]}>
                Close
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Logout confirm modal */}
      <ConfirmModal
        visible={logoutConfirmOpen}
        title="Sign out"
        message="Are you sure you want to sign out of your newsroom account?"
        confirmLabel="Sign out"
        cancelLabel="Stay in"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      zIndex: 10,
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    header: {
      minHeight: 62,
      width: '100%',
      maxWidth: 1240,
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 8,
    },
    brandLink: {
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 6,
    },
    brandName: {
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 27,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    aiHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.forest,
      borderWidth: 1,
      borderColor: colors.forest,
    },
    aiHeaderButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    languageWrapper: {
      position: 'relative',
      zIndex: 20,
    },
    navigationButton: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 4,
    },
    navigationText: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: '600',
    },
    chevron: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 1,
    },
    chevronRotated: {
      transform: [{ rotate: '180deg' }],
    },
    themeToggle: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    themeIcon: {
      fontSize: 17,
      color: colors.muted,
    },
    logoutBtn: {
      borderLeftWidth: 1,
      borderLeftColor: colors.line,
      paddingLeft: 16,
      marginLeft: 4,
    },
    logoutText: {
      color: colors.orange,
      fontSize: 13,
      fontWeight: '600',
    },
    languageMenu: {
      position: 'absolute',
      top: 46,
      right: 0,
      width: 180,
      paddingVertical: 4,
      borderWidth: 1,
      borderRadius: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 30,
    },
    languageOption: {
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
    },
    languageOptionText: {
      color: colors.ink,
      fontSize: 13,
    },
    selectedMark: {
      color: colors.orange,
      fontSize: 10,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(17, 17, 17, 0.55)',
    },
    modalCard: {
      width: '100%',
      maxWidth: 440,
      padding: 24,
      borderWidth: 1,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 8,
    },
    modalEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    modalTitle: {
      marginTop: 10,
      fontSize: 26,
      fontWeight: '700',
    },
    modalBody: {
      marginTop: 12,
      fontSize: 14,
      lineHeight: 22,
    },
    closeButton: {
      alignSelf: 'flex-start',
      minHeight: 42,
      justifyContent: 'center',
      marginTop: 18,
      paddingHorizontal: 2,
    },
    closeButtonText: {
      fontSize: 13,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}
