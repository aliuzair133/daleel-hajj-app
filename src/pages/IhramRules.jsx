import { useState } from 'react';
import ihramData from '../data/ihram-rules.json';

export default function IhramRules() {
  const [tab, setTab] = useState('prohibitions');

  return (
    <div className="page-container px-4 py-4 fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ihram Rules</h1>
      <p className="text-sm text-gray-500 mb-4">Prohibitions and fidyah (expiation) guide</p>

      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        {['prohibitions', 'fidyah'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all min-h-0 ${tab === t ? 'bg-white dark:bg-gray-700 text-teal-primary shadow-sm' : 'text-gray-500'}`}>
            {t === 'prohibitions' ? 'Prohibitions' : 'Fidyah Table'}
          </button>
        ))}
      </div>

      {tab === 'prohibitions' && (
        <div className="space-y-3 fade-in">
          {ihramData.prohibitions.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">{p.rule}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                  p.applies_to === 'all' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'
                }`}>
                  {p.applies_to === 'all' ? 'All' : p.applies_to === 'men' ? '♂ Men' : '♀ Women'}
                </span>
              </div>
              {p.rule_ar && <p className="arabic-text text-xs text-gray-500 mb-2">{p.rule_ar}</p>}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{p.description}</p>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">Fidyah: {p.fidyah}</p>
              </div>
              <p className="text-xs text-gray-400 text-right mt-1">📚 {p.source}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fidyah' && (
        <div className="space-y-3 fade-in">
          {ihramData.fidyah_table.map(f => (
            <div key={f.id} className="card">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-2">{f.violation}</h3>
              <div className="space-y-1.5 mb-2">
                {f.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {f.choice ? <span className="text-teal-primary font-bold">{i + 1}.</span> : <span>•</span>}
                    {opt}
                  </div>
                ))}
              </div>
              {f.choice && <p className="text-xs text-teal-primary font-semibold">Choice of any one option</p>}
              {f.notes && <p className="text-xs text-gray-400 italic mt-1">{f.notes}</p>}
            </div>
          ))}

          <div className="card mt-4 bg-teal-50 dark:bg-teal-900/20">
            <h3 className="font-semibold text-teal-primary text-sm mb-2">Release from Ihram</h3>
            {ihramData.partial_release_stages.map(s => (
              <div key={s.stage} className="mb-3 last:mb-0">
                <p className="text-xs font-bold text-teal-primary">Stage {s.stage}: {s.name}</p>
                <p className="text-xs text-gray-500 italic mb-1">{s.name_ar}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1"><span className="font-semibold">After:</span> {s.achieved_after}</p>
                <p className="text-xs text-sage-primary font-semibold">✓ {s.what_becomes_permissible}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 mt-4 pb-4">
        🕌 Consult a qualified scholar for personal rulings on fidyah.
      </p>
    </div>
  );
}
