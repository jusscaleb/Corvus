import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
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
import { searchUsers, createNewsroom } from '../services/api';

export default function CreateNewsroomModal({ visible, onClose, onCreated }) {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const styles = makeStyles(colors);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setSubmitting(false);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 85, friction: 9, useNativeDriver: true }),
      ]).start();

      handleSearch('');
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    }
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
    } catch (err) {
      console.error('[CreateNewsroomModal] searchUsers failed:', err?.message);
      setSearchResults([]);
      if (err?.message) {
        showToast({ message: `Search error: ${err.message}`, type: 'error' });
      }
    } finally {
      setSearching(false);
    }
  }

  function toggleUser(user) {
    const exists = selectedUsers.some((u) => u.user_id === user.user_id);
    if (exists) {
      setSelectedUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast({ message: 'Enter a newsroom name.', type: 'error' });
      return;
    }

    if (selectedUsers.length < 2) {
      showToast({
        message: 'A newsroom requires at least 3 people (including yourself). Please add at least 2 colleagues.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const group = await createNewsroom({
        name: trimmedName,
        description: description.trim(),
        member_ids: selectedUsers.map((u) => u.user_id),
      });

      showToast({
        message: `Newsroom "${trimmedName}" established with ${selectedUsers.length + 1} members.`,
        type: 'success',
      });

      if (onCreated) onCreated(group);
      onClose();
    } catch (err) {
      showToast({
        message: err.message || 'Failed to create newsroom.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const totalMembers = selectedUsers.length + 1;
  const hasMinMembers = selectedUsers.length >= 2;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>EDITORIAL DESK / NEW GROUP</Text>
              <Text style={styles.title}>Establish Newsroom</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Form Fields */}
            <View style={styles.field}>
              <Text style={styles.label}>Newsroom Name</Text>
              <TextInput
                placeholder="e.g. Financial Investigations, Culture Desk"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Editorial Focus / Scope (Optional)</Text>
              <TextInput
                placeholder="Brief description of the desk coverage..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                style={styles.input}
              />
            </View>

            {/* Member Requirement Banner */}
            <View style={[styles.requirementBox, hasMinMembers && styles.requirementBoxValid]}>
              <Text style={[styles.requirementText, hasMinMembers && styles.requirementTextValid]}>
                {hasMinMembers
                  ? `✓ Newsroom quota met: ${totalMembers} colleagues (including you)`
                  : `Notice: Minimum 3 members required: You + ${selectedUsers.length} selected (${2 - selectedUsers.length} more needed)`}
              </Text>
            </View>

            {/* Selected Chips */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedHeading}>Selected Colleagues ({selectedUsers.length})</Text>
                <View style={styles.chipsWrap}>
                  {selectedUsers.map((u) => (
                    <Pressable key={u.user_id} onPress={() => toggleUser(u)} style={styles.chip}>
                      <Text style={styles.chipText}>{u.full_name || u.username}</Text>
                      <Text style={styles.chipRemove}>✕</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Search Colleagues */}
            <View style={styles.searchSection}>
              <Text style={styles.label}>Add Colleagues by Username or Name</Text>
              <TextInput
                placeholder="Type username (e.g. editor, sarah)..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                style={styles.searchInput}
              />
            </View>

            {/* User List */}
            {searching ? (
              <ActivityIndicator color={colors.forest} style={{ marginVertical: 14 }} />
            ) : searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.user_id === user.user_id);
                  return (
                    <Pressable
                      key={user.user_id}
                      onPress={() => toggleUser(user)}
                      style={[styles.userRow, isSelected && styles.userRowSelected]}
                    >
                      <View style={[styles.userAvatar, isSelected && styles.userAvatarSelected]}>
                        <Text style={[styles.userAvatarText, isSelected && styles.userAvatarTextSelected]}>
                          {(user.full_name || user.username).slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userCopy}>
                        <Text style={[styles.userName, isSelected && styles.userNameSelected]}>
                          {user.full_name || user.username}
                        </Text>
                        <Text style={styles.userHandle}>@{user.username}</Text>
                      </View>
                      <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                        <Text style={[styles.checkMark, isSelected && styles.checkMarkSelected]}>
                          {isSelected ? '✓' : '+'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptySearchText}>
                {searching
                  ? ''
                  : searchQuery
                  ? 'No colleagues found matching that username.'
                  : 'No other registered users yet.'}
              </Text>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !hasMinMembers || !name.trim()}
              style={[
                styles.submitBtn,
                (!hasMinMembers || !name.trim() || submitting) && styles.submitBtnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>
                  {hasMinMembers ? 'Launch Newsroom' : `Add ${2 - selectedUsers.length} more`}
                </Text>
              )}
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
      maxWidth: 520,
      maxHeight: '90%',
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
    scrollBody: {
      padding: 20,
      gap: 16,
    },
    field: {
      gap: 6,
    },
    label: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    input: {
      minHeight: 44,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 14,
    },
    requirementBox: {
      padding: 10,
      borderRadius: 6,
      backgroundColor: colors.paleOrange,
      borderWidth: 1,
      borderColor: colors.orange,
    },
    requirementBoxValid: {
      backgroundColor: colors.paleGreen,
      borderColor: colors.forest,
    },
    requirementText: {
      color: colors.orange,
      fontSize: 11,
      fontWeight: '700',
    },
    requirementTextValid: {
      color: colors.forest,
    },
    selectedSection: {
      gap: 8,
    },
    selectedHeading: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.forest,
    },
    chipText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    chipRemove: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    searchSection: {
      gap: 6,
    },
    searchInput: {
      minHeight: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 13,
    },
    resultsList: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      overflow: 'hidden',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    userRowSelected: {
      backgroundColor: colors.paleGreen,
    },
    userAvatar: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.note,
    },
    userAvatarSelected: {
      backgroundColor: colors.forest,
    },
    userAvatarText: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '800',
    },
    userAvatarTextSelected: {
      color: '#fff',
    },
    userCopy: {
      flex: 1,
    },
    userName: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: '700',
    },
    userNameSelected: {
      color: colors.forest,
    },
    userHandle: {
      color: colors.muted,
      fontSize: 11,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleSelected: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    checkMark: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '800',
    },
    checkMarkSelected: {
      color: '#fff',
    },
    emptySearchText: {
      color: colors.muted,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    cancelBtn: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    cancelText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    submitBtn: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: 6,
      backgroundColor: colors.forest,
    },
    submitBtnDisabled: {
      backgroundColor: colors.line,
    },
    submitText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
