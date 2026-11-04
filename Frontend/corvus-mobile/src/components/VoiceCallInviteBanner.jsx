import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Phone, PhoneOff } from './VoiceChatIcons';

/**
 * VoiceCallInviteBanner
 *
 * A slide-down notification banner that appears at the top of the chat pane
 * when another user has started a voice session in the current room.
 *
 * @param {object|null} invite       - The voice_call_status event payload, or null to hide.
 * @param {function}    onJoin       - Callback when the user taps "Join".
 * @param {function}    onDismiss    - Callback when the user taps "Dismiss".
 */
export default function VoiceCallInviteBanner({ invite, onJoin, onDismiss }) {
  const slideAnim   = useRef(new Animated.Value(-90)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ── Animate in/out whenever `invite` presence changes ───────────────────────
  useEffect(() => {
    if (invite) {
      // Slide down + fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 11,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      // Slide up + fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -90,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [invite, slideAnim, opacityAnim]);

  // Don't mount at all when there is nothing to show and the animation has
  // fully completed — avoids unnecessary layout nodes.
  if (!invite) return null;

  const initiator = invite.initiator_name || 'A colleague';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        {/* Left: Icon + copy */}
        <View style={styles.infoSection}>
          <View style={styles.iconRing}>
            <Phone size={14} color="#10B981" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.titleText} numberOfLines={1}>
              {invite?.room_title ? `Voice in ${invite.room_title}` : 'Voice session started'}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {initiator} opened a live voice channel
            </Text>
          </View>
        </View>

        {/* Right: Action buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss voice call invitation"
          >
            <PhoneOff size={13} color="#8C8880" />
          </Pressable>

          <Pressable
            onPress={onJoin}
            style={styles.joinButton}
            accessibilityRole="button"
            accessibilityLabel="Join voice session"
          >
            <Phone size={13} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>

      {/* Pulsing live indicator strip at the bottom edge */}
      <LiveStrip />
    </Animated.View>
  );
}

/**
 * LiveStrip — a thin animated green gradient bar along the banner bottom edge,
 * acting as a subtle "live" indicator without any text.
 */
function LiveStrip() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const bgOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  return (
    <Animated.View
      style={[styles.liveStrip, { opacity: bgOpacity }]}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Sits at the top of whatever container it is placed in
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    // Subtle shadow so it floats cleanly over sidebars, tabs, and content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: 'rgba(15, 20, 18, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
    }),
  },
  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
    minWidth: 0,
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    color: '#E0DED6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  subtitleText: {
    color: '#8C8880',
    fontSize: 10,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  liveStrip: {
    height: 2,
    backgroundColor: '#10B981',
    width: '100%',
  },
});

