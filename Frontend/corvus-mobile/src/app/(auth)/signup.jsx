import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';

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

    Alert.alert('Not connected yet', 'The sign-up screen is ready for the Django API connection.');
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