import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

const PRIORITY_STYLES = {
  essential: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  recommended: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
  optional: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
};

const PRIORITY_BADGE = {
  essential:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  recommended: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  optional:    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

export function ChecklistItem({ item, isChecked, onToggle, onDelete, showPriority = false }) {
  const priority = item.priority ?? 'optional';
  const borderClass = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.optional;

  return (
    <div className={[
      'flex items-start gap-3 rounded-2xl border p-4 transition-opacity',
      borderClass,
      isChecked ? 'opacity-60' : 'opacity-100',
    ].join(' ')}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        aria-label={isChecked ? 'Mark unchecked' : 'Mark checked'}
        className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
      >
        {isChecked
          ? <CheckCircle2 size={24} className="text-[#2D6A4F]" fill="rgba(45,106,79,0.15)" />
          : <Circle size={24} className="text-gray-300 dark:text-gray-600" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {showPriority && (
              <span className={[
                'inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1',
                PRIORITY_BADGE[priority],
              ].join(' ')}>
                {priority}
              </span>
            )}
            <p className={[
              'text-sm font-semibold leading-snug',
              isChecked ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white',
            ].join(' ')}>
              {item.label}
            </p>
            {item.label_ar && (
              <p className="text-xs text-gray-400 font-arabic mt-0.5" dir="rtl">
                {item.label_ar}
              </p>
            )}
            {item.note && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {item.note}
              </p>
            )}
          </div>

          {/* Delete button (for user-added items) */}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              aria-label="Delete item"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
