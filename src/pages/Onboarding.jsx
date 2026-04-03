import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BN', name: 'Brunei' },
  { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'China' },
  { code: 'EG', name: 'Egypt' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LY', name: 'Libya' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NG', name: 'Nigeria' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PS', name: 'Palestine' }, { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
  { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' }, { code: 'SD', name: 'Sudan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'UG', name: 'Uganda' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'YE', name: 'Yemen' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'fr', label: 'French', native: 'Français' },
];

// ─── Screen 1: Welcome + Name ───────────────────────────────────────────────
function ScreenWelcome({ name, setName, onNext }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-8 pt-16 text-center">
      {/* Islamic geometric decoration */}
      <div className="w-24 h-24 rounded-3xl bg-[#0D7377] flex items-center justify-center mb-6 shadow-lg">
        <span className="text-5xl">🕋</span>
      </div>

      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
        Daleel
      </h1>
      <p className="text-lg font-arabic text-[#C9A84C] mb-2" dir="rtl">دليل</p>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
        Your trusted Hajj companion
      </p>

      {/* Bismillah */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl px-6 py-4 mb-8 w-full max-w-xs">
        <p className="text-xl font-arabic text-[#0D7377] leading-loose text-center" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
      </div>

      {/* Name input */}
      <div className="w-full max-w-xs mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
          What's your name?
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Ahmed, Fatima…"
          className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent transition-all"
          autoFocus
        />
      </div>

      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
      >
        Get Started <ChevronRight size={18} />
      </button>

      <p className="text-xs text-gray-400 mt-4 max-w-xs">
        Your data stays on your device. We never collect or share personal information.
      </p>
    </div>
  );
}

// ─── Screen 2: Country ────────────────────────────────────────────────────────
function ScreenCountry({ country, setCountry, onNext, onBack }) {
  const [search, setSearch] = useState('');
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 z-10 px-4 pt-12 pb-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#0D7377] text-sm font-semibold mb-3"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Your Country</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          We'll show your embassy contacts automatically
        </p>
        {/* Progress dots */}
        <div className="flex gap-2 mt-3">
          <div className="w-6 h-1.5 rounded-full bg-[#0D7377]/30" />
          <div className="w-6 h-1.5 rounded-full bg-[#0D7377]" />
          <div className="w-6 h-1.5 rounded-full bg-[#0D7377]/30" />
        </div>
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search country…"
          className="w-full mt-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
        />
      </div>

      {/* Country list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {filtered.map(c => (
          <button
            key={c.code}
            onClick={() => setCountry(c.code)}
            className={[
              'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]',
              country === c.code
                ? 'bg-[#0D7377] border-[#0D7377] text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:border-[#0D7377]/40',
            ].join(' ')}
          >
            <span className="font-medium text-sm">{c.name}</span>
            {country === c.code && <Check size={16} />}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onNext}
          disabled={!country}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Screen 3: Language + Mahram ─────────────────────────────────────────────
function ScreenPreferences({ language, setLanguage, isMahram, setIsMahram, onFinish, onBack, userName }) {
  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-6">
      {/* Back + progress */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#0D7377] text-sm font-semibold mb-3 self-start"
      >
        <ChevronLeft size={16} /> Back
      </button>
      <div className="flex gap-2 mb-6">
        <div className="w-6 h-1.5 rounded-full bg-[#0D7377]/30" />
        <div className="w-6 h-1.5 rounded-full bg-[#0D7377]/30" />
        <div className="w-6 h-1.5 rounded-full bg-[#0D7377]" />
      </div>

      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
        Almost there, {userName}!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        A few final preferences to personalise your experience.
      </p>

      {/* Language */}
      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Language</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={[
              'flex flex-col items-center py-4 rounded-2xl border transition-all active:scale-[0.98]',
              language === l.code
                ? 'bg-[#0D7377] border-[#0D7377] text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:border-[#0D7377]/40',
            ].join(' ')}
          >
            <span className={['font-bold text-base', l.code === 'ar' || l.code === 'ur' ? 'font-arabic' : ''].join(' ')}>
              {l.native}
            </span>
            <span className={['text-xs mt-0.5', language === l.code ? 'text-white/70' : 'text-gray-400'].join(' ')}>
              {l.label}
            </span>
          </button>
        ))}
      </div>

      {/* Mahram status */}
      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
        Are you performing Hajj with a mahram (guardian)?
      </p>
      <div className="flex gap-3 mb-8">
        {[{ val: true, label: 'Yes, with mahram' }, { val: false, label: 'No / N/A' }].map(opt => (
          <button
            key={String(opt.val)}
            onClick={() => setIsMahram(opt.val)}
            className={[
              'flex-1 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.98]',
              isMahram === opt.val
                ? 'bg-[#0D7377] border-[#0D7377] text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-8">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Disclaimer:</strong> This app is a guide only. Consult your Hajj group leader or a qualified scholar for binding rulings. May Allah accept your Hajj. 🤲
        </p>
      </div>

      <div className="flex-1" />

      <button
        onClick={onFinish}
        className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#b8943d] transition-all active:scale-[0.98] shadow-md"
      >
        <span>Begin My Journey</span>
        <span className="font-arabic text-lg">🕋</span>
      </button>
    </div>
  );
}

// ─── Main Onboarding component ────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const { updateSetting } = useSettings();
  const [screen, setScreen] = useState(0);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('en');
  const [isMahram, setIsMahram] = useState(null);

  async function handleFinish() {
    await Promise.all([
      updateSetting('userName', name.trim()),
      updateSetting('country', country),
      updateSetting('language', language),
      updateSetting('isMahram', isMahram ?? false),
      updateSetting('onboardingComplete', true),
    ]);
    onComplete?.();
  }

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen overflow-y-auto">
      {screen === 0 && (
        <ScreenWelcome
          name={name}
          setName={setName}
          onNext={() => setScreen(1)}
        />
      )}
      {screen === 1 && (
        <ScreenCountry
          country={country}
          setCountry={setCountry}
          onNext={() => setScreen(2)}
          onBack={() => setScreen(0)}
        />
      )}
      {screen === 2 && (
        <ScreenPreferences
          language={language}
          setLanguage={setLanguage}
          isMahram={isMahram}
          setIsMahram={setIsMahram}
          onFinish={handleFinish}
          onBack={() => setScreen(1)}
          userName={name.trim() || 'Pilgrim'}
        />
      )}
    </div>
  );
}
