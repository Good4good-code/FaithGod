import React, { useState, useEffect } from 'react';
import { DailyVerse } from '../types';
import { getTodayVerse } from '../data/dailyVerses';
import { Sparkles, Calendar, Heart, Share2, BookOpen, Quote, Check, Printer } from 'lucide-react';

interface DailyVerseViewProps {
  onFavoriteVerse: (v: DailyVerse) => void;
  isFavorited: boolean;
  onAskAssistant: (prompt: string) => void;
}

export default function DailyVerseView({ onFavoriteVerse, isFavorited, onAskAssistant }: DailyVerseViewProps) {
  const [verse, setVerse] = useState<DailyVerse>(getTodayVerse());
  const [reflection, setReflection] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Parse structured elements from reflection text if available
  const [parsedReflection, setParsedReflection] = useState<{
    reflectionText: string;
    applications: string[];
    prayer: string;
  } | null>(null);

  useEffect(() => {
    setVerse(getTodayVerse());
    setReflection('');
    setParsedReflection(null);
  }, []);

  const handleGenerateReflection = async () => {
    setLoading(true);
    setReflection('');
    setParsedReflection(null);
    try {
      const res = await fetch('/api/verse-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verse: verse.verse,
          reference: verse.reference
        })
      });
      const data = await res.json();
      if (data.error) {
        setReflection(`Failed to generate reflection: ${data.error}`);
      } else {
        const text = data.text;
        setReflection(text);
        
        // Parse the text to separate Reflection, Application, and Prayer sections
        const reflectionMarker = text.indexOf('Reflection');
        const applicationMarker = text.indexOf('Application');
        const prayerMarker = text.indexOf('Prayer');
        
        let refText = text;
        let apps: string[] = [];
        let prayText = '';
        
        if (reflectionMarker !== -1 && applicationMarker !== -1 && prayerMarker !== -1) {
          refText = text.substring(reflectionMarker, applicationMarker).replace(/Reflection\s*:?/i, '').trim();
          
          const appPart = text.substring(applicationMarker, prayerMarker).replace(/Application\s*:?/i, '').trim();
          apps = appPart.split(/\n+/).map((line: string) => line.replace(/^-\s*|^\*\s*|^\d+\.\s*/, '').trim()).filter((line: string) => line.length > 0);
          
          prayText = text.substring(prayerMarker).replace(/Prayer\s*:?/i, '').trim();
        } else {
          // Fallback parsing if structure is slightly different
          const paragraphs = text.split('\n\n').filter((p: string) => p.trim().length > 0);
          refText = paragraphs.slice(0, Math.max(1, paragraphs.length - 2)).join('\n\n');
          apps = paragraphs[paragraphs.length - 2]?.split('\n').map((line: string) => line.replace(/^-\s*|^\*\s*|^\d+\.\s*/, '').trim()) || [];
          prayText = paragraphs[paragraphs.length - 1] || '';
        }

        setParsedReflection({
          reflectionText: refText,
          applications: apps,
          prayer: prayText
        });
      }
    } catch (err) {
      setReflection('Please configure your GEMINI_API_KEY in the environment setting to unlock server-side dynamic devotions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    let copyText = `Daily Verse - ${verse.date}\n"${verse.verse}" — ${verse.reference}\nTheme: ${verse.theme}\n`;
    if (parsedReflection) {
      copyText += `\n[REFLECTION]\n${parsedReflection.reflectionText}\n\n[APPLICATION]\n${parsedReflection.applications.map(a => `• ${a}`).join('\n')}\n\n[PRAYER]\n${parsedReflection.prayer}`;
    } else if (reflection) {
      copyText += `\n[DEVOTION]\n${reflection}`;
    }
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="daily-verse-view" className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Date Header */}
      <div className="flex items-center justify-between text-stone-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold uppercase tracking-widest font-mono">Verse of the Day • {verse.date}</span>
        </div>
        <span className="text-xs bg-[#0f172a]/10 text-[#0f172a] px-2.5 py-1 rounded-full border border-slate-200 font-medium">
          {verse.theme}
        </span>
      </div>

      {/* Main Verse Card */}
      <div className="relative bg-white border border-[#e7e5e4] rounded-3xl p-8 sm:p-12 text-center shadow-md overflow-hidden">
        {/* Background Decorative Graphic */}
        <div className="absolute -top-10 -left-10 text-stone-50/70 select-none pointer-events-none">
          <Quote className="w-48 h-48 transform -rotate-12" />
        </div>

        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
          <p className="text-2xl sm:text-3xl md:text-4xl text-stone-800 font-serif leading-relaxed italic">
            "{verse.verse}"
          </p>
          
          <p className="text-sm sm:text-base font-bold text-stone-500 font-mono tracking-wide">
            — {verse.reference}
          </p>

          <div className="pt-6 flex flex-wrap gap-3 justify-center items-center">
            <button
              id="btn-favorite-today"
              onClick={() => onFavoriteVerse(verse)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
            </button>

            <button
              id="btn-copy-today"
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Share Verse'}</span>
            </button>

            <button
              id="btn-generate-devotional"
              onClick={handleGenerateReflection}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-[#d4af37] text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer border border-[#d4af37]/20"
            >
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>{loading ? 'Reflecting...' : 'Generate AI Devotional'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Devotional Output */}
      {loading && (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-pulse">
          <Sparkles className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
          <h3 className="text-lg font-serif font-medium text-stone-800">Writing Biblical Devotion...</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            Gemini is reflecting on this scripture, analyzing theological themes, practical applications, and drafting a heartfelt prayer.
          </p>
        </div>
      )}

      {!loading && (parsedReflection || reflection) && (
        <div className="bg-[#fafaf9] border border-[#e7e5e4] rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <h3 className="text-xl font-bold text-stone-800 font-serif flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              <span>Scripture Devotional Guide</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                title="Copy Full Devotional"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                title="Print Devotional"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {parsedReflection ? (
            <div className="space-y-6">
              {/* Reflection */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0f172a] font-mono font-bold">Theological Reflection</span>
                <div className="prose prose-stone text-stone-700 leading-relaxed text-sm md:text-base font-serif whitespace-pre-line">
                  {parsedReflection.reflectionText}
                </div>
              </div>

              {/* Life Application */}
              {parsedReflection.applications.length > 0 && (
                <div className="bg-white border border-stone-100 p-6 rounded-2xl space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0f172a] font-mono font-bold">Daily Faith Application</span>
                  <ul className="space-y-3">
                    {parsedReflection.applications.map((app, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-stone-600">
                        <span className="w-5 h-5 rounded-full bg-[#0f172a]/10 text-[#d4af37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prayer */}
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl space-y-3 italic">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0f172a] font-mono not-italic block">Heartfelt Prayer</span>
                <p className="text-stone-700 leading-relaxed font-serif text-sm sm:text-base">
                  {parsedReflection.prayer}
                </p>
              </div>
            </div>
          ) : (
            // Fallback display if parsing wasn't exact
            <div className="prose prose-stone text-stone-700 leading-relaxed font-serif whitespace-pre-line text-sm">
              {reflection}
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs text-stone-400 font-mono">
            <span>Generated on-demand using Gemini 3.5 Flash</span>
            <button
              onClick={() => onAskAssistant(`Regarding the daily verse ${verse.reference}: "${verse.verse}". I want to explore deeper. What other parts of scripture connect with this message, and what are some biblical cross-references?`)}
              className="text-[#d4af37] hover:text-[#0f172a] hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Discuss deeper with AI Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
