export function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className={['flex items-center justify-between gap-4 cursor-pointer', disabled ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
      <div className="flex-1">
        {label && <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>}
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <div className={[
          'w-12 h-7 rounded-full transition-colors duration-200',
          checked ? 'bg-[#0D7377]' : 'bg-gray-200 dark:bg-gray-700',
        ].join(' ')} />
        <div className={[
          'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')} />
      </div>
    </label>
  );
}
