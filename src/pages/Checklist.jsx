import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/db';
import { ChecklistItem } from '../components/ChecklistItem';
import checklistData from '../data/checklist.json';

export default function Checklist() {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    getSetting('checklist', {}).then(saved => setChecked(saved || {}));
  }, []);

  async function toggleItem(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    await setSetting('checklist', next);
  }

  const totalItems = checklistData.categories.reduce((s, c) => s + c.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="px-4 pt-4 pb-8 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">Pre-Hajj Checklist</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Prepare thoroughly for your blessed journey</p>

      {/* Progress */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Preparation Progress</span>
          <span className="text-sm text-[#0D7377] font-black tabular-nums">{checkedCount}/{totalItems}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-[#0D7377] h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {pct === 100 ? '✅ All packed and ready!' : `${pct}% prepared — keep going!`}
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Essential
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" /> Optional
        </span>
      </div>

      {checklistData.categories.map(cat => {
        const catChecked = cat.items.filter(i => checked[i.id]).length;
        const allDone = catChecked === cat.items.length;
        return (
          <div key={cat.id} className="card mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{cat.title}</h3>
                  <p className="text-xs text-gray-400">{catChecked}/{cat.items.length} done</p>
                </div>
              </div>
              {allDone && (
                <span className="text-xs font-black text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-1 rounded-full">
                  ✓ Complete
                </span>
              )}
            </div>
            <div className="space-y-2">
              {cat.items.map(item => (
                <ChecklistItem
                  key={item.id}
                  item={{
                    id: item.id,
                    label: item.text,
                    priority: item.required ? 'essential' : 'optional',
                  }}
                  isChecked={!!checked[item.id]}
                  onToggle={toggleItem}
                  showPriority
                />
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-center text-gray-400 mt-4 pb-4">
        Red = required for travel · Gray = optional but recommended
      </p>
    </div>
  );
}
