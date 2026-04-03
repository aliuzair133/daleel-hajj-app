const VARIANTS = {
  teal:      'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  gold:      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  sage:      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  red:       'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  gray:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  emergency: 'bg-red-600 text-white',
  success:   'bg-green-500 text-white',
};

export function Badge({ children, variant = 'teal', className = '' }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
      VARIANTS[variant] ?? VARIANTS.gray,
      className,
    ].join(' ')}>
      {children}
    </span>
  );
}
