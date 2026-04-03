import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

const QUICK_QA = [
  { q: "What is the difference between Hajj al-Ifrad, Qiran, and Tamattu'?", a: "There are three types of Hajj: Ifrad (performing only Hajj without Umrah), Qiran (combining Umrah and Hajj in one Ihram), and Tamattu' (performing Umrah first, exiting Ihram, then re-entering Ihram for Hajj). Tamattu' is considered the best by many scholars and is what most pilgrims perform. Those who perform Qiran or Tamattu' must offer a Hady (animal sacrifice)." },
  { q: "Is Hajj valid if I missed Arafat?", a: "Standing at Arafat (Wuquf) is the single most important pillar of Hajj. The Prophet ﷺ said: 'Hajj is Arafat.' If you miss the Wuquf entirely (you were not at Arafat at all between Dhuhr of 9 Dhul Hijjah and Fajr of 10 Dhul Hijjah), your Hajj is invalid and must be repeated in a future year. However, if you arrived after sunset but before Fajr of 10th, your Hajj is still valid according to the majority of scholars." },
  { q: "Can women perform Hajj without a mahram?", a: "The majority of classical scholars held that a mahram (male guardian) is required for a woman's Hajj. However, scholars such as Ibn Qudamah, and later many contemporary scholars including some on the Saudi Fatwa Council, have ruled that women may travel with a group of trustworthy women if a mahram is unavailable. The Saudi Ministry of Hajj has also facilitated Hajj for women over 45 in organized groups without mahram. This is a matter of scholarly difference — consult your local scholar or Hajj mission." },
  { q: "What if I cannot walk during Sa'i or Tawaf?", a: "Tawaf and Sa'i can be performed in a wheelchair — this is explicitly permitted and widely practiced. The Saudi authorities provide wheelchair services in Masjid al-Haram. For Tawaf, a wheelchair-bound person may be pushed by another. There is no diminishment in the validity of Hajj for those with physical limitations who cannot walk." },
  { q: "What is Tawaf al-Qudum and is it obligatory?", a: "Tawaf al-Qudum (Arrival Tawaf) is the Tawaf performed upon arriving in Makkah before the main Hajj rituals. For those performing Hajj al-Ifrad or Qiran, it is a Sunnah (highly recommended) but not obligatory. For Tamattu' pilgrims, the Umrah Tawaf serves as the arrival Tawaf. Missing it does not require fidyah." },
  { q: "Can I clip nails or cut hair while in Ihram?", a: "No. Cutting hair, shaving any body hair, or clipping nails is prohibited while in the state of Ihram. This prohibition applies equally to men and women. If done out of forgetfulness or ignorance, most scholars hold that fidyah is required: either fasting 3 days, feeding 6 poor persons (half saa' each = approximately 1.5 kg of staple food each), or sacrificing one sheep." },
  { q: "What prayers should I make at Arafat?", a: "At Arafat, the most recommended dhikr is: 'La ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa ala kulli shay'in qadir' (There is no god but Allah alone...). Combine this with: sincere istighfar (seeking forgiveness), durood on the Prophet ﷺ, du'a for yourself and your family, recitation of Quran, and any personal supplication. The Prophet ﷺ spent most of the Day of Arafat in du'a facing the Qiblah with raised hands. This is the most answered time for du'a in the entire year." },
  { q: "Is it permissible to perform Hajj on behalf of a deceased person?", a: "Yes, it is permissible to perform Hajj on behalf of a deceased Muslim, or on behalf of an elderly or chronically ill person who is physically unable to perform it themselves. The person performing the proxy Hajj (Hajj al-Badal) must have already completed their own obligatory Hajj first. The intention must be clearly made for the person on whose behalf Hajj is being performed." },
  { q: "What is the ruling on using phone/taking photos during Hajj?", a: "Using a phone for navigation, accessing Hajj guidance like this app, or communicating with family is permissible. However, being preoccupied with phone use — especially social media, video calls, or photography — during the key acts of worship (especially at Arafat, during Tawaf, and in Mina) is strongly discouraged. Many scholars advise focusing fully on worship. Photography of other pilgrims, especially women, without consent is prohibited. Prioritize your spiritual focus." },
  { q: "Can I perform Hajj if I have debt?", a: "Scholars differ on this. The majority view is that paying off debts takes precedence over Hajj if the creditor demands repayment and the debt is due. Hajj becomes obligatory only when one has sufficient provision beyond one's needs and debts. However, if the creditor is willing to defer the debt, or if the debt does not affect your ability to fund Hajj, many scholars say Hajj remains obligatory. Consult your Hajj mission or a qualified scholar about your specific situation." },
  { q: "What is the significance of the Black Stone (Hajar al-Aswad)?", a: "The Black Stone (Hajar al-Aswad) is a stone in the eastern corner of the Kaaba. It descended from Paradise and was originally white, turning black from the sins of humanity. Kissing, touching, or pointing toward it at the start of each Tawaf circuit is Sunnah. Umar ibn al-Khattab (RA) famously said: 'I know you are just a stone that neither harms nor benefits. Had I not seen the Prophet ﷺ kissing you, I would not have kissed you.' This affirms that this act is followed purely out of obedience and love for the Prophet ﷺ, not out of belief in the stone's power." },
];

export default function AIGuide() {
  const isOffline = useOffline();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "As-salamu alaykum! I'm your Hajj guide. Ask me anything about Hajj rituals, rulings, du'as, or general Islamic guidance for your pilgrimage. May Allah accept your Hajj! 🕋" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('No API key');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: `You are a knowledgeable and respectful Islamic guide specializing in Hajj. Answer questions accurately based on Quran, Sahih Hadith, and official Saudi Ministry of Hajj guidelines. When rulings differ between madhabs, note the differences clearly. Always recommend consulting a qualified scholar for personal rulings. Be concise, warm, and spiritually supportive. Use Arabic terms when helpful (with English explanation). Keep responses under 300 words unless a longer answer is clearly needed.`,
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: userMsg }]).slice(-10),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      // Fallback to cached Q&A
      const match = QUICK_QA.find(qa =>
        userMsg.toLowerCase().includes(qa.q.toLowerCase().slice(0, 20))
      ) || QUICK_QA[Math.floor(Math.random() * QUICK_QA.length)];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${match.a}\n\n_Note: I'm using cached responses. Connect to internet for live AI guidance._`
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container flex flex-col fade-in" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Hajj Guide</h1>
        <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            AI responses are for guidance only. Consult your group scholar for binding rulings.
          </p>
        </div>
        {isOffline && (
          <p className="text-xs text-gray-500 mt-1 text-center">📴 Offline — showing cached Q&A</p>
        )}
      </div>

      {/* Quick Questions */}
      <div className="px-4 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_QA.slice(0, 5).map((qa, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qa.q)}
              className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-teal-50 hover:text-teal-primary transition-colors min-h-0 h-auto max-w-[200px] text-left truncate"
            >
              {qa.q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-teal-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-card'
            }`}>
              {msg.role === 'assistant' && (
                <span className="text-xs text-teal-primary font-semibold block mb-1">🕋 Daleel Guide</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-card">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
            placeholder="Ask about Hajj rituals, rulings..."
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/30"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-teal-primary text-white p-3 rounded-xl hover:bg-teal-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-0 h-auto w-12"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
