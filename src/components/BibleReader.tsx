import React, { useState, useEffect } from 'react';
import { BIBLE_BOOKS, BibleBook } from '../data/bibleBooksMetadata';
import { getVersesForBookAndChapter, Verse } from '../data/bibleData';
import { FavoriteVerse } from '../types';
import { BookOpen, Search, Bookmark, Copy, Sparkles, Sliders, Check, HelpCircle, ArrowRight } from 'lucide-react';

interface BibleReaderProps {
  onAddFavorite: (fav: Omit<FavoriteVerse, 'id' | 'dateAdded'>) => void;
  favorites: FavoriteVerse[];
  onRemoveFavorite: (bookId: string, chapter: number, verse: number) => void;
  onAskAssistant: (prompt: string) => void;
  activeTranslation: string;
}

export default function BibleReader({
  onAddFavorite,
  favorites,
  onRemoveFavorite,
  onAskAssistant,
  activeTranslation
}: BibleReaderProps) {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // AI Explainer State
  const [explainingVerse, setExplainingVerse] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  useEffect(() => {
    setVerses(getVersesForBookAndChapter(selectedBook.id, selectedChapter));
    setAiExplanation('');
    setExplainingVerse(null);
  }, [selectedBook, selectedChapter]);

  // Group books by testament
  const otBooks = BIBLE_BOOKS.filter(b => b.testament === 'OT');
  const ntBooks = BIBLE_BOOKS.filter(b => b.testament === 'NT');

  const filteredOtBooks = otBooks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNtBooks = ntBooks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  };

  const isFavorite = (verseNum: number) => {
    return favorites.some(
      f => f.bookId === selectedBook.id && f.chapter === selectedChapter && f.verse === verseNum
    );
  };

  const toggleFavorite = (v: Verse) => {
    if (isFavorite(v.verse)) {
      onRemoveFavorite(selectedBook.id, selectedChapter, v.verse);
    } else {
      onAddFavorite({
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        chapter: selectedChapter,
        verse: v.verse,
        text: v.text
      });
    }
  };

  const handleCopy = (v: Verse) => {
    const textToCopy = `"${v.text}" — ${selectedBook.name} ${selectedChapter}:${v.verse} (${activeTranslation})`;
    navigator.clipboard.writeText(textToCopy);
    const key = `${selectedBook.id}-${selectedChapter}-${v.verse}`;
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExplainVerse = async (v: Verse) => {
    setExplainingVerse(v.verse);
    setLoadingExplanation(true);
    setAiExplanation('');
    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain the deep theological meaning, translation context, and practical application of ${selectedBook.name} ${selectedChapter}:${v.verse}: "${v.text}".`
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiExplanation(`AI: ${data.error}`);
      } else {
        setAiExplanation(data.text);
      }
    } catch (err) {
      setAiExplanation('Unable to contact the study assistant. Please ensure your GEMINI_API_KEY is configured.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base md:text-lg leading-relaxed',
    lg: 'text-lg md:text-xl leading-relaxed font-serif',
    xl: 'text-xl md:text-2xl leading-loose font-serif'
  };

  return (
    <div id="bible-reader-view" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full max-h-[82vh]">
      {/* Book Sidebar Selection */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-4 flex flex-col h-[300px] lg:h-full overflow-hidden shadow-sm">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-[#854d0e]" />
          <span>Select Bible Book</span>
        </h3>
        
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            id="book-search-input"
            type="text"
            placeholder="Search books..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scrollable books container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Old Testament */}
          {(filteredOtBooks.length > 0) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 px-2 block mb-1">Old Testament</span>
              <div className="grid grid-cols-1 gap-1">
                {filteredOtBooks.map((book) => (
                  <button
                    id={`book-select-${book.id}`}
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex justify-between items-center ${
                      selectedBook.id === book.id
                        ? 'bg-[#fefce8] text-[#854d0e] font-medium border border-[#fef08a]'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{book.name}</span>
                    <span className="text-xs text-stone-400">{book.chapters} chs</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Testament */}
          {(filteredNtBooks.length > 0) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 px-2 block mb-1">New Testament</span>
              <div className="grid grid-cols-1 gap-1">
                {filteredNtBooks.map((book) => (
                  <button
                    id={`book-select-${book.id}`}
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex justify-between items-center ${
                      selectedBook.id === book.id
                        ? 'bg-[#fefce8] text-[#854d0e] font-medium border border-[#fef08a]'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{book.name}</span>
                    <span className="text-xs text-stone-400">{book.chapters} chs</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chapter Text Viewer */}
      <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
        {/* Navigation & Controls Bar */}
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-4 flex flex-wrap gap-4 justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-stone-800 font-serif">{selectedBook.name}</span>
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
              <span className="text-sm font-medium text-stone-600 px-2">Chapter</span>
              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-[320px] md:max-w-[420px] no-scrollbar">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    id={`chapter-select-${ch}`}
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-medium shrink-0 transition-all ${
                      selectedChapter === ch
                        ? 'bg-[#854d0e] text-white'
                        : 'text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reader Preferences */}
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-stone-400" />
            <div className="flex bg-stone-50 border border-stone-200 rounded-lg p-0.5">
              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                <button
                  id={`font-size-${size}`}
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    fontSize === size
                      ? 'bg-white text-stone-800 shadow-sm border border-stone-200/50'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  A<span className="text-[10px]">{size.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-lg font-mono uppercase">{activeTranslation}</span>
          </div>
        </div>

        {/* Text Pane & Explainer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Verses Container */}
          <div className="md:col-span-2 bg-white border border-[#e7e5e4] rounded-2xl p-6 overflow-y-auto shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              {verses.map((v) => {
                const key = `${selectedBook.id}-${selectedChapter}-${v.verse}`;
                return (
                  <div
                    id={`verse-block-${v.verse}`}
                    key={v.verse}
                    className="group relative pl-6 border-l-2 border-transparent hover:border-[#854d0e] transition-all"
                  >
                    <p className={`${fontSizeClasses[fontSize]} text-stone-700`}>
                      <sup className="text-xs font-bold text-[#854d0e] mr-1.5 font-sans select-none">{v.verse}</sup>
                      {v.text}
                    </p>

                    {/* Action buttons (copy, bookmark, AI helper) */}
                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-2 mt-2 transition-opacity animate-fadeIn">
                      <button
                        id={`btn-fav-verse-${v.verse}`}
                        onClick={() => toggleFavorite(v)}
                        className={`p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer ${
                          isFavorite(v.verse) ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
                        }`}
                        title={isFavorite(v.verse) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        id={`btn-copy-verse-${v.verse}`}
                        onClick={() => handleCopy(v)}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors relative cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedId === key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        id={`btn-explain-verse-${v.verse}`}
                        onClick={() => handleExplainVerse(v)}
                        className="p-1 rounded-lg text-stone-400 hover:text-[#854d0e] hover:bg-[#fefce8] transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                        title="Explain with AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Explain</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs text-stone-400 italic font-mono">End of Chapter {selectedChapter}</span>
              <button
                id="ask-assistant-chapter"
                onClick={() => onAskAssistant(`I am currently reading ${selectedBook.name} Chapter ${selectedChapter}. Can you provide a comprehensive study guide of its key themes, cultural context, and key takeaways?`)}
                className="text-xs text-[#854d0e] hover:text-[#a16207] font-medium flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0"
              >
                <span>Ask AI Chat for Chapter Study Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Explainer Pane */}
          <div className="bg-[#fcfbf9] border border-[#e7e5e4] rounded-2xl p-5 overflow-y-auto flex flex-col shadow-sm">
            <h4 className="font-semibold text-stone-800 flex items-center gap-2 mb-3 pb-3 border-b border-stone-200">
              <Sparkles className="w-4 h-4 text-[#854d0e]" />
              <span>AI Biblical Explainer</span>
            </h4>

            {explainingVerse ? (
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-semibold text-[#854d0e] uppercase tracking-wider mb-1">
                  Verse Context:
                </span>
                <p className="text-sm text-stone-600 italic bg-white p-3 rounded-xl border border-stone-100 mb-4 font-serif">
                  "{verses.find(v => v.verse === explainingVerse)?.text}" 
                  <span className="block text-right text-xs font-bold font-sans mt-1 text-stone-500">
                    — {selectedBook.name} {selectedChapter}:{explainingVerse}
                  </span>
                </p>

                <div className="flex-1 overflow-y-auto bg-white border border-stone-100 rounded-xl p-4 text-sm text-stone-700 leading-relaxed space-y-3">
                  {loadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400">
                      <Sparkles className="w-6 h-6 animate-pulse text-[#854d0e]" />
                      <p className="text-xs">Analyzing Biblical text...</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line font-sans prose-stone text-xs leading-relaxed">
                      {aiExplanation}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400 gap-3">
                <HelpCircle className="w-8 h-8 text-stone-300" />
                <p className="text-sm font-medium text-stone-500">How to use AI Explain:</p>
                <p className="text-xs leading-relaxed max-w-[200px]">
                  Hover over any verse in the reader and click <span className="font-semibold text-[#854d0e]">AI Explain</span> to receive immediate, deep spiritual and context commentary.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
