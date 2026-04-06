import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { ContactCard } from '../components/ContactCard';
import contactsData from '../data/contacts.json';

export default function Contacts() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [selectedCountry, setSelectedCountry] = useState(settings.country || 'US');
  const countryData = contactsData.by_country[selectedCountry];
  const countries = Object.entries(contactsData.by_country).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  return (
    <div className="px-4 pt-4 pb-8 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">{t('contacts.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('contacts.save_before_travel')}</p>

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

      {/* Embassy Selector */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">{t('contacts.your_embassy')}</h2>
        <select
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
        >
          {countries.map(([code, { name }]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        {countryData && (
          <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
            {countryData.embassy_riyadh && (
              <ContactCard
                label={`${countryData.name} ${t('contacts.embassy_riyadh')}`}
                number={countryData.embassy_riyadh}
                type="embassy"
                compact
              />
            )}
            {countryData.consulate_jeddah && (
              <ContactCard
                label={`${countryData.name} ${t('contacts.consulate_jeddah')}`}
                number={countryData.consulate_jeddah}
                type="consulate"
                compact
              />
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-center text-gray-400 pb-2">
        📞 {t('contacts.tap_to_call')}
      </div>
    </div>
  );
}
