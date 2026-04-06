import { useState } from 'react';
import { User, Globe, Type, Moon, RotateCcw, ChevronRight, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { db } from '../utils/db';
import contactsData from '../data/contacts.json';

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ar', label: 'Arabic',   native: 'العربية'  },
  { code: 'ur', label: 'Urdu',     native: 'اردو'     },
  { code: 'fr', label: 'French',   native: 'Français' },
];

const TEXT_SIZES = [
  { id: 'small',  desc: 'Small'   },
  { id: 'medium', desc: 'Medium'  },
  { id: 'large',  desc: 'Large'   },
  { id: 'xlarge', desc: 'XL'      },
];

const DARK_MODES = [
  { id: 'system', label: '⚙️ System' },
  { id: 'light',  label: '☀️ Light'  },
  { id: 'dark',   label: '🌙 Dark'   },
];

const countries = Object.entries(contactsData.by_country).sort((a, b) =>
  a[1].name.localeCompare(b[1].name)
);

function SettingSection({ icon: Icon, title, children }) {
  return (
    <div className="card mb-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#0D7377]/10 dark:bg-[#0D7377]/20 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-[#0D7377]" />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleNameBlur(e) {
    await updateSetting('userName', e.target.value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    await db.settings.clear();
    await db.progress.clear();
    await db.bookmarks.clear();
    window.location.reload();
  }

  return (
    <div className="px-4 pt-4 pb-8 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{t('settings.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('settings.personalise')}</p>

      {/* ── Name ── */}
      <SettingSection icon={User} title={t('settings.your_name')}>
        <div className="relative">
          <input
            type="text"
            defaultValue={settings.userName}
            onBlur={handleNameBlur}
            placeholder={t('settings.name_placeholder')}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
          />
          {saved && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#2D6A4F] font-semibold">
              {t('settings.saved')}
            </span>
          )}
        </div>
      </SettingSection>

      {/* ── Country ── */}
      <SettingSection icon={Globe} title={t('settings.your_country')}>
        <select
          value={settings.country}
          onChange={e => updateSetting('country', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
        >
          {countries.map(([code, { name }]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-2">{t('settings.country_desc')}</p>
      </SettingSection>

      {/* ── Language ── */}
      <SettingSection icon={Globe} title={t('settings.language')}>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => updateSetting('language', lang.code)}
              className={[
                'py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]',
                settings.language === lang.code
                  ? 'bg-[#0D7377] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
              ].join(' ')}
            >
              <span className={lang.code === 'ar' || lang.code === 'ur' ? 'font-arabic' : ''}>
                {lang.native}
              </span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* ── Text Size ── */}
      <SettingSection icon={Type} title={t('settings.text_size')}>
        <div className="flex gap-2">
          {TEXT_SIZES.map((size, idx) => (
            <button
              key={size.id}
              onClick={() => updateSetting('textSize', size.id)}
              className={[
                'flex-1 py-3 rounded-xl font-bold transition-all active:scale-[0.97] flex flex-col items-center gap-0.5',
                settings.textSize === size.id
                  ? 'bg-[#0D7377] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
              ].join(' ')}
              style={{ fontSize: `${11 + idx * 2}px` }}
            >
              <span>A</span>
              <span className="text-[9px] opacity-70">{size.desc}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* ── Dark Mode ── */}
      <SettingSection icon={Moon} title={t('settings.appearance')}>
        <div className="flex gap-2">
          {DARK_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => updateSetting('darkMode', mode.id)}
              className={[
                'flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97]',
                settings.darkMode === mode.id
                  ? 'bg-[#0D7377] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
              ].join(' ')}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </SettingSection>

      {/* ── Mahram Status ── */}
      <div className="card mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('settings.mahram')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('settings.mahram_desc')}</p>
          </div>
          <button
            onClick={() => updateSetting('isMahram', !settings.isMahram)}
            className={[
              'w-12 h-6 rounded-full transition-colors relative flex-shrink-0',
              settings.isMahram ? 'bg-[#0D7377]' : 'bg-gray-200 dark:bg-gray-700',
            ].join(' ')}
            aria-label={t('settings.mahram')}
          >
            <span
              className={[
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                settings.isMahram ? 'left-6' : 'left-0.5',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* ── About ── */}
      <div className="card mb-3 text-center py-6 bg-gradient-to-br from-teal-50 to-amber-50/50 dark:from-teal-900/20 dark:to-amber-900/10">
        <p className="text-3xl mb-2">🕋</p>
        <p className="font-black text-[#0D7377] text-xl">Daleel · دليل</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('app.tagline')}</p>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          {t('settings.version')}<br />
          {t('settings.content_verified')}
        </p>
      </div>

      {/* ── Disclaimer ── */}
      <div className="card mb-3 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            {t('app.disclaimer')} 🤲
          </p>
        </div>
      </div>

      {/* ── Reset ── */}
      <button
        onClick={handleReset}
        className={[
          'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-[0.98]',
          resetConfirm
            ? 'bg-red-600 border-red-600 text-white'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-red-500',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <RotateCcw size={16} />
          {resetConfirm ? t('settings.reset_confirm') : t('settings.reset')}
        </div>
        <ChevronRight size={16} className={resetConfirm ? 'text-white' : 'text-gray-300'} />
      </button>
    </div>
  );
}
