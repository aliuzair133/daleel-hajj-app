export function Card({ children, className = '', onClick, padding = 'md', ...props }) {
  const pads = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' };
  const base = [
    'bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800',
    pads[padding] ?? pads.md,
    onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.99] transition-all duration-150' : '',
    className,
  ].join(' ');

  return onClick ? (
    <button className={base} onClick={onClick} {...props}>{children}</button>
  ) : (
    <div className={base} {...props}>{children}</div>
  );
}
