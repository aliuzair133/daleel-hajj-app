import { forwardRef } from 'react';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary:   'bg-[#0D7377] text-white hover:bg-[#095C5F] active:bg-[#074042] shadow-sm',
  secondary: 'bg-white dark:bg-gray-800 text-[#0D7377] border border-[#0D7377] hover:bg-teal-50 dark:hover:bg-teal-900/20',
  ghost:     'bg-transparent text-[#0D7377] hover:bg-teal-50 dark:hover:bg-teal-900/20',
  gold:      'bg-[#C9A84C] text-white hover:bg-[#A8873A] active:bg-[#8B6E2F] shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  muted:     'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
};

const SIZES = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg gap-1',
  sm: 'text-sm px-3 py-2 rounded-xl gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-5 py-3 rounded-2xl gap-2',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon: Icon,
    iconRight,
    className = '',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#0D7377]/40 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
        'min-h-[48px]',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'xs' || size === 'sm' ? 14 : 16} className="text-current" />
      ) : Icon ? (
        <Icon size={size === 'xs' || size === 'sm' ? 14 : 18} />
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <iconRight.type {...iconRight.props} size={size === 'xs' || size === 'sm' ? 14 : 18} />}
    </button>
  );
});
