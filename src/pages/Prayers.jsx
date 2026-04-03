import { useState, useEffect } from 'react';
import { Search, BookmarkCheck } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useAudio } from '../hooks/useAudio';
import { toggleBookmark, getBookmarkedDuaIds } from '../utils/db';
import { DuaCard } from '../components/DuaCard';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import duasData from '../data/duas.json';

const PRAYER_TIMES_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function Prayers() {
  const [activeTab, setActiveTab] = useState('duas');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { prayerTimes, currentNext, countdown } = usePrayerTimes(21.3891, 39.8579);
  const { play, isPlaying, currentSrc } = useAudio();

  useEffect(() => {
    getBookmarkedDuaIds().then(setBookmarkedIds);
  }, []);

  async function handleBookmark(duaId) {
    const isNowBookmarked = await toggleBookmark(duaId);
    setBookmarkedIds(prev => {
      const n = new Set(prev);
      if (isNowBookmarked) n.add(duaId); else n.delete(duaId);
      return n;
    });
  }

  const filteredDuas = duasData.duas.filter(dua => {
    const matchesSearch = !search ||
      dua.title.toLowerCase().includes(search.toLowerCase()) ||
      dua.translation.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || dua.category === selectedCategory;
    const matchesBookmark = !showBookmarks || bookmarkedIds.has(dua.id);
    return matchesSearch && matchesCat && matchesBookmark;
  });

  return (
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

      {activeTab === 'duas' && (
        <>
          {/* Search + Bookmarks toggle */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search du'as…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30"
              />
            </div>
            <button
              onClick={() => setShowBookmarks(b => !b)}
              aria-label="Bookmarked du'as"
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

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-hide">
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

          {/* Du'as List */}
          {filteredDuas.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm font-medium">
                {showBookmarks ? 'No bookmarked du\'as yet' : 'No du\'as found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDuas.map(dua => (
                <DuaCard
                  key={dua.id}
                  dua={dua}
                  isBookmarked={bookmarkedIds.has(dua.id)}
                  onBookmark={handleBookmark}
                  onPlay={play}
                  isAudioPlaying={isPlaying && currentSrc === `/audio/${dua.audio_file}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'prayers' && (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-500 mb-1">Prayer times based on Makkah · Umm al-Qura method</p>
          {PRAYER_TIMES_NAMES.map(name => (
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
  );
}
