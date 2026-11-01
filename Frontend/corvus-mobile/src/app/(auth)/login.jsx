import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';
import { login } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 520;
  const dense = compact || (Platform.OS === 'web' && height < 820);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignIn() {
    setErrorMessage('');
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/main_screen');
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <EditorialAuthPage
      mode=" signin"
 eyebrow="REPORTER ACCESS"
 headline="Pick up where the story left off."
 description="Your newsroom your collaborators and your next good question are waiting."
 noteLabel="DESK NOTE / 02"
 noteTitle="Keep the story moving."
 noteText="Return to your drafts source notes and editorial conversations."
 formLabel="NEWSROOM ACCESS"
 formTitle="Sign in"
 formDescription="Enter your details to return to your desk."
 >
 <View style={[styles.form, dense && styles.formCompact]}>
 {errorMessage ? (
 <View style={styles.errorBanner}>
 <Text style={styles.errorText}>{errorMessage}</Text>
 </View>
 ) : null}
 <TextField
 label="Email"
 compact={dense}
 value={email}
 onChangeText={(val) => {
 setEmail(val);
 if (errorMessage) setErrorMessage('');
 }}
 placeholder="you@newsroom.org"
 keyboardType="email-address"
 autoCapitalize="none"
 textContentType="emailAddress"
 />
 <TextField
 label="Password"
 compact={dense}
 value={password}
 onChangeText={(val) => {
 setPassword(val);
 if (errorMessage) setErrorMessage('');
 }}
 placeholder="Enter your password"
 secureTextEntry
 textContentType="password"
 />
 <PrimaryButton
 title="Sign in to newsroom"
 onPress={handleSignIn}
 compact={dense}
 loading={loading}
 disabled={loading}
 />
 </View>

 <View style={[styles.formFooter, dense && styles.formFooterCompact]}>
 <Text style={styles.footerText}>Need a newsroom account?</Text>
 <Pressable accessibilityRole="button" onPress={() => router.push('/signup')}>
 <Text style={styles.footerLink}>Register as reporter</Text>
 </Pressable>
 </View>
 </EditorialAuthPage>
 );
}

const styles = StyleSheet.create({
 form: {
 gap: 15,
 marginTop: 22,
 },
 formCompact: {
 gap: 10,
 marginTop: 16,
 },
 errorBanner: {
 backgroundColor: '#FDF2F2',
 borderLeftWidth: 3,
 borderLeftColor: colors.orange,
 paddingVertical: 8,
 paddingHorizontal: 12,
 borderRadius: 4,
 },
 errorText: {
 color: '#991B1B',
 fontSize: 12,
 fontWeight: '600',
 },
 formFooter: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 alignItems: 'center',
 gap: 6,
 marginTop: 20,
 paddingTop: 16,
 borderTopWidth: 1,
 borderTopColor: colors.line,
 },
 formFooterCompact: {
 gap: 5,
 marginTop: 12,
 paddingTop: 10,
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