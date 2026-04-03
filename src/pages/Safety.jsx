import { useState } from 'react';
import { Shield, Heart, Users, ThermometerSun, Phone, CheckCircle2 } from 'lucide-react';
import { SafetyAlert } from '../components/SafetyAlert';
import safetyData from '../data/safety.json';

const d = safetyData;

const SECTIONS = [
  { id: 'heat',   icon: ThermometerSun, label: 'Heat Safety' },
  { id: 'crowd',  icon: Users,          label: 'Crowds'      },
  { id: 'health', icon: Heart,          label: 'Health'      },
  { id: 'lost',   icon: Shield,         label: 'Lost Pilgrim'},
];

function BulletList({ items, className = '' }) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-snug">
          <span className="text-[#0D7377] dark:text-teal-400 flex-shrink-0 mt-0.5">•</span>
          <span className="text-gray-700 dark:text-gray-300">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items, className = '' }) {
  return (
    <ol className={`space-y-2 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-snug">
          <span className="font-black text-[#0D7377] dark:text-teal-400 flex-shrink-0 w-5 text-right">{i + 1}.</span>
          <span className="text-gray-700 dark:text-gray-300">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionNav({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
      {SECTIONS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
            active === id
              ? 'bg-[#0D7377] text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
          ].join(' ')}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );
}

/* ── Heat Safety ─────────────────────────────── */
function HeatSection() {
  const hs = d.heat_safety;
  return (
    <div className="space-y-3 fade-in">
      {/* Hydration rule */}
      <SafetyAlert type="caution" title="Hydration Rule — Drink Every 15 Minutes">
        <p className="mb-2">{hs.hydration.rule}</p>
        <BulletList items={hs.hydration.tips} />
      </SafetyAlert>

      {/* Prevention */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">☂️ Prevention Tips</h3>
        <BulletList items={hs.prevention} />
      </div>

      {/* Heat Exhaustion */}
      <SafetyAlert type="caution" title={hs.heat_exhaustion.title}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Symptoms</p>
        <BulletList items={hs.heat_exhaustion.symptoms} className="mb-3" />
        <div className="mt-2 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xs font-bold uppercase tracking-wider mb-1">Action</p>
          <p className="text-sm">{hs.heat_exhaustion.action}</p>
        </div>
      </SafetyAlert>

      {/* Heatstroke */}
      <SafetyAlert type="emergency" title={hs.heatstroke.title}>
        <p className="text-xs font-black uppercase tracking-wider mb-2">Symptoms</p>
        <BulletList items={hs.heatstroke.symptoms} className="mb-3" />
        <div className="mt-2 p-3 bg-red-200/40 dark:bg-red-900/30 rounded-xl border border-red-300 dark:border-red-700">
          <p className="text-xs font-black uppercase tracking-wider mb-1">🚨 Action</p>
          <p className="text-sm font-semibold">{hs.heatstroke.action}</p>
        </div>
        <a
          href="tel:997"
          className="mt-3 flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
        >
          <Phone size={16} /> Call Ambulance — 997
        </a>
      </SafetyAlert>
    </div>
  );
}

/* ── Crowd Safety ────────────────────────────── */
function CrowdSection() {
  const cs = d.crowd_safety;
  return (
    <div className="space-y-3 fade-in">
      <SafetyAlert type="info" title="Why Crowd Safety Matters">
        {cs.overview}
      </SafetyAlert>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🧭 Rules to Follow</h3>
        <NumberedList items={cs.rules} />
      </div>

      <SafetyAlert type="caution" title="Emergency Exits">
        {cs.emergency_exits}
      </SafetyAlert>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">📡 Communication Plan</h3>
        <BulletList items={[cs.communication]} />
      </div>
    </div>
  );
}

/* ── Health Requirements ─────────────────────── */
function HealthSection() {
  const hr = d.health_requirements;
  return (
    <div className="space-y-3 fade-in">
      {/* Mandatory Vaccinations */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          Mandatory Vaccinations
        </h3>
        <div className="space-y-3">
          {hr.mandatory_vaccinations.map((v, i) => (
            <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{v.name}</p>
              {v.requirement && <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5">{v.requirement}</p>}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">⏱ {v.timing}</p>
              {v.notes && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">{v.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Vaccinations */}
      {hr.recommended_vaccinations?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            Recommended Vaccinations
          </h3>
          <div className="space-y-2">
            {hr.recommended_vaccinations.map((v, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{v.name}</p>
                {v.reason && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{v.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">💊 Medications to Pack</h3>
        <div className="space-y-2">
          {hr.medications_to_carry.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-[#2D6A4F] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{m}</p>
            </div>
          ))}
        </div>
      </div>

      <SafetyAlert type="tip" title="Chronic Conditions">
        {hr.chronic_conditions}
      </SafetyAlert>
    </div>
  );
}

/* ── Lost Pilgrim ────────────────────────────── */
function LostSection() {
  const lp = d.lost_pilgrim;
  return (
    <div className="space-y-3 fade-in">
      {/* Emergency call button */}
      <div className="bg-red-600 rounded-2xl p-4 text-white text-center">
        <p className="text-xs font-black uppercase tracking-widest mb-1">Lost Pilgrim Hotline</p>
        <a
          href="tel:920000776"
          className="text-2xl font-black tracking-widest flex items-center justify-center gap-2"
        >
          <Phone size={20} /> 920000776
        </a>
        <p className="text-xs text-red-200 mt-1">24/7 · Multilingual · Free call inside KSA</p>
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🚶 If You Are Lost</h3>
        <NumberedList items={lp.if_you_are_lost} />
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🔍 If Someone in Your Group is Missing</h3>
        <NumberedList items={lp.if_someone_is_missing} />
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🛡️ Prevention</h3>
        <BulletList items={lp.prevention} />
      </div>
    </div>
  );
}

/* ── General Tips banner ─────────────────────── */
function GeneralTips() {
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">General Tips</h3>
      {d.general_tips.map((tip, i) => (
        <SafetyAlert key={i} type={tip.type ?? 'tip'} title={tip.title}>
          {tip.body}
        </SafetyAlert>
      ))}
    </div>
  );
}

/* ── Main page ───────────────────────────────── */
export default function Safety() {
  const [section, setSection] = useState('heat');

  return (
    <div className="px-4 pt-4 pb-6 fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Health & Safety</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Essential guidance for a safe pilgrimage</p>

      <SectionNav active={section} onChange={setSection} />

      {section === 'heat'   && <HeatSection />}
      {section === 'crowd'  && <CrowdSection />}
      {section === 'health' && <HealthSection />}
      {section === 'lost'   && <LostSection />}

      {section === 'heat' && <GeneralTips />}
    </div>
  );
}
