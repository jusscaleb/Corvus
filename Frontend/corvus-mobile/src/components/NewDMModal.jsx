import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchUsers, createOrGetDirectChat } from '../services/api';

export default function NewDMModal({ visible, onClose, onCreated }) {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const styles = makeStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);

  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSearchResults([]);
      setStarting(false);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver }),
        Animated.spring(scale, { toValue: 1, tension: 85, friction: 9, useNativeDriver }),
      ]).start();

      handleSearch('');
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver }),
        Animated.timing(scale, { toValue: 0.92, duration: 150, useNativeDriver }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (visible) {
        handleSearch(searchQuery);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSearch(query) {
    setSearching(true);
    try {
      const results = await searchUsers(query);
      const userList = Array.isArray(results)
        ? results
        : (Array.isArray(results?.results) ? results.results : []);
      const myId = currentUser?.user_id;
      const myUsername = currentUser?.username;
      const myEmail = currentUser?.email;
      const filtered = userList.filter(
        (u) =>
          (!myId || String(u.user_id) !== String(myId)) &&
          (!myUsername || u.username !== myUsername) &&
          (!myEmail || u.email !== myEmail)
      );
      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectUser(user) {
    setStarting(true);
    try {
      const conversation = await createOrGetDirectChat(user.user_id);
      showToast({
        message: `Conversation with @${user.username} ready.`,
        type: 'success',
      });
      if (onCreated) onCreated({ ...conversation, targetUser: user });
      onClose();
    } catch (err) {
      showToast({
        message: err.message || 'Failed to start direct message.',
        type: 'error',
      });
    } finally {
      setStarting(false);
    }
  }

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>EDITORIAL DESK / DIRECT MESSAGES</Text>
              <Text style={styles.title}>New Conversation</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search colleague by username or name..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoFocus
              style={styles.searchInput}
            />
          </View>

          {/* Results List */}
          <ScrollView contentContainerStyle={styles.listContainer} keyboardShouldPersistTaps="handled">
            {searching ? (
              <ActivityIndicator color={colors.forest} style={{ marginVertical: 24 }} />
            ) : starting ? (
              <View style={styles.startingBox}>
                <ActivityIndicator color={colors.forest} />
                <Text style={styles.startingText}>Connecting correspondence...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <Pressable
                  key={user.user_id}
                  onPress={() => handleSelectUser(user)}
                  style={styles.userRow}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user.full_name || user.username).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.full_name || user.username}</Text>
                    <Text style={styles.userHandle}>@{user.username}</Text>
                  </View>
                  <Text style={styles.chatAction}>Message →</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No colleagues found matching that username.' : 'No other reporters registered yet.'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '85%',
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    eyebrow: {
      color: colors.orange,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },
    title: {
      marginTop: 4,
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 22,
      fontWeight: '700',
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.note,
    },
    closeBtnText: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '700',
    },
    searchBox: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    searchInput: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 14,
    },
    listContainer: {
      paddingVertical: 8,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '700',
    },
    userHandle: {
      color: colors.muted,
      fontSize: 12,
    },
    chatAction: {
      color: colors.forest,
      fontSize: 12,
      fontWeight: '700',
    },
    startingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 10,
    },
    startingText: {
      color: colors.muted,
      fontSize: 12,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.muted,
      fontSize: 13,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    cancelBtn: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    cancelText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
