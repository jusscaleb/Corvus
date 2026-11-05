import { Platform } from 'react-native';

let ExpoAudio = null;
let FileSystem = null;

// Dynamically and safely load expo-audio (Modern SDK 52/58 API)
try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  // Fallback to legacy expo-av if available
  try {
    ExpoAudio = require('expo-av');
  } catch (err) {}
}

// Safely load FileSystem
try {
  FileSystem = require('expo-file-system/legacy');
} catch (e) {
  try {
    FileSystem = require('expo-file-system');
  } catch (err) {}
}

class MobileAudioEngine {
  constructor() {
    this.recorder = null;
    this.player = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.audioQueue = [];
    this.isProcessingQueue = false;
  }

  isAvailable() {
    return Boolean(
      (ExpoAudio && (ExpoAudio.AudioRecorder || ExpoAudio.Audio)) ||
      (Platform.OS === 'web' && typeof window !== 'undefined')
    );
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'web') return true;
      if (ExpoAudio?.requestRecordingPermissionsAsync) {
        const { granted } = await ExpoAudio.requestRecordingPermissionsAsync();
        return granted;
      }
      if (ExpoAudio?.Audio?.requestPermissionsAsync) {
        const { granted } = await ExpoAudio.Audio.requestPermissionsAsync();
        return granted;
      }
      return true;
    } catch (e) {
      console.warn('[MobileAudioEngine] Permission check failed:', e);
      return false;
    }
  }

  async startRecording(onVolumeUpdate) {
    if (this.isRecording) return null;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        throw new Error('Microphone permission not granted.');
      }

      // 1. Try modern expo-audio AudioRecorder
      if (ExpoAudio?.AudioRecorder) {
        const recorder = new ExpoAudio.AudioRecorder({
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 64000,
          extension: '.m4a',
        });
        await recorder.prepare();
        recorder.record();
        this.recorder = recorder;
        this.isRecording = true;
        return recorder;
      }

      // 2. Fallback to legacy expo-av Audio.Recording
      if (ExpoAudio?.Audio?.Recording) {
        const recording = new ExpoAudio.Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: ExpoAudio.Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: ExpoAudio.Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          ios: {
            extension: '.m4a',
            audioQuality: ExpoAudio.Audio.IOSAudioQuality.MEDIUM,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 64000,
          },
        });
        await recording.startAsync();
        this.recorder = recording;
        this.isRecording = true;
        return recording;
      }
    } catch (err) {
      console.warn('[MobileAudioEngine] startRecording warning:', err);
      this.isRecording = false;
      this.recorder = null;
      throw err;
    }
    return null;
  }

  async stopRecording() {
    if (!this.recorder || !this.isRecording) return null;
    try {
      this.isRecording = false;
      let uri = null;

      if (this.recorder.stop) {
        await this.recorder.stop();
        uri = this.recorder.uri;
      } else if (this.recorder.stopAndUnloadAsync) {
        await this.recorder.stopAndUnloadAsync();
        uri = this.recorder.getURI();
      }

      this.recorder = null;
      if (!uri) return null;

      let base64Audio = null;

      // Web: fetch URI blob -> base64
      if (Platform.OS === 'web' && typeof fetch !== 'undefined') {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            const b64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : null;
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else if (FileSystem && FileSystem.readAsStringAsync) {
        base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });
      }

      return {
        uri,
        base64: base64Audio,
        mimeType: Platform.OS === 'ios' || Platform.OS === 'android' ? 'audio/m4a' : 'audio/webm',
      };
    } catch (err) {
      console.warn('[MobileAudioEngine] stopRecording error:', err);
      this.recorder = null;
      this.isRecording = false;
      return null;
    }
  }

  async playBase64Audio(base64Data, mimeType = 'audio/m4a') {
    try {
      // 1. Web HTML5 Audio
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const audio = new window.Audio(`data:${mimeType};base64,${base64Data}`);
        return new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(() => resolve());
        });
      }

      if (!FileSystem || !FileSystem.cacheDirectory) return;

      const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
      const fileUri = `${FileSystem.cacheDirectory}voice_incoming_${Date.now()}.${ext}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });

      // 2. Modern expo-audio AudioPlayer
      if (ExpoAudio?.createAudioPlayer) {
        const player = ExpoAudio.createAudioPlayer(fileUri);
        return new Promise((resolve) => {
          player.play();
          setTimeout(() => {
            try { player.remove(); } catch (e) {}
            FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
            resolve();
          }, 3000);
        });
      }

      // 3. Fallback to legacy expo-av Sound
      if (ExpoAudio?.Audio?.Sound) {
        const { sound } = await ExpoAudio.Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: true, volume: 1.0 }
        );
        return new Promise((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });
        });
      }
    } catch (err) {
      console.warn('[MobileAudioEngine] playBase64Audio error:', err);
    }
  }

  queueIncomingAudio(base64Data, mimeType, onStartPlay, onEndPlay) {
    this.audioQueue.push({ base64Data, mimeType, onStartPlay, onEndPlay });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessingQueue || this.audioQueue.length === 0) return;
    this.isProcessingQueue = true;

    while (this.audioQueue.length > 0) {
      const item = this.audioQueue.shift();
      if (item.onStartPlay) item.onStartPlay();
      try {
        await this.playBase64Audio(item.base64Data, item.mimeType);
      } catch (e) {
        console.warn('[MobileAudioEngine] playback queue error:', e);
      } finally {
        if (item.onEndPlay) item.onEndPlay();
      }
    }

    this.isProcessingQueue = false;
  }

  cleanup() {
    this.recorder = null;
    this.player = null;
    this.audioQueue = [];
    this.isRecording = false;
    this.isProcessingQueue = false;
  }
}

export const mobileAudioEngine = new MobileAudioEngine();
export default mobileAudioEngine;
