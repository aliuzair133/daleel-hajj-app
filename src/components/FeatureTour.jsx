import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

/**
 * FeatureTour — guided post-onboarding walkthrough.
 *
 * Each step spotlights a tab in the bottom navigation so the user can
 * see exactly where to find each feature. A "cut-out" glow ring appears
 * over the correct tab; the tooltip card sits just above it.
 */

// Tab index (0-based, left → right) and screen path for each step
const TOUR_STEPS = [
  {
    id:       'home',
    tabIndex: 0,
    icon:     '🏠',
    title:    'Your Hajj Dashboard',
    desc:     "Start here every day. See today's ritual, the next prayer countdown, quick duas, and your overall Hajj progress — at a glance.",
    color:    '#0D7377',
  },
  {
    id:       'rituals',
    tabIndex: 1,
    icon:     '📿',
    title:    'Day-by-Day Rituals',
    desc:     'Follow Hajj across all 6 days, step by step. Tap each step to read full guidance and mark it complete as you go.',
    color:    '#0D7377',
  },
  {
    id:       'prayers',
    tabIndex: 2,
    icon:     '🤲',
    title:    "Du'as & Prayer Times",
    desc:     '20+ authentic Hajj duas with Arabic, transliteration, audio, and bookmarks. Add your own personal duas for family back home.',
    color:    '#0D7377',
  },
  {
    id:       'contacts',
    tabIndex: 3,
    icon:     '📞',
    title:    'Emergency Contacts',
    desc:     "Saudi emergency numbers and your country's embassy — always one tap away. Tap any number to call immediately.",
    color:    '#DC2626',
  },
  {
    id:       'more',
    tabIndex: 4,
    icon:     '🛡️',
    title:    'Safety, Map & More',
    desc:     'Health & crowd safety guides, interactive holy sites map, pre-Hajj checklist, and an AI-powered Hajj scholar — most features work fully offline.',
    color:    '#2D6A4F',
  },
];

const NAV_HEIGHT = 72; // approximate bottom nav height in px (incl safe area)

export default function FeatureTour({ onComplete }) {
  const [step,      setStep]      = useState(0);
  const [navWidth,  setNavWidth]  = useState(0);
  const [spotRect,  setSpotRect]  = useState(null); // {x, y, w, h}
  const resizeRef = useRef(null);

  const current  = TOUR_STEPS[step];
  const isLast   = step === TOUR_STEPS.length - 1;

  // Measure the viewport width so we can compute each tab's bounding box
  useEffect(() => {
    function measure() {
      const vw = window.innerWidth;
      setNavWidth(vw);
      const tabCount = TOUR_STEPS.length; // 5
      const tabW     = vw / tabCount;
      const tabX     = current.tabIndex * tabW;
      const vh       = window.innerHeight;
      setSpotRect({
        x: tabX,
        y: vh - NAV_HEIGHT,
        w: tabW,
        h: NAV_HEIGHT,
      });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [current.tabIndex]);

  function goNext() {
    if (isLast) onComplete();
    else setStep(s => s + 1);
  }

  function goBack() {
    if (step > 0) setStep(s => s - 1);
  }

  if (!spotRect) return null;

  const { x: sx, y: sy, w: sw, h: sh } = spotRect;
  const spotCenterX = sx + sw / 2;

  // Tooltip card position: just above the spotlight, centred on the tab
  const cardWidth  = Math.min(navWidth - 32, 360);
  const cardLeft   = Math.max(16, Math.min(spotCenterX - cardWidth / 2, navWidth - cardWidth - 16));
  const cardBottom = sh + 12; // px above the nav bar

  // SVG cutout: full-screen rect minus a rounded rect for the spotlight tab
  const rx = 12; // corner radius for spotlight
  const pad = 6; // padding around tab

  return createPortal(
    <div
      className="fixed inset-0 z-[300]"
      role="dialog"
      aria-modal="true"
      aria-label={`Feature tour step ${step + 1} of ${TOUR_STEPS.length}`}
    >
      {/* ── SVG overlay with cutout ── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <mask id="tour-mask">
            {/* White = visible overlay */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout = transparent "spotlight" area */}
            <rect
              x={sx + pad}
              y={sy + pad}
              width={sw - pad * 2}
              height={sh - pad}
              rx={rx}
              fill="black"
            />
          </mask>
        </defs>
        {/* Dark scrim with hole */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-mask)"
        />
        {/* Glow ring around the spotlight */}
        <rect
          x={sx + pad - 3}
          y={sy + pad - 3}
          width={sw - pad * 2 + 6}
          height={sh - pad + 6}
          rx={rx + 3}
          fill="none"
          stroke={current.color}
          strokeWidth="2.5"
          opacity="0.9"
        />
        {/* Animated pulse ring */}
        <rect
          x={sx + pad - 8}
          y={sy + pad - 8}
          width={sw - pad * 2 + 16}
          height={sh - pad + 16}
          rx={rx + 8}
          fill="none"
          stroke={current.color}
          strokeWidth="1.5"
          opacity="0.4"
          className="animate-ping"
          style={{ transformOrigin: `${spotCenterX}px ${sy + sh / 2}px` }}
        />
      </svg>

      {/* ── Tooltip card ── */}
      <div
        className="absolute"
        style={{
          left:   cardLeft,
          bottom: cardBottom,
          width:  cardWidth,
        }}
      >
        {/* Tail pointer */}
        <div
          className="absolute bottom-[-8px] w-4 h-4 rotate-45 rounded-sm"
          style={{
            left: spotCenterX - cardLeft - 8,
            background: 'white',
          }}
        />

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width:      `${((step + 1) / TOUR_STEPS.length) * 100}%`,
                background: current.color,
              }}
            />
          </div>

          <div className="px-5 pt-4 pb-4">
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: current.color + '18' }}
                >
                  {current.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    Step {step + 1} of {TOUR_STEPS.length}
                  </p>
                  <h3
                    className="text-base font-black leading-tight"
                    style={{ color: current.color }}
                  >
                    {current.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onComplete}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0 ml-2"
                aria-label="Skip tour"
              >
                <X size={15} />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {current.desc}
            </p>

            {/* Navigation */}
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 active:scale-95 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {/* Step dots */}
              <div className="flex-1 flex items-center justify-center gap-1.5">
                {TOUR_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={[
                      'rounded-full transition-all duration-300',
                      i === step
                        ? 'w-5 h-2'
                        : 'w-2 h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300',
                    ].join(' ')}
                    style={i === step ? { background: current.color } : {}}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goNext}
                className="flex items-center justify-center gap-1.5 px-5 h-10 rounded-xl text-white font-bold text-sm active:scale-95 transition-all flex-shrink-0"
                style={{ background: current.color }}
              >
                {isLast ? (
                  <>Begin 🕋</>
                ) : (
                  <>Next <ChevronRight size={15} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
