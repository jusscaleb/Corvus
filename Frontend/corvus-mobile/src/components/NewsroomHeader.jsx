import { useState } from 'react';
import { Link } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const languages = [
  { label: 'English', value: 'ENG' },
  { label: 'isiNdebele', value: 'NDE' },
  { label: 'Shona', value: 'SNA' },
];

export default function NewsroomHeader({ mode = 'landing' }) {
  const [language, setLanguage] = useState('ENG');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <View
          accessibilityRole="header"
          accessibilityLabel={mode === 'landing' ? 'Main navigation' : 'Account navigation'}
          style={styles.header}
        >
          <Link href="/" asChild>
            <Pressable accessibilityLabel="Go to Corvus home" accessibilityRole="link" style={styles.brandLink}>
              <Text style={styles.brandName}>Corvus</Text>
            </Pressable>
          </Link>

          <View style={styles.navigation}>
            <View style={styles.languageWrapper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Language: ${language}`}
                accessibilityState={{ expanded: languageMenuOpen }}
                onPress={() => setLanguageMenuOpen((open) => !open)}
                style={styles.navigationButton}
              >
                <Text style={styles.navigationText}>Language</Text>
                <Text style={styles.chevron}>▼</Text>
              </Pressable>
              {languageMenuOpen && (
                <View style={styles.languageMenu}>
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
                </View>
              )}
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => setPrivacyOpen(true)}
              style={styles.navigationButton}
            >
              <Text style={styles.navigationText}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setPrivacyOpen(false)}
        transparent
        visible={privacyOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close privacy policy notice"
            accessibilityRole="button"
            onPress={() => setPrivacyOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>CORVUS / PRIVACY</Text>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalBody}>
              A privacy policy has not been published yet. This notice is a placeholder, not a legal policy.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPrivacyOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 5,
    backgroundColor: colors.paper,
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
  brandName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  brandLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  languageWrapper: {
    position: 'relative',
    zIndex: 10,
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
    fontWeight: '500',
  },
  chevron: {
    color: colors.muted,
    fontSize: 8,
  },
  languageMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 180,
    paddingVertical: 4,
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
    backgroundColor: 'rgba(17, 17, 17, 0.42)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  modalEyebrow: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalTitle: {
    marginTop: 10,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 28,
  },
  modalBody: {
    marginTop: 12,
    color: colors.muted,
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
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: colors.orange,
  },
});