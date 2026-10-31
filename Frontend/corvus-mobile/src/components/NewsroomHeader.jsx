import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const languages = [
  { label: 'English', value: 'ENG' },
  { label: 'isiNdebele', value: 'NDE' },
  { label: 'Shona', value: 'SNA' },
];

export default function NewsroomHeader({ mode = 'landing' }) {
  const router = useRouter();
  const [language, setLanguage] = useState('ENG');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const action = mode === 'signin'
    ? { label: 'Create account', route: '/signup' }
    : { label: 'Sign in', route: '/login' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Corvus home"
          onPress={() => router.replace('/')}
          style={styles.brand}
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandInitial}>C</Text>
          </View>
          <View>
            <Text style={styles.brandName}>CORVUS</Text>
            <Text style={styles.brandCaption}>NEWSROOM</Text>
          </View>
        </Pressable>

        <View style={styles.navigation}>
          <View style={styles.languageWrapper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Language: ${language}`}
              accessibilityState={{ expanded: languageMenuOpen }}
              onPress={() => setLanguageMenuOpen((open) => !open)}
              style={styles.languageButton}
            >
              <Text style={styles.languageLabel}>LANG</Text>
              <Text style={styles.languageValue}>{language}  v</Text>
            </Pressable>
            {languageMenuOpen && (
              <View style={styles.languageMenu}>
                {languages.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.value}
                    onPress={() => {
                      setLanguage(item.value);
                      setLanguageMenuOpen(false);
                    }}
                    style={styles.languageOption}
                  >
                    <Text style={styles.languageOptionText}>{item.label}</Text>
                    {language === item.value && <Text style={styles.selectedMark}>/</Text>}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(action.route)}
            style={styles.accountButton}
          >
            <Text style={styles.accountButtonText}>{action.label}</Text>
            <Text style={styles.accountArrow}>/</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 5,
    backgroundColor: colors.paper,
  },
  header: {
    minHeight: 76,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  brandInitial: {
    color: colors.orange,
    fontFamily: 'serif',
    fontSize: 24,
  },
  brandName: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },
  brandCaption: {
    marginTop: 1,
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  languageButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  languageLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  languageValue: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  languageMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 156,
    padding: 5,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  languageOption: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
  },
  languageOptionText: {
    color: colors.ink,
    fontSize: 12,
  },
  selectedMark: {
    color: colors.orange,
    fontWeight: '800',
  },
  accountButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  accountButtonText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  accountArrow: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '800',
  },
  rule: {
    height: 3,
    backgroundColor: colors.blue,
  },
});