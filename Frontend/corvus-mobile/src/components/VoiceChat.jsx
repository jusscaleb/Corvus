import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Bot,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { lightColors } from '../theme/colors';

// ============================================================================
// VOICE CHAT CONTEXT & PROVIDER
// ============================================================================
const VoiceChatContext = createContext(null);

export function useVoiceChat() {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider');
  }
  return context;
}

export function VoiceChatProvider({ children }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
  const [activeCallData, setActiveCallData] = useState(null);
  const [targetUser, setTargetUser] = useState({
    name: 'Sarah Jenkins',
    avatar: 'SJ',
  });

  const startVoiceCall = (name = 'Sarah Jenkins', avatar = 'SJ') => {
    setTargetUser({ name, avatar });
    setIsModalVisible(true);
  };

  const toggleGlobalAi = () => {
    setGlobalAiEnabled((prev) => !prev);
  };

  const handleEndMinimizedCall = () => {
    if (activeCallData?.handleEndCall) {
      activeCallData.handleEndCall();
    }
    setActiveCallData(null);
  };

  return (
    <VoiceChatContext.Provider
      value={{
        isModalVisible,
        setIsModalVisible,
        globalAiEnabled,
        toggleGlobalAi,
        activeCallData,
        setActiveCallData,
        targetUser,
        startVoiceCall,
      }}
    >
      <View style={styles.providerContainer}>
        {/* Multitasking Call Strip */}
        <FloatingCallBanner
          activeCallData={activeCallData}
          onExpandCall={() => setIsModalVisible(true)}
          onEndCall={handleEndMinimizedCall}
        />
        
        {/* Rest of App UI */}
        <View style={styles.childrenWrapper}>{children}</View>

        {/* Voice Call Popup Modal */}
        <VoiceChatModal
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setActiveCallData(null);
          }}
          targetName={targetUser.name}
          targetAvatar={targetUser.avatar}
          globalAiEnabled={globalAiEnabled}
          activeCallData={activeCallData}
          onMinimizeCall={(data) => {
            setActiveCallData(data);
            setIsModalVisible(false);
          }}
        />
      </View>
    </VoiceChatContext.Provider>
  );
}

// ============================================================================
// CHAT SCREEN HEADER (Connects directly to MainScreen.jsx)
// ============================================================================
export function ChatScreenHeader({
  title,
  subtitle,
  avatar,
  memberCount,
  onOpenVoiceCall,
}) {
  const { globalAiEnabled, toggleGlobalAi, startVoiceCall } = useVoiceChat();
  let themeColors = lightColors;
  try {
    const theme = useTheme();
    if (theme?.colors) themeColors = theme.colors;
  } catch (_) {
    themeColors = lightColors;
  }

  const avatarText = avatar || (title ? title.substring(0, 2).toUpperCase() : 'DM');

  const handlePhonePress = () => {
    if (onOpenVoiceCall) {
      onOpenVoiceCall();
    } else {
      startVoiceCall(title, avatarText);
    }
  };

  return (
    <View
      style={[
        styles.chatHeader,
        {
          backgroundColor: themeColors.headerBg || '#ffffff',
          borderBottomColor: themeColors.line || '#d6d3d1',
        },
      ]}
    >
      <View style={styles.chatHeaderLeft}>
        {avatarText ? (
          <View
            style={[
              styles.chatHeaderAvatar,
              { backgroundColor: themeColors.ink || '#1c1917' },
            ]}
          >
            <Text
              style={[
                styles.chatHeaderAvatarText,
                { color: themeColors.paper || '#ffffff' },
              ]}
            >
              {avatarText}
            </Text>
          </View>
        ) : null}
        <View style={styles.chatHeaderTitleContainer}>
          <Text
            style={[
              styles.chatHeaderTitle,
              { color: themeColors.ink || '#1c1917' },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.chatHeaderSubtitle,
              { color: themeColors.muted || '#78716c' },
            ]}
            numberOfLines={1}
          >
            {subtitle || 'Active Channel'}
          </Text>
        </View>
      </View>

      <View style={styles.chatHeaderRightControls}>
        {memberCount ? (
          <Text
            style={[
              styles.chatMemberCount,
              { color: themeColors.muted || '#78716c' },
            ]}
            numberOfLines={1}
          >
            {memberCount}
          </Text>
        ) : null}

        {/* Robot Symbol AI Toggle Switch */}
        <TouchableOpacity
          onPress={toggleGlobalAi}
          activeOpacity={0.8}
          style={[
            styles.aiToggleBox,
            {
              backgroundColor: themeColors.sidebarBg || '#f5f5f4',
              borderColor: themeColors.line || '#d6d3d1',
            },
          ]}
          accessibilityLabel="Toggle Corvus AI assistant"
          accessibilityRole="switch"
          accessibilityState={{ checked: globalAiEnabled }}
        >
          <Bot
            size={16}
            color={globalAiEnabled ? (themeColors.ink || '#1c1917') : (themeColors.muted || '#a8a29e')}
          />
          <View
            style={[
              styles.switchTrack,
              globalAiEnabled
                ? [styles.switchTrackOn, { backgroundColor: themeColors.ink || '#1c1917' }]
                : [styles.switchTrackOff, { backgroundColor: themeColors.line || '#d6d3d1' }],
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                globalAiEnabled ? styles.switchThumbOn : styles.switchThumbOff,
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Voice Chat Trigger Button */}
        <TouchableOpacity
          onPress={handlePhonePress}
          activeOpacity={0.8}
          style={[
            styles.voiceCallTriggerBtn,
            { backgroundColor: themeColors.forest || themeColors.ink || '#1c1917' },
          ]}
          accessibilityLabel={`Start voice call with ${title}`}
          accessibilityRole="button"
        >
          <Phone size={14} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// VOICE CHAT MODAL UI COMPONENT
// ============================================================================
export function VoiceChatModal({
  visible,
  onClose,
  targetName = 'Sarah Jenkins',
  targetAvatar = 'SJ',
  globalAiEnabled = true,
  activeCallData = null,
  onMinimizeCall,
}) {
  const [callState, setCallState] = useState(activeCallData ? 'active' : 'prompt'); // 'prompt' | 'active'
  const [includeAi, setIncludeAi] = useState(globalAiEnabled);
  const [showNotification, setShowNotification] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState('target');

  // Sync if opened with existing minimized call
  useEffect(() => {
    if (visible && activeCallData) {
      setCallState('active');
      if (typeof activeCallData.includeAi === 'boolean') {
        setIncludeAi(activeCallData.includeAi);
      }
      if (typeof activeCallData.isMuted === 'boolean') {
        setIsMuted(activeCallData.isMuted);
      }
    }
  }, [visible, activeCallData]);

  // Passive AI Voice Call Simulation
  useEffect(() => {
    if (callState !== 'active') return;
    const speakers = ['you', 'target', null];
    const interval = setInterval(() => {
      const nextSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
      setActiveSpeaker(nextSpeaker);
    }, 2800);
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (!activeCallData) {
      setIncludeAi(globalAiEnabled);
    }
  }, [globalAiEnabled, activeCallData]);

  const handleStartCall = (withAi) => {
    setIncludeAi(withAi);
    setCallState('active');
    if (withAi) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3500);
    }
  };

  const handleEndCall = () => {
    setCallState('prompt');
    setShowNotification(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* STEP 1: AI PERMISSION PROMPT */}
          {callState === 'prompt' && (
            <View style={styles.promptContent}>
              <View style={styles.sparkleIconWrapper}>
                <Sparkles size={24} color="#1c1917" />
              </View>

              <Text style={styles.promptTitle}>Start Voice Call</Text>
              <Text style={styles.promptSubtitle}>
                Connecting with <Text style={styles.boldText}>{targetName}</Text>
              </Text>

              <View style={styles.consentCard}>
                <Text style={styles.consentHeader}>Allow Corvus AI on this call?</Text>
                <Text style={styles.consentText}>
                  Corvus AI will listen passively in the background without speaking to provide transcriptions and context.
                </Text>
              </View>

              <View style={styles.promptButtonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOutline]}
                  onPress={() => handleStartCall(false)}
                >
                  <Text style={styles.btnOutlineText}>No AI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnDark]}
                  onPress={() => handleStartCall(true)}
                >
                  <Bot size={14} color="#f59e0b" style={styles.iconMarginRight} />
                  <Text style={styles.btnDarkText}>AI Mode</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: ACTIVE VOICE CHAT INTERFACE */}
          {callState === 'active' && (
            <View style={styles.activeCallContainer}>
              {showNotification && (
                <View style={styles.aiNoticeBanner}>
                  <Bot size={14} color="#f59e0b" />
                  <Text style={styles.aiNoticeText}>
                    Corvus AI is passively listening.
                  </Text>
                </View>
              )}

              {/* Call Header */}
              <View style={styles.callHeader}>
                <View style={styles.statusRow}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.callHeaderTitle}>Call Active</Text>
                </View>

                <View style={styles.headerControlGroup}>
                  <TouchableOpacity
                    onPress={() =>
                      onMinimizeCall({
                        targetName,
                        targetAvatar,
                        isMuted,
                        setIsMuted,
                        handleEndCall,
                        includeAi,
                      })
                    }
                    style={styles.iconBtnSmall}
                  >
                    <Minimize2 size={14} color="#e7e5e4" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setIncludeAi(!includeAi);
                      if (!includeAi) {
                        setShowNotification(true);
                        setTimeout(() => setShowNotification(false), 3000);
                      }
                    }}
                    style={[
                      styles.iconBtnSmall,
                      includeAi ? styles.aiActiveBtn : styles.aiInactiveBtn,
                    ]}
                  >
                    <Bot size={14} color={includeAi ? '#1c1917' : '#a8a29e'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Participants Dropdown */}
              <View style={styles.participantsBox}>
                <TouchableOpacity
                  onPress={() => setShowParticipantsDropdown(!showParticipantsDropdown)}
                  style={styles.participantsToggleBtn}
                >
                  <Text style={styles.participantsToggleText}>Participants (2)</Text>
                  {showParticipantsDropdown ? (
                    <ChevronUp size={14} color="#a8a29e" />
                  ) : (
                    <ChevronDown size={14} color="#a8a29e" />
                  )}
                </TouchableOpacity>

                {showParticipantsDropdown && (
                  <View style={styles.participantsList}>
                    <View
                      style={[
                        styles.participantItem,
                        activeSpeaker === 'you' && styles.participantItemActive,
                      ]}
                    >
                      <Text style={styles.participantName}>You (Host)</Text>
                      {activeSpeaker === 'you' && (
                        <Text style={styles.speakingBadge}>Speaking...</Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.participantItem,
                        activeSpeaker === 'target' && styles.participantItemActive,
                      ]}
                    >
                      <Text style={styles.participantName}>{targetName}</Text>
                      {activeSpeaker === 'target' && (
                        <Text style={styles.speakingBadge}>Speaking...</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* Center Active Speaker Visualizer */}
              <View style={styles.speakerVisualContainer}>
                <View
                  style={[
                    styles.avatarCircle,
                    activeSpeaker === 'target' && styles.avatarCircleSpeaking,
                  ]}
                >
                  <Text style={styles.avatarText}>{targetAvatar}</Text>
                </View>

                <Text style={styles.speakerTitle}>{targetName}</Text>
                <Text style={styles.speakerStatus}>
                  {activeSpeaker === 'target' ? 'Speaking...' : 'Connected'}
                </Text>

                {includeAi && (
                  <View style={styles.aiTag}>
                    <Bot size={12} color="#f59e0b" />
                    <Text style={styles.aiTagText}>AI passively listening</Text>
                  </View>
                )}
              </View>

              {/* Call Control Buttons */}
              <View style={styles.callActionBar}>
                <TouchableOpacity
                  onPress={() => setIsMuted(!isMuted)}
                  style={[styles.actionRoundBtn, isMuted && styles.actionBtnActiveRed]}
                >
                  {isMuted ? (
                    <MicOff size={16} color="#ef4444" />
                  ) : (
                    <Mic size={16} color="#e7e5e4" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEndCall}
                  style={styles.endCallBtn}
                >
                  <PhoneOff size={18} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsDeafened(!isDeafened)}
                  style={[styles.actionRoundBtn, isDeafened && styles.actionBtnActiveRed]}
                >
                  <Volume2 size={16} color={isDeafened ? '#ef4444' : '#e7e5e4'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// FLOATING CALL BANNER (FOR MULTITASKING ON MAIN SCREEN)
// ============================================================================
export function FloatingCallBanner({ activeCallData, onExpandCall, onEndCall }) {
  if (!activeCallData) return null;

  return (
    <View style={styles.floatingCallBar}>
      <View style={styles.floatingCallLeft}>
        <View style={styles.greenPulseDot} />
        <Text style={styles.floatingCallName}>{activeCallData.targetName}</Text>
        {activeCallData.includeAi && (
          <View style={styles.floatingAiBadge}>
            <Bot size={12} color="#1c1917" />
          </View>
        )}
      </View>

      <View style={styles.floatingCallRight}>
        <TouchableOpacity onPress={onExpandCall} style={styles.floatingIconBtn}>
          <Maximize2 size={13} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onEndCall} style={styles.floatingEndBtn}>
          <PhoneOff size={13} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default VoiceChatProvider;

// ============================================================================
// REACT NATIVE STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  providerContainer: {
    flex: 1,
  },
  childrenWrapper: {
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  iconMarginRight: {
    marginRight: 4,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chatHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d6d3d1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 70,
  },
  chatHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
    minWidth: 0,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1917',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  chatHeaderTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  chatHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  chatHeaderSubtitle: {
    fontSize: 10,
    color: '#78716c',
    marginTop: 3,
  },
  chatMemberCount: {
    fontSize: 9,
    color: '#78716c',
    fontFamily: 'monospace',
    marginRight: 4,
  },
  chatHeaderRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f4',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  switchTrack: {
    width: 28,
    height: 16,
    borderRadius: 8,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#1c1917',
  },
  switchTrackOff: {
    backgroundColor: '#d6d3d1',
  },
  switchThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  switchThumbOn: {
    transform: [{ translateX: 12 }],
  },
  switchThumbOff: {
    transform: [{ translateX: 0 }],
  },
  voiceCallTriggerBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#1c1917',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1c1917',
    borderRadius: 16,
    overflow: 'hidden',
  },
  promptContent: {
    padding: 24,
    alignItems: 'center',
  },
  sparkleIconWrapper: {
    width: 52,
    height: 52,
    backgroundColor: '#f5f5f4',
    borderWidth: 2,
    borderColor: '#1c1917',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  promptSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
    marginBottom: 12,
  },
  consentCard: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  consentHeader: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1c1917',
    marginBottom: 4,
  },
  consentText: {
    fontSize: 11,
    color: '#78716c',
    lineHeight: 15,
  },
  promptButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: '#1c1917',
    backgroundColor: '#ffffff',
  },
  btnOutlineText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1c1917',
  },
  btnDark: {
    backgroundColor: '#1c1917',
    borderWidth: 2,
    borderColor: '#1c1917',
  },
  btnDarkText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#ffffff',
  },
  cancelText: {
    fontSize: 12,
    color: '#a8a29e',
    textDecorationLine: 'underline',
  },
  activeCallContainer: {
    backgroundColor: '#1c1917',
  },
  aiNoticeBanner: {
    backgroundColor: '#292524',
    borderColor: '#f59e0b',
    borderWidth: 1,
    padding: 8,
    margin: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiNoticeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  callHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
    backgroundColor: '#0c0a09',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  callHeaderTitle: {
    fontSize: 12,
    color: '#d6d3d1',
    fontFamily: 'monospace',
  },
  headerControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtnSmall: {
    padding: 6,
    backgroundColor: '#292524',
    borderRadius: 6,
  },
  aiActiveBtn: {
    backgroundColor: '#f59e0b',
  },
  aiInactiveBtn: {
    backgroundColor: '#292524',
  },
  participantsBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
    backgroundColor: '#1c1917',
  },
  participantsToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d6d3d1',
  },
  participantsList: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#292524',
  },
  participantItemActive: {
    borderColor: '#10b981',
    backgroundColor: '#292524',
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e7e5e4',
  },
  speakingBadge: {
    fontSize: 10,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  speakerVisualContainer: {
    padding: 24,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#292524',
    borderWidth: 3,
    borderColor: '#44403c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircleSpeaking: {
    borderColor: '#10b981',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#e7e5e4',
  },
  speakerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f5f5f4',
  },
  speakerStatus: {
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 2,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  aiTagText: {
    fontSize: 10,
    color: '#f59e0b',
  },
  callActionBar: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#292524',
    backgroundColor: '#0c0a09',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionRoundBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: '#44403c',
  },
  actionBtnActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  endCallBtn: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#dc2626',
  },
  floatingCallBar: {
    backgroundColor: '#1c1917',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1c1917',
    zIndex: 999,
  },
  floatingCallLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCallName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  floatingAiBadge: {
    backgroundColor: '#f59e0b',
    padding: 3,
    borderRadius: 4,
  },
  floatingCallRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingIconBtn: {
    padding: 6,
    backgroundColor: '#292524',
    borderRadius: 4,
  },
  floatingEndBtn: {
    padding: 6,
    backgroundColor: '#dc2626',
    borderRadius: 4,
  },
});
