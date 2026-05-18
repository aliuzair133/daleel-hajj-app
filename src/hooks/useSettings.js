import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/db';
import i18n from '../i18n/index';

const DEFAULTS = {
  userName: '',
  country: 'US',
  language: 'en',
  textSize: 'medium',
  darkMode: 'system',   // 'system' | 'light' | 'dark'
  isMahram: false,
  onboardingComplete: false,
  latitude: 21.3891,
  longitude: 39.8579,
  locationName: 'Makkah, Saudi Arabia',
};

const TEXT_SIZE_MAP = {
  small:  '14px',
  medium: '16px',
  large:  '18px',
  xlarge: '20px',
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const saved = {};
      for (const key of Object.keys(DEFAULTS)) {
        const val = await getSetting(key, DEFAULTS[key]);
        saved[key] = val;
      }
      setSettings(saved);
      setLoaded(true);
      applySettings(saved);
    }
    loadSettings();
  }, []);

  // Keep .dark class in sync when OS preference changes (system mode only)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only act if the user's chosen setting is 'system'
      setSetting('darkMode', undefined); // no-op; just read current setting
      const root = document.documentElement;
      if (!root.classList.contains('light')) {
        root.classList.toggle('dark', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function applySettings(s) {
    const root = document.documentElement;

    // ── Text size ─────────────────────────────────────────
    root.style.fontSize = TEXT_SIZE_MAP[s.textSize] ?? '16px';

    // ── Dark mode ─────────────────────────────────────────────────
    // Tailwind dark: variants only respond to the .dark CLASS (not the
    // CSS media query alone). So when mode=system we must sync the class
    // with the OS preference ourselves.
    if (s.darkMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (s.darkMode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // 'system' — mirror the OS preference into the .dark class
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.remove('light');
    }

    // ── Language / dir ────────────────────────────────────
    const RTL_LANGS = ['ar', 'ur'];
    const lang = s.language || 'en';
    const isRtl = RTL_LANGS.includes(lang);
    root.setAttribute('lang', lang);
    root.setAttribute('dir',  isRtl ? 'rtl' : 'ltr');
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }

  async function updateSetting(key, value) {
    await setSetting(key, value);
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      applySettings(next);
      return next;
    });
  }

  async function updateSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
      await setSetting(key, value);
    }
    setSettings(prev => {
      const next = { ...prev, ...updates };
      applySettings(next);
      return next;
    });
  }

  async function detectLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;
          // Try reverse-geocoding to get a human-readable city name
          let locationName = '';
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en', 'User-Agent': 'Daleel-Hajj-App/1.0' }, signal: AbortSignal.timeout(6000) }
            );
            const data = await res.json();
            locationName =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              data.display_name?.split(',')[0] ||
              '';
          } catch {
            // offline or API error — leave locationName empty, keep previous
          }
          const updates = locationName
            ? { latitude, longitude, locationName }
            : { latitude, longitude };
          await updateSettings(updates);
          resolve({ latitude, longitude, locationName });
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  }

  return { settings, loaded, updateSetting, updateSettings, detectLocation };
}
