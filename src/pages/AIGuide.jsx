/**
 * AIGuide.jsx — Dil Se Dua
 *
 * Single-prompt Islamic dua-writing agent powered by Claude.
 * User describes what they need → agent writes a personalised dua.
 */

import { useState } from 'react';
import { Sparkles, BookMarked, Check, Loader2, WifiOff, RotateCcw, Send } from 'lucide-react';
import { addPersonalDua } from '../utils/db';

/* ── Sample starter prompts ──────────────────────────────────────── */
const SAMPLE_PROMPTS = [
  { emoji: '🕋', label: 'Dua for Arafah' },
  { emoji: '🤲', label: 'Dua for my parents' },
  { emoji: '💚', label: 'Dua for healing & shifa' },
  { emoji: '🌿', label: 'Dua for rizq & barakah' },
  { emoji: '💍', label: 'Dua for my spouse' },
  { emoji: '🌙', label: 'Dua for forgiveness' },
];

export default function AIGuide() {
  const [prompt,     setPrompt]     = useState('');
  const [result,     setResult]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const isOffline = !navigator.onLine;

  /* ── Generate dua ─────────────────────────────────────────────── */
  async function handleGenerate(text) {
    const userPrompt = (text ?? prompt).trim();
    if (!userPrompt || loading) return;

    setResult('');
    setError('');
    setSaveStatus('idle');
    setLoading(true);

    try {
      const res = await fetch('/api/dua-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResult(data.response);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Save to My Du'as ─────────────────────────────────────────── */
  async function handleSave() {
    if (!result) return;
    setSaveStatus('saving');
    try {
      const title = prompt.trim().slice(0, 60) || "Personal Du'a";
      await addPersonalDua({
        title,
        body:   result,
        arabic: '',
        tags:   ['Dil Se Dua'],
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  /* ── Reset ────────────────────────────────────────────────────── */
  function handleReset() {
    setPrompt('');
    setResult('');
    setError('');
    setSaveStatus('idle');
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-[var(--color-border-soft)]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A84C]" />
            <h1 className="text-base font-black text-gray-900 dark:text-white">Dil Se Dua</h1>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Personalised duas, written with heart</p>
        </div>
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <RotateCcw size={13} /> New dua
          </button>
        )}
      </div>

      {/* ── Offline banner ─────────────────────────────────────── */}
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <WifiOff size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You're offline. Dil Se Dua needs an internet connection.
          </p>
        </div>
      )}

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-5">

        {/* ── Result card ────────────────────────────────────────── */}
        {result && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Gold top bar */}
            <div className="h-1 bg-gradient-to-r from-[#C9A84C] to-[#0D7377]" />
            <div className="p-5">
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {result}
              </p>
            </div>
            {/* Save button */}
            <div className="px-5 pb-5">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={[
                  'w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]',
                  saveStatus === 'saved'
                    ? 'bg-[#2D6A4F]/15 text-[#2D6A4F]'
                    : 'bg-[#C9A84C]/10 text-[#A8873A] dark:text-[#C9A84C] hover:bg-[#C9A84C]/20',
                ].join(' ')}
              >
                {saveStatus === 'saving' && <Loader2 size={15} className="animate-spin" />}
                {saveStatus === 'saved'  && <Check size={15} />}
                {saveStatus === 'idle'   && <BookMarked size={15} />}
                {saveStatus === 'saved' ? "Saved to My Du'as" : "Save to My Du'as"}
              </button>
              {saveStatus === 'error' && (
                <p className="text-xs text-red-500 text-center mt-2">Could not save. Please try again.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Loading state ───────────────────────────────────────── */}
        {loading && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0D7377]/10 flex items-center justify-center">
              <Sparkles size={18} className="text-[#0D7377] animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Writing your dua…</p>
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#C9A84C]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#C9A84C]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#C9A84C]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-center">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => setError('')} className="mt-1 text-xs text-red-400 underline">Dismiss</button>
          </div>
        )}

        {/* ── Input area (hidden after result) ───────────────────── */}
        {!result && (
          <>
            {/* Sample prompts */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                Quick start
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PROMPTS.map(({ emoji, label }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setPrompt(label);
                      handleGenerate(label);
                    }}
                    disabled={isOffline || loading}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-left hover:border-[#0D7377]/30 hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or describe</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Text input */}
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Mere waalid ke liye dua chahiye jo cancer mein hain, unka naam Tariq hai..."
                disabled={loading || isOffline}
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 px-4 py-3.5 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/30 transition-all disabled:opacity-50 shadow-sm"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || loading || isOffline}
                className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#095C5F] transition-all active:scale-[0.98] disabled:opacity-40 shadow-sm"
              >
                <Send size={16} />
                Write My Dua
              </button>
            </div>
          </>
        )}

        {/* ── Write another button (after result) ─────────────────── */}
        {result && !loading && (
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            Write another dua
          </button>
        )}

        <p className="text-[10px] text-gray-400 text-center pb-4">
          Duas are composed by AI. Always verify with a qualified scholar.
        </p>
      </div>
    </div>
  );
}
