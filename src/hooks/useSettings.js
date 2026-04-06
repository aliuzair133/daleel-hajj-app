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

  function applySettings(s) {
    const root = document.documentElement;

    // ── Text size ─────────────────────────────────────────
    root.style.fontSize = TEXT_SIZE_MAP[s.textSize] ?? '16px';

    // ── Dark mode (class-based; CSS handles `prefers-color-scheme`) ──
    if (s.darkMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (s.darkMode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light'); // suppresses OS dark mode in CSS
    } else {
      // 'system' — remove both overrides so OS preference takes effect
      root.classList.remove('dark', 'light');
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
        pos => {
          const { latitude, longitude } = pos.coords;
          updateSettings({ latitude, longitude });
          resolve({ latitude, longitude });
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  return { settings, loaded, updateSetting, updateSettings, detectLocation };
}
