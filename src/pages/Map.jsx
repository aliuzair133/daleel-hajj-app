import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Navigation, Layers, ChevronDown, ChevronUp, Route, ChevronRight } from 'lucide-react';
import sitesData from '../data/sites.json';
import 'leaflet/dist/leaflet.css';

/* ── Site categories ─────────────────────────────────────────── */
const CATEGORY_CONFIG = {
  essential: { label: 'Essential',  color: '#0D7377', bg: '#E8F4F4', emoji: '🕋' },
  important: { label: 'Important',  color: '#B45309', bg: '#FEF3C7', emoji: '🕌' },
  blessed:   { label: 'Blessed',    color: '#2D6A4F', bg: '#D1FAE5', emoji: '✨' },
};

/* ── Hajj route polyline (geo-ordered journey) ───────────────── */
const HAJJ_ROUTE = [
  [21.4225, 39.8262],  // Masjid al-Haram (start)
  [21.4133, 39.8930],  // Mina (Day 8)
  [21.3549, 39.9845],  // Arafat (Day 9)
  [21.3833, 39.9333],  // Muzdalifah (night 9→10)
  [21.4206, 39.8735],  // Jamarat Bridge (Day 10 stoning)
  [21.4225, 39.8262],  // Masjid al-Haram (Tawaf al-Ifadah)
];

/* ── Journey stages — map each Hajj day to guidance ─────────────
   NATIVE MIGRATION NOTE: This data is pure JS — fully portable.
   Replace the map pan calls with react-native-maps animateToRegion().
   ────────────────────────────────────────────────────────────── */
// Hajj 2026: 8 Dhul Hijjah ≈ May 25 2026 (subject to moon sighting)
const HAJJ_START_MS = new Date('2026-05-25T00:00:00').getTime();
const MS_PER_DAY    = 86400000;

const JOURNEY_STAGES = [
  {
    day:       8,
    dayName:   'Day of Tarwiyah',
    location:  'Makkah → Mina',
    siteId:    'mina',
    coords:    [21.4133, 39.8930],
    zoom:      14,
    icon:      '🕋',
    action:    'Travel to Mina after Fajr. Perform 5 prayers in Mina.',
    nextLoc:   'Arafat',
  },
  {
    day:       9,
    dayName:   'Day of Arafat',
    location:  'Arafat',
    siteId:    'arafat',
    coords:    [21.3549, 39.9845],
    zoom:      13,
    icon:      '🤲',
    action:    'Stand at Arafat from Dhuhr until sunset. This is the pillar of Hajj.',
    nextLoc:   'Muzdalifah',
  },
  {
    day:       10,
    dayName:   "Eid al-Adha — Day of Sacrifice",
    location:  'Muzdalifah → Mina',
    siteId:    'muzdalifah',
    coords:    [21.3833, 39.9333],
    zoom:      13,
    icon:      '🌙',
    action:    'Collect 49 pebbles. Proceed to Mina at dawn for Rami, sacrifice, shaving, then Tawaf al-Ifadah.',
    nextLoc:   'Masjid al-Haram',
  },
  {
    day:       11,
    dayName:   'Day of Tashreeq (1)',
    location:  'Mina',
    siteId:    'mina',
    coords:    [21.4206, 39.8735],
    zoom:      14,
    icon:      '🪨',
    action:    'Stone all three Jamarat after Dhuhr. Spend the night in Mina.',
    nextLoc:   'Mina (Day 12)',
  },
  {
    day:       12,
    dayName:   'Day of Tashreeq (2)',
    location:  'Mina',
    siteId:    'mina',
    coords:    [21.4206, 39.8735],
    zoom:      14,
    icon:      '🪨',
    action:    'Stone all three Jamarat after Dhuhr. You may depart before sunset or stay for Day 13.',
    nextLoc:   'Makkah (Farewell Tawaf)',
  },
  {
    day:       13,
    dayName:   'Day of Tashreeq (3) & Farewell',
    location:  'Mina → Makkah',
    siteId:    'masjid_al_haram',
    coords:    [21.4225, 39.8262],
    zoom:      15,
    icon:      '🕋',
    action:    'Stone Jamarat if still in Mina. Perform Tawaf al-Wada (Farewell Tawaf) before departing.',
    nextLoc:   null,
  },
];

function getCurrentStage() {
  const nowMs  = Date.now();
  const dayNum = Math.floor((nowMs - HAJJ_START_MS) / MS_PER_DAY) + 8; // Hajj starts day 8
  return JOURNEY_STAGES.find(s => s.day === dayNum) ?? null;
}

/* ── Map centre / initial zoom ───────────────────────────────── */
const MAP_CENTER = [21.395, 39.910];
const MAP_ZOOM   = 12;

/* ── Build a custom DivIcon for each site ─────────────────────── */
function makeIcon(site, isSelected, isCurrentStage, L) {
  const cfg    = CATEGORY_CONFIG[site.category] || CATEGORY_CONFIG.essential;
  const size   = isSelected ? 44 : isCurrentStage ? 40 : 36;
  const border = isSelected
    ? `3px solid ${cfg.color}`
    : isCurrentStage
    ? `3px solid #C9A84C`
    : `2px solid ${cfg.color}`;
  const shadow = isSelected || isCurrentStage
    ? `0 4px 16px rgba(0,0,0,0.35)`
    : `0 2px 8px rgba(0,0,0,0.2)`;
  const bg     = isCurrentStage && !isSelected ? '#FEF3C7' : cfg.bg;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${bg};
        border:${border};
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:${isSelected ? 20 : 16}px;
        box-shadow:${shadow};
        transition: all 0.2s ease;
        cursor: pointer;
      ">${cfg.emoji}</div>
      <div style="
        width:0; height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${isCurrentStage && !isSelected ? '#C9A84C' : cfg.color};
        margin:0 auto;
        margin-top:-2px;
      "></div>`,
    iconSize:    [size, size + 8],
    iconAnchor:  [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

/* ════════════════════════════════════════════════════════════════
   Map Page Component
   NATIVE MIGRATION NOTE: Swap Leaflet for react-native-maps MapView.
   The component state/logic (journey mode, filters, site selection)
   is fully portable — only the map rendering section needs changing.
   ════════════════════════════════════════════════════════════════ */
export default function Map() {
  const mapRef       = useRef(null);
  const containerRef = useRef(null);
  const markersRef   = useRef({});
  const leafletRef   = useRef(null);

  const [selectedSite,  setSelectedSite]  = useState(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [filter,        setFilter]        = useState('all');
  const [showRoute,     setShowRoute]     = useState(true);
  const [mapReady,      setMapReady]      = useState(false);
  const [journeyMode,   setJourneyMode]   = useState(false);
  const [currentStage,  setCurrentStage]  = useState(null);

  /* ── Determine current journey stage when mode is toggled ── */
  useEffect(() => {
    if (journeyMode) {
      const stage = getCurrentStage();
      setCurrentStage(stage);
      // Pan to the current stage location if active
      if (stage && mapRef.current) {
        mapRef.current.flyTo(stage.coords, stage.zoom, { duration: 1.5 });
      }
    } else {
      setCurrentStage(null);
    }
  }, [journeyMode]);

  /* ── Initialize Leaflet map ─────────────────────────────────── */
  useEffect(() => {
    import('leaflet').then(L => {
      if (mapRef.current || !containerRef.current) return;

      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: MAP_CENTER,
        zoom:   MAP_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Hajj route polyline
      const routeLine = L.polyline(HAJJ_ROUTE, {
        color:     '#C9A84C',
        weight:    3,
        opacity:   0.75,
        dashArray: '8 6',
        lineCap:   'round',
      }).addTo(map);
      routeLine._isRoute = true;

      // Place markers for all sites
      sitesData.sites.forEach(site => {
        const marker = L.marker(
          [site.coordinates.lat, site.coordinates.lng],
          { icon: makeIcon(site, false, false, L) }
        ).addTo(map);

        marker.on('click', () => {
          setSelectedSite(site);
          setDrawerOpen(true);
          map.panTo([site.coordinates.lat, site.coordinates.lng], { animate: true });
        });

        markersRef.current[site.id] = { marker, site };
      });

      setTimeout(() => { map.invalidateSize(); setMapReady(true); }, 100);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  /* ── Update marker icons when selection / journey stage changes ── */
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    Object.values(markersRef.current).forEach(({ marker, site }) => {
      const isSelected     = selectedSite?.id === site.id;
      const isCurrentStage = journeyMode && currentStage?.siteId === site.id;
      marker.setIcon(makeIcon(site, isSelected, isCurrentStage, L));
    });
  }, [selectedSite, currentStage, journeyMode]);

  /* ── Show/hide markers based on category filter ─────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(({ marker, site }) => {
      const visible = filter === 'all' || site.category === filter;
      if (visible) { if (!map.hasLayer(marker)) map.addLayer(marker); }
      else          { if (map.hasLayer(marker)) map.removeLayer(marker); }
    });
  }, [filter]);

  /* ── Toggle Hajj route ──────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer(layer => {
      if (layer._isRoute) {
        if (showRoute) { if (!map.hasLayer(layer)) map.addLayer(layer); }
        else           { map.removeLayer(layer); }
      }
    });
  }, [showRoute]);

  /* ── Pan to site from list ──────────────────────────────────── */
  function flyToSite(site) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([site.coordinates.lat, site.coordinates.lng], 15, { duration: 1 });
    setSelectedSite(site);
    setDrawerOpen(true);
  }

  /* ── Recenter on all sites ─────────────────────────────────── */
  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    if (journeyMode && currentStage) {
      map.flyTo(currentStage.coords, currentStage.zoom, { duration: 1.2 });
      return;
    }
    const bounds = Object.values(markersRef.current)
      .filter(({ site }) => filter === 'all' || site.category === filter)
      .map(({ site }) => [site.coordinates.lat, site.coordinates.lng]);
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }

  const filteredSites = sitesData.sites.filter(
    s => filter === 'all' || s.category === filter
  );

  const FILTERS = [
    { key: 'all',       label: 'All Sites' },
    { key: 'essential', label: '🕋 Essential' },
    { key: 'important', label: '🕌 Important' },
    { key: 'blessed',   label: '✨ Blessed' },
  ];

  /* ════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-dvh bg-[var(--color-bg)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-[var(--color-bg)]">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Holy Sites Map</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Interactive guide to the Hajj journey</p>
          </div>

          {/* Journey Mode toggle */}
          <button
            onClick={() => setJourneyMode(m => !m)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all',
              journeyMode
                ? 'bg-[#C9A84C] border-[#C9A84C] text-white shadow-sm'
                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]',
            ].join(' ')}
          >
            <Route size={13} />
            Journey
          </button>
        </div>

        {/* ── Journey Mode banner ── */}
        {journeyMode && (
          <div className="mb-2">
            {currentStage ? (
              <div className="rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/40 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{currentStage.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A8873A]">
                        Day {currentStage.day} · {currentStage.dayName}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                      📍 {currentStage.location}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {currentStage.action}
                    </p>
                    {currentStage.nextLoc && (
                      <p className="text-[11px] text-[#A8873A] font-semibold mt-1 flex items-center gap-1">
                        Next: {currentStage.nextLoc} <ChevronRight size={12} />
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 px-3 py-2.5">
                <p className="text-xs text-[#0D7377] font-semibold flex items-center gap-1.5">
                  <Route size={13} />
                  Journey Mode is active during Hajj (8–13 Dhul Hijjah 1447 · May 25–30, 2026)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                filter === f.key
                  ? 'bg-[#0D7377] text-white border-[#0D7377]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}

          {/* Route toggle */}
          <button
            onClick={() => setShowRoute(r => !r)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ml-1',
              showRoute
                ? 'bg-[#C9A84C]/15 text-[#A8873A] border-[#C9A84C]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]',
            ].join(' ')}
          >
            <span>— Route</span>
          </button>
        </div>
      </div>

      {/* ── Map area ──────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ zIndex: 0 }}
        />

        {!mapReady && (
          <div className="absolute inset-0 bg-[#E8F4F4] dark:bg-teal-900/30 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm text-[#0D7377] font-medium">Loading map…</p>
            </div>
          </div>
        )}

        {/* ── Map controls (top-right) ───────────────────────── */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-lg border border-gray-100 dark:border-gray-700"
            aria-label="Zoom in"
          >+</button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-lg border border-gray-100 dark:border-gray-700"
            aria-label="Zoom out"
          >−</button>
          <button
            onClick={recenter}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center border border-gray-100 dark:border-gray-700"
            aria-label={journeyMode ? 'Go to current stage' : 'Fit all sites'}
            title={journeyMode ? 'Go to current stage' : 'Fit all sites'}
          >
            <Navigation size={16} className={journeyMode ? 'text-[#C9A84C]' : 'text-[#0D7377]'} />
          </button>
        </div>

        {/* ── Legend (bottom-left) ──────────────────────────── */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-100 dark:border-gray-700">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 mb-1 last:mb-0">
              <span className="text-xs">{cfg.emoji}</span>
              <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
          ))}
          {journeyMode && (
            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
              <div className="w-3 h-3 rounded-full border-2 border-[#C9A84C] bg-[#FEF3C7]" />
              <span className="text-[10px] text-[#A8873A] font-semibold">Current Stage</span>
            </div>
          )}
          {showRoute && (
            <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              <div className="w-5 h-0 border-b-2 border-dashed border-[#C9A84C]" />
              <span className="text-[10px] text-gray-500">Hajj Route</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Site list / bottom sheet ───────────────────────────── */}
      <div
        className={[
          'flex-shrink-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] transition-all duration-300',
          drawerOpen && selectedSite ? 'max-h-72 overflow-y-auto' : 'max-h-48 overflow-hidden',
        ].join(' ')}
        style={{ zIndex: 10 }}
      >
        <div className="sticky top-0 bg-[var(--color-surface)] px-4 pt-3 pb-1 flex items-center justify-between z-10">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {filteredSites.length} Sites
          </span>
          <div className="flex items-center gap-2">
            {selectedSite && (
              <button
                onClick={() => { setSelectedSite(null); setDrawerOpen(false); }}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] min-h-0 h-auto py-0"
              >
                <X size={14} /> Clear
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(d => !d)}
              className="text-[var(--color-text-muted)] min-h-0 h-auto py-0"
              aria-label={drawerOpen ? 'Collapse list' : 'Expand list'}
            >
              {drawerOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {/* Selected site detail card */}
        {drawerOpen && selectedSite && (() => {
          const cfg = CATEGORY_CONFIG[selectedSite.category] || CATEGORY_CONFIG.essential;
          const isActiveStage = journeyMode && currentStage?.siteId === selectedSite.id;
          return (
            <div
              className="mx-4 mb-3 rounded-2xl p-3.5 border slide-up"
              style={{
                background:   isActiveStage ? '#FEF3C7' : cfg.bg,
                borderColor: (isActiveStage ? '#C9A84C' : cfg.color) + '40',
              }}
            >
              {isActiveStage && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Route size={12} className="text-[#A8873A]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A8873A]">
                    Current Stage
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl">{cfg.emoji}</span>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: isActiveStage ? '#A8873A' : cfg.color }}>{selectedSite.name}</h3>
                  <p className="arabic-text text-base" style={{ color: cfg.color }}>{selectedSite.name_ar}</p>
                  <p className="text-xs text-gray-500">📍 {selectedSite.location}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{selectedSite.significance}</p>
              {selectedSite.rituals_performed?.length > 0 && (
                <div className="bg-white/70 dark:bg-black/10 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cfg.color }}>Rituals Here</p>
                  {selectedSite.rituals_performed.map((r, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5 mb-0.5">
                      <span style={{ color: cfg.color }}>•</span> {r}
                    </p>
                  ))}
                </div>
              )}
              {selectedSite.notes && (
                <p className="text-xs italic text-gray-500 mt-2 leading-relaxed">{selectedSite.notes}</p>
              )}
            </div>
          );
        })()}

        {/* Sites list (collapsed state or below detail) */}
        <div className={drawerOpen ? 'pb-2' : 'pb-0'}>
          {(!drawerOpen || !selectedSite) && (
            <div className="px-4 pb-2 space-y-1.5">
              {filteredSites.map(site => {
                const cfg       = CATEGORY_CONFIG[site.category] || CATEGORY_CONFIG.essential;
                const isActive  = selectedSite?.id === site.id;
                const isCurrent = journeyMode && currentStage?.siteId === site.id;
                return (
                  <button
                    key={site.id}
                    onClick={() => flyToSite(site)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border min-h-0 h-auto',
                      isActive
                        ? 'border-[#0D7377] bg-teal-50 dark:bg-teal-900/20'
                        : isCurrent
                        ? 'border-[#C9A84C] bg-amber-50 dark:bg-amber-900/10'
                        : 'border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-2)]',
                    ].join(' ')}
                  >
                    <span className="text-lg flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{site.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{site.location}</p>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 bg-[#C9A84C]/15 text-[#A8873A] border border-[#C9A84C]/30">
                        Here now
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav spacer */}
      <div style={{ height: 64, flexShrink: 0 }} />
    </div>
  );
}
