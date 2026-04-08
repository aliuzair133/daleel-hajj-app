import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAudio — dual-mode audio engine.
 *
 * Priority 1 — File-based: play(src, { arabic, lang })
 *   Tries to load the MP3 at `src`. On ANY error (404, empty file, decode
 *   failure) it immediately falls back to the Web Speech API so the user
 *   always hears *something*.
 *
 * Priority 2 — Speech synthesis: speak({ text, lang })
 *   Uses the device's built-in TTS. Works fully offline. Supports Arabic
 *   (ar-SA), English, Urdu, French, etc.
 */
export function useAudio() {
  const audioRef = useRef(null);
  const utterRef = useRef(null);
  // Store fallback context so the audio-error event can trigger speech
  const fallbackRef = useRef(null);

  const [currentSrc, setCurrentSrc] = useState(null);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [mode,       setMode]       = useState('idle'); // 'audio' | 'speech' | 'idle'

  // ── helpers ─────────────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    utterRef.current   = null;
    fallbackRef.current = null;
    setIsPlaying(false);
    setMode('idle');
  }, []);

  // speak is defined first so getAudio's error handler can reference it
  const speakFn = useRef(null);

  function getAudio() {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener('ended',   () => { setIsPlaying(false); setMode('idle'); });
      a.addEventListener('pause',   () => { setIsPlaying(false); });
      a.addEventListener('playing', () => { setIsPlaying(true);  setMode('audio'); });
      // On ANY media error — immediately try speech synthesis fallback
      a.addEventListener('error', () => {
        setIsPlaying(false);
        const fb = fallbackRef.current;
        fallbackRef.current = null;
        if (fb && speakFn.current) {
          speakFn.current({ text: fb.arabic, lang: fb.lang });
        } else {
          setMode('idle');
        }
      });
      audioRef.current = a;
    }
    return audioRef.current;
  }

  // ── speak (Web Speech API) ──────────────────────────────────────────────

  const speak = useCallback(({ text, lang = 'ar-SA', rate = 0.9, pitch = 1 }) => {
    if (!window.speechSynthesis) {
      console.warn('[useAudio] SpeechSynthesis not supported on this device');
      return;
    }

    // Toggle off if already speaking the same text
    if (isPlaying && mode === 'speech' && utterRef.current?.text === text) {
      stopAll();
      return;
    }

    stopAll();

    const utter   = new SpeechSynthesisUtterance(text);
    utter.lang    = lang;
    utter.rate    = rate;
    utter.pitch   = pitch;

    // Pick the best available voice for the language
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utter.voice = match;

    utter.onstart = () => { setIsPlaying(true);  setMode('speech'); };
    utter.onend   = () => { setIsPlaying(false); setMode('idle');   utterRef.current = null; };
    utter.onerror = () => { setIsPlaying(false); setMode('idle');   utterRef.current = null; };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [isPlaying, mode, stopAll]);

  // Keep speakFn ref in sync so the audio error handler can use it
  useEffect(() => { speakFn.current = speak; }, [speak]);

  // ── play (file-based → speech fallback) ────────────────────────────────

  const play = useCallback((src, { arabic = null, lang = 'ar-SA' } = {}) => {
    // Toggle off
    if (isPlaying && currentSrc === src) {
      stopAll();
      setCurrentSrc(null);
      return;
    }

    stopAll();
    setCurrentSrc(src);

    // Store fallback context for the error handler
    if (arabic) fallbackRef.current = { arabic, lang };

    const audio = getAudio();
    audio.src   = src;

    const tryPlay = audio.play();
    if (tryPlay !== undefined) {
      tryPlay.catch(() => {
        // Promise-level rejection (e.g. NotAllowedError, or file missing)
        // The 'error' event handles decode / network errors separately
        const fb = fallbackRef.current;
        fallbackRef.current = null;
        if (fb) {
          speak({ text: fb.arabic, lang: fb.lang });
        } else {
          setIsPlaying(false);
          setCurrentSrc(null);
        }
      });
    }
  }, [isPlaying, currentSrc, speak, stopAll]);

  // ── stop ────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    stopAll();
    setCurrentSrc(null);
  }, [stopAll]);

  // ── cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) audio.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Pre-warm the voices list (some browsers lazy-load it)
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load, { once: true });
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return { play, speak, stop, isPlaying, currentSrc, mode };
}
