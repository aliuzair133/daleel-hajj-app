import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Tour steps — each maps to a core app section
// NATIVE MIGRATION NOTE: Replace the backdrop + bottom sheet with
// react-native-walkthrough-tooltip or a custom Modal from react-native.
// The steps array and state logic are fully portable.
const TOUR_STEPS = [
  {
    id:   'home',
    icon: '🏠',
    title: "Your Hajj Dashboard",
    desc:  "See today's rituals, next prayer countdown, and quick links to everything you need — all at a glance.",
  },
  {
    id:   'rituals',
    icon: '📿',
    title: "Day-by-Day Rituals",
    desc:  "Follow each Hajj stage step by step across all 6 days. Mark steps as complete and track your overall progress.",
  },
  {
    id:   'prayers',
    icon: '🤲',
    title: "Du'as & Prayer Times",
    desc:  "20+ authentic Hajj duas with Arabic, transliteration & translation. Save your own personal duas with tags for loved ones.",
  },
  {
    id:   'map',
    icon: '🗺️',
    title: "Interactive Holy Sites Map",
    desc:  "Explore Makkah, Mina, Arafat & Muzdalifah. Enable Journey Mode during Hajj to see exactly where you are and where to go next.",
  },
  {
    id:   'more',
    icon: '🛡️',
    title: "Safety, Checklist & AI Guide",
    desc:  "Health & safety guidelines, pre-Hajj packing checklist, emergency contacts, and an AI-powered Hajj scholar — most features fully offline.",
  },
];

export default function FeatureTour({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center">
      {/* Bottom sheet */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">

        {/* Skip */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors py-1"
            aria-label={t('tour.skip')}
          >
            <X size={14} />
            <span>{t('tour.skip')}</span>
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {TOUR_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={[
                'rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 h-2 bg-[#0D7377]'
                  : i < step
                  ? 'w-2 h-2 bg-[#0D7377]/35'
                  : 'w-2 h-2 bg-gray-200 dark:bg-gray-700',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-7">
          <div className="text-5xl mb-4 leading-none">{current.icon}</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-snug">
            {t(`tour.step_${current.id}_title`, { defaultValue: current.title })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
            {t(`tour.step_${current.id}_desc`, { defaultValue: current.desc })}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {!isFirst && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm active:scale-[0.98] transition-all"
            >
              {t('common.back')}
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-sm shadow-md active:scale-[0.98] transition-all"
          >
            {isLast
              ? <>{t('tour.begin')} 🕋</>
              : <>{t('common.next')} <ChevronRight size={16} /></>
            }
          </button>
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-gray-400 mt-4">
          {step + 1} {t('tour.of')} {TOUR_STEPS.length}
        </p>
      </div>
    </div>
  );
}
