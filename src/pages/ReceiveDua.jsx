/**
 * ReceiveDua.jsx — The pilgrim's import page
 *
 * Route: /receive?d=<base64-encoded-payload>
 *
 * The pilgrim opens this URL (sent by a family member / friend via WhatsApp).
 * The dua data is decoded from the URL param and saved directly to the
 * pilgrim's own IndexedDB under the tag the link was generated for.
 *
 * Deduplication: each submission has a stable `sourceId` (same person +
 * same tag = same sourceId). Re-importing updates the existing dua rather
 * than creating a duplicate.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Tag, ChevronRight, AlertCircle } from 'lucide-react';
import { addPersonalDua, updatePersonalDua, getPersonalDuaBySourceId } from '../utils/db';

/* ── Decode helper ─────────────────────────────────────────────── */
function decodePayload(encoded) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

/* ── Component ─────────────────────────────────────────────────── */
export default function ReceiveDua() {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get('d');
  const payload = encoded ? decodePayload(encoded) : null;

  const [status, setStatus] = useState('idle'); // idle | saving | saved | updated | error
  const [isUpdate, setIsUpdate] = useState(false);

  /* Auto-check if this is a duplicate (same sourceId already imported) */
  useEffect(() => {
    if (!payload?.sourceId) return;
    getPersonalDuaBySourceId(payload.sourceId).then(existing => {
      if (existing) setIsUpdate(true);
    });
  }, [payload?.sourceId]);

  async function handleAdd() {
    if (!payload) return;
    setStatus('saving');
    try {
      const existing = payload.sourceId
        ? await getPersonalDuaBySourceId(payload.sourceId)
        : null;

      const tags = payload.tag ? [payload.tag] : [];
      // Title is always the sender's name (backward compat: fall back to payload.title)
      const title = payload.senderName?.trim() || payload.title?.trim() || 'Prayer Request';

      if (existing) {
        await updatePersonalDua(existing.id, {
          title,
          body:   payload.body,
          arabic: payload.arabic ?? '',
          tags,
        });
        setStatus('updated');
      } else {
        await addPersonalDua({
          title,
          body:     payload.body,
          arabic:   payload.arabic ?? '',
          tags,
          sourceId: payload.sourceId ?? null,
        });
        setStatus('saved');
      }
    } catch {
      setStatus('error');
    }
  }

  /* ── Bad / missing payload ── */
  if (!payload) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={40} className="text-amber-500 mb-4" />
        <h1 className="text-lg font-black text-gray-900 dark:text-white mb-2">Invalid Link</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          This link appears to be broken or has expired. Ask the sender to share a new link.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm no-underline active:scale-[0.98] transition-all"
        >
          Open Daleel App
        </Link>
      </div>
    );
  }

  /* ── Saved / Updated confirmation ── */
  if (status === 'saved' || status === 'updated') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/15 flex items-center justify-center mb-5">
          <Check size={32} className="text-[#2D6A4F]" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {status === 'updated' ? 'Du\'a Updated' : 'Du\'a Added'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          Prayers from <strong className="text-[#0D7377]">{payload.senderName || payload.title || 'your loved one'}</strong>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Saved to <span className="font-semibold text-[#C9A84C]">{payload.tag}</span> in My Du'as.
        </p>
        <p className="text-xs text-gray-400 mb-8">May Allah accept this du'a. 🤲</p>

        <Link
          to="/prayers"
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0D7377] text-white font-semibold text-sm no-underline active:scale-[0.98] transition-all shadow-sm"
        >
          View in My Du'as <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  /* ── Preview + add button ── */
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-5 pb-4 border-b border-[var(--color-border-soft)]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377]">
            {isUpdate ? 'Updated du\'a received' : 'Du\'a received'}
          </p>
          <h1 className="text-base font-black text-gray-900 dark:text-white">
            Add to My Du'as
          </h1>
        </div>
        <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        {/* Update notice */}
        {isUpdate && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ✏️ This is an updated version of a du'a already in your list. Tapping "Add" will update the existing entry.
            </p>
          </div>
        )}

        {/* Tag badge */}
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-[#C9A84C]" />
          <span className="text-xs font-bold text-[#A8873A] dark:text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-1 rounded-full border border-[#C9A84C]/20">
            {payload.tag}
          </span>
        </div>

        {/* Dua preview card — title = sender name, body = bullet list */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-card p-5 space-y-4">
          {/* Sender name as title with avatar */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-black text-[#C9A84C]">
                {(payload.senderName || payload.title || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Prayers from</p>
              <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                {payload.senderName || payload.title || 'Prayer Request'}
              </h2>
            </div>
          </div>

          {/* Bullet-pointed prayers */}
          <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4 space-y-2">
            {payload.body.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {line}
              </p>
            ))}
          </div>

          {payload.arabic && (
            <div className="rounded-xl bg-[#0D7377]/5 dark:bg-[#0D7377]/10 border border-[#0D7377]/15 p-4">
              <p
                className="font-arabic text-gray-900 dark:text-white leading-loose text-right"
                dir="rtl"
                style={{ fontSize: '1.4rem', lineHeight: '2.4' }}
              >
                {payload.arabic}
              </p>
            </div>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={status === 'saving'}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {status === 'saving'
            ? 'Saving…'
            : isUpdate
            ? <><Check size={17} /> Update in My Du'as</>
            : <><Check size={17} /> Add to My Du'as</>}
        </button>

        {status === 'error' && (
          <p className="text-sm text-red-500 text-center">
            Something went wrong. Please try again.
          </p>
        )}

        <Link
          to="/"
          className="flex items-center justify-center text-sm text-gray-400 py-2 no-underline"
        >
          Open Daleel App without adding
        </Link>
      </div>

      <p className="text-xs text-center text-gray-400 px-4 pb-6 leading-relaxed">
        🔒 Saved only to this device. Nothing is sent to any server.
      </p>
    </div>
  );
}
