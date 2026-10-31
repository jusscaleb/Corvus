import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    Alert.alert('Not connected yet', 'The sign-in screen is ready for the Django API connection.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.back}>
          <Text style={styles.backText}>Back to Corvus</Text>
        </Pressable>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Good stories start here.</Text>
        <Text style={styles.description}>Sign in to return to your newsroom.</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@newsroom.org"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            textContentType="password"
          />
          <PrimaryButton title="Sign in" onPress={handleSignIn} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/signup')} style={styles.switchLink}>
          <Text style={styles.switchText}>New to Corvus? <Text style={styles.switchEmphasis}>Create an account</Text></Text>
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
    marginBottom: 42,
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
    gap: 20,
    marginTop: 34,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: 22,
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