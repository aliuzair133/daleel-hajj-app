import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { BottomNav } from './components/ui/BottomNav';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { db } from './utils/db';
import FeatureTour from './components/FeatureTour';

// Pages — lazy-loaded for code splitting & faster initial load
const Home       = lazy(() => import('./pages/Home'));
const Rituals    = lazy(() => import('./pages/Rituals'));
const Prayers    = lazy(() => import('./pages/Prayers'));
const Contacts   = lazy(() => import('./pages/Contacts'));
const More       = lazy(() => import('./pages/More'));
const Safety     = lazy(() => import('./pages/Safety'));
const Checklist  = lazy(() => import('./pages/Checklist'));
const Map        = lazy(() => import('./pages/Map'));
const IhramRules = lazy(() => import('./pages/IhramRules'));
const Settings   = lazy(() => import('./pages/Settings'));
const AIGuide    = lazy(() => import('./pages/AIGuide'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

/* ── Loading skeleton shown during Suspense or initial DB check ── */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
      <div className="text-center fade-in">
        <div className="text-5xl mb-4">🕋</div>
        <p className="text-[var(--color-text-muted)] text-sm font-medium tracking-wide">
          Loading Daleel…
        </p>
      </div>
    </div>
  );
}

/* ── Animated route wrapper ────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-wrapper">
      <Routes location={location}>
        <Route path="/"            element={<Home />} />
        <Route path="/rituals"     element={<Rituals />} />
        <Route path="/prayers"     element={<Prayers />} />
        <Route path="/contacts"    element={<Contacts />} />
        <Route path="/more"        element={<More />} />
        <Route path="/safety"      element={<Safety />} />
        <Route path="/checklist"   element={<Checklist />} />
        <Route path="/map"         element={<Map />} />
        <Route path="/ihram-rules" element={<IhramRules />} />
        <Route path="/ai-guide"    element={<AIGuide />} />
        <Route path="/settings"    element={<Settings />} />
      </Routes>
    </div>
  );
}

/* ── Root app component ────────────────────────────────────────── */
export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(null); // null = still checking
  const [showTour, setShowTour]             = useState(false);

  useEffect(() => {
    db.settings
      .get('onboardingComplete')
      .then(row => {
        const done = !!row?.value;
        setOnboardingDone(done);

        // If onboarding is already done, check whether the tour has been seen
        if (done) {
          db.settings.get('tourComplete').then(tr => {
            if (!tr?.value) setShowTour(true);
          });
        }
      })
      .catch(() => setOnboardingDone(false));
  }, []);

  async function handleTourComplete() {
    await db.settings.put({ key: 'tourComplete', value: true });
    setShowTour(false);
  }

  // Still checking IndexedDB — show loading screen
  if (onboardingDone === null) return <LoadingFallback />;

  // First launch — show Onboarding (no nav, no shell)
  if (!onboardingDone) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Onboarding
          onComplete={() => {
            setOnboardingDone(true);
            setShowTour(true); // trigger tour immediately after onboarding
          }}
        />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      {/* Offline alert banner at very top */}
      <OfflineBanner />

      {/* App shell: scrollable main + fixed BottomNav */}
      <div className="flex flex-col min-h-dvh bg-[var(--color-bg)]">
        <main className="main-scroll">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
        </main>
        <BottomNav />
      </div>

      {/* Feature tour overlay — shown once after first onboarding */}
      {showTour && <FeatureTour onComplete={handleTourComplete} />}
    </BrowserRouter>
  );
}
