import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { ContactCard } from '../components/ContactCard';
import contactsData from '../data/contacts.json';

// Build a sorted list of all countries from contacts.json
const ALL_COUNTRIES = Object.entries(contactsData.by_country)
  .map(([code, data]) => ({ code, ...data }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Contacts() {
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();

  // Start with null — set properly once settings load
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [search, setSearch] = useState('');

  // Once settings are loaded, default to the user's chosen country
  useEffect(() => {
    if (loaded && selectedCountry === null) {
      setSelectedCountry(settings.country || 'US');
    }
  }, [loaded, settings.country, selectedCountry]);

  const countryData = selectedCountry ? contactsData.by_country[selectedCountry] : null;
  const hasEmbassy = countryData?.embassy_riyadh || countryData?.consulate_jeddah;

  const filtered = search.trim()
    ? ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_COUNTRIES;

  return (
    <div className="px-4 pt-4 pb-8 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
        {t('contacts.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('contacts.save_before_travel')}
      </p>

      {/* Universal Saudi Emergency */}
      <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 mb-4 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200 dark:border-red-800">
          <span className="text-base">🚨</span>
          <h2 className="font-black text-red-700 dark:text-red-400 text-sm uppercase tracking-wide">
            {t('contacts.saudi_emergency')}
          </h2>
        </div>
        <div className="divide-y divide-red-100 dark:divide-red-900/40">
          {contactsData.saudi_universal.map(contact => (
            <ContactCard key={contact.number} {...contact} compact />
          ))}
        </div>
      </div>

      {/* Embassy / Consulate Selector */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">
          {t('contacts.your_embassy')}
        </h2>

        {/* Country search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search country…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30"
          />
        </div>

        {/* Country selector dropdown */}
        <select
          value={selectedCountry ?? ''}
          onChange={e => { setSelectedCountry(e.target.value); setSearch(''); }}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white mb-3"
        >
          {!selectedCountry && <option value="">Select country…</option>}
          {filtered.map(({ code, flag, name }) => (
            <option key={code} value={code}>{flag} {name}</option>
          ))}
        </select>

        {/* Quick-pick filtered list (when searching) */}
        {search.trim().length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No countries found</p>
            ) : (
              filtered.map(({ code, flag, name }) => (
                <button
                  key={code}
                  onClick={() => { setSelectedCountry(code); setSearch(''); }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all active:scale-[0.98]',
                    selectedCountry === code
                      ? 'bg-[#0D7377] border-[#0D7377] text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200',
                  ].join(' ')}
                >
                  <span className="text-base">{flag}</span>
                  <span className="font-medium">{name}</span>
                  <span className="ml-auto text-xs opacity-50">{code}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Embassy / Consulate contacts */}
        {countryData && (
          <div>
            {hasEmbassy ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {countryData.embassy_riyadh && (
                  <ContactCard
                    label={`${countryData.flag ?? ''} ${countryData.name} — ${t('contacts.embassy_riyadh')}`}
                    number={countryData.embassy_riyadh}
                    type="embassy"
                    compact
                  />
                )}
                {countryData.consulate_jeddah && (
                  <ContactCard
                    label={`${countryData.flag ?? ''} ${countryData.name} — ${t('contacts.consulate_jeddah')}`}
                    number={countryData.consulate_jeddah}
                    type="consulate"
                    compact
                  />
                )}
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ℹ️ No embassy or consulate data is available for <strong>{countryData.name}</strong> in Saudi Arabia. Please contact your country's foreign affairs ministry before travelling.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nusuk support link */}
        <a
          href="https://hajj.nusuk.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#0D7377]/30 text-[#0D7377] dark:text-teal-400 text-sm font-semibold hover:bg-[#0D7377]/5 transition-all"
        >
          🌐 Nusuk Hajj Portal
        </a>
      </div>

      <div className="text-xs text-center text-gray-400 pb-2">
        📞 {t('contacts.tap_to_call')}
      </div>
    </div>
  );
}
