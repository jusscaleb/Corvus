import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 520;
  const dense = compact || (Platform.OS === 'web' && height < 820);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    router.replace('/dashboard');
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
      <View style={[styles.form, dense && styles.formCompact]}>
        <TextField
          label="Email"
          compact={dense}
          value={email}
          onChangeText={setEmail}
          placeholder="you@newsroom.org"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
          compact={dense}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          textContentType="password"
        />
        <PrimaryButton title="Sign in" onPress={handleSignIn} variant="accent" compact={dense} />
      </View>

      <View style={[styles.formFooter, dense && styles.formFooterCompact]}>
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
  formCompact: {
    gap: 11,
    marginTop: 15,
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
  formFooterCompact: {
    gap: 5,
    marginTop: 10,
    paddingTop: 9,
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