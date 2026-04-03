import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAudio — manages a single shared audio element across the app.
 * Call play(src) to play a file; playing the same src again pauses it.
 */
export function useAudio() {
  const audioRef = useRef(null);
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);

  // Lazily create audio element once
  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended',  () => setIsPlaying(false));
      audioRef.current.addEventListener('pause',  () => setIsPlaying(false));
      audioRef.current.addEventListener('playing',() => setIsPlaying(true));
      audioRef.current.addEventListener('error',  () => setIsPlaying(false));
    }
    return audioRef.current;
  }

  const play = useCallback((src) => {
    const audio = getAudio();
    if (currentSrc === src && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    if (currentSrc !== src) {
      audio.src = src;
      setCurrentSrc(src);
    }
    audio.currentTime = 0;
    audio.play().catch(() => setIsPlaying(false));
  }, [currentSrc]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) { audio.pause(); }
    };
  }, []);

  return { play, stop, isPlaying, currentSrc };
}
