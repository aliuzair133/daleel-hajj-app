/**
 * ReceiveDua.jsx — The pilgrim's import page
 *
 * Route: /receive
 *
 * Handles two URL formats:
 *
 *  NEW (server-stored):  /receive?id=abc1234
 *    → fetches the payload from /api/load-dua?id=abc1234
 *    → works for any payload size; link is always short
 *
 *  LEGACY (URL-encoded): /receive?d=<base64-payload>
 *    → decodes payload directly from the URL param
 *    → kept for backward compatibility with old links already in the wild
 *
 * Once the payload is loaded, the pilgrim can save it to IndexedDB
 * (My Du'as) with one tap.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Tag, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { addPersonalDua, updatePersonalDua, getPersonalDuaBySourceId } from '../utils/db';

/* ── Legacy base64 decoder — handles old ?d= links ─────────────── */
function decodeLegacyPayload(encoded) {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    return {
      sourceId:   raw.s   ?? raw.sourceId,
      tag:        raw.t   ?? raw.tag,
      senderName: raw.n   ?? raw.senderName,
      body:       raw.b   ?? raw.body,
      title:      raw.title,
      arabic:     raw.arabic,
    };
  } catch {
    return null;
  }
}

/* ── Component ─────────────────────────────────────────────────── */
export default function ReceiveDua() {
  const [searchParams] = useSearchParams();
  const serverId = searchParams.get('id');    // new server-based link
  const legacyD  = searchParams.get('d');     // old URL-encoded link

  const [payload,    setPayload]    = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | ready | error
  const [loadError,  setLoadError]  = useState('');

  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | updated | error
  const [isUpdate,   setIsUpdate]   = useState(false);

  /* ── Load payload on mount ──────────────────────────────────────── */
  useEffect(() => {
    async function loadPayload() {
      // ── New server-stored link ─────────────────────────────────
      if (serverId) {
        try {
          const res = await fetch(`/api/load-dua?id=${encodeURIComponent(serverId)}`);
          if (res.status === 404) {
            setLoadError('This link has expired or doesn\'t exist. Ask the sender to share a new one.');
            setLoadStatus('error');
            return;
          }
          if (!res.ok) {
            setLoadError('Could not load this du\'a. Please check your internet connection and try again.');
            setLoadStatus('error');
            return;
          }
          const data = await res.json();
          setPayload(data);
          setLoadStatus('ready');
        } catch {
          setLoadError('Could not load this du\'a. Please check your internet connection and try again.');
          setLoadStatus('error');
        }
        return;
      }

      // ── Legacy URL-encoded link ────────────────────────────────
      if (legacyD) {
        const decoded = decodeLegacyPayload(legacyD);
        if (!decoded) {
          setLoadError('This link appears to be broken. Ask the sender to share a new one.');
          setLoadStatus('error');
          return;
        }
        setPayload(decoded);
        setLoadStatus('ready');
        return;
      }

      // ── No recognised param ────────────────────────────────────
      setLoadError('No du\'a data found in this link.');
      setLoadStatus('error');
    }

    loadPayload();
  }, [serverId, legacyD]);

  /* ── Check for existing duplicate once payload is loaded ─────── */
  useEffect(() => {
    if (!payload?.sourceId) return;
    getPersonalDuaBySourceId(payload.sourceId).then(existing => {
      if (existing) setIsUpdate(true);
    });
  }, [payload?.sourceId]);

  /* ── Save to IndexedDB ──────────────────────────────────────────── */
  async function handleAdd() {
    if (!payload) return;
    setSaveStatus('saving');
    try {
      const existing = payload.sourceId
        ? await getPersonalDuaBySourceId(payload.sourceId)
        : null;

      const tags  = payload.tag ? [payload.tag] : [];
      const title = payload.senderName?.trim() || payload.title?.trim() || 'Prayer Request';

      if (existing) {
        await updatePersonalDua(existing.id, {
          title,
          body:   payload.body,
          arabic: payload.arabic ?? '',
          tags,
        });
        setSaveStatus('updated');
      } else {
        await addPersonalDua({
          title,
          body:     payload.body,
          arabic:   payload.arabic ?? '',
          tags,
          sourceId: payload.sourceId ?? null,
        });
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('error');
    }
  }

  /* ── Loading screen ─────────────────────────────────────────────── */
  if (loadStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center gap-4">
        <Loader2 size={36} className="text-[#0D7377] animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading du'a…</p>
      </div>
    );
  }

  /* ── Error screen ───────────────────────────────────────────────── */
  if (loadStatus === 'error') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={40} className="text-amber-500 mb-4" />
        <h1 className="text-lg font-black text-gray-900 dark:text-white mb-2">Link Unavailable</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-xs">
          {loadError}
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

  /* ── Saved / Updated confirmation ─────────────────────────────── */
  if (saveStatus === 'saved' || saveStatus === 'updated') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/15 flex items-center justify-center mb-5">
          <Check size={32} className="text-[#2D6A4F]" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {saveStatus === 'updated' ? 'Du\'a Updated' : 'Du\'a Added'}
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

  /* ── Preview + add button ───────────────────────────────────────── */
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

        {/* Dua preview card */}
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
          disabled={saveStatus === 'saving'}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {saveStatus === 'saving'
            ? <><Loader2 size={17} className="animate-spin" /> Saving…</>
            : isUpdate
            ? <><Check size={17} /> Update in My Du'as</>
            : <><Check size={17} /> Add to My Du'as</>}
        </button>

        {saveStatus === 'error' && (
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
