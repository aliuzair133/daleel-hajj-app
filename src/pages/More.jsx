import { Link } from 'react-router-dom';
import { ShieldAlert, CheckSquare, Map, Settings, MessageCircle, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function More() {
  const { t } = useTranslation();

  const MORE_ITEMS = [
    { to: '/safety',     icon: ShieldAlert,   labelKey: 'more.health_safety',  descKey: 'more.health_safety_desc',  color: 'text-red-600',       bg: 'bg-red-50 dark:bg-red-900/20' },
    { to: '/checklist',  icon: CheckSquare,   labelKey: 'more.checklist',       descKey: 'more.checklist_desc',      color: 'text-teal-primary',  bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { to: '/map',        icon: Map,           labelKey: 'more.holy_sites',      descKey: 'more.holy_sites_desc',     color: 'text-sage-primary',  bg: 'bg-green-50 dark:bg-green-900/20' },
    { to: '/ai-guide',   icon: MessageCircle, labelKey: 'more.ai_guide',        descKey: 'more.ai_guide_desc',       color: 'text-purple-600',    bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { to: '/ihram-rules',icon: BookOpen,      labelKey: 'more.ihram_rules',     descKey: 'more.ihram_rules_desc',    color: 'text-gold-dark',     bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { to: '/settings',   icon: Settings,      labelKey: 'more.settings',        descKey: 'more.settings_desc',       color: 'text-gray-600',      bg: 'bg-gray-50 dark:bg-gray-800' },
  ];

  return (
    <div className="px-4 pt-4 pb-6 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('more.title')}</h1>

      <div className="space-y-3">
        {MORE_ITEMS.map(({ to, icon: Icon, labelKey, descKey, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow no-underline"
          >
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t(labelKey)}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t(descKey)}</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-center">
        <p className="text-2xl mb-1">🕋</p>
        <p className="font-semibold text-teal-primary text-sm">{t('app.name')} — دليل</p>
        <p className="text-xs text-gray-500 mt-1">{t('app.tagline')}</p>
        <p className="text-xs text-gray-400 mt-2">{t('app.disclaimer')}</p>
      </div>
    </div>
  );
}
