import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';

interface DictionaryTerm {
  word: string;
  original: string;
  meaning: string;
  context: string;
  references: string[];
}

const OFFLINE_GLOSSARY: DictionaryTerm[] = [
  {
    word: 'Grace',
    original: 'Greek: χάρις (Charis)',
    meaning: 'The unmerited and free favor of God toward humans, providing salvation, strength, and transformation regardless of our achievements.',
    context: 'In classical Greek, "charis" meant beauty or charm. In Biblical context, Apostle Paul elevated it to mean God\'s radical, unconditional gift of Christ on the cross to save sinners.',
    references: ['Ephesians 2:8-9', 'Romans 5:20-21']
  },
  {
    word: 'Shalom',
    original: 'Hebrew: שָׁלוֹם (Shalom)',
    meaning: 'Completeness, wholeness, health, peace, safety, and prosperity. Not just the absence of conflict, but the presence of ultimate divine harmony.',
    context: 'In the Old Testament, Shalom represents the restored creation where people, nature, and God live in perfect covenant relationship. Jesus is called the "Sar Shalom" (Prince of Peace).',
    references: ['Isaiah 9:6', 'John 14:27']
  },
  {
    word: 'Covenant',
    original: 'Hebrew: בְּרִית (Berit) / Greek: διαθήκη (Diatheke)',
    meaning: 'A sacred, solemn, binding agreement established by God with His people, defining their relationship, obligations, and divine promises.',
    context: 'Ancient covenants were sealed by blood sacrifices, symbolizing life-and-death commitment. The New Covenant is established forever by the blood of Jesus Christ.',
    references: ['Genesis 15:18', 'Luke 22:20']
  },
  {
    word: 'Faith',
    original: 'Greek: πίστιs (Pistis)',
    meaning: 'Trust, belief, and absolute loyalty. Conviction of the truth of God\'s revelations, combined with personal reliance and obedience.',
    context: 'Faith in Hebrews 11 is defined as "the substance of things hoped for, the evidence of things not seen." It is not passive intellectual agreement but an active life of trust.',
    references: ['Hebrews 11:1', 'James 2:17']
  }
];

export default function BibleDictionaryView() {
  const [searchWord, setSearchWord] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);
  
  // Custom AI word state
  const [customWord, setCustomWord] = useState('');
  const [aiResult, setAiResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleOfflineSelect = (term: DictionaryTerm) => {
    setSelectedTerm(term);
    setAiResult('');
    setCustomWord('');
  };

  const handleAiLookup = async (wordToLookup: string) => {
    if (!wordToLookup.trim()) return;
    setCustomWord(wordToLookup);
    setSelectedTerm(null);
    setLoading(true);
    setAiResult('');
    
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToLookup.trim() })
      });
      const data = await res.json();
      if (data.error) {
        setAiResult(`Failed to lookup: ${data.error}`);
      } else {
        setAiResult(data.text);
      }
    } catch (err) {
      setAiResult('Please provide a valid GEMINI_API_KEY in the workspace environment variables to look up words dynamically with AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchWord.trim()) return;
    
    // Check if it matches an offline term
    const matched = OFFLINE_GLOSSARY.find(
      t => t.word.toLowerCase() === searchWord.trim().toLowerCase()
    );
    if (matched) {
      setSelectedTerm(matched);
      setAiResult('');
      setCustomWord('');
    } else {
      handleAiLookup(searchWord);
    }
  };

  return (
    <div id="bible-dictionary-view" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full max-h-[82vh]">
      {/* Sidebar glossary list */}
      <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[300px] lg:h-full overflow-hidden shadow-sm">
        <h3 className="font-semibold text-stone-800 dark:text-slate-100 flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-[#d4af37]" />
          <span>Theological Glossary</span>
        </h3>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 dark:text-slate-500" />
          <input
            id="dict-search-input"
            type="text"
            placeholder="Search word or ask AI..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 focus:bg-white dark:focus:bg-[#131f42] text-slate-800 dark:text-slate-100 transition-all"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
          />
        </form>

        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500 px-2 block mb-2">Key Biblical Terms</span>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {OFFLINE_GLOSSARY.map((term) => (
            <button
              id={`dict-select-${term.word.toLowerCase()}`}
              key={term.word}
              onClick={() => handleOfflineSelect(term)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${
                selectedTerm?.word === term.word
                  ? 'bg-[#d4af37]/15 text-[#d4af37] font-semibold border border-[#d4af37]/35'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span>{term.word}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>
        
        {/* Helper bottom note */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 text-[11px] text-stone-400 dark:text-slate-500 leading-relaxed">
          💡 Enter any biblical name, place, or doctrine (e.g. "Grace", "Covenant") in the box to explain it instantly.
        </div>
      </div>

      {/* Main content pane */}
      <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-6 overflow-y-auto h-full shadow-sm">
          {/* Default view */}
          {!selectedTerm && !customWord && !loading && (
            <div className="flex flex-col items-center justify-center text-center py-20 text-stone-400 dark:text-slate-500 gap-4 max-w-sm mx-auto h-full">
              <div className="w-12 h-12 rounded-full bg-[#0f172a]/10 dark:bg-slate-800/50 flex items-center justify-center text-[#0f172a]">
                <BookOpen className="w-6 h-6 text-[#d4af37]" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-stone-700 dark:text-slate-300">Biblical Knowledge Dictionary</h3>
              <p className="text-xs leading-relaxed">
                Select a key term from the left sidebar glossary to learn Hebrew/Greek roots and theological context, or search for any word above to use AI.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center text-center py-24 text-stone-400 dark:text-slate-500 gap-3 h-full">
              <Sparkles className="w-10 h-10 text-[#d4af37] animate-spin" />
              <h4 className="font-serif font-medium text-stone-700 dark:text-slate-300">Searching Scriptures & Historical Logs...</h4>
              <p className="text-xs max-w-xs leading-relaxed">
                Gemini is researching Hebrew/Greek roots, archaeological details, and biblical instances for <span className="font-bold text-stone-600 dark:text-slate-400">"{customWord}"</span>.
              </p>
            </div>
          )}

          {/* Selected Offline Term */}
          {selectedTerm && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-200 dark:border-slate-800 pb-4">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-slate-100 font-serif">{selectedTerm.word}</h2>
                <span className="text-sm bg-[#0f172a]/5 dark:bg-[#d4af37]/10 text-[#0f172a] dark:text-[#d4af37] border border-slate-200 dark:border-[#d4af37]/20 px-2.5 py-1 rounded-md mt-1 inline-block font-semibold italic">
                  {selectedTerm.original}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider font-mono">Biblical Definition</h4>
                  <p className="text-stone-700 dark:text-slate-200 leading-relaxed text-sm md:text-base font-serif">
                    {selectedTerm.meaning}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider font-mono">Historical & Linguistic Context</h4>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-sm">
                    {selectedTerm.context}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-2">Key Scripture Occurrences</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTerm.references.map((ref, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold text-[#0f172a] dark:text-slate-200 bg-slate-100 dark:bg-[#131f42] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Result */}
          {customWord && !loading && aiResult && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-stone-200 dark:border-slate-800 pb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-slate-100 font-serif">Dictionary Result: "{customWord}"</h2>
                  <span className="text-xs text-stone-400 dark:text-slate-500 font-mono">Dynamic AI Lookup Completed</span>
                </div>
                <button
                  id="btn-re-lookup"
                  onClick={() => handleAiLookup(customWord)}
                  className="text-xs font-semibold text-[#0f172a] dark:text-slate-200 hover:bg-[#0f172a]/5 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refresh Lookup</span>
                </button>
              </div>

              <div className="prose prose-stone dark:prose-invert text-stone-700 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line text-sm md:text-base space-y-4">
                {aiResult}
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex justify-between items-center text-xs text-stone-400 dark:text-slate-500 font-mono">
                <span>Data synthesized dynamically by Gemini 3.5 Flash</span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Accurate Study Helper</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
