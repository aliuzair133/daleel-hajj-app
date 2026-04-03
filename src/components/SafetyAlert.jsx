import { AlertTriangle, Info, Lightbulb, Siren } from 'lucide-react';

const VARIANTS = {
  emergency: {
    wrap:  'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
    label: 'text-red-700 dark:text-red-300',
    icon:  <Siren size={14} className="text-red-600 dark:text-red-400" />,
    badge: 'bg-red-600 text-white',
    tag:   'EMERGENCY',
  },
  caution: {
    wrap:  'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
    label: 'text-amber-800 dark:text-amber-300',
    icon:  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />,
    badge: 'bg-amber-500 text-white',
    tag:   'CAUTION',
  },
  tip: {
    wrap:  'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700',
    label: 'text-teal-800 dark:text-teal-300',
    icon:  <Lightbulb size={14} className="text-[#0D7377]" />,
    badge: 'bg-[#0D7377] text-white',
    tag:   'TIP',
  },
  info: {
    wrap:  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    label: 'text-blue-800 dark:text-blue-300',
    icon:  <Info size={14} className="text-blue-600 dark:text-blue-400" />,
    badge: 'bg-blue-600 text-white',
    tag:   'INFO',
  },
};

export function SafetyAlert({ type = 'tip', title, children }) {
  const v = VARIANTS[type] ?? VARIANTS.tip;

  return (
    <div className={['rounded-2xl border p-4 mb-3', v.wrap].join(' ')}>
      <div className="flex items-center gap-2 mb-2">
        {v.icon}
        <span className={['text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', v.badge].join(' ')}>
          {v.tag}
        </span>
        {title && (
          <span className={['text-sm font-bold', v.label].join(' ')}>{title}</span>
        )}
      </div>
      <div className={['text-sm leading-relaxed', v.label].join(' ')}>
        {children}
      </div>
    </div>
  );
}
