/**
 * ShareDua.jsx — Public standalone dua submission form
 *
 * Route: /share/:tagSlug
 *
 * Anyone with the link can submit a personal du'a that gets saved to
 * their own device's IndexedDB under the given tag. If they return to
 * the same URL on the same device, their previous submission is loaded
 * for editing (identified via localStorage).
 *
 * No sign-in required. No server. Fully offline-capable after first load.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Send, Pencil, Check } from 'lucide-react';
import {
  addPersonalDua,
  updatePersonalDua,
  db,
} from '../utils/db';

/* localStorage key for remembering a previous submission per tag */
function storageKey(tagSlug) {
  return `daleel_share_${tagSlug}`;
}

/* Read the saved dua id for this tag from localStorage */
function getSavedDuaId(tagSlug) {
  try {
    return localStorage.getItem(storageKey(tagSlug));
  } catch {
    return null;
  }
}

/* Save the dua id for this tag to localStorage */
function saveDuaId(tagSlug, id) {
  try {
    localStorage.setItem(storageKey(tagSlug), String(id));
  } catch { /* ignore */ }
}

export default function ShareDua() {
  const { tagSlug } = useParams();
  const tag = decodeURIComponent(tagSlug ?? '');

  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [arabic,   setArabic]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [isEdit,   setIsEdit]   = useState(false);
  const [existingId, setExistingId] = useState(null);
  const [error,    setError]    = useState('');

  /* On mount: check if this device already submitted a dua for this tag */
  useEffect(() => {
    async function checkExisting() {
      const savedId = getSavedDuaId(tag);
      if (savedId) {
        try {
          const existing = await db.personal_duas.get(Number(savedId));
          if (existing) {
            setTitle(existing.title);
            setBody(existing.body);
            setArabic(existing.arabic ?? '');
            setExistingId(existing.id);
            setIsEdit(true);
          }
        } catch { /* id not found — treat as new */ }
      }
      setLoading(false);
    }
    if (tag) checkExisting();
    else setLoading(false);
  }, [tag]);

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit && existingId != null) {
        await updatePersonalDua(existingId, {
          title: title.trim(),
          body:  body.trim(),
          arabic: arabic.trim(),
        });
      } else {
        const id = await addPersonalDua({
          title:  title.trim(),
          body:   body.trim(),
          arabic: arabic.trim(),
          tags:   [tag],
        });
        saveDuaId(tag, id);
        setExistingId(id);
        setIsEdit(true);
      }
      setDone(true);
    } catch (err) {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  /* ── Success screen ─────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/15 flex items-center justify-center mb-5">
          <Check size={32} className="text-[#2D6A4F]" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {isEdit && existingId ? 'Du\'a Updated' : 'Du\'a Saved'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
          Your du'a has been saved under the <strong className="text-[#0D7377]">{tag}</strong> tag.
        </p>
        <p className="text-xs text-gray-400 mb-8 leading-relaxed max-w-xs">
          It's stored on this device. Return to this link anytime to update it.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setDone(false)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-[#0D7377] text-[#0D7377] font-semibold text-sm active:scale-[0.98] transition-all"
          >
            <Pencil size={15} /> Edit My Du'a
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm active:scale-[0.98] transition-all no-underline"
          >
            Open Daleel App
          </Link>
        </div>

        {/* Spiritual closing */}
        <p className="text-xs text-gray-400 mt-8">
          🤲 May Allah accept your du'a and grant your wishes.
        </p>
      </div>
    );
  }

  /* ── Form screen ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4 border-b border-[var(--color-border-soft)]">
        <Link
          to="/"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 no-underline active:scale-95 transition-all"
          aria-label="Back to app"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377]">
            {isEdit ? 'Update your du\'a' : 'Submit a du\'a'}
          </p>
          <h1 className="text-base font-black text-gray-900 dark:text-white truncate">
            Tag: <span className="text-[#C9A84C]">{tag}</span>
          </h1>
        </div>
        {/* Daleel logo */}
        <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
      </div>

      {/* Context card */}
      <div className="mx-4 mt-4 rounded-2xl bg-[#0D7377]/6 dark:bg-[#0D7377]/12 border border-[#0D7377]/15 px-4 py-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {isEdit
            ? `You've already submitted a du'a here. Update it below.`
            : `Write your prayer request or du'a below. It will be saved to your device under the "${tag}" tag.`}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Prayer for my mother's health"
            maxLength={100}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all"
          />
        </div>

        {/* Du'a / prayer text */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Your Du'a or Prayer Request <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your prayer or request here… You can write in any language."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none transition-all"
          />
        </div>

        {/* Arabic text (optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Arabic Text <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={arabic}
            onChange={e => setArabic(e.target.value)}
            placeholder="اكتب الدعاء بالعربية (اختياري)"
            dir="rtl"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-arabic text-right text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none transition-all"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || saving}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? (
            'Saving…'
          ) : isEdit ? (
            <><Pencil size={17} /> Update My Du'a</>
          ) : (
            <><Send size={17} /> Submit Du'a</>
          )}
        </button>

        <p className="text-xs text-center text-gray-400 pb-4 leading-relaxed">
          🔒 Your du'a is saved only on this device. Nothing is sent to any server.
        </p>
      </form>
    </div>
  );
}
