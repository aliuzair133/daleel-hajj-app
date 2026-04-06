import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BookMarked, Phone, Grid3X3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function BottomNav() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/',         icon: Home,       label: t('nav.home')     },
    { to: '/rituals',  icon: BookOpen,   label: t('nav.rituals')  },
    { to: '/prayers',  icon: BookMarked, label: t('nav.prayers')  },
    { to: '/contacts', icon: Phone,      label: t('nav.contacts') },
    { to: '/more',     icon: Grid3X3,    label: t('nav.more')     },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => [
            'flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-2 min-h-[56px] transition-colors duration-150',
            'text-[10px] font-semibold uppercase tracking-wider no-underline',
            isActive ? 'text-[#0D7377]' : 'text-gray-400 dark:text-gray-500',
          ].join(' ')}
        >
          {({ isActive }) => (
            <>
              <div className={[
                'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-150',
                isActive ? 'bg-teal-100 dark:bg-teal-900/40' : '',
              ].join(' ')}>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
