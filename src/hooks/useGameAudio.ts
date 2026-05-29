import { useCallback, useEffect, useRef } from "react";

export type GameSound = "move" | "wall" | "goal" | "trap" | "max_steps" | "start" | "reset" | "toggle";

type AudioContextConstructor = new () => AudioContext;

const MUSIC_VOLUME_MULTIPLIER = 6.4;
const SFX_VOLUME_MULTIPLIER = 9.25;

interface MusicNote {
  delay: number;
  duration: number;
  frequency: number;
  type: OscillatorType;
  volume: number;
}

interface WindowWithWebAudio extends Window {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
}

function getAudioContextCtor() {
  if (typeof window === "undefined") return undefined;
  const audioWindow = window as WindowWithWebAudio;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
}

function scheduleMusicNote(audioContext: AudioContext, destination: AudioNode, start: number, note: MusicNote) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const noteStart = start + note.delay;
  const noteEnd = noteStart + note.duration;

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.frequency, noteStart);
  gain.gain.setValueAtTime(0.0001, noteStart);
  gain.gain.exponentialRampToValueAtTime(note.volume * MUSIC_VOLUME_MULTIPLIER, noteStart + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(noteStart);
  oscillator.stop(noteEnd + 0.03);
}

export function useGameAudio(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | undefined>(undefined);
  const nextMusicLoopAtRef = useRef(0);

  const getContext = useCallback((allowWhenMuted = false) => {
    if (!enabled && !allowWhenMuted) return null;
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) return null;

    if (!contextRef.current) {
      contextRef.current = new AudioContextCtor();
    }

    const audioContext = contextRef.current;
    if (!audioContext) return null;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    return audioContext;
  }, [enabled]);

  const stopBackgroundMusic = useCallback(() => {
    if (musicTimerRef.current !== undefined) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = undefined;
    }

    const audioContext = contextRef.current;
    const musicGain = musicGainRef.current;
    if (!audioContext || !musicGain) return;

    const now = audioContext.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), now);
    musicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    window.setTimeout(() => {
      musicGain.disconnect();
      if (musicGainRef.current === musicGain) {
        musicGainRef.current = null;
      }
    }, 240);
  }, []);

  const scheduleBackgroundLoop = useCallback((audioContext: AudioContext) => {
    const musicGain = musicGainRef.current;
    if (!musicGain) return;

    const loopStart = Math.max(nextMusicLoopAtRef.current, audioContext.currentTime + 0.08);
    const melody: MusicNote[] = [
      { delay: 0, duration: 0.64, frequency: 261.63, type: "sine", volume: 0.009 },
      { delay: 0.6, duration: 0.72, frequency: 329.63, type: "triangle", volume: 0.0085 },
      { delay: 1.2, duration: 0.82, frequency: 392, type: "sine", volume: 0.009 },
      { delay: 1.92, duration: 0.9, frequency: 493.88, type: "triangle", volume: 0.008 },
      { delay: 2.76, duration: 0.82, frequency: 440, type: "sine", volume: 0.0085 },
      { delay: 3.42, duration: 0.7, frequency: 392, type: "triangle", volume: 0.008 },
      { delay: 4.02, duration: 0.78, frequency: 329.63, type: "sine", volume: 0.0085 },
    ];
    const bass: MusicNote[] = [
      { delay: 0, duration: 1.08, frequency: 65.41, type: "sine", volume: 0.014 },
      { delay: 1.2, duration: 1.06, frequency: 82.41, type: "sine", volume: 0.012 },
      { delay: 2.4, duration: 1.08, frequency: 73.42, type: "sine", volume: 0.0125 },
      { delay: 3.6, duration: 1.1, frequency: 98, type: "sine", volume: 0.012 },
    ];

    [...bass, ...melody].forEach((note) => scheduleMusicNote(audioContext, musicGain, loopStart, note));
    nextMusicLoopAtRef.current = loopStart + 4.8;
  }, []);

  const startBackgroundMusic = useCallback(() => {
    const audioContext = getContext();
    if (!audioContext || musicTimerRef.current !== undefined) return;

    if (!musicGainRef.current) {
      const musicGain = audioContext.createGain();
      musicGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      musicGain.gain.exponentialRampToValueAtTime(0.78, audioContext.currentTime + 0.35);
      musicGain.connect(audioContext.destination);
      musicGainRef.current = musicGain;
    }

    nextMusicLoopAtRef.current = 0;
    scheduleBackgroundLoop(audioContext);
    musicTimerRef.current = window.setInterval(() => {
      const currentContext = contextRef.current;
      if (!enabled || !currentContext || currentContext.state === "closed") return;
      if (nextMusicLoopAtRef.current - currentContext.currentTime < 1.2) {
        scheduleBackgroundLoop(currentContext);
      }
    }, 600);
  }, [enabled, getContext, scheduleBackgroundLoop]);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      options: {
        delay?: number;
        endFrequency?: number;
        type?: OscillatorType;
        volume?: number;
      } = {},
    ) => {
      const audioContext = getContext();
      if (!audioContext) return;

      const start = audioContext.currentTime + (options.delay ?? 0);
      const end = start + duration;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = options.type ?? "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
      }

      const targetVolume = (options.volume ?? 0.045) * SFX_VOLUME_MULTIPLIER;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(targetVolume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    },
    [getContext],
  );

  const playSound = useCallback(
    (sound: GameSound) => {
      if (!enabled) return;
      startBackgroundMusic();

      switch (sound) {
        case "move":
          playTone(240, 0.055, { endFrequency: 360, type: "triangle", volume: 0.028 });
          break;
        case "wall":
          playTone(135, 0.09, { endFrequency: 78, type: "sawtooth", volume: 0.04 });
          break;
        case "goal":
          playTone(523.25, 0.09, { type: "triangle", volume: 0.05 });
          playTone(659.25, 0.09, { delay: 0.08, type: "triangle", volume: 0.05 });
          playTone(783.99, 0.16, { delay: 0.16, type: "triangle", volume: 0.052 });
          break;
        case "trap":
          playTone(196, 0.12, { endFrequency: 92, type: "sawtooth", volume: 0.052 });
          playTone(88, 0.18, { delay: 0.08, type: "square", volume: 0.035 });
          break;
        case "max_steps":
          playTone(330, 0.08, { endFrequency: 220, type: "triangle", volume: 0.038 });
          playTone(220, 0.12, { delay: 0.09, endFrequency: 165, type: "triangle", volume: 0.034 });
          break;
        case "start":
          playTone(392, 0.08, { type: "triangle", volume: 0.035 });
          playTone(587.33, 0.1, { delay: 0.07, type: "triangle", volume: 0.04 });
          break;
        case "reset":
          playTone(440, 0.06, { endFrequency: 220, type: "triangle", volume: 0.035 });
          break;
        case "toggle":
          playTone(520, 0.045, { type: "sine", volume: 0.025 });
          break;
      }
    },
    [enabled, playTone, startBackgroundMusic],
  );

  const unlockAudio = useCallback(() => {
    const audioContext = getContext(true);
    if (enabled && audioContext) {
      startBackgroundMusic();
    }
  }, [enabled, getContext, startBackgroundMusic]);

  useEffect(() => {
    if (enabled) {
      if (contextRef.current) {
        startBackgroundMusic();
      }
      return undefined;
    }

    stopBackgroundMusic();
    contextRef.current?.suspend();
    return undefined;
  }, [enabled, startBackgroundMusic, stopBackgroundMusic]);

  useEffect(() => stopBackgroundMusic, [stopBackgroundMusic]);

  return { playSound, unlockAudio };
}
