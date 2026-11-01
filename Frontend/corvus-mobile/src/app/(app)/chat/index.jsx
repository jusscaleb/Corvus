import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NewsroomHeader from '../../../components/NewsroomHeader';
import { useTheme } from '../../../context/ThemeContext';

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: 'Good morning. What are we working on today?' },
  ]);
  const [draft, setDraft] = useState('');

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: String(Date.now()), role: 'user', text }]);
    setDraft('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <NewsroomHeader mode="chat" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}
      >
        <View style={styles.chatToolbar}>
          <View>
            <Text style={styles.chatEyebrow}>EDITORIAL DESK / CHAT</Text>
            <Text style={styles.headerTitle}>Newsroom chat</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/main_screen')} style={styles.exitBtn}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.messages}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[styles.messageRow, isUser && styles.userRow]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  {!isUser && <Text style={styles.sender}>CORVUS</Text>}
                  <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Message"
            multiline
            onChangeText={setDraft}
            onSubmitEditing={sendMessage}
            placeholder="Write a message..."
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.composer}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!draft.trim()}
            onPress={sendMessage}
            style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    keyboardView: {
      flex: 1,
    },
    chatToolbar: {
      minHeight: 64,
      paddingHorizontal: 20,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chatEyebrow: {
      color: colors.orange,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },
    headerTitle: {
      marginTop: 3,
      color: colors.ink,
      fontSize: 18,
      fontWeight: '700',
    },
    exitBtn: {
      minWidth: 52,
      minHeight: 42,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    exitText: {
      color: colors.forest,
      fontSize: 14,
      fontWeight: '700',
    },
    messages: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      padding: 18,
      gap: 14,
    },
    messageRow: {
      alignItems: 'flex-start',
    },
    userRow: {
      alignItems: 'flex-end',
    },
    bubble: {
      maxWidth: '88%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    assistantBubble: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.line,
    },
    userBubble: {
      backgroundColor: colors.forest,
    },
    sender: {
      marginBottom: 6,
      color: colors.orange,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    messageText: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: colors.white,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.paper,
    },
    composer: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      paddingHorizontal: 13,
      paddingVertical: 12,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 15,
    },
    sendButton: {
      minWidth: 66,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      backgroundColor: colors.forest,
    },
    sendDisabled: {
      backgroundColor: colors.line,
    },
    sendLabel: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
