import { useState } from 'react';
import { Phone, Copy, Check, Mail } from 'lucide-react';

const TYPE_STYLES = {
  emergency: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
  hajj:      'border-[#0D7377]/20 dark:border-[#0D7377]/30 bg-teal-50/50 dark:bg-teal-900/10',
  health:    'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
  email:     'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
  embassy:   'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
  consulate: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
};

const NUMBER_STYLES = {
  emergency: 'text-red-600 dark:text-red-400 text-xl font-black',
  default:   'text-[#0D7377] font-bold',
};

export function ContactCard({ label, number, type = 'default', compact = false }) {
  const [copied, setCopied] = useState(false);
  const isEmail = type === 'email';
  const isEmergency = type === 'emergency';

  function handleCopy() {
    navigator.clipboard.writeText(number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (compact) {
    // Compact inline row (used inside a card list)
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="flex-1 min-w-0 pr-3">
          <p className={`text-sm font-medium ${isEmergency ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
            {label}
          </p>
          <p className={isEmergency ? NUMBER_STYLES.emergency : NUMBER_STYLES.default}>
            {number}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEmail
            ? <a href={`tel:${number}`} className="flex items-center gap-1 bg-[#0D7377] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#095C5F] transition-colors min-h-[44px]">
                <Phone size={13} /> Call
              </a>
            : <a href={`mailto:${number}`} className="flex items-center gap-1 bg-[#0D7377] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#095C5F] transition-colors min-h-[44px]">
                <Mail size={13} /> Email
              </a>
          }
          <button onClick={handleCopy} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]">
            {copied ? <Check size={13} className="text-[#2D6A4F]" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    );
  }

  // Full card
  return (
    <div className={[
      'rounded-2xl border p-4',
      TYPE_STYLES[type] ?? TYPE_STYLES.embassy,
    ].join(' ')}>
      <p className={`text-sm font-semibold mb-0.5 ${isEmergency ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
        {label}
      </p>
      <p className={`mb-3 ${isEmergency ? NUMBER_STYLES.emergency : NUMBER_STYLES.default}`}>
        {number}
      </p>
      <div className="flex gap-2">
        {!isEmail
          ? <a href={`tel:${number}`} className="flex-1 flex items-center justify-center gap-1.5 bg-[#0D7377] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#095C5F] transition-colors min-h-[48px]">
              <Phone size={15} /> Call
            </a>
          : <a href={`mailto:${number}`} className="flex-1 flex items-center justify-center gap-1.5 bg-[#0D7377] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#095C5F] transition-colors min-h-[48px]">
              <Mail size={15} /> Email
            </a>
        }
        <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[48px]">
          {copied ? <><Check size={15} className="text-[#2D6A4F]" /> Copied!</> : <><Copy size={15} /> Copy</>}
        </button>
      </div>
    </div>
  );
}
