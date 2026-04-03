import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, BookOpen } from 'lucide-react';

export function RitualStep({ step, isCompleted, onToggle, duaMap = {} }) {
  const [expanded, setExpanded] = useState(false);
  const relatedDua = step.dua_id ? duaMap[step.dua_id] : null;

  return (
    <article className={[
      'bg-white dark:bg-gray-900 rounded-2xl shadow-card border transition-all duration-200',
      isCompleted
        ? 'border-[#2D6A4F]/30 dark:border-[#2D6A4F]/40'
        : 'border-gray-100 dark:border-gray-800',
    ].join(' ')}>
      <div className="flex items-start gap-3 p-4">
        {/* Completion toggle */}
        <button
          onClick={() => onToggle(step.id)}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
        >
          {isCompleted
            ? <CheckCircle2 size={24} className="text-[#2D6A4F]" fill="rgba(45,106,79,0.15)" />
            : <Circle size={24} className="text-gray-300 dark:text-gray-600" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Step label */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D7377]">
                Step {step.order}
              </span>
              <h3 className={[
                'font-bold text-sm mt-0.5 leading-snug',
                isCompleted ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white',
              ].join(' ')}>
                {step.title}
              </h3>
              {step.title_ar && (
                <p className="text-xs text-gray-400 font-arabic mt-0.5" dir="rtl">{step.title_ar}</p>
              )}
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
            {step.description}
          </p>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Related Du'a */}
              {relatedDua && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen size={12} className="text-amber-700 dark:text-amber-400" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Du'a: {relatedDua.title}
                    </p>
                  </div>
                  <p className="text-base font-arabic text-gray-800 dark:text-gray-200 leading-loose" dir="rtl">
                    {relatedDua.arabic}
                  </p>
                  <p className="text-xs text-gray-500 italic mt-1">{relatedDua.transliteration}</p>
                </div>
              )}

              {/* Common mistakes */}
              {step.common_mistakes?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} className="text-red-600 dark:text-red-400" />
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">Common Mistakes</p>
                  </div>
                  <ul className="space-y-1.5">
                    {step.common_mistakes.map((m, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300 flex gap-1.5">
                        <span className="flex-shrink-0">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tip */}
              {step.tip && (
                <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb size={12} className="text-[#0D7377]" />
                    <p className="text-xs font-bold text-[#0D7377]">Tip</p>
                  </div>
                  <p className="text-xs text-teal-700 dark:text-teal-300 leading-relaxed">{step.tip}</p>
                </div>
              )}

              {/* Source */}
              {step.source && (
                <p className="text-xs text-gray-400 text-right">📚 {step.source}</p>
              )}
            </div>
          )}

          {/* Mark complete button */}
          <button
            onClick={() => onToggle(step.id)}
            className={[
              'mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98]',
              isCompleted
                ? 'bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 text-[#2D6A4F] border border-[#2D6A4F]/30'
                : 'bg-[#0D7377] text-white hover:bg-[#095C5F]',
            ].join(' ')}
          >
            {isCompleted ? '✓ Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </article>
  );
}
