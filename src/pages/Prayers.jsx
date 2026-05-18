import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, BookmarkCheck, X, ChevronLeft, ChevronRight,
  Volume2, Square, Bookmark, Navigation, Plus, Pencil,
  Trash2, Tag, Layers, MapPin, Share2, Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useSettings } from '../hooks/useSettings';
import { useAudio } from '../hooks/useAudio';
import {
  toggleBookmark, getBookmarkedDuaIds,
  addPersonalDua, updatePersonalDua, deletePersonalDua, getAllPersonalDuas,
} from '../utils/db';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { Badge } from '../components/ui/Badge';
import duasData from '../data/duas.json';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const CATEGORY_BADGE = {
  ihram: 'teal', tawaf: 'gold', sai: 'sage', arafat: 'teal',
  rami: 'red', sacrifice: 'gold', farewell: 'gray', general: 'gray',
  forgiveness: 'teal', health: 'sage', family: 'gold', success: 'gold',
};

/* ─────────────────────────────────────────────────────────────────────────
   DuaSwiper — unified swipeable card viewer for Hajj duas + personal duas
   ───────────────────────────────────────────────────────────────────────── */
function DuaSwiper({
  duas,
  startIdx = 0,
  type = 'hajj',       // 'hajj' | 'personal'
  onClose,
  bookmarkedIds,
  onBookmark,
  onPlay,
  isPlaying,
  currentSrc,
}) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(Math.max(0, Math.min(startIdx, duas.length - 1)));
  const [touchStartX, setTouchStartX] = useState(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const total = duas.length;
  const dua = duas[idx];
  const idxRef = useRef(idx);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]); // eslint-disable-line

  const navigate = (dir) => {
    const cur = idxRef.current;
    const newIdx = cur + dir;
    if (newIdx < 0 || newIdx >= total || isAnimating) return;
    setIsAnimating(true);
    // Slide current card off screen
    setOffsetX(dir > 0 ? -window.innerWidth : window.innerWidth);
    setTimeout(() => {
      setIdx(newIdx);
      setOffsetX(0);
      setIsAnimating(false);
    }, 200);
  };

  /* Touch swipe handlers */
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (touchStartX === null || isAnimating) return;
    setOffsetX(e.touches[0].clientX - touchStartX);
  };
  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const dx = offsetX;
    setTouchStartX(null);
    if (Math.abs(dx) > 70) {
      const dir = dx < 0 ? 1 : -1;
      const cur = idxRef.current;
      if ((dir === 1 && cur < total - 1) || (dir === -1 && cur > 0)) {
        setIsAnimating(true);
        setOffsetX(dx < 0 ? -window.innerWidth : window.innerWidth);
        setTimeout(() => {
          setIdx(i => i + dir);
          setOffsetX(0);
          setIsAnimating(false);
        }, 200);
        return;
      }
    }
    setOffsetX(0); // snap back
  };

  if (!dua) return null;

  const isHajj = type === 'hajj';
  const isBookmarked = isHajj && bookmarkedIds?.has(dua.id);
  const audioActive = isPlaying && currentSrc === `/audio/${dua.audio_file}`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={dua.title}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--color-border-soft)] flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>

        <div className="text-center select-none">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {idx + 1}
            <span className="text-gray-400 font-normal"> / {total}</span>
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-600">← swipe →</p>
        </div>

        <div className="flex items-center gap-2">
          {isHajj && onPlay && (
            <button
              onClick={() => onPlay(`/audio/${dua.audio_file || ''}`, dua.arabic)}
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95',
                audioActive
                  ? 'bg-[#0D7377] text-white'
                  : 'bg-teal-50 dark:bg-teal-900/30 text-[#0D7377]',
              ].join(' ')}
              aria-label={audioActive ? t('prayers.stop_audio') : t('prayers.play_audio')}
            >
              {audioActive ? <Square size={14} fill="white" /> : <Volume2 size={16} />}
            </button>
          )}
          {isHajj && onBookmark && (
            <button
              onClick={() => onBookmark(dua.id)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 active:scale-95 transition-all"
              aria-label={isBookmarked ? t('prayers.bookmarked') : t('prayers.bookmark')}
            >
              {isBookmarked
                ? <BookmarkCheck size={18} className="text-[#C9A84C]" />
                : <Bookmark size={18} className="text-gray-400" />}
            </button>
          )}
          {!isHajj && <div className="w-10 h-10" />}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#0D7377] to-[#2D6A4F] transition-all duration-300 ease-out"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      {/* ── Swipeable card content ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: touchStartX !== null ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-5 py-5 space-y-4 max-w-lg mx-auto pb-10">

          {/* ── Hajj Dua Layout ── */}
          {isHajj ? (
            <>
              <div>
                <Badge variant={CATEGORY_BADGE[dua.category] ?? 'gray'} className="mb-2">
                  {dua.category}
                </Badge>
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {dua.title}
                </h2>
                {dua.when_to_recite && (
                  <p className="text-sm text-[#0D7377] mt-1.5 leading-relaxed">
                    ⏱ {dua.when_to_recite}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-[#0D7377]/5 dark:bg-[#0D7377]/10 border border-[#0D7377]/15 p-5">
                <p
                  className="font-arabic text-gray-900 dark:text-white leading-loose text-right"
                  dir="rtl"
                  style={{ fontSize: '1.7rem', lineHeight: '2.6' }}
                >
                  {dua.arabic}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {t('prayers.transliteration')}
                </p>
                <p className="text-base italic text-gray-700 dark:text-gray-300 leading-relaxed">
                  {dua.transliteration}
                </p>
              </div>

              <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377] mb-2">
                  {t('prayers.translation')}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {dua.translation}
                </p>
              </div>

              {dua.notes && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡 {dua.notes}
                  </p>
                </div>
              )}

              {dua.source && (
                <p className="text-xs text-gray-400 text-right pb-2">📚 {dua.source}</p>
              )}
            </>
          ) : (
            /* ── Personal Dua Layout ── */
            <>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-snug">
                {dua.title}
              </h2>

              {dua.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dua.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C9A84C]/10 text-[#A8873A] dark:text-[#C9A84C] text-xs font-semibold border border-[#C9A84C]/20"
                    >
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {dua.arabic && (
                <div className="rounded-2xl bg-[#0D7377]/5 dark:bg-[#0D7377]/10 border border-[#0D7377]/15 p-5">
                  <p
                    className="font-arabic text-gray-900 dark:text-white leading-loose text-right"
                    dir="rtl"
                    style={{ fontSize: '1.5rem', lineHeight: '2.4' }}
                  >
                    {dua.arabic}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4">
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {dua.body}
                </p>
              </div>

              <p className="text-xs text-gray-400 text-right pb-2">
                Saved {new Date(dua.createdAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Prev / Next navigation ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-t border-[var(--color-border-soft)] bg-[var(--color-bg)] flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          disabled={idx === 0 || isAnimating}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          <ChevronLeft size={18} /> {t('prayers.previous')}
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={idx === total - 1 || isAnimating}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          {t('common.next')} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PersonalDuaForm — add / edit a personal dua
   ───────────────────────────────────────────────────────────────────────── */
function PersonalDuaForm({ existing, onSave, onCancel }) {
  const { t } = useTranslation();
  const [title,    setTitle]    = useState(existing?.title    ?? '');
  const [body,     setBody]     = useState(existing?.body     ?? '');
  const [arabic,   setArabic]   = useState(existing?.arabic   ?? '');
  const [tagInput, setTagInput] = useState((existing?.tags ?? []).join(', '));

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  function handleSave() {
    if (!isValid) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ title, body, arabic, tags });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--color-border-soft)]">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          <X size={18} />
        </button>
        <h2 className="text-base font-black text-gray-900 dark:text-white">
          {existing ? t('personal_duas.edit_title') : t('personal_duas.add_title')}
        </h2>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="px-4 py-2 rounded-xl bg-[#0D7377] text-white text-sm font-bold disabled:opacity-40"
        >
          {t('common.save')}
        </button>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            {t('personal_duas.title_label')} *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('personal_duas.title_placeholder')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            {t('personal_duas.body_label')} *
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={t('personal_duas.body_placeholder')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            {t('personal_duas.arabic_label')}
          </label>
          <textarea
            rows={2}
            value={arabic}
            onChange={e => setArabic(e.target.value)}
            placeholder={t('personal_duas.arabic_placeholder')}
            dir="rtl"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-arabic text-right text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            {t('personal_duas.tags_label')}
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder={t('personal_duas.tags_placeholder')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          />
          <p className="text-xs text-gray-400 mt-1">{t('personal_duas.tags_hint')}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PersonalDuaDetail — read / edit / delete a single personal dua
   ───────────────────────────────────────────────────────────────────────── */
function PersonalDuaDetail({ dua, onClose, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] animate-page-enter">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--color-border-soft)]">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          <X size={18} />
        </button>
        <h2 className="text-sm font-black text-gray-700 dark:text-gray-200 truncate max-w-[160px]">
          {dua.title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 text-[#0D7377]"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => { if (confirmDelete) onDelete(dua.id); else setConfirmDelete(true); }}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-full transition-all',
              confirmDelete ? 'bg-red-500 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-500',
            ].join(' ')}
            title={confirmDelete ? t('personal_duas.delete_confirm') : 'Delete'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {dua.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dua.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C9A84C]/10 text-[#A8873A] dark:text-[#C9A84C] text-xs font-semibold border border-[#C9A84C]/20"
              >
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}

        {dua.arabic && (
          <div className="rounded-2xl bg-[#0D7377]/5 dark:bg-[#0D7377]/10 border border-[#0D7377]/15 p-5">
            <p
              className="font-arabic text-gray-900 dark:text-white leading-loose text-right"
              dir="rtl"
              style={{ fontSize: '1.5rem', lineHeight: '2.4' }}
            >
              {dua.arabic}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4">
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {dua.body}
          </p>
        </div>

        <p className="text-xs text-gray-400 text-right">
          Saved {new Date(dua.createdAt).toLocaleDateString()}
        </p>

        {confirmDelete && (
          <p className="text-xs text-center text-red-500 font-semibold">
            {t('personal_duas.delete_confirm')} — {t('common.tap_again', { defaultValue: 'Tap delete again to confirm.' })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PersonalDuasTab
   ───────────────────────────────────────────────────────────────────────── */
function PersonalDuasTab() {
  const { t } = useTranslation();
  const [duas,           setDuas]          = useState([]);
  const [search,         setSearch]        = useState('');
  const [showForm,       setShowForm]      = useState(false);
  const [editDua,        setEditDua]       = useState(null);
  const [detailDua,      setDetailDua]     = useState(null);
  const [editingDetail,  setEditingDetail] = useState(false);
  const [activeTag,      setActiveTag]     = useState(null);
  const [swiperOpen,     setSwiperOpen]    = useState(false);
  const [swiperStartIdx, setSwiperStartIdx] = useState(0);
  const [copiedTag,      setCopiedTag]     = useState(null); // which tag link was just copied

  function copyShareLink(tag) {
    const url = `${window.location.origin}/share/${encodeURIComponent(tag)}`;
    navigator.clipboard?.writeText(url).catch(() => {
      // Fallback: create temp input
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  }

  async function reload() {
    const all = await getAllPersonalDuas();
    setDuas(all);
  }
  useEffect(() => { reload(); }, []);

  async function handleSave({ title, body, arabic, tags }) {
    if (editDua) {
      await updatePersonalDua(editDua.id, { title, body, arabic, tags });
    } else {
      await addPersonalDua({ title, body, arabic, tags });
    }
    setShowForm(false);
    setEditDua(null);
    setEditingDetail(false);
    if (detailDua) setDetailDua(null);
    await reload();
  }

  async function handleDelete(id) {
    await deletePersonalDua(id);
    setDetailDua(null);
    await reload();
  }

  const filtered = duas.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.body.toLowerCase().includes(q)  ||
      (d.tags ?? []).some(tag => tag.toLowerCase().includes(q))
    );
  });

  const allTags = [...new Set(duas.flatMap(d => d.tags ?? []))].slice(0, 10);

  const tagFiltered = activeTag
    ? filtered.filter(d => (d.tags ?? []).includes(activeTag))
    : filtered;

  function openSwiper(startIdx = 0) {
    setSwiperStartIdx(startIdx);
    setSwiperOpen(true);
  }

  // Portals
  const swiperPortal = swiperOpen && tagFiltered.length > 0
    ? createPortal(
        <DuaSwiper
          duas={tagFiltered}
          startIdx={swiperStartIdx}
          type="personal"
          onClose={() => setSwiperOpen(false)}
        />,
        document.body
      )
    : null;

  const formPortal = (showForm || editingDetail)
    ? createPortal(
        <PersonalDuaForm
          existing={editDua}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditDua(null); setEditingDetail(false); }}
        />,
        document.body
      )
    : null;

  const detailPortal = (!showForm && !editingDetail && detailDua)
    ? createPortal(
        <PersonalDuaDetail
          dua={detailDua}
          onClose={() => setDetailDua(null)}
          onEdit={() => { setEditDua(detailDua); setEditingDetail(true); }}
          onDelete={handleDelete}
        />,
        document.body
      )
    : null;

  return (
    <div>
      {swiperPortal}
      {formPortal}
      {detailPortal}

      {/* Search + Add + Swipe row */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={t('prayers.search_duas')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
          />
        </div>
        {/* Swipe mode button */}
        {duas.length > 0 && (
          <button
            onClick={() => openSwiper(0)}
            title={activeTag ? `Swipe "${activeTag}" duas` : 'Swipe through all duas'}
            className={[
              'w-11 h-11 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#0D7377]',
            ].join(' ')}
            aria-label="Swipe mode"
          >
            <Layers size={18} />
          </button>
        )}
        <button
          onClick={() => { setEditDua(null); setShowForm(true); }}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0D7377] text-white flex-shrink-0 active:scale-95 transition-all"
          aria-label={t('personal_duas.add')}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Tag filter chips + share buttons */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setActiveTag(null)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
              !activeTag ? 'bg-[#C9A84C] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
            ].join(' ')}
          >
            {t('common.all')}
          </button>
          {allTags.map(tag => (
            <div key={tag} className="flex-shrink-0 flex items-center gap-0.5">
              {/* Filter button */}
              <button
                onClick={() => setActiveTag(t => t === tag ? null : tag)}
                className={[
                  'flex items-center gap-1 pl-3 pr-2.5 py-1.5 rounded-l-full text-xs font-bold transition-all',
                  activeTag === tag ? 'bg-[#C9A84C] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                ].join(' ')}
              >
                <Tag size={10} /> {tag}
              </button>
              {/* Share link button */}
              <button
                onClick={() => copyShareLink(tag)}
                title={`Copy share link for "${tag}"`}
                className={[
                  'flex items-center justify-center w-7 h-7 rounded-r-full text-xs transition-all active:scale-90',
                  copiedTag === tag
                    ? 'bg-[#2D6A4F] text-white'
                    : activeTag === tag
                    ? 'bg-[#b8943d] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                ].join(' ')}
              >
                {copiedTag === tag ? <Check size={10} /> : <Share2 size={10} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Swipe banner when a tag is active */}
      {activeTag && tagFiltered.length > 0 && (
        <button
          onClick={() => openSwiper(0)}
          className="w-full flex items-center justify-between px-4 py-3 mb-3 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#A8873A] dark:text-[#C9A84C] active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Layers size={16} />
            Swipe through {tagFiltered.length} "{activeTag}" duas
          </div>
          <ChevronRight size={16} />
        </button>
      )}

      {/* Empty state */}
      {duas.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">🤲</p>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            {t('personal_duas.empty_title')}
          </p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mb-5">
            {t('personal_duas.empty_desc')}
          </p>
          <button
            onClick={() => { setEditDua(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm"
          >
            <Plus size={16} /> {t('personal_duas.add')}
          </button>
        </div>
      ) : tagFiltered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">{t('personal_duas.no_results')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tagFiltered.map((dua, duaIdx) => (
            <button
              key={dua.id}
              onClick={() => setDetailDua(dua)}
              className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 active:scale-[0.98] transition-all hover:border-[#C9A84C]/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug mb-1 truncate">
                    {dua.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {dua.body}
                  </p>
                </div>
                {dua.arabic && (
                  <p
                    className="font-arabic text-[#0D7377] text-base leading-relaxed flex-shrink-0 max-w-[90px] text-right line-clamp-2"
                    dir="rtl"
                  >
                    {dua.arabic}
                  </p>
                )}
              </div>
              {dua.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {dua.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#A8873A] dark:text-[#C9A84C] text-[10px] font-semibold"
                    >
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Prayers page
   ───────────────────────────────────────────────────────────────────────── */
export default function Prayers() {
  const { t } = useTranslation();
  const { settings, detectLocation } = useSettings();
  const [activeTab, setActiveTab]               = useState('duas');
  const [locating,  setLocating]                = useState(false);
  const [search,    setSearch]                  = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds,    setBookmarkedIds]     = useState(new Set());
  const [showBookmarks,    setShowBookmarks]     = useState(false);
  // Swiper state (Hajj duas)
  const [swiperOpen,    setSwiperOpen]    = useState(false);
  const [swiperStartIdx, setSwiperStartIdx] = useState(0);

  const { prayerTimes, currentNext, countdown } = usePrayerTimes(
    settings.latitude, settings.longitude
  );
  const { play, isPlaying, currentSrc } = useAudio();

  useEffect(() => {
    getBookmarkedDuaIds().then(setBookmarkedIds);
  }, []);

  async function handleDetectLocation() {
    setLocating(true);
    try { await detectLocation(); } catch { /* ignore */ } finally { setLocating(false); }
  }

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
    const matchesCat = selectedCategory === 'all' || dua.category === selectedCategory;
    const matchesBm  = !showBookmarks || bookmarkedIds.has(dua.id);
    return matchesSearch && matchesCat && matchesBm;
  });

  const TABS = [
    { id: 'duas',    label: t('prayers.hajj_duas')     },
    { id: 'prayers', label: t('prayers.daily_prayers') },
    { id: 'mine',    label: t('personal_duas.tab')     },
  ];

  return (
    <>
      {/* ── Hajj Dua swipe viewer (portal) ── */}
      {swiperOpen && filteredDuas.length > 0 && createPortal(
        <DuaSwiper
          duas={filteredDuas}
          startIdx={swiperStartIdx}
          type="hajj"
          onClose={() => setSwiperOpen(false)}
          bookmarkedIds={bookmarkedIds}
          onBookmark={handleBookmark}
          onPlay={(src, arabic) => play(src, { arabic: arabic, lang: 'ar-SA' })}
          isPlaying={isPlaying}
          currentSrc={currentSrc}
        />,
        document.body
      )}

      {/* ── List / grid view ── */}
      <div className="px-4 pt-4 pb-6 fade-in max-w-lg mx-auto">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
          {t('prayers.title')}
        </h1>

        {/* 3-tab bar */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 py-2.5 rounded-lg text-xs font-bold transition-all leading-snug',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-[#0D7377] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Hajj Du'as tab ── */}
        {activeTab === 'duas' && (
          <>
            {/* Search + bookmark toggle */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder={t('prayers.search_duas')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowBookmarks(b => !b)}
                aria-label={t('prayers.show_bookmarks')}
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
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-hide">
              {[{ id: 'all', icon: '📿', label: t('prayers.all_categories') }, ...duasData.categories].map(cat => (
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

            {filteredDuas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm font-medium">
                  {showBookmarks ? t('prayers.no_bookmarks') : t('prayers.no_duas')}
                </p>
              </div>
            ) : (
              <>
                {/* Swipe mode banner */}
                <button
                  onClick={() => { setSwiperStartIdx(0); setSwiperOpen(true); }}
                  className="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-2xl bg-[#0D7377]/8 dark:bg-[#0D7377]/15 border border-[#0D7377]/20 text-[#0D7377] active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Layers size={16} />
                    Swipe through {filteredDuas.length} {selectedCategory !== 'all' ? `"${selectedCategory}"` : ''} duas
                  </div>
                  <ChevronRight size={16} />
                </button>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredDuas.map((dua, idx) => (
                    <button
                      key={dua.id}
                      onClick={() => { setSwiperStartIdx(idx); setSwiperOpen(true); }}
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
                          : <span className="text-[10px] text-teal-500 font-semibold">🎙 Read aloud</span>}
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
              <div>
                <p className="text-xs text-gray-500">{t('prayers.uma_qura')}</p>
                {settings.locationName && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={9} className="text-[#0D7377]" />
                    {settings.locationName}
                  </p>
                )}
              </div>
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0D7377] disabled:opacity-50 active:scale-95 transition-all"
              >
                <Navigation size={11} className={locating ? 'animate-pulse' : ''} />
                {locating ? t('home.detecting') : t('home.use_my_location')}
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

        {/* ── My Du'as tab ── */}
        {activeTab === 'mine' && <PersonalDuasTab />}
      </div>
    </>
  );
}
