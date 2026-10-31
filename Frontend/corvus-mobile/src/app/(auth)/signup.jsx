import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleCreateAccount() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Complete each field to continue.');
      return;
    }

    Alert.alert('Not connected yet', 'The sign-up screen is ready for the Django API connection.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.back}>
          <Text style={styles.backText}>Back to Corvus</Text>
        </Pressable>
        <Text style={styles.eyebrow}>JOIN THE NEWSROOM</Text>
        <Text style={styles.title}>Start with a byline.</Text>
        <Text style={styles.description}>Create your account to begin working with your team.</Text>

        <View style={styles.form}>
          <TextField
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            textContentType="name"
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
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            textContentType="newPassword"
          />
          <PrimaryButton title="Create account" onPress={handleCreateAccount} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.switchLink}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchEmphasis}>Sign in</Text></Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginBottom: 30,
  },
  backText: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: 12,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 38,
    lineHeight: 45,
  },
  description: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    gap: 18,
    marginTop: 28,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  switchText: {
    color: colors.muted,
    fontSize: 14,
  },
  switchEmphasis: {
    color: colors.forest,
    fontWeight: '700',
  },
});