import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Volume2, VolumeX, Phone, BookOpen, Shield, MapPin, CheckSquare, Scroll, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useProgress } from '../hooks/useProgress';
import { useSettings } from '../hooks/useSettings';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { getHijriDate } from '../utils/formatters';
import ritualsData from '../data/rituals.json';
import duasData from '../data/duas.json';

// Hajj 2026: 8 Dhul Hijjah 1447 ≈ May 25 2026 (subject to moon sighting)
const HAJJ_START = new Date('2026-05-25T00:00:00');
const HAJJ_END   = new Date('2026-05-30T23:59:59');
const HAJJ_DAYS  = ritualsData.days;

function getDaysUntilHajj() {
  const diff = HAJJ_START - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getCurrentHajjDay() {
  const now = new Date();
  if (now < HAJJ_START || now > HAJJ_END) return null;
  return HAJJ_DAYS[Math.floor((now - HAJJ_START) / 86400000)] ?? null;
}

function getGreeting(name, t) {
  const h = new Date().getHours();
  const base =
    h < 5  ? `${t('home.greeting_morning')} 🌙` :
    h < 12 ? `${t('home.greeting_morning')} ☀️` :
    h < 17 ? `${t('home.greeting_afternoon')} 🌤` :
    h < 20 ? `${t('home.greeting_afternoon')} 🌅` :
             `${t('home.greeting_morning')} 🌃`;
  return name ? `${base}, ${name}` : base;
}

const talbiyahDua = duasData.duas.find(d => d.id === 'talbiyah');
const arafatDua   = duasData.duas.find(d => d.id === 'dua_arafat') ??
                    duasData.duas.find(d => d.category === 'arafat');

export default function Home() {
  const { t } = useTranslation();
  const { settings, detectLocation } = useSettings();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const { prayerTimes, currentNext, countdown } = usePrayerTimes(
    settings.latitude, settings.longitude
  );

  async function handleDetectLocation() {
    setLocating(true);
    setLocError(null);
    try {
      await detectLocation();
    } catch {
      setLocError(t('home.location_error'));
    } finally {
      setLocating(false);
    }
  }
  const { completedCount, totalSteps } = useProgress();
  const hajjDay   = getCurrentHajjDay();
  const daysUntil = getDaysUntilHajj();
  const hijriDate = getHijriDate();
  const progressPct = totalSteps ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Audio player for Talbiyah
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function toggleTalbiyah() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlaying(false);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 fade-in max-w-lg mx-auto">
      {/* Hidden audio */}
      <audio ref={audioRef} src="/audio/talbiyah.mp3" preload="none" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between pt-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{hijriDate}</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 leading-snug">
            {getGreeting(settings.userName, t)}
          </h1>
        </div>
        <div className="flex flex-col items-end ml-3 flex-shrink-0">
          <span className="text-2xl font-arabic text-[#0D7377] leading-none">دليل</span>
          <span className="text-[10px] text-gray-400 mt-0.5">{t('app.tagline')}</span>
        </div>
      </div>

      {/* ── Today in Hajj / Countdown ── */}
      {hajjDay ? (
        <div className="rounded-2xl bg-gradient-to-br from-[#0D7377] to-[#095C5F] text-white p-5 shadow-md">
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">{t('home.today_in_hajj')}</p>
          <h2 className="text-lg font-black leading-tight mb-0.5">{hajjDay.title}</h2>
          <p className="text-teal-200 text-sm">{hajjDay.hijri_date} · 📍 {hajjDay.location}</p>
          <Link
            to="/rituals"
            className="mt-3 inline-flex items-center text-sm text-teal-100 hover:text-white transition-colors font-medium"
          >
            {t('home.view_today_rituals')} <ChevronRight size={16} className="ml-0.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-[#0D7377] to-[#095C5F] text-white p-5 shadow-md">
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-2">{t('home.hajj_year')}</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl">🕋</span>
            <div>
              <p className="text-4xl font-black tabular-nums leading-none">{daysUntil}</p>
              <p className="text-teal-200 text-sm mt-1">{t('home.days_until_text')}</p>
              <p className="text-teal-300 text-xs mt-0.5">{t('home.hajj_start_date')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress (only during Hajj) ── */}
      {hajjDay && totalSteps > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('home.progress_title')}</span>
            <span className="text-sm text-[#0D7377] dark:text-teal-400 font-bold tabular-nums">
              {completedCount}/{totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-[#0D7377] h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{progressPct}{t('home.pct_steps_completed')}</p>
        </div>
      )}

      {/* ── Next Prayer ── */}
      {prayerTimes && currentNext?.next && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('home.prayer_times')}</h3>
            <button
              onClick={handleDetectLocation}
              disabled={locating}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#0D7377] disabled:opacity-50 active:scale-95 transition-all"
            >
              <Navigation size={11} className={locating ? 'animate-pulse' : ''} />
              {locating ? t('home.detecting') : t('home.use_my_location')}
            </button>
          </div>
          {locError && <p className="text-xs text-amber-600 mb-2 px-1">{locError}</p>}
          <div className="space-y-2">
            {prayers.map(name => (
              <PrayerTimeCard
                key={name}
                name={name}
                time={prayerTimes[name]}
                isNext={currentNext?.next?.name === name}
                msUntil={currentNext?.next?.name === name ? countdown : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{t('home.quick_actions')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Talbiyah audio */}
          <button
            onClick={toggleTalbiyah}
            className={[
              'card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all',
              playing ? 'bg-[#0D7377] border-[#0D7377]' : '',
            ].join(' ')}
          >
            {playing
              ? <VolumeX size={22} className="text-white" />
              : <Volume2 size={22} className="text-[#0D7377]" />}
            <span className={['text-xs font-semibold text-center', playing ? 'text-white' : 'text-gray-700 dark:text-gray-300'].join(' ')}>
              {playing ? t('home.stop') : t('home.talbiyah')}
            </span>
          </button>

          {/* Emergency */}
          <Link
            to="/contacts"
            className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all no-underline"
          >
            <Phone size={22} className="text-red-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{t('home.emergency')}</span>
          </Link>

          {/* Duas */}
          <Link
            to="/prayers"
            className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all no-underline"
          >
            <BookOpen size={22} className="text-[#C9A84C]" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{t('home.duas')}</span>
          </Link>
        </div>
      </div>

      {/* ── Essential Resources ── */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{t('home.essential_resources')}</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/ihram-rules"
            className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all no-underline"
          >
            <Scroll size={22} className="text-[#0D7377]" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{t('home.ihram_rules')}</span>
          </Link>
          <Link
            to="/map"
            className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all no-underline"
          >
            <MapPin size={22} className="text-[#C9A84C]" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{t('home.holy_sites')}</span>
          </Link>
          <Link
            to="/checklist"
            className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all no-underline"
          >
            <CheckSquare size={22} className="text-[#2D6A4F]" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{t('home.checklist')}</span>
          </Link>
        </div>
      </div>

      {/* ── Talbiyah Card ── */}
      {talbiyahDua && (
        <div className="rounded-2xl border border-[#C9A84C]/30 bg-amber-50/60 dark:bg-amber-900/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">
              {t('home.talbiyah_label')}
            </span>
            <span className="text-xs text-gray-400">{talbiyahDua.source}</span>
          </div>
          <p className="font-arabic text-gray-900 dark:text-gray-100 text-xl leading-loose mb-2 text-right" dir="rtl">
            {talbiyahDua.arabic}
          </p>
          <p className="text-xs text-gray-500 italic mb-1 leading-relaxed">{talbiyahDua.transliteration}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{talbiyahDua.translation}</p>
        </div>
      )}

      {/* ── Featured Du'a ── */}
      {arafatDua && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#0D7377] uppercase tracking-widest">{t('home.todays_dua')}</span>
            <span className="text-xs text-gray-400">{arafatDua.source}</span>
          </div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">{arafatDua.title}</h4>
          <p className="font-arabic text-gray-900 dark:text-gray-100 text-lg leading-loose mb-2 text-right" dir="rtl">
            {arafatDua.arabic}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{arafatDua.translation}</p>
          <Link to="/prayers" className="mt-3 text-xs text-[#0D7377] font-semibold flex justify-end">
            {t('common.view_all_duas')}
          </Link>
        </div>
      )}

      {/* ── Safety reminder ── */}
      <Link to="/safety" className="no-underline">
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3 active:scale-[0.98] transition-all">
          <Shield size={20} className="text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">{t('home.safety_reminder_title')}</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
              {t('home.safety_reminder_body')}
            </p>
          </div>
          <ChevronRight size={16} className="text-red-400 flex-shrink-0" />
        </div>
      </Link>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-center text-gray-400 px-4 pb-2">
        🕌 {t('app.disclaimer')}
      </p>
    </div>
  );
}
