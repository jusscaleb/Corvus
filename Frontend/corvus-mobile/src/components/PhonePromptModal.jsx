import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUserProfile } from '../services/api';

/**
 * Pure helper to check whether a phone number string is non-empty and formatted
 * as a valid E.164 / international mobile number (7 to 18 digits).
 */
export function hasValidPhoneNumber(rawPhone) {
  if (!rawPhone) return false;
  const cleaned = String(rawPhone)
    .trim()
    .replace(/[\s\-().]/g, '')
    .replace(/^00/, '+');
  return /^\+?[0-9]{7,18}$/.test(cleaned);
}

/**
 * Normalizes a raw phone string into compact E.164 format (e.g. "+263 77 123 4567" -> "+263771234567").
 */
export function formatPhoneForApi(rawPhone) {
  if (!rawPhone) return '';
  return String(rawPhone)
    .trim()
    .replace(/[\s\-().]/g, '')
    .replace(/^00/, '+');
}

/**
 * Pure helper determining whether the UI should automatically prompt the authenticated
 * user to add their phone number for offline SMS newsroom dispatches.
 */
export function shouldPromptForPhoneNumber(user, dismissedForSession = false) {
  if (!user || dismissedForSession) return false;
  return !hasValidPhoneNumber(user.phone_number);
}

function PhoneWireIcon({ size = 18, color = '#fff' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <Line x1="12" y1="18" x2="12.01" y2="18" />
      <Path d="M9 7h6" />
      <Path d="M9 11h4" />
    </Svg>
  );
}

const COUNTRY_PREFIXES = [
  { label: '🇿🇼 +263', code: '+263 ' },
  { label: '🇿🇦 +27', code: '+27 ' },
  { label: '🇰🇪 +254', code: '+254 ' },
  { label: '🇬🇧 +44', code: '+44 ' },
  { label: '🇺🇸 +1', code: '+1 ' },
];

export default function PhonePromptModal({ visible, onClose, onSaved }) {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const styles = makeStyles(colors);

  const [phoneInput, setPhoneInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      setPhoneInput(user?.phone_number || '+263 ');
      setErrorMsg('');
      setSaving(false);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver }),
        Animated.spring(scale, { toValue: 1, tension: 85, friction: 9, useNativeDriver }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver }),
        Animated.timing(scale, { toValue: 0.94, duration: 140, useNativeDriver }),
      ]).start();
    }
    // Only reset form when `visible` transitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const applyCountryPrefix = (prefix) => {
    setErrorMsg('');
    const stripped = phoneInput.replace(/^\+\d+\s*/, '');
    setPhoneInput(`${prefix}${stripped}`);
  };

  const handleSavePhone = async () => {
    if (saving) return;
    const normalized = formatPhoneForApi(phoneInput);
    if (!hasValidPhoneNumber(normalized)) {
      setErrorMsg('Please enter a valid mobile number with country code (e.g. +263 77 123 4567).');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const updatedProfile = await updateUserProfile({ phone_number: normalized });
      updateUser(updatedProfile || { phone_number: normalized });
      showToast({
        message: `Offline SMS Wire enabled for ${normalized}. You'll receive AI summaries when newsroom branches are published.`,
        type: 'info',
      });
      if (onSaved) onSaved(normalized);
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save phone number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const isExistingUpdate = Boolean(user?.phone_number);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />

        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <PhoneWireIcon size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>OFFLINE NEWSROOM WIRE • TWILIO SMS DISPATCH</Text>
              <Text style={styles.title}>
                {isExistingUpdate ? 'Update Offline SMS Number' : 'Add Your Phone for Offline SMS Alerts'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss SMS prompt"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.description}>
              Stay in the loop even when you have <Text style={styles.boldText}>no mobile data or internet</Text>.
              Whenever a colleague in your newsroom publishes a new branch, <Text style={styles.boldText}>Saiph AI</Text> reads
              the article and texts a concise 160-character summary straight to your phone.
            </Text>

            {/* Sample SMS Preview */}
            <View style={styles.smsPreviewBox}>
              <Text style={styles.smsPreviewLabel}>EXAMPLE OFFLINE SMS DISPATCH (160 CHARS)</Text>
              <Text style={styles.smsPreviewText}>
                [Corvus•Metro Desk] Jane pushed 'legal-review' (Water Audit): Audit reveals $14M in municipal water tenders bypassed public bidding.
              </Text>
            </View>

            {/* Quick Country Prefix Chips */}
            <Text style={styles.fieldLabel}>MOBILE PHONE NUMBER (WITH COUNTRY CODE)</Text>
            <View style={styles.prefixRow}>
              {COUNTRY_PREFIXES.map((item) => (
                <Pressable
                  key={item.code}
                  accessibilityRole="button"
                  onPress={() => applyCountryPrefix(item.code)}
                  style={styles.prefixChip}
                >
                  <Text style={styles.prefixChipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              accessibilityLabel="Mobile phone number for SMS alerts"
              value={phoneInput}
              onChangeText={(txt) => {
                setPhoneInput(txt);
                if (errorMsg) setErrorMsg('');
              }}
              onSubmitEditing={handleSavePhone}
              placeholder="+263 77 123 4567"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                errorMsg && { borderColor: '#dc2626' },
              ]}
            />

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              disabled={saving}
              style={styles.laterBtn}
            >
              <Text style={styles.laterBtnText}>
                {isExistingUpdate ? 'Cancel' : 'Remind Me Later'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save phone number and enable SMS alerts"
              onPress={handleSavePhone}
              disabled={saving || !phoneInput.trim()}
              style={[
                styles.saveBtn,
                (saving || !phoneInput.trim()) && { opacity: 0.55 },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isExistingUpdate ? 'Update SMS Number' : 'Enable SMS Alerts'}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(12, 16, 20, 0.62)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.cardBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 15,
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.orange,
      marginBottom: 2,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'serif',
      color: colors.ink,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: colors.note,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
    },
    body: {
      padding: 18,
      gap: 12,
    },
    description: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
    },
    boldText: {
      fontWeight: '700',
      color: colors.ink,
    },
    smsPreviewBox: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderLeftWidth: 3,
      borderLeftColor: colors.forest,
      gap: 4,
    },
    smsPreviewLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.forest,
    },
    smsPreviewText: {
      fontSize: 12,
      fontFamily: 'monospace',
      lineHeight: 17,
      color: colors.ink,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.ink,
      marginTop: 2,
    },
    prefixRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    prefixChip: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 5,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
    },
    prefixChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.ink,
    },
    input: {
      height: 44,
      paddingHorizontal: 13,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      color: colors.ink,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    errorText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#dc2626',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 13,
      backgroundColor: colors.sidebarBg,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    laterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    laterBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
    },
    saveBtn: {
      minWidth: 150,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 6,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });

