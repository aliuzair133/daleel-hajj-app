import { Clock } from 'lucide-react';

const PRAYER_META = {
  fajr:    { label: 'Fajr',    label_ar: 'الفجر',   rakaat: '2 Fard',  icon: '🌙' },
  sunrise: { label: 'Sunrise', label_ar: 'الشروق',  rakaat: null,      icon: '🌅' },
  dhuhr:   { label: 'Dhuhr',   label_ar: 'الظهر',   rakaat: '4 Fard',  icon: '☀️' },
  asr:     { label: 'Asr',     label_ar: 'العصر',   rakaat: '4 Fard',  icon: '🌤' },
  maghrib: { label: 'Maghrib', label_ar: 'المغرب',  rakaat: '3 Fard',  icon: '🌇' },
  isha:    { label: 'Isha',    label_ar: 'العشاء',  rakaat: '4 Fard',  icon: '🌃' },
};

function formatTime(date) {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatCountdown(ms) {
  if (ms == null || ms < 0) return null;
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Single prayer row card — pass name, time (Date), isNext, isCurrent, msUntil */
export function PrayerTimeCard({ name, time, isNext = false, isCurrent = false, msUntil = null }) {
  const meta = PRAYER_META[name] ?? { label: name, label_ar: '', rakaat: null, icon: '🕌' };
  const countdown = formatCountdown(msUntil);

  return (
    <div className={[
      'flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all',
      isNext
        ? 'bg-[#0D7377] border-[#0D7377] text-white shadow-md'
        : isCurrent
          ? 'bg-[#0D7377]/10 dark:bg-[#0D7377]/20 border-[#0D7377]/30 dark:border-[#0D7377]/40'
          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800',
    ].join(' ')}>
      {/* Icon */}
      <span className="text-2xl flex-shrink-0 w-10 text-center">{meta.icon}</span>

      {/* Names */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={['font-bold text-sm', isNext ? 'text-white' : 'text-gray-900 dark:text-white'].join(' ')}>
            {meta.label}
          </p>
          {meta.label_ar && (
            <p className={['text-xs font-arabic', isNext ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'].join(' ')} dir="rtl">
              {meta.label_ar}
            </p>
          )}
        </div>
        {meta.rakaat && (
          <p className={['text-xs mt-0.5', isNext ? 'text-white/75' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
            {meta.rakaat}
          </p>
        )}
      </div>

      {/* Time + countdown */}
      <div className="text-right flex-shrink-0">
        <p className={['font-bold text-base tabular-nums', isNext ? 'text-white' : 'text-[#0D7377] dark:text-teal-400'].join(' ')}>
          {formatTime(time)}
        </p>
        {isNext && countdown && (
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <Clock size={10} className="text-white/70" />
            <p className="text-xs text-white/80">in {countdown}</p>
          </div>
        )}
        {isNext && (
          <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-full">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
