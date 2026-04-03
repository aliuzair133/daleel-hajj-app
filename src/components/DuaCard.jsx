import { useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Volume2, Square } from 'lucide-react';
import { Badge } from './ui/Badge';

const CATEGORY_BADGE = {
  ihram:    'teal',
  tawaf:    'gold',
  sai:      'sage',
  arafat:   'teal',
  rami:     'red',
  sacrifice:'gold',
  farewell: 'gray',
  general:  'gray',
};

export function DuaCard({ dua, isBookmarked = false, onBookmark, defaultOpen = false, onPlay, isAudioPlaying = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Gold accent bar */}
        <div className="w-1 self-stretch rounded-full bg-[#C9A84C] flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <Badge variant={CATEGORY_BADGE[dua.category] ?? 'gray'} className="mb-1">
                {dua.category}
              </Badge>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                {dua.title}
              </h3>
              {dua.title_ar && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-0.5" dir="rtl">
                  {dua.title_ar}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {dua.audio_file && (
                <button
                  onClick={() => onPlay?.(`/audio/${dua.audio_file}`)}
                  aria-label={isAudioPlaying ? 'Stop audio' : 'Play audio'}
                  className={[
                    'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                    isAudioPlaying
                      ? 'bg-[#0D7377] text-white'
                      : 'bg-teal-50 dark:bg-teal-900/30 text-[#0D7377] hover:bg-teal-100',
                  ].join(' ')}
                >
                  {isAudioPlaying ? <Square size={13} fill="white" /> : <Volume2 size={15} />}
                </button>
              )}
              <button
                onClick={() => onBookmark?.(dua.id)}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isBookmarked
                  ? <BookmarkCheck size={16} className="text-[#C9A84C]" />
                  : <Bookmark size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Arabic — always visible */}
          <p
            className="text-xl leading-loose text-gray-900 dark:text-white font-arabic mt-2"
            dir="rtl"
          >
            {dua.arabic}
          </p>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-[#0D7377] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
      >
        <span>{open ? 'Hide' : 'Show'} transliteration & translation</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expandable body */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100 dark:border-gray-800">
          {/* Transliteration */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Transliteration</p>
            <p className="text-sm italic text-gray-700 dark:text-gray-300 leading-relaxed">
              {dua.transliteration}
            </p>
          </div>

          {/* Translation */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0D7377] mb-1">Translation</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {dua.translation}
            </p>
          </div>

          {/* When to recite */}
          {dua.when_to_recite && (
            <div className="flex gap-2 items-start">
              <span className="text-sm flex-shrink-0">⏱</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
                {dua.when_to_recite}
              </p>
            </div>
          )}

          {/* Notes */}
          {dua.notes && (
            <div className="flex gap-2 items-start">
              <span className="text-sm flex-shrink-0">💡</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{dua.notes}</p>
            </div>
          )}

          {/* Source */}
          {dua.source && (
            <p className="text-xs text-gray-400 text-right">📚 {dua.source}</p>
          )}
        </div>
      )}
    </article>
  );
}
