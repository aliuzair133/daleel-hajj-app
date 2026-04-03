import { Link } from 'react-router-dom';
import { ShieldAlert, CheckSquare, Map, Settings, MessageCircle, BookOpen } from 'lucide-react';

const MORE_ITEMS = [
  { to: '/safety', icon: ShieldAlert, label: 'Health & Safety', description: 'Heat, crowds, lost pilgrim', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  { to: '/checklist', icon: CheckSquare, label: 'Pre-Hajj Checklist', description: 'Documents, packing, preparation', color: 'text-teal-primary', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { to: '/map', icon: Map, label: 'Holy Sites', description: 'Makkah, Mina, Arafat, Muzdalifah', color: 'text-sage-primary', bg: 'bg-green-50 dark:bg-green-900/20' },
  { to: '/ai-guide', icon: MessageCircle, label: 'AI Guide', description: 'Ask questions about Hajj', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { to: '/ihram-rules', icon: BookOpen, label: 'Ihram Rules', description: 'Prohibitions & fidyah guide', color: 'text-gold-dark', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { to: '/settings', icon: Settings, label: 'Settings', description: 'Language, country, preferences', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
];

export default function More() {
  return (
    <div className="page-container px-4 py-4 fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">More</h1>

      <div className="space-y-3">
        {MORE_ITEMS.map(({ to, icon: Icon, label, description, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow no-underline"
          >
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-center">
        <p className="text-2xl mb-1">🕋</p>
        <p className="font-semibold text-teal-primary text-sm">Daleel — دليل</p>
        <p className="text-xs text-gray-500 mt-1">Your trusted Hajj companion</p>
        <p className="text-xs text-gray-400 mt-2">
          This app is a guide only. Consult your Hajj group leader or a qualified scholar for binding rulings.
        </p>
      </div>
    </div>
  );
}
