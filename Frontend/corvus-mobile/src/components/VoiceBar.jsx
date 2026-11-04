import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Mic,
  MicOff,
  PhoneOff,
  Headphones,
  VolumeX,
  ChevronDown,
  ChevronUp,
} from './VoiceChatIcons';

/**
 * Animated Pulse Ring for Active Speaker
 */
function SpeakingRing({ isSpeaking, color = '#10B981', children }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let animation = null;
    if (isSpeaking) {
      animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.9,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isSpeaking, pulseAnim, opacityAnim]);

  return (
    <View style={styles.avatarWrapper}>
      {isSpeaking && (
        <Animated.View
          style={[
            styles.speakingHalo,
            {
              borderColor: color,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

/**
 * Equalizer Wave Indicator for the Current Speaker
 */
function EqualizerWave({ isSpeaking, color = '#10B981' }) {
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(8)).current;
  const bar3 = useRef(new Animated.Value(5)).current;

  useEffect(() => {
    if (!isSpeaking) {
      bar1.setValue(3);
      bar2.setValue(4);
      bar3.setValue(3);
      return;
    }

    const animateBar = (anim, minVal, maxVal, dur) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: maxVal, duration: dur, useNativeDriver: false }),
          Animated.timing(anim, { toValue: minVal, duration: dur, useNativeDriver: false }),
        ])
      );
    };

    const a1 = animateBar(bar1, 3, 14, 280);
    const a2 = animateBar(bar2, 4, 18, 350);
    const a3 = animateBar(bar3, 3, 12, 220);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isSpeaking, bar1, bar2, bar3]);

  if (!isSpeaking) return null;

  return (
    <View style={styles.equalizerContainer}>
      <Animated.View style={[styles.eqBar, { height: bar1, backgroundColor: color }]} />
      <Animated.View style={[styles.eqBar, { height: bar2, backgroundColor: color }]} />
      <Animated.View style={[styles.eqBar, { height: bar3, backgroundColor: color }]} />
    </View>
  );
}

/**
 * VoiceBar Component
 * Overlay bar anchored to the newsroom / mind map workspace.
 *
 * @param {object} voiceChat - Handle returned by useVoiceChat hook
 * @param {string} roomTitle - Optional display title for the active session
 * @param {function} onDisconnect - Callback invoked upon disconnecting
 */
export default function VoiceBar({ voiceChat, roomTitle = 'Investigation Desk', onDisconnect }) {
  const [minimized, setMinimized] = useState(false);

  const {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    participants = [],
    error,
    toggleMute,
    toggleDeafen,
    disconnect,
  } = voiceChat || {};

  const handleDisconnect = () => {
    if (disconnect) disconnect();
    if (onDisconnect) onDisconnect();
  };

  if (!isConnected && !isConnecting && !error) {
    return null;
  }

  // Identify who is currently talking
  const activeSpeakers = participants.filter((p) => p.isSpeaking);
  const speakerLabel =
    activeSpeakers.length > 0
      ? activeSpeakers.map((s) => (s.isLocal ? 'You' : s.userName.split(' ')[0])).join(', ') + ' speaking...'
      : null;

  return (
    <View style={styles.anchorContainer} pointerEvents="box-none">
      <View style={styles.voiceBarContainer}>
        {/* Error Notification Pill */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          </View>
        )}

        {/* Minimized Docked Tab */}
        {minimized ? (
          <Pressable onPress={() => setMinimized(false)} style={styles.minimizedTab}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.minimizedTitle}>
              Voice ({participants.length})
            </Text>
            {activeSpeakers.length > 0 && <EqualizerWave isSpeaking={true} color="#10B981" />}
            <ChevronUp size={14} color="#E0DED6" style={{ marginLeft: 6 }} />
          </Pressable>
        ) : (
          /* Full Expanded Voice Bar */
          <View style={styles.contentRow}>
            {/* Left: Room Status & Speaking Feedback */}
            <View style={styles.roomStatusCol}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.liveIndicatorDot,
                    isConnecting ? styles.connectingDot : styles.activeDot,
                  ]}
                />
                <Text style={styles.channelBadgeText}>
                  {isConnecting ? 'CONNECTING...' : 'LIVE VOICE'}
                </Text>
              </View>

              <Text style={styles.roomTitleText} numberOfLines={1}>
                {speakerLabel || roomTitle}
              </Text>
            </View>

            {/* Center: Participant Avatars Stack */}
            <View style={styles.participantsStack}>
              {participants.map((participant) => {
                const initials = (participant.userName || 'J')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                const isSpeaking = participant.isSpeaking;
                const isMutedPeer = participant.isMuted;

                return (
                  <SpeakingRing key={participant.userId} isSpeaking={isSpeaking}>
                    <View
                      style={[
                        styles.avatarCircle,
                        participant.isLocal ? styles.localAvatar : styles.remoteAvatar,
                        isSpeaking && styles.avatarSpeakingBorder,
                      ]}
                    >
                      <Text style={styles.avatarInitials}>{initials}</Text>

                      {/* Mute badge on avatar */}
                      {isMutedPeer && (
                        <View style={styles.avatarMuteBadge}>
                          <MicOff size={8} color="#FFFFFF" />
                        </View>
                      )}

                      {/* Equalizer indicator above avatar if speaking */}
                      {isSpeaking && (
                        <View style={styles.avatarEqBadge}>
                          <EqualizerWave isSpeaking={true} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </SpeakingRing>
                );
              })}
            </View>

            {/* Right: Audio Action Controls */}
            <View style={styles.actionsGroup}>
              {/* Mute / Unmute Button */}
              <Pressable
                onPress={toggleMute}
                style={[
                  styles.controlButton,
                  isMuted ? styles.controlBtnMuted : styles.controlBtnActive,
                ]}
                accessibilityLabel={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? (
                  <MicOff size={15} color="#FFFFFF" />
                ) : (
                  <Mic size={15} color="#E0DED6" />
                )}
              </Pressable>

              {/* Deafen / Undeafen Button */}
              <Pressable
                onPress={toggleDeafen}
                style={[
                  styles.controlButton,
                  isDeafened ? styles.controlBtnDeafened : styles.controlBtnActive,
                ]}
                accessibilityLabel={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
              >
                {isDeafened ? (
                  <VolumeX size={15} color="#FFFFFF" />
                ) : (
                  <Headphones size={15} color="#E0DED6" />
                )}
              </Pressable>

              {/* Disconnect Call Button */}
              <Pressable
                onPress={handleDisconnect}
                style={styles.disconnectButton}
                accessibilityLabel="Leave Voice Channel"
              >
                <PhoneOff size={15} color="#FFFFFF" />
              </Pressable>

              {/* Minimize Dock Button */}
              <Pressable
                onPress={() => setMinimized(true)}
                style={styles.minimizeBtn}
                accessibilityLabel="Minimize Voice Bar"
              >
                <ChevronDown size={14} color="#8C8880" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchorContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  voiceBarContainer: {
    maxWidth: 680,
    width: '92%',
    backgroundColor: 'rgba(20, 22, 24, 0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(16px)',
      userSelect: 'none',
    }),
  },
  errorBanner: {
    backgroundColor: '#C84B31',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  minimizedTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  minimizedTitle: {
    color: '#E0DED6',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomStatusCol: {
    maxWidth: 160,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#10B981',
  },
  connectingDot: {
    backgroundColor: '#F59E0B',
  },
  channelBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roomTitleText: {
    color: '#E0DED6',
    fontSize: 12,
    fontWeight: '700',
  },
  participantsStack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  avatarWrapper: {
    marginHorizontal: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingHalo: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  localAvatar: {
    backgroundColor: '#315E4A',
  },
  remoteAvatar: {
    backgroundColor: '#2E2C28',
  },
  avatarSpeakingBorder: {
    borderColor: '#10B981',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarMuteBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#C84B31',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#141618',
  },
  avatarEqBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#141618',
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 10,
    width: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  eqBar: {
    width: 2.5,
    borderRadius: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlBtnMuted: {
    backgroundColor: '#C84B31',
  },
  controlBtnDeafened: {
    backgroundColor: '#7C3AED',
  },
  disconnectButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C84B31',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  minimizeBtn: {
    padding: 6,
    marginLeft: 4,
  },
});

