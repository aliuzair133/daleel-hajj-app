import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAudio — dual-mode audio engine.
 *
 * 1. File-based: play(src, { arabic, lang })
 *    Tries to play the MP3 at `src`. If it fails (missing / placeholder),
 *    falls back automatically to Web Speech API.
 *
 * 2. Speech synthesis: speak({ text, lang })
 *    Directly synthesises text with the device's TTS engine.
 *    Works fully offline and supports Arabic (ar-SA), English, Urdu, etc.
 */
export function useAudio() {
  const audioRef   = useRef(null);
  const utterRef   = useRef(null);

  const [currentSrc, setCurrentSrc] = useState(null);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [mode,       setMode]       = useState('idle'); // 'audio' | 'speech' | 'idle'

  // ── helpers ──────────────────────────────────────────────────────────────

  function getAudio() {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener('ended',   () => { setIsPlaying(false); setMode('idle'); });
      a.addEventListener('pause',   () => { setIsPlaying(false); });
      a.addEventListener('playing', () => { setIsPlaying(true);  setMode('audio'); });
      a.addEventListener('error',   () => { setIsPlaying(false); });
      audioRef.current = a;
    }
    return audioRef.current;
  }

  function stopAll() {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (utterRef.current) utterRef.current = null;
    setIsPlaying(false);
    setMode('idle');
  }

  // ── speak (Web Speech API) ───────────────────────────────────────────────

  const speak = useCallback(({ text, lang = 'ar-SA', rate = 0.85, pitch = 1 }) => {
    if (!window.speechSynthesis) {
      console.warn('SpeechSynthesis not supported on this device');
      return;
    }

    // Toggle off if already speaking the same text
    if (isPlaying && mode === 'speech' && utterRef.current?.text === text) {
      stopAll();
      return;
    }

    stopAll();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = lang;
    utter.rate  = rate;
    utter.pitch = pitch;

    // Pick the best available voice for the language
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utter.voice = match;

    utter.onstart = () => { setIsPlaying(true); setMode('speech'); };
    utter.onend   = () => { setIsPlaying(false); setMode('idle'); utterRef.current = null; };
    utter.onerror = () => { setIsPlaying(false); setMode('idle'); utterRef.current = null; };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [isPlaying, mode]);

  // ── play (file-based with speech fallback) ───────────────────────────────

  const play = useCallback((src, { arabic = null, lang = 'ar-SA' } = {}) => {
    // Toggle off
    if (isPlaying && currentSrc === src) {
      stopAll();
      setCurrentSrc(null);
      return;
    }

    stopAll();
    setCurrentSrc(src);

    const audio = getAudio();
    audio.src   = src;

    const tryPlay = audio.play();
    if (tryPlay !== undefined) {
      tryPlay.catch(() => {
        // File missing / placeholder — fall back to speech synthesis
        if (arabic) {
          speak({ text: arabic, lang });
        } else {
          setIsPlaying(false);
          setCurrentSrc(null);
        }
      });
    }
  }, [isPlaying, currentSrc, speak]);

  // ── stop ─────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    stopAll();
    setCurrentSrc(null);
  }, []);

  // ── cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) audio.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Pre-load voices (some browsers need a nudge)
  useEffect(() => {
    if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
    }
  }, []);

  return { play, speak, stop, isPlaying, currentSrc, mode };
}
