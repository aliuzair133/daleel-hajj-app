import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function TopBar({ title, subtitle, showBack = false, action, transparent = false }) {
  const navigate = useNavigate();

  return (
    <header className={[
      'sticky top-0 z-30 flex items-center gap-3 px-4 py-3',
      transparent
        ? 'bg-transparent'
        : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800',
    ].join(' ')}>
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
