import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '../hooks/useProgress';
import { RitualStep } from '../components/RitualStep';
import ritualsData from '../data/rituals.json';
import duasData from '../data/duas.json';

const duaMap = Object.fromEntries(duasData.duas.map(d => [d.id, d]));

export default function Rituals() {
  const { t } = useTranslation();
  const { completedIds, toggleStep, completedCount, totalSteps } = useProgress();
  const [expandedDay, setExpandedDay] = useState(-1);
  const progressPct = totalSteps ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="px-4 pt-4 pb-6 fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('rituals.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('rituals.subtitle')} · {totalSteps} {t('rituals.steps')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('rituals.overall_progress')}</span>
          <span className="text-sm text-[#0D7377] dark:text-teal-400 font-black tabular-nums">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-[#0D7377] h-3 rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {progressPct === 100
            ? t('rituals.all_complete')
            : `${progressPct}${t('rituals.pct_complete')}`}
        </p>
      </div>

      {/* Day cards */}
      {ritualsData.days.map((day, dayIndex) => {
        const isOpen = expandedDay === dayIndex;
        const dayCompleted = day.steps.filter(s => completedIds.has(s.id)).length;
        const allDone = dayCompleted === day.steps.length;

        return (
          <div key={day.id} className="mb-3">
            <button
              onClick={() => setExpandedDay(isOpen ? -1 : dayIndex)}
              className={[
                'w-full flex items-start gap-3 text-left p-4 rounded-2xl border transition-all active:scale-[0.98]',
                isOpen
                  ? 'bg-[#0D7377] border-[#0D7377] shadow-md'
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-[#0D7377]/30',
              ].join(' ')}
            >
              {/* Day number circle */}
              <div className={[
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm',
                isOpen   ? 'bg-white/20 text-white' :
                allDone  ? 'bg-[#2D6A4F]/15 text-[#2D6A4F]' :
                           'bg-[#0D7377]/10 text-[#0D7377]',
              ].join(' ')}>
                {allDone && !isOpen ? '✓' : dayIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={['text-xs font-bold uppercase tracking-widest', isOpen ? 'text-teal-200' : 'text-[#0D7377]'].join(' ')}>
                  {day.hijri_date}
                </p>
                <h3 className={['font-bold text-sm mt-0.5 leading-snug', isOpen ? 'text-white' : 'text-gray-800 dark:text-gray-100'].join(' ')}>
                  {day.title}
                </h3>
                <p className={['text-xs mt-1', isOpen ? 'text-teal-200' : 'text-gray-400'].join(' ')}>
                  📍 {day.location} · {dayCompleted}/{day.steps.length} {t('rituals.steps')}
                </p>
              </div>
              <div className={['flex-shrink-0', isOpen ? 'text-white' : 'text-gray-300'].join(' ')}>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isOpen && (
              <div className="mt-2 space-y-2 fade-in">
                {day.steps.map(step => (
                  <RitualStep
                    key={step.id}
                    step={step}
                    isCompleted={completedIds.has(step.id)}
                    onToggle={toggleStep}
                    duaMap={duaMap}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-center text-gray-400 pb-2 mt-4 px-4">
        {t('rituals.consult')}
      </p>
    </div>
  );
}
