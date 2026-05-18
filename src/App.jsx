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
const ShareDua   = lazy(() => import('./pages/ShareDua'));
const ReceiveDua = lazy(() => import('./pages/ReceiveDua'));

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
        <Route path="/"              element={<Home />} />
        <Route path="/rituals"       element={<Rituals />} />
        <Route path="/prayers"       element={<Prayers />} />
        <Route path="/contacts"      element={<Contacts />} />
        <Route path="/more"          element={<More />} />
        <Route path="/safety"        element={<Safety />} />
        <Route path="/checklist"     element={<Checklist />} />
        <Route path="/map"           element={<Map />} />
        <Route path="/ihram-rules"   element={<IhramRules />} />
        <Route path="/ai-guide"      element={<AIGuide />} />
        <Route path="/settings"      element={<Settings />} />
        <Route path="/share/:tagSlug" element={<ShareDua />} />
        <Route path="/receive"        element={<ReceiveDua />} />
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

  // ── Share + Receive routes work for EVERYONE — no onboarding needed ──
  // Family members open /share/:tag to submit, then send the pilgrim
  // a /receive?d=... link which imports the dua into the pilgrim's app.
  const path = window.location.pathname;
  const isPublicRoute = path.startsWith('/share/') || path.startsWith('/receive');
  if (isPublicRoute) {
    return (
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/share/:tagSlug" element={<ShareDua />} />
            <Route path="/receive"        element={<ReceiveDua />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
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
            setShowTour(true);
          }}
        />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <div className="flex flex-col min-h-dvh bg-[var(--color-bg)]">
        <main className="main-scroll">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
        </main>
        <BottomNav />
      </div>
      {showTour && <FeatureTour onComplete={handleTourComplete} />}
    </BrowserRouter>
  );
}
