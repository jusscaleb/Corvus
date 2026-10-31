import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  function handleCreateAccount() {
    if (!username.trim() || !email.trim() || !phoneNumber.trim() || !password) {
      Alert.alert('Missing details', 'Complete each field to continue.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    Alert.alert('Not connected yet', 'The sign-up screen is ready for the Django API connection.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=100&q=80' }}
                style={styles.logoIcon}
              />
              <Text style={styles.logoText}>Corvus</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Text style={styles.headerPrompt}>Already have an account?</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.headerLinkButton}>
                <Text style={styles.headerLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.blueBorderLine} />

          <View style={styles.mainSection}>
            <View style={styles.introColumn}>
              <View style={styles.badgeRow}>
                <View style={styles.redDash} />
                <Text style={styles.badgeText}>JOIN THE NEWSROOM</Text>
              </View>
              <Text style={styles.heroTitle}>Your next story starts here.</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.heroSubtitle}>
                Create a space for your reporting, your collaborators, and the questions worth pursuing.
              </Text>

              <View style={styles.storyNote}>
                <Text style={styles.noteLabel}>FIELD NOTES</Text>
                <Text style={styles.noteTitle}>Look closer. Ask questions.</Text>
                <View style={styles.noteRule} />
                <Text style={styles.noteBody}>For the stories worth telling.</Text>
              </View>
            </View>

            <View style={styles.formColumn}>
              <View style={styles.formCard}>
                <Text style={styles.formEyebrow}>YOUR BYLINE BEGINS HERE</Text>
                <Text style={styles.formTitle}>Create your account</Text>
                <Text style={styles.formDescription}>A few details, then you can get to work.</Text>

                <View style={styles.form}>
                  <TextField
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Choose a username"
                    autoCapitalize="none"
                    textContentType="username"
                  />
                  <TextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@newsroom.org"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                  />
                  <TextField
                    label="Phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Your phone number"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                  />
                  <TextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    secureTextEntry
                    textContentType="newPassword"
                  />
                  <PrimaryButton title="Create account" onPress={handleCreateAccount} variant="accent" />
                </View>

                <View style={styles.formFooter}>
                  <Text style={styles.footerPrompt}>Already have a newsroom account?</Text>
                  <Pressable accessibilityRole="button" onPress={() => router.push('/login')}>
                    <Text style={styles.footerLink}>Sign in</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f4ed',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    tintColor: '#1a1a1a',
  },
  logoText: {
    color: '#1a1a1a',
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPrompt: {
    color: '#555555',
    fontSize: 13,
  },
  headerLinkButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerLink: {
    color: '#c84b31',
    fontSize: 14,
    fontWeight: '700',
  },
  blueBorderLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#2096ff',
  },
  mainSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
    paddingHorizontal: 48,
    paddingTop: 42,
    paddingBottom: 30,
  },
  introColumn: {
    flexGrow: 1,
    flexBasis: 320,
    paddingVertical: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  redDash: {
    width: 20,
    height: 2,
    marginRight: 8,
    backgroundColor: '#c84b31',
  },
  badgeText: {
    color: '#c84b31',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    maxWidth: 490,
    color: '#1a1a1a',
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 56,
  },
  titleUnderline: {
    width: 140,
    height: 3,
    marginTop: 12,
    marginBottom: 22,
    backgroundColor: '#c84b31',
  },
  heroSubtitle: {
    maxWidth: 440,
    color: '#555555',
    fontSize: 16,
    lineHeight: 25,
  },
  storyNote: {
    width: '100%',
    maxWidth: 360,
    marginTop: 36,
    padding: 18,
    backgroundColor: '#eae5d5',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  noteLabel: {
    color: '#c84b31',
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noteTitle: {
    marginTop: 8,
    color: '#1a1a1a',
    fontFamily: 'serif',
    fontSize: 23,
  },
  noteRule: {
    height: 1,
    marginTop: 12,
    backgroundColor: '#c7bfad',
  },
  noteBody: {
    marginTop: 10,
    color: '#555555',
    fontSize: 12,
  },
  formColumn: {
    flexGrow: 1,
    flexBasis: 340,
    alignItems: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 460,
    padding: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e0d5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  formEyebrow: {
    color: '#c84b31',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  formTitle: {
    marginTop: 9,
    color: '#1a1a1a',
    fontFamily: 'serif',
    fontSize: 30,
    lineHeight: 36,
  },
  formDescription: {
    marginTop: 7,
    color: '#666666',
    fontSize: 14,
    lineHeight: 21,
  },
  form: {
    gap: 15,
    marginTop: 22,
  },
  formFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e0d5',
  },
  footerPrompt: {
    color: '#666666',
    fontSize: 12,
  },
  footerLink: {
    color: '#c84b31',
    fontSize: 12,
    fontWeight: '700',
  },
});