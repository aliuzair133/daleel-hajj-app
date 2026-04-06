import { useState, useEffect } from 'react';
import { Search, BookmarkCheck, X, ChevronLeft, ChevronRight, Volume2, Square, Bookmark, Navigation } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useSettings } from '../hooks/useSettings';
import { useAudio } from '../hooks/useAudio';
import { toggleBookmark, getBookmarkedDuaIds } from '../utils/db';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { Badge } from '../components/ui/Badge';
import duasData from '../data/duas.json';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const CATEGORY_BADGE = {
  ihram: 'teal', tawaf: 'gold', sai: 'sage', arafat: 'teal',
  rami: 'red', sacrifice: 'gold', farewell: 'gray', general: 'gray',
};

/* ── Full-screen Dua Modal ─────────────────────────────────────── */
function DuaModal({ dua, idx, total, onClose, onPrev, onNext, isBookmarked, onBookmark, onPlay, isAudioPlaying }) {
  // Close on backdrop click
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] animate-page-enter"
      role="dialog"
      aria-modal="true"
      aria-label={dua.title}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-[var(--color-border-soft)]">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <span className="text-xs font-semibold text-gray-400">{idx + 1} / {total}</span>

        <div className="flex items-center gap-2">
          {dua.audio_file && (
            <button
              onClick={() => onPlay?.(`/audio/${dua.audio_file}`)}
              aria-label={isAudioPlaying ? 'Stop audio' : 'Play audio'}
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95',
                isAudioPlaying ? 'bg-[#0D7377] text-white' : 'bg-teal-50 dark:bg-teal-900/30 text-[#0D7377]',
              ].join(' ')}
            >
              {isAudioPlaying ? <Square size={14} fill="white" /> : <Volume2 size={16} />}
            </button>
          )}
          <button
            onClick={() => onBookmark?.(dua.id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 active:scale-95 transition-all"
          >
            {isBookmarked
              ? <BookmarkCheck size={18} className="text-[#C9A84C]" />
              : <Bookmark size={18} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Category + title */}
        <div>
          <Badge variant={CATEGORY_BADGE[dua.category] ?? 'gray'} className="mb-2">{dua.category}</Badge>
          <h2 className="text-xl font-black text-gray-900 dark:text-white leading-snug">{dua.title}</h2>
          {dua.when_to_recite && (
            <p className="text-sm text-[#0D7377] mt-1 leading-relaxed">⏱ {dua.when_to_recite}</p>
          )}
        </div>

        {/* Arabic — large and prominent */}
        <div className="rounded-2xl bg-[#0D7377]/5 dark:bg-[#0D7377]/10 border border-[#0D7377]/15 p-5">
          <p
            className="font-arabic text-gray-900 dark:text-white leading-loose text-right"
            dir="rtl"
            style={{ fontSize: '1.7rem', lineHeight: '2.6' }}
          >
            {dua.arabic}
          </p>
        </div>

        {/* Transliteration */}
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Transliteration</p>
          <p className="text-base italic text-gray-700 dark:text-gray-300 leading-relaxed">{dua.transliteration}</p>
        </div>

        {/* Translation */}
        <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377] mb-2">Translation</p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{dua.translation}</p>
        </div>

        {/* Notes */}
        {dua.notes && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">💡 {dua.notes}</p>
          </div>
        )}

        {/* Source */}
        {dua.source && (
          <p className="text-xs text-gray-400 text-right pb-2">📚 {dua.source}</p>
        )}
      </div>

      {/* ── Prev / Next navigation ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-t border-[var(--color-border-soft)] bg-[var(--color-bg)]">
        <button
          onClick={onPrev}
          disabled={idx === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button
          onClick={onNext}
          disabled={idx === total - 1}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Prayers page ─────────────────────────────────────────── */
export default function Prayers() {
  const { settings, detectLocation } = useSettings();
  const [activeTab, setActiveTab]         = useState('duas');
  const [locating, setLocating]           = useState(false);

  async function handleDetectLocation() {
    setLocating(true);
    try { await detectLocation(); } catch { /* ignore */ } finally { setLocating(false); }
  }
  const [search, setSearch]               = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedIdx, setSelectedIdx]     = useState(null); // flashcard modal index

  const { prayerTimes, currentNext, countdown } = usePrayerTimes(
    settings.latitude, settings.longitude
  );
  const { play, isPlaying, currentSrc } = useAudio();

  useEffect(() => {
    getBookmarkedDuaIds().then(setBookmarkedIds);
  }, []);

  async function handleBookmark(duaId) {
    const isNowBookmarked = await toggleBookmark(duaId);
    setBookmarkedIds(prev => {
      const n = new Set(prev);
      isNowBookmarked ? n.add(duaId) : n.delete(duaId);
      return n;
    });
  }

  const filteredDuas = duasData.duas.filter(dua => {
    const matchesSearch = !search ||
      dua.title.toLowerCase().includes(search.toLowerCase()) ||
      dua.translation.toLowerCase().includes(search.toLowerCase());
    const matchesCat    = selectedCategory === 'all' || dua.category === selectedCategory;
    const matchesBm     = !showBookmarks || bookmarkedIds.has(dua.id);
    return matchesSearch && matchesCat && matchesBm;
  });

  const selectedDua = selectedIdx !== null ? filteredDuas[selectedIdx] : null;

  return (
    <>
      {/* ── Full-screen modal ── */}
      {selectedDua && (
        <DuaModal
          dua={selectedDua}
          idx={selectedIdx}
          total={filteredDuas.length}
          onClose={() => setSelectedIdx(null)}
          onPrev={() => setSelectedIdx(i => Math.max(0, i - 1))}
          onNext={() => setSelectedIdx(i => Math.min(filteredDuas.length - 1, i + 1))}
          isBookmarked={bookmarkedIds.has(selectedDua.id)}
          onBookmark={handleBookmark}
          onPlay={play}
          isAudioPlaying={isPlaying && currentSrc === `/audio/${selectedDua.audio_file}`}
        />
      )}

      {/* ── List view ── */}
      <div className="px-4 pt-4 pb-6 fade-in max-w-lg mx-auto">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Prayers & Du'as</h1>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
          {[{ id: 'duas', label: "Hajj Du'as" }, { id: 'prayers', label: 'Prayer Times' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-[#0D7377] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Du'as tab ── */}
        {activeTab === 'duas' && (
          <>
            {/* Search + Bookmarks */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search du'as…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowBookmarks(b => !b)}
                aria-label="Show bookmarked du'as"
                className={[
                  'w-11 h-11 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0',
                  showBookmarks
                    ? 'bg-[#C9A84C] border-[#C9A84C] text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400',
                ].join(' ')}
              >
                <BookmarkCheck size={16} />
              </button>
            </div>

            {/* Category filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
              {[{ id: 'all', icon: '📿', label: 'All' }, ...duasData.categories].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={[
                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                    selectedCategory === cat.id
                      ? 'bg-[#0D7377] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  ].join(' ')}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Empty state */}
            {filteredDuas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm font-medium">
                  {showBookmarks ? "No bookmarked du'as yet" : "No du'as found"}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3 px-1">
                  {filteredDuas.length} du'a{filteredDuas.length !== 1 ? 's' : ''} — tap any to read in full
                </p>

                {/* 2-column tile grid */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredDuas.map((dua, idx) => (
                    <button
                      key={dua.id}
                      onClick={() => setSelectedIdx(idx)}
                      className="text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 active:scale-[0.97] transition-all hover:border-[#0D7377]/30 hover:shadow-card-hover"
                    >
                      <Badge variant={CATEGORY_BADGE[dua.category] ?? 'gray'} className="mb-2 text-[10px]">
                        {dua.category}
                      </Badge>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug mb-2">
                        {dua.title}
                      </h3>
                      <p
                        className="font-arabic text-gray-400 dark:text-gray-500 text-right leading-relaxed line-clamp-2"
                        dir="rtl"
                        style={{ fontSize: '1rem' }}
                      >
                        {dua.arabic}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {dua.audio_file
                          ? <span className="text-[10px] text-[#0D7377] font-semibold">🔊 Audio</span>
                          : <span />}
                        {bookmarkedIds.has(dua.id)
                          ? <BookmarkCheck size={13} className="text-[#C9A84C]" />
                          : null}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Prayer Times tab ── */}
        {activeTab === 'prayers' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">Umm al-Qura method</p>
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0D7377] disabled:opacity-50 active:scale-95 transition-all"
              >
                <Navigation size={11} className={locating ? 'animate-pulse' : ''} />
                {locating ? 'Detecting…' : 'Use my location'}
              </button>
            </div>
            {PRAYER_NAMES.map(name => (
              <PrayerTimeCard
                key={name}
                name={name}
                time={prayerTimes?.[name]}
                isNext={currentNext?.next?.name === name}
                msUntil={currentNext?.next?.name === name ? countdown : null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
