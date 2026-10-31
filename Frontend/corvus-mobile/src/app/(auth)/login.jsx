import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
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
    <EditorialAuthPage
      mode="signin"
      eyebrow="REPORTER ACCESS"
      headline="Pick up where the story left off."
      description="Your newsroom, your collaborators, and your next good question are waiting."
      noteLabel="DESK NOTE / 02"
      noteTitle="Keep the story moving."
      noteText="Return to your drafts, source notes, and editorial conversations."
      formLabel="NEWSROOM ACCESS"
      formTitle="Sign in"
      formDescription="Enter your details to return to your desk."
    >
      <View style={styles.form}>
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
          placeholder="Your password"
          secureTextEntry
          textContentType="password"
        />
        <PrimaryButton title="Sign in" onPress={handleSignIn} variant="accent" />
      </View>

      <View style={styles.formFooter}>
        <Text style={styles.footerText}>New to Corvus?</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/signup')}>
          <Text style={styles.footerLink}>Create an account</Text>
        </Pressable>
      </View>
    </EditorialAuthPage>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    marginTop: 24,
  },
  formFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  },
  footerLink: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '700',
  },
});