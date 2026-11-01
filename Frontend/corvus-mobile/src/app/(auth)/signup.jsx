import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';

export default function SignupScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 520;
  const dense = compact || (Platform.OS === 'web' && height < 820);
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

    router.replace('/main_screen');
  }

  return (
    <EditorialAuthPage
      mode="signup"
      eyebrow="JOIN THE NEWSROOM"
      headline="Your next story starts here."
      description="A place for your reporting, your collaborators, and the questions worth pursuing."
      noteLabel="FIELD NOTE / 01"
      noteTitle="Look closer. Ask questions."
      noteText="Good reporting begins with curiosity and a careful record."
      formLabel="REPORTER REGISTRATION"
      formTitle="Create your account"
      formDescription="Add your details to get started."
    >
      <View style={[styles.form, dense && styles.formCompact]}>
        <TextField
          label="Username"
          compact={dense}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          autoCapitalize="none"
          textContentType="username"
        />
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
          label="Phone number"
          compact={dense}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Your phone number"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
        <TextField
          label="Password"
          compact={dense}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
        />
        <PrimaryButton title="Create account" onPress={handleCreateAccount} variant="accent" compact={dense} />
      </View>

      <View style={[styles.formFooter, dense && styles.formFooterCompact]}>
        <Text style={styles.footerText}>Already have a newsroom account?</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/login')}>
          <Text style={styles.footerLink}>Sign in</Text>
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
    gap: 9,
    marginTop: 14,
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