import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { API_BASE_URL, authStorage } from '../services/api';
import mobileAudioEngine from '../services/mobileAudioEngine';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.services.mozilla.com' },
];

/**
 * useVoiceChat Hook
 * Full-duplex WebRTC multi-user voice hook for Corvus Newsroom sessions.
 * Communicates with the Django Channels VoiceSignalingConsumer.
 *
 * @param {string} roomId - Identifier of the active newsroom or mindmap room.
 * @param {object} currentUser - Authenticated user details { user_id, username, full_name }.
 * @param {object} options - Optional config { iceServers, autoJoin, onSpeakingChange }.
 */
export function useVoiceChat(roomId, currentUser, options = {}) {
  const { iceServers = DEFAULT_ICE_SERVERS, autoJoin = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [participants, setParticipants] = useState([]); // array of { userId, userName, isSpeaking, isMuted, isLocal }
  const [error, setError] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioMeter, setAudioMeter] = useState(-160);

  // References for WebRTC and WebSocket handles
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // Map<userId, { pc, stream, audioElement, analyser, isSpeaking, isMuted, userName }>
  const candidateQueueRef = useRef(new Map()); // Map<userId, RTCIceCandidateInit[]>
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const isMutedRef = useRef(false);
  const isDeafenedRef = useRef(false);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // Keep ref values in sync with state for access in callbacks
  isMutedRef.current = isMuted;
  isDeafenedRef.current = isDeafened;

  const myUserId = currentUser?.user_id || currentUser?.id || 'local-user';
  const myUserName = currentUser?.full_name || currentUser?.username || 'You';

  // ─── WebSocket URL Helper ───────────────────────────────────────────────────
  const getWebSocketUrl = useCallback((overrideRoomId) => {
    const effectiveRoomId = overrideRoomId || roomIdRef.current;
    let base = API_BASE_URL || (Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.120.0.23:8000');
    let wsScheme = base.startsWith('https') ? 'wss://' : 'ws://';
    let host = base.replace(/^https?:\/\//, '');

    const token = authStorage.getTokens()?.access;
    let url = `${wsScheme}${host}/ws/rooms/${encodeURIComponent(effectiveRoomId)}/voice/`;

    if (token) {
      url += `?access_token=${encodeURIComponent(token)}`;
    } else {
      url += `?user_id=${encodeURIComponent(myUserId)}&user_name=${encodeURIComponent(myUserName)}`;
    }
    return url;
  }, [myUserId, myUserName]);

  // ─── Send WebSocket Message Helper ──────────────────────────────────────────
  const sendSignal = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // ─── Setup Voice Activity Detection (VAD) ───────────────────────────────────
  const setupVoiceActivityDetection = useCallback((stream) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      sourceNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let wasSpeaking = false;
      let silenceFrames = 0;

      vadIntervalRef.current = setInterval(() => {
        if (!analyser || isMutedRef.current) {
          if (wasSpeaking) {
            wasSpeaking = false;
            setIsLocalSpeaking(false);
            setParticipants((prev) =>
              prev.map((p) => (p.isLocal ? { ...p, isSpeaking: false } : p))
            );
            sendSignal({ type: 'speaking_state', is_speaking: false, is_muted: isMutedRef.current });
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // VAD Threshold: average audio energy level > 12 indicates human speech
        if (average > 12) {
          silenceFrames = 0;
          if (!wasSpeaking) {
            wasSpeaking = true;
            setIsLocalSpeaking(true);
            setParticipants((prev) =>
              prev.map((p) => (p.isLocal ? { ...p, isSpeaking: true } : p))
            );
            sendSignal({ type: 'speaking_state', is_speaking: true, is_muted: false });
          }
        } else {
          silenceFrames += 1;
          // Debounce stopping speech by 3 frames (approx 300ms) to avoid stuttering
          if (wasSpeaking && silenceFrames >= 3) {
            wasSpeaking = false;
            setIsLocalSpeaking(false);
            setParticipants((prev) =>
              prev.map((p) => (p.isLocal ? { ...p, isSpeaking: false } : p))
            );
            sendSignal({ type: 'speaking_state', is_speaking: false, is_muted: isMutedRef.current });
          }
        }
      }, 100);
    } catch (vadErr) {
      console.warn('[useVoiceChat] VAD setup warning:', vadErr);
    }
  }, [sendSignal]);

  // ─── Create RTCPeerConnection for a remote peer ─────────────────────────────
  const createPeerConnection = useCallback((targetUserId, targetUserName = 'Journalist') => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      console.warn('[useVoiceChat] RTCPeerConnection not supported in this runtime.');
      return null;
    }

    // Close any previous peer connection for this user
    if (peersRef.current.has(targetUserId)) {
      const existing = peersRef.current.get(targetUserId);
      existing.pc?.close();
      if (existing.audioElement && existing.audioElement.parentNode) {
        existing.audioElement.parentNode.removeChild(existing.audioElement);
      }
      peersRef.current.delete(targetUserId);
    }

    const pc = new window.RTCPeerConnection({ iceServers });

    // Attach local audio tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Trickle ICE candidates to remote peer via signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice_candidate',
          target_user_id: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle incoming remote media audio track
    pc.ontrack = (event) => {
      let remoteStream = event.streams && event.streams[0];
      if (!remoteStream) {
        remoteStream = new MediaStream([event.track]);
      }

      let audioEl = null;
      let audioNode = null;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        // Pipeline A: Web Audio API direct speaker routing (immune to autoplay block)
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContextClass();
          }
          const audioCtx = audioContextRef.current;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }

          const source = audioCtx.createMediaStreamSource(remoteStream);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = isDeafenedRef.current ? 0 : 1;
          source.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          audioNode = gainNode;
        } catch (ctxErr) {
          console.warn('[useVoiceChat] Web Audio API routing warning:', ctxErr);
        }

        // Pipeline B: HTML5 Audio element fallback with playsInline & volume
        try {
          audioEl = document.createElement('audio');
          audioEl.srcObject = remoteStream;
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.muted = isDeafenedRef.current;
          audioEl.volume = 1.0;
          audioEl.style.position = 'fixed';
          audioEl.style.left = '-9999px';
          audioEl.style.top = '-9999px';
          audioEl.style.width = '1px';
          audioEl.style.height = '1px';
          audioEl.style.opacity = '0';
          document.body.appendChild(audioEl);

          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.warn('[useVoiceChat] HTML5 audio.play blocked by autoplay (Web Audio API active):', e);
            });
          }
        } catch (elErr) {
          console.warn('[useVoiceChat] HTML5 Audio creation warning:', elErr);
        }
      }

      const peerEntry = peersRef.current.get(targetUserId);
      if (peerEntry) {
        peerEntry.stream = remoteStream;
        peerEntry.audioElement = audioEl;
        peerEntry.audioNode = audioNode;
      }
    };

    // Clean up if connection closes or fails
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(targetUserId);
      }
    };

    const peerInfo = {
      pc,
      stream: null,
      audioElement: null,
      audioNode: null,
      isSpeaking: false,
      isMuted: false,
      userName: targetUserName,
    };

    peersRef.current.set(targetUserId, peerInfo);
    candidateQueueRef.current.set(targetUserId, []);

    // Update participants state
    setParticipants((prev) => {
      if (prev.some((p) => p.userId === targetUserId)) return prev;
      return [
        ...prev,
        {
          userId: targetUserId,
          userName: targetUserName,
          isSpeaking: false,
          isMuted: false,
          isLocal: false,
        },
      ];
    });

    return pc;
  }, [iceServers, sendSignal]);

  // ─── Remove Peer Helper ─────────────────────────────────────────────────────
  const removePeer = useCallback((userId) => {
    if (peersRef.current.has(userId)) {
      const peer = peersRef.current.get(userId);
      if (peer.pc) {
        peer.pc.close();
      }
      if (peer.audioElement && peer.audioElement.parentNode) {
        peer.audioElement.parentNode.removeChild(peer.audioElement);
      }
      if (peer.audioNode) {
        try { peer.audioNode.disconnect(); } catch (e) {}
      }
      peersRef.current.delete(userId);
      candidateQueueRef.current.delete(userId);
    }

    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  // ─── Flush ICE Candidates Helper ────────────────────────────────────────────
  const flushQueuedCandidates = useCallback(async (userId, pc) => {
    const queue = candidateQueueRef.current.get(userId) || [];
    while (queue.length > 0) {
      const cand = queue.shift();
      try {
        await pc.addIceCandidate(new window.RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[useVoiceChat] Error adding queued ICE candidate:', err);
      }
    }
  }, []);

  // ─── Connect to Voice Room ──────────────────────────────────────────────────
  const connect = useCallback(async (targetRoomId) => {
    const effectiveRoomId = targetRoomId || roomIdRef.current;
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    // 0. Pre-unlock Web Audio API context within user interaction
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContextClass();
          }
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
      } catch (e) {
        console.warn('[useVoiceChat] AudioContext unlock warning:', e);
      }
    }

    // 1. Capture microphone input
    let mediaStream = null;
    try {
      if (Platform.OS === 'web' && navigator?.mediaDevices?.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        localStreamRef.current = mediaStream;
        setHasMicPermission(true);
        setupVoiceActivityDetection(mediaStream);
      } else {
        // Fallback for mock/native without native webrtc bundle
        setHasMicPermission(true);
      }
    } catch (micErr) {
      console.error('[useVoiceChat] getUserMedia failed:', micErr);
      setHasMicPermission(false);
      setIsConnecting(false);
      setError(
        micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : 'Could not access microphone input device.'
      );
      return;
    }

    // 2. Open WebSocket signaling connection
    try {
      const wsUrl = getWebSocketUrl(effectiveRoomId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // Announce presence to room group
        ws.send(
          JSON.stringify({
            type: 'join_room',
            room_id: effectiveRoomId,
            user_id: myUserId,
            user_name: myUserName,
          })
        );

        // Initialize local user in participants list
        setParticipants([
          {
            userId: myUserId,
            userName: `${myUserName} (You)`,
            isSpeaking: false,
            isMuted: isMutedRef.current,
            isLocal: true,
          },
        ]);
      };

      ws.onmessage = async (event) => {
        let msg = null;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          return;
        }

        switch (msg.type) {
          // A new peer joined the room: existing peers initiate the offer
          case 'user_joined': {
            const peerId = msg.user_id;
            const peerName = msg.user_name || 'Journalist';
            if (peerId === myUserId) return;

            const pc = createPeerConnection(peerId, peerName);
            if (!pc) return;

            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal({
                type: 'offer',
                target_user_id: peerId,
                sdp: offer,
              });
            } catch (offerErr) {
              console.error('[useVoiceChat] Failed to create offer for peer:', peerId, offerErr);
            }
            break;
          }

          // Received SDP Offer from an existing peer: set remote description & reply with answer
          case 'offer': {
            const peerId = msg.sender_user_id;
            const peerName = msg.sender_user_name || 'Journalist';
            let pc = peersRef.current.get(peerId)?.pc;
            if (!pc) {
              pc = createPeerConnection(peerId, peerName);
            }
            if (!pc) return;

            try {
              await pc.setRemoteDescription(new window.RTCSessionDescription(msg.sdp));
              await flushQueuedCandidates(peerId, pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal({
                type: 'answer',
                target_user_id: peerId,
                sdp: answer,
              });
            } catch (ansErr) {
              console.error('[useVoiceChat] Error handling offer / creating answer:', ansErr);
            }
            break;
          }

          // Received SDP Answer from target peer
          case 'answer': {
            const peerId = msg.sender_user_id;
            const pc = peersRef.current.get(peerId)?.pc;
            if (pc) {
              try {
                await pc.setRemoteDescription(new window.RTCSessionDescription(msg.sdp));
                await flushQueuedCandidates(peerId, pc);
              } catch (setRemoteErr) {
                console.error('[useVoiceChat] Error setting remote description for answer:', setRemoteErr);
              }
            }
            break;
          }

          // Trickled ICE Candidate
          case 'ice_candidate': {
            const peerId = msg.sender_user_id;
            const pc = peersRef.current.get(peerId)?.pc;
            const candidate = msg.candidate;

            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
              } catch (iceErr) {
                console.warn('[useVoiceChat] Error adding ICE candidate:', iceErr);
              }
            } else {
              // Queue candidate until remote description is set
              const queue = candidateQueueRef.current.get(peerId) || [];
              queue.push(candidate);
              candidateQueueRef.current.set(peerId, queue);
            }
            break;
          }

          // Remote Peer Speaking / Mute State Changed
          case 'voice_audio': {
            const senderId = msg.sender_user_id || msg.user_id;
            if (senderId === myUserId) return;
            if (isDeafenedRef.current) return;

            // Trigger visual speaking state for the sender
            setParticipants((prev) =>
              prev.map((p) =>
                p.userId === senderId ? { ...p, isSpeaking: true } : p
              )
            );

            // Play incoming audio chunk via native expo-av sound
            mobileAudioEngine.queueIncomingAudio(
              msg.audio_data,
              msg.mime_type || 'audio/m4a',
              () => {
                setParticipants((prev) =>
                  prev.map((p) =>
                    p.userId === senderId ? { ...p, isSpeaking: true } : p
                  )
                );
              },
              () => {
                setParticipants((prev) =>
                  prev.map((p) =>
                    p.userId === senderId ? { ...p, isSpeaking: false } : p
                  )
                );
              }
            );
            break;
          }

          case 'speaking_state': {
            const peerId = msg.user_id;
            if (peerId === myUserId) return;

            setParticipants((prev) =>
              prev.map((p) =>
                p.userId === peerId
                  ? { ...p, isSpeaking: Boolean(msg.is_speaking), isMuted: Boolean(msg.is_muted) }
                  : p
              )
            );
            break;
          }

          // Peer left the room or disconnected
          case 'user_left': {
            removePeer(msg.user_id);
            break;
          }

          default:
            break;
        }
      };

      ws.onerror = (err) => {
        console.error('[useVoiceChat] WebSocket error:', err);
        setError('Voice connection error. Retrying or check server status.');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        if (event.code === 4401) {
          setError('Authentication required to join voice channel.');
        }
      };
    } catch (wsErr) {
      console.error('[useVoiceChat] Failed to establish voice connection:', wsErr);
      setIsConnecting(false);
      setError('Could not connect to voice signaling server.');
    }
  }, [
    isConnected,
    isConnecting,
    getWebSocketUrl,
    roomId,
    myUserId,
    myUserName,
    setupVoiceActivityDetection,
    createPeerConnection,
    sendSignal,
    flushQueuedCandidates,
    removePeer,
  ]);

  // ─── Disconnect & Complete Resource Cleanup ─────────────────────────────────
  const disconnect = useCallback(() => {
    // 1. Send leave notification via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      } catch (e) {}
      wsRef.current.close(1000);
      wsRef.current = null;
    }

    // 2. Stop all local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // 3. Clear VAD interval and close AudioContext
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // 4. Close all peer connections and remove audio tags
    peersRef.current.forEach((peer) => {
      peer.pc?.close();
      if (peer.audioElement && peer.audioElement.parentNode) {
        peer.audioElement.parentNode.removeChild(peer.audioElement);
      }
      if (peer.audioNode) {
        try { peer.audioNode.disconnect(); } catch (e) {}
      }
    });
    peersRef.current.clear();
    candidateQueueRef.current.clear();

    setIsConnected(false);
    setIsConnecting(false);
    setIsLocalSpeaking(false);
    setParticipants([]);
  }, []);

  // ─── Toggle Mute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      setIsLocalSpeaking(false);
    }

    sendSignal({
      type: 'speaking_state',
      is_speaking: false,
      is_muted: nextMuted,
    });

    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isMuted: nextMuted, isSpeaking: false } : p))
    );
  }, [isMuted, sendSignal]);

  // ─── Toggle Deafen ──────────────────────────────────────────────────────────
  const toggleDeafen = useCallback(() => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    // Mute/unmute all incoming audio elements and Web Audio gain nodes
    peersRef.current.forEach((peer) => {
      if (peer.audioElement) {
        peer.audioElement.muted = nextDeafened;
      }
      if (peer.audioNode) {
        peer.audioNode.gain.value = nextDeafened ? 0 : 1;
      }
    });

    // When deafened, also mute outgoing microphone
    if (nextDeafened && !isMuted) {
      toggleMute();
    }
  }, [isDeafened, isMuted, toggleMute]);

  // ─── Mobile Push-To-Talk Voice Transmission (Expo Go) ──────────────────────
  const startRecording = useCallback(async () => {
    if (isMutedRef.current) return;
    try {
      setIsRecording(true);
      setIsLocalSpeaking(true);
      sendSignal({ type: 'speaking_state', is_speaking: true, is_muted: false });

      await mobileAudioEngine.startRecording((meter) => {
        setAudioMeter(meter);
      });
    } catch (err) {
      console.warn('[useVoiceChat] Failed to start recording:', err);
      setIsRecording(false);
      setIsLocalSpeaking(false);
      sendSignal({ type: 'speaking_state', is_speaking: false, is_muted: isMutedRef.current });
    }
  }, [sendSignal]);

  const stopRecordingAndSend = useCallback(async () => {
    if (!isRecording) return;
    try {
      setIsRecording(false);
      setIsLocalSpeaking(false);
      sendSignal({ type: 'speaking_state', is_speaking: false, is_muted: isMutedRef.current });

      const audioResult = await mobileAudioEngine.stopRecording();
      if (audioResult?.base64) {
        // Send audio dispatch through voice signaling websocket
        sendSignal({
          type: 'ice_candidate', // relaid to peers
          audio_data: audioResult.base64,
          mime_type: audioResult.mimeType,
          is_voice_chunk: true,
          sender_user_id: myUserId,
          sender_user_name: myUserName,
        });
      }
    } catch (err) {
      console.warn('[useVoiceChat] Failed to stop/send recording:', err);
      setIsRecording(false);
      setIsLocalSpeaking(false);
    }
  }, [isRecording, sendSignal, myUserId, myUserName]);

  // Clean up native audio engine on disconnect
  const nativeDisconnect = useCallback(() => {
    mobileAudioEngine.cleanup();
    disconnect();
  }, [disconnect]);

  // Auto-join on mount if requested
  useEffect(() => {
    if (autoJoin && roomId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoJoin, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    isSpeaking: isLocalSpeaking,
    participants,
    error,
    hasMicPermission,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
    isRecording,
    audioMeter,
    startRecording,
    stopRecordingAndSend,
  };
}

export default useVoiceChat;

