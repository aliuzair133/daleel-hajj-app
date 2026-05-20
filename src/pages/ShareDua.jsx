/**
 * ShareDua.jsx — Dua submission form for family / friends of the pilgrim
 *
 * Route: /share/:tagSlug
 *
 * Rules:
 * - The sender's NAME becomes the title of the dua in the pilgrim's app
 * - Each submission from the same device adds a bullet point to that person's
 *   combined dua entry (one entry per person, not one per prayer)
 * - After submitting, sender gets a short link (/receive?id=...) to forward
 * - Pilgrim opens /receive?id=... → dua imports into their app
 * - Payload is stored server-side (Upstash Redis, 30-day TTL) so links are
 *   always short and work in WhatsApp / SMS regardless of prayer length
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Send, Copy, Check,
  MessageCircle, Plus, X, Loader2, AlertCircle,
} from 'lucide-react';

/* ── localStorage helpers (device-local draft state only) ──────── */

const SOURCEID_KEY = tag => `daleel_sourceid_${tag}`;
const DRAFT_KEY    = tag => `daleel_draft_${tag}`;

function getOrCreateSourceId(tag) {
  try {
    const saved = localStorage.getItem(SOURCEID_KEY(tag));
    if (saved) return saved;
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SOURCEID_KEY(tag), id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function getDraft(tag) {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY(tag)) ?? 'null'); }
  catch { return null; }
}

function saveDraft(tag, data) {
  try { localStorage.setItem(DRAFT_KEY(tag), JSON.stringify(data)); }
  catch {}
}

/** Max total characters across ALL combined prayers */
const MAX_TOTAL_CHARS = 20000;

/** Build combined body: each prayer on its own bullet line */
function buildBody(prayers) {
  return prayers.filter(Boolean).map(p => `• ${p.trim()}`).join('\n');
}

/**
 * Upload the dua payload to /api/store-dua.
 * Returns { id } on success, or throws on failure.
 */
async function uploadPayload(payload) {
  const res = await fetch('/api/store-dua', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Server error ${res.status}`);
  }
  const data = await res.json();
  if (!data.id) throw new Error('No ID returned from server');
  return data.id;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function ShareDua() {
  const { tagSlug } = useParams();
  const tag = decodeURIComponent(tagSlug ?? '');

  // Persisted sender state
  const [senderName,   setSenderName]   = useState('');
  const [prayers,      setPrayers]      = useState([]);
  const [newPrayer,    setNewPrayer]    = useState('');
  const [nameLocked,   setNameLocked]   = useState(false);

  // UI state
  const [receiveUrl,    setReceiveUrl]    = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [uploadError,   setUploadError]   = useState('');
  const [copied,        setCopied]        = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [editingName,   setEditingName]   = useState(false);

  /* Load draft on mount */
  useEffect(() => {
    const draft = getDraft(tag);
    if (draft) {
      setSenderName(draft.senderName ?? '');
      setPrayers(draft.prayers ?? []);
      setNameLocked(!!(draft.senderName));
    }
  }, [tag]);

  const existingBodyLength  = buildBody(prayers).length;
  const combinedLength      = existingBodyLength + (newPrayer.trim() ? newPrayer.length + 3 : 0);
  const overLimit           = combinedLength > MAX_TOTAL_CHARS;
  const nearLimit           = combinedLength > MAX_TOTAL_CHARS * 0.85;

  const canSubmit = newPrayer.trim().length > 0 && senderName.trim().length > 0 && !overLimit;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const updatedPrayers = [...prayers, newPrayer.trim()];
    const sourceId       = getOrCreateSourceId(tag);
    const body           = buildBody(updatedPrayers);

    const payload = { sourceId, tag, senderName: senderName.trim(), body };

    // Persist draft so next visit shows existing prayers
    saveDraft(tag, { senderName: senderName.trim(), prayers: updatedPrayers });
    setPrayers(updatedPrayers);
    setNewPrayer('');
    setNameLocked(true);
    setUploadError('');
    setUploading(true);

    try {
      const id  = await uploadPayload(payload);
      const url = `${window.location.origin}/receive?id=${id}`;
      setReceiveUrl(url);
      setSubmitted(true);
    } catch (err) {
      setUploadError(err.message || 'Could not generate link. Please try again.');
      // Roll back draft so user can retry
      saveDraft(tag, { senderName: senderName.trim(), prayers });
      setPrayers(prayers);
      setPrayers(updatedPrayers); // keep the new prayer in list for retry
    } finally {
      setUploading(false);
    }
  }

  function removePrayer(idx) {
    const updated = prayers.filter((_, i) => i !== idx);
    setPrayers(updated);
    saveDraft(tag, { senderName, prayers: updated });
  }

  function handleAddAnother() {
    setSubmitted(false);
    setUploadError('');
  }

  function copyLink() {
    const fallback = () => {
      const el = Object.assign(document.createElement('input'), { value: receiveUrl });
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    };
    navigator.clipboard?.writeText(receiveUrl).catch(fallback) ?? fallback();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const whatsappText = senderName
    ? `Assalamu alaykum! Here are my du'as for you to make at Hajj 🤲 — from ${senderName}\n\n${receiveUrl}`
    : `Here is a du'a for you to include in your Hajj prayers 🤲\n\n${receiveUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  /* ── After submit: send-to-pilgrim screen ─────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4 border-b border-[var(--color-border-soft)]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2D6A4F]">
              Du'as ready ✓
            </p>
            <h1 className="text-base font-black text-gray-900 dark:text-white">
              Send to the pilgrim
            </h1>
          </div>
          <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
        </div>

        <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
          {/* Instruction */}
          <div className="rounded-2xl bg-[#0D7377]/8 dark:bg-[#0D7377]/15 border border-[#0D7377]/20 p-4">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
              Your du'as are ready 🤲
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Send the link below to the Hajj pilgrim. When they open it, all your
              prayers will appear under their <strong className="text-[#0D7377]">"{tag}"</strong> tag,
              listed under your name.
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {senderName && <span className="text-[#C9A84C]">{senderName} · </span>}
              {prayers.length} prayer{prayers.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-1.5">
              {prayers.map((p, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Short link preview */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Share link
            </p>
            <p className="text-sm font-semibold text-[#0D7377] break-all leading-relaxed">
              {receiveUrl}
            </p>
          </div>

          {/* Add another prayer */}
          <button
            onClick={handleAddAnother}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-[#0D7377]/40 text-[#0D7377] font-semibold text-sm active:scale-[0.98] transition-all"
          >
            <Plus size={16} /> Add another prayer
          </button>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-sm no-underline bg-[#25D366] text-white"
          >
            <MessageCircle size={20} fill="white" /> Send via WhatsApp
          </a>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className={[
              'flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border font-semibold text-sm active:scale-[0.98] transition-all',
              copied
                ? 'bg-[#2D6A4F]/10 border-[#2D6A4F]/30 text-[#2D6A4F] dark:text-green-400'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
            ].join(' ')}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy link</>}
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 px-4 pb-6 leading-relaxed">
          🔒 Your du'as are stored securely and deleted automatically after 30 days.
        </p>
      </div>
    );
  }

  /* ── Form screen ─────────────────────────────────────────────── */
  const isFirstSubmission = prayers.length === 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4 border-b border-[var(--color-border-soft)]">
        <Link
          to="/"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 no-underline active:scale-95 transition-all"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377]">
            {isFirstSubmission ? 'Write a du\'a' : 'Add another prayer'}
          </p>
          <h1 className="text-base font-black text-gray-900 dark:text-white truncate">
            Tag: <span className="text-[#C9A84C]">{tag}</span>
          </h1>
        </div>
        <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
      </div>

      {/* Context banner */}
      <div className="mx-4 mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3">
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          A pilgrim going to Hajj will make your du'a at the holy sites. Write your prayer requests below — they'll be saved under your name. 🕋
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">

        {/* Sender name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Your Name <span className="text-red-400">*</span>
          </label>
          {nameLocked && !editingName ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0D7377]/8 dark:bg-[#0D7377]/15 border border-[#0D7377]/20">
              <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                {senderName}
              </span>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-xs text-[#0D7377] font-semibold"
              >
                Edit
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              onBlur={() => { if (senderName.trim() && nameLocked) setEditingName(false); }}
              placeholder="e.g. Amina, or just Mum"
              maxLength={60}
              autoFocus={editingName}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            This becomes the title in the pilgrim's app — so they know who each du'a is from.
          </p>
        </div>

        {/* Previously submitted prayers */}
        {prayers.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Your prayers so far
            </p>
            <div className="space-y-2">
              {prayers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-900/15 border border-teal-100 dark:border-teal-800"
                >
                  <span className="text-[#0D7377] font-bold mt-0.5 flex-shrink-0">•</span>
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{p}</p>
                  <button
                    type="button"
                    onClick={() => removePrayer(i)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Remove this prayer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New prayer input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {prayers.length === 0 ? 'Your Prayer Request' : 'Add Another Prayer'}
              <span className="text-red-400"> *</span>
            </label>
            {(combinedLength > MAX_TOTAL_CHARS * 0.5 || overLimit) && (
              <span className={[
                'text-xs font-semibold tabular-nums',
                overLimit ? 'text-red-500' : nearLimit ? 'text-amber-500' : 'text-gray-400',
              ].join(' ')}>
                {combinedLength.toLocaleString()}/{MAX_TOTAL_CHARS.toLocaleString()} total
              </span>
            )}
          </div>
          <textarea
            rows={4}
            value={newPrayer}
            onChange={e => setNewPrayer(e.target.value)}
            placeholder={
              prayers.length === 0
                ? 'Write what you\'d like the pilgrim to pray for on your behalf…'
                : 'Add another prayer request…'
            }
            className={[
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition-all',
              overLimit
                ? 'border-red-300 dark:border-red-700 focus:ring-red-400/30'
                : 'border-gray-200 dark:border-gray-700 focus:ring-[#0D7377]',
            ].join(' ')}
          />
          {overLimit && (
            <p className="text-xs text-red-500 mt-1.5 leading-relaxed">
              Combined prayers exceed {MAX_TOTAL_CHARS.toLocaleString()} characters. Please shorten or remove an older one (tap ×).
            </p>
          )}
          {nearLimit && !overLimit && (
            <p className="text-xs text-amber-500 mt-1.5 leading-relaxed">
              Getting close to the limit.
            </p>
          )}
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 px-4 py-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
              {uploadError}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || uploading}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {uploading
            ? <><Loader2 size={17} className="animate-spin" /> Saving du'as…</>
            : prayers.length === 0
            ? <><Send size={17} /> Submit &amp; Get Link for Pilgrim</>
            : <><Plus size={17} /> Add Prayer &amp; Update Link</>}
        </button>

        <p className="text-xs text-center text-gray-400 pb-4 leading-relaxed">
          After submitting, you'll get a short link to send to the pilgrim via WhatsApp or SMS.
        </p>
      </form>
    </div>
  );
}
