/**
 * ShareDua.jsx — Dua submission form for the SENDER (family / friend)
 *
 * Route: /share/:tagSlug
 *
 * Flow:
 *  1. Pilgrim generates link for a tag → shares via WhatsApp/SMS
 *  2. Family member opens link → fills in their dua/prayer request
 *  3. On submit → they receive a "pilgrim receive link" to forward
 *  4. Pilgrim opens that link (ReceiveDua page) → dua saved to THEIR app
 *
 * Returning device detection: localStorage keeps the sourceId so that
 * if the same person opens the link again they can update their dua
 * and resend a fresh receive link.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Send, Pencil, Copy, Check, MessageCircle } from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Stable ID for a submitter+tag pair, stored in localStorage */
function getOrCreateSourceId(tagSlug) {
  const key = `daleel_sourceid_${tagSlug}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/** Retrieve previously submitted dua data for this tag (for edit mode) */
function getSavedDraft(tagSlug) {
  try {
    const raw = localStorage.getItem(`daleel_draft_${tagSlug}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Persist draft so returning submitter can edit */
function saveDraft(tagSlug, data) {
  try {
    localStorage.setItem(`daleel_draft_${tagSlug}`, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * Encode dua payload as a safe base64 URL param.
 * Uses encodeURIComponent → unescape trick to handle Arabic/Unicode in btoa.
 */
function encodePayload(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

/** Build the pilgrim's receive URL */
function buildReceiveUrl(payload) {
  return `${window.location.origin}/receive?d=${encodePayload(payload)}`;
}

/* ── Component ───────────────────────────────────────────────────── */

export default function ShareDua() {
  const { tagSlug } = useParams();
  const tag = decodeURIComponent(tagSlug ?? '');

  const [senderName, setSenderName] = useState('');
  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [arabic,     setArabic]     = useState('');
  const [isEdit,     setIsEdit]     = useState(false);
  const [receiveUrl, setReceiveUrl] = useState('');
  const [copied,     setCopied]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  /* Pre-fill if this device has submitted before */
  useEffect(() => {
    const draft = getSavedDraft(tag);
    if (draft) {
      setSenderName(draft.senderName ?? '');
      setTitle(draft.title ?? '');
      setBody(draft.body ?? '');
      setArabic(draft.arabic ?? '');
      setIsEdit(true);
    }
  }, [tag]);

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    const sourceId   = getOrCreateSourceId(tag);
    const payload    = {
      sourceId,
      tag,
      senderName: senderName.trim(),
      title:      title.trim(),
      body:       body.trim(),
      arabic:     arabic.trim(),
      sentAt:     new Date().toISOString(),
    };

    // Persist draft for next visit
    saveDraft(tag, payload);

    // Build the receive URL the pilgrim will open
    setReceiveUrl(buildReceiveUrl(payload));
    setSubmitted(true);
    setIsEdit(true);
  }

  function copyLink() {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(receiveUrl);
      } catch {
        const el = Object.assign(document.createElement('input'), { value: receiveUrl });
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };
    copy();
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Here is my du'a for you to include in your Hajj prayers 🤲\n\n${receiveUrl}`
  )}`;

  /* ── Success / send-to-pilgrim screen ────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4 border-b border-[var(--color-border-soft)]">
          <button
            onClick={() => setSubmitted(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2D6A4F]">Du'a written ✓</p>
            <h1 className="text-base font-black text-gray-900 dark:text-white">Now send it to the pilgrim</h1>
          </div>
          <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
        </div>

        <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
          {/* Instruction card */}
          <div className="rounded-2xl bg-[#0D7377]/8 dark:bg-[#0D7377]/15 border border-[#0D7377]/20 p-4">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
              Your du'a is ready 🤲
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Send the link below to the Hajj pilgrim. When they open it, your du'a will be added directly to their Daleel app under <strong className="text-[#0D7377]">"{tag}"</strong>.
            </p>
          </div>

          {/* Preview of what was submitted */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-card p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your submission</p>
            <p className="font-bold text-sm text-gray-900 dark:text-white">{title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{body}</p>
            {arabic && (
              <p className="font-arabic text-[#0D7377] text-base text-right leading-relaxed" dir="rtl">
                {arabic}
              </p>
            )}
            {senderName && (
              <p className="text-xs text-gray-400">— {senderName}</p>
            )}
          </div>

          {/* Send via WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold text-base active:scale-[0.98] transition-all shadow-sm no-underline"
          >
            <MessageCircle size={20} fill="white" />
            Send via WhatsApp
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
            {copied ? <><Check size={16} /> Link copied!</> : <><Copy size={16} /> Copy link</>}
          </button>

          {/* Edit and resend */}
          <button
            onClick={() => setSubmitted(false)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-gray-400 text-sm font-medium active:scale-[0.98] transition-all"
          >
            <Pencil size={14} /> Edit my du'a and resend
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 px-4 pb-6 leading-relaxed">
          🔒 No server involved. Your du'a travels through this link only.
        </p>
      </div>
    );
  }

  /* ── Form screen ─────────────────────────────────────────────── */
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
            {isEdit ? 'Update your du\'a' : 'Write your du\'a'}
          </p>
          <h1 className="text-base font-black text-gray-900 dark:text-white truncate">
            For tag: <span className="text-[#C9A84C]">{tag}</span>
          </h1>
        </div>
        <span className="text-xl font-arabic text-[#0D7377]">دليل</span>
      </div>

      {/* Context */}
      <div className="mx-4 mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3">
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          A pilgrim going to Hajj will make your du'a at the holy sites. Write your prayer request below — after submitting you'll get a link to send to them. 🕋
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        {/* Your name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Your Name <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder="e.g. Amina, or just Mum"
            maxLength={60}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all"
          />
          <p className="text-xs text-gray-400 mt-1">So the pilgrim knows whose du'a this is.</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Prayer for Baba's recovery"
            maxLength={100}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all"
          />
        </div>

        {/* Du'a body */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Your Prayer Request <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write what you'd like the pilgrim to pray for on your behalf… You can write in any language."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none transition-all"
          />
        </div>

        {/* Arabic */}
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

        <button
          type="submit"
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {isEdit
            ? <><Pencil size={17} /> Update &amp; Get New Link</>
            : <><Send size={17} /> Write Du'a &amp; Get Link</>}
        </button>

        <p className="text-xs text-center text-gray-400 pb-4 leading-relaxed">
          After submitting you'll get a link to send to the pilgrim via WhatsApp or SMS.
        </p>
      </form>
    </div>
  );
}
