import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import EditorialAuthPage from '../../components/EditorialAuthPage';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { colors } from '../../theme/colors';
import { register } from '../../services/api';

export default function SignupScreen() {
 const router = useRouter();
 const { width, height } = useWindowDimensions();
 const compact = width < 520;
 const dense = compact || (Platform.OS === 'web' && height < 820);
 const [username, setUsername] = useState('');
 const [fullName, setFullName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [passwordConfirm, setPasswordConfirm] = useState('');
 const [loading, setLoading] = useState(false);
 const [errorMessage, setErrorMessage] = useState('');

 async function handleCreateAccount() {
 setErrorMessage('');
 if (!username.trim() || !email.trim() || !password) {
 Alert.alert('Missing details', 'Please complete the required fields.');
 return;
 }

 if (password.length < 8) {
 Alert.alert('Password too short', 'Use at least 8 characters.');
 return;
 }

 if (passwordConfirm && password !== passwordConfirm) {
 Alert.alert('Password mismatch', 'Passwords do not match.');
 return;
 }

 setLoading(true);
 try {
 await register({
 username: username.trim(),
 email: email.trim(),
 full_name: fullName.trim() || username.trim(),
 password,
 password_confirm: passwordConfirm || password,
 });
 router.replace('/main_screen');
 } catch (err) {
 const msg = err.message || 'Registration failed. Please check your information.';
 setErrorMessage(msg);
 Alert.alert('Registration Failed', msg);
 } finally {
 setLoading(false);
 }
 }

 return (
 <EditorialAuthPage
 mode="signup"
 eyebrow="JOIN THE NEWSROOM"
 headline="Your next story starts here."
 description="A place for your reporting your collaborators and the questions worth pursuing."
 noteLabel="FIELD NOTE / 01"
 noteTitle="Look closer. Ask questions."
 noteText="Good reporting begins with curiosity and a careful record."
 formLabel="REPORTER REGISTRATION"
 formTitle="Create your account"
 formDescription="Add your details to get started."
 >
 <View style={[styles.form, dense && styles.formCompact]}>
 {errorMessage ? (
 <View style={styles.errorBanner}>
 <Text style={styles.errorText}>{errorMessage}</Text>
 </View>
 ) : null}
 <TextField
 label="Username"
 compact={dense}
 value={username}
 onChangeText={(val) => {
 setUsername(val);
 if (errorMessage) setErrorMessage('');
 }}
 placeholder="Choose a username"
 autoCapitalize="none"
 textContentType="username"
 />
 <TextField
 label="Full Name"
 compact={dense}
 value={fullName}
 onChangeText={setFullName}
 placeholder="Reporter full name"
 textContentType="name"
 />
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
 placeholder="At least 8 characters"
 secureTextEntry
 textContentType="newPassword"
 />
 <TextField
 label="Confirm Password"
 compact={dense}
 value={passwordConfirm}
 onChangeText={(val) => {
 setPasswordConfirm(val);
 if (errorMessage) setErrorMessage('');
 }}
 placeholder="Re-enter password"
 secureTextEntry
 textContentType="newPassword"
 />
 <PrimaryButton
 title="Create account"
 onPress={handleCreateAccount}
 variant="accent"
 compact={dense}
 loading={loading}
 disabled={loading}
 />
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