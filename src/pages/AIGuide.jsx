/**
 * AIGuide.jsx — Dil Se Dua
 *
 * A guided Islamic dua-writing agent powered by Claude.
 * The agent asks 2–3 warm questions to gather context, then writes
 * a deeply personalised dua in Roman Urdu.
 *
 * Features:
 *  - Sample prompt chips to get started quickly
 *  - Guided conversational flow
 *  - "Save to My Du'as" button on every agent response
 *  - Offline detection with friendly message
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookMarked, Check, Loader2, WifiOff, RotateCcw } from 'lucide-react';
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

/* ── Opening greeting from the agent ────────────────────────────── */
const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Assalamu alaykum 🤲\n\nMain hoon Dil Se Dua — aapka personal dua-writing companion. Main aapke liye ek khaas, dil se likhi hui dua tayyar karunga.\n\nKisi ek prompt ko tap karein ya apne alfaaz mein batayein — kiske liye, kis mauqe par dua chahiye?',
};

/* ── Helper: derive a short title from conversation ─────────────── */
function deriveDuaTitle(messages) {
  const firstUserMsg = messages.find(m => m.role === 'user')?.content ?? '';
  const trimmed = firstUserMsg.trim().slice(0, 60);
  return trimmed || 'Personal Du\'a';
}

/* ── Chat bubble component ───────────────────────────────────────── */
function ChatBubble({ message, onSave, saveState }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        {/* Agent avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-[#0D7377]/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-[#0D7377]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0D7377]">
              Dil Se Dua
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={[
            'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-[#0D7377] text-white rounded-br-md'
              : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm',
          ].join(' ')}
        >
          {message.content}
        </div>

        {/* Save button — shown on agent messages only (not the welcome message) */}
        {!isUser && onSave && (
          <button
            onClick={onSave}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className={[
              'mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all',
              saveState === 'saved'
                ? 'bg-[#2D6A4F]/15 text-[#2D6A4F]'
                : 'bg-[#C9A84C]/10 text-[#A8873A] dark:text-[#C9A84C] hover:bg-[#C9A84C]/20 active:scale-95',
            ].join(' ')}
          >
            {saveState === 'saving' && <Loader2 size={11} className="animate-spin" />}
            {saveState === 'saved'  && <Check size={11} />}
            {!saveState && <BookMarked size={11} />}
            {saveState === 'saved' ? "Saved to My Du'as" : "Save to My Du'as"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function AIGuide() {
  const [messages,   setMessages]   = useState([WELCOME_MESSAGE]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [saveStates, setSaveStates] = useState({}); // { msgIndex: 'saving'|'saved'|'error' }
  const [isOffline,  setIsOffline]  = useState(!navigator.onLine);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* ── Scroll to bottom on new messages ───────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Online/offline detection ────────────────────────────────────── */
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ── Send message ────────────────────────────────────────────────── */
  async function sendMessage(text) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    // Exclude the welcome message from API calls (it's UI-only)
    const apiMessages = newMessages.filter(m =>
      !(m.role === 'assistant' && m.content === WELCOME_MESSAGE.content)
    );

    try {
      const res = await fetch('/api/dua-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error (${res.status})`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  /* ── Save a specific agent message to My Du'as ───────────────────── */
  async function handleSave(msgIndex) {
    setSaveStates(prev => ({ ...prev, [msgIndex]: 'saving' }));
    try {
      const duaBody = messages[msgIndex].content;
      const title   = deriveDuaTitle(messages);
      await addPersonalDua({
        title,
        body:   duaBody,
        arabic: '',
        tags:   ['Dil Se Dua'],
      });
      setSaveStates(prev => ({ ...prev, [msgIndex]: 'saved' }));
    } catch {
      setSaveStates(prev => ({ ...prev, [msgIndex]: 'error' }));
    }
  }

  /* ── Reset conversation ──────────────────────────────────────────── */
  function resetChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError('');
    setSaveStates({});
  }

  const showSamplePrompts = messages.length === 1; // only the welcome message

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-bg)]">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-[var(--color-border-soft)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A84C]" />
            <h1 className="text-base font-black text-gray-900 dark:text-white">Dil Se Dua</h1>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Personalised duas, written with heart</p>
        </div>
        <button
          onClick={resetChat}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-label="Start new dua"
          title="Start over"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* ── Offline banner ──────────────────────────────────────────── */}
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex-shrink-0">
          <WifiOff size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You're offline. Dil Se Dua needs an internet connection.
          </p>
        </div>
      )}

      {/* ── Messages area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            onSave={msg.role === 'assistant' && i !== 0 ? () => handleSave(i) : null}
            saveState={saveStates[i]}
          />
        ))}

        {/* Sample prompts — shown only at start */}
        {showSamplePrompts && (
          <div className="mt-2 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
              Get started
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PROMPTS.map(({ emoji, label }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  disabled={isOffline}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-left hover:border-[#0D7377]/30 hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-40"
                >
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0D7377]/15 flex items-center justify-center">
                <Sparkles size={12} className="text-[#0D7377]" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#0D7377]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#0D7377]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#0D7377]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center mb-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 max-w-[85%] text-center">
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError('')}
                className="mt-1 text-xs text-red-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pb-safe pb-4 pt-3 border-t border-[var(--color-border-soft)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Apni baat likhen…"
            disabled={loading || isOffline}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/30 transition-all disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || isOffline}
            className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#0D7377] text-white flex items-center justify-center hover:bg-[#095C5F] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            aria-label="Send message"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={18} />
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Duas are composed by AI. Always verify with a qualified scholar.
        </p>
      </div>
    </div>
  );
}
