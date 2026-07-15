import React, { useState, useEffect } from 'react';
import { BIBLE_BOOKS, BibleBook } from '../data/bibleBooksMetadata';
import { getVersesForBookAndChapter, Verse } from '../data/bibleData';
import { FavoriteVerse, Highlight } from '../types';
import { 
  BookOpen, Search, Bookmark, Copy, Sparkles, Sliders, Check, HelpCircle, ArrowRight,
  Play, Pause, Square, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface BibleReaderProps {
  onAddFavorite: (fav: Omit<FavoriteVerse, 'id' | 'dateAdded'>) => void;
  favorites: FavoriteVerse[];
  onRemoveFavorite: (bookId: string, chapter: number, verse: number) => void;
  onAskAssistant: (prompt: string) => void;
  activeTranslation: string;
  currentUser: FirebaseUser | null;
}

export default function BibleReader({
  onAddFavorite,
  favorites,
  onRemoveFavorite,
  onAskAssistant,
  activeTranslation,
  currentUser
}: BibleReaderProps) {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  
  // AI Explainer State
  const [explainingVerse, setExplainingVerse] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  // Audio Bible TTS Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeakingVerse, setCurrentSpeakingVerse] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  useEffect(() => {
    let active = true;

    const fetchChapterVerses = async () => {
      setLoadingVerses(true);
      // Determine the translation code for bible-api.com
      let translationParam = 'web';
      if (activeTranslation.toUpperCase() === 'KJV') {
        translationParam = 'kjv';
      }

      const bookQuery = selectedBook.name.toLowerCase().replace(/\s+/g, '+');
      const url = `https://bible-api.com/${bookQuery}+${selectedChapter}?translation=${translationParam}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch from Bible API');
        }
        const data = await response.json();
        if (active && data && Array.isArray(data.verses)) {
          const fetchedVerses: Verse[] = data.verses.map((v: any) => ({
            verse: v.verse,
            text: v.text.trim()
          }));
          setVerses(fetchedVerses);
          setLoadingVerses(false);
          return;
        }
      } catch (err) {
        console.warn("Error fetching verses, using local curated backup:", err);
      }

      // Fallback to local scriptures if fetch fails
      if (active) {
        setVerses(getVersesForBookAndChapter(selectedBook.id, selectedChapter));
        setLoadingVerses(false);
      }
    };

    fetchChapterVerses();
    setAiExplanation('');
    setExplainingVerse(null);

    // Cancel any ongoing speech when the chapter or book changes
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSpeakingVerse(null);

    return () => {
      active = false;
    };
  }, [selectedBook, selectedChapter, activeTranslation]);

  // Handle unmount cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Synchronize Highlights
  useEffect(() => {
    // Load local highlights
    const savedHighlights = localStorage.getItem('faithgod_highlights');
    let localList: Highlight[] = [];
    if (savedHighlights) {
      try {
        localList = JSON.parse(savedHighlights);
      } catch (e) {
        console.error(e);
      }
    }

    // Filter local highlights for the current book and chapter to keep UI snappy
    const localCurrent = localList.filter(h => h.bookId === selectedBook.id && h.chapter === selectedChapter);
    setHighlights(localCurrent);

    const fetchHighlights = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'highlights'),
          where('userId', '==', currentUser.uid),
          where('bookId', '==', selectedBook.id),
          where('chapter', '==', selectedChapter)
        );
        const querySnapshot = await getDocs(q);
        const fbHighlights: Highlight[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fbHighlights.push({
            id: doc.id,
            userId: data.userId,
            bookId: data.bookId,
            bookName: data.bookName || selectedBook.name,
            chapter: data.chapter,
            verse: data.verse,
            color: data.color,
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        // Merge / overwrite local highlights for this book/chapter with Firestore truth
        setHighlights(fbHighlights);

        // Also update localStorage with all Firestore highlights by merging them
        const nonCurrentLocal = localList.filter(h => !(h.bookId === selectedBook.id && h.chapter === selectedChapter));
        const mergedAll = [...nonCurrentLocal, ...fbHighlights];
        localStorage.setItem('faithgod_highlights', JSON.stringify(mergedAll));
      } catch (err) {
        console.error("Failed to fetch highlights from Firestore:", err);
      }
    };

    fetchHighlights();
  }, [currentUser, selectedBook.id, selectedChapter, selectedBook.name]);

  const handleToggleHighlight = async (verseNum: number, color: 'yellow' | 'green' | 'blue' | 'pink' | null) => {
    const highlightId = `${currentUser ? currentUser.uid : 'local'}_${selectedBook.id}_${selectedChapter}_${verseNum}`;

    // Get all from local storage
    const savedHighlights = localStorage.getItem('faithgod_highlights');
    let localList: Highlight[] = [];
    if (savedHighlights) {
      try {
        localList = JSON.parse(savedHighlights);
      } catch (e) {}
    }

    if (color === null) {
      // REMOVE HIGHLIGHT
      setHighlights(prev => prev.filter(h => h.verse !== verseNum));
      const updatedLocal = localList.filter(h => !(h.bookId === selectedBook.id && h.chapter === selectedChapter && h.verse === verseNum));
      localStorage.setItem('faithgod_highlights', JSON.stringify(updatedLocal));

      if (currentUser) {
        try {
          await deleteDoc(doc(db, 'highlights', highlightId));
        } catch (err) {
          console.error("Failed to delete highlight in Firestore:", err);
        }
      }
    } else {
      // ADD / UPDATE HIGHLIGHT
      const newHighlight: Highlight = {
        id: highlightId,
        userId: currentUser ? currentUser.uid : 'local',
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        chapter: selectedChapter,
        verse: verseNum,
        color: color,
        createdAt: new Date().toISOString()
      };

      setHighlights(prev => {
        const filtered = prev.filter(h => h.verse !== verseNum);
        return [...filtered, newHighlight];
      });

      const filteredLocal = localList.filter(h => !(h.bookId === selectedBook.id && h.chapter === selectedChapter && h.verse === verseNum));
      const updatedLocal = [...filteredLocal, newHighlight];
      localStorage.setItem('faithgod_highlights', JSON.stringify(updatedLocal));

      if (currentUser) {
        try {
          await setDoc(doc(db, 'highlights', highlightId), newHighlight);
        } catch (err) {
          console.error("Failed to set highlight in Firestore:", err);
        }
      }
    }
  };

  const handlePlayAudio = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Convert verses to a speakable list
    const speakableVerses = [...verses];
    if (speakableVerses.length === 0) return;

    let index = 0;

    const speakNext = () => {
      if (index >= speakableVerses.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSpeakingVerse(null);
        return;
      }

      const verse = speakableVerses[index];
      setCurrentSpeakingVerse(verse.verse);

      // Scroll into view
      const element = document.getElementById(`verse-block-${verse.verse}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const textToSpeak = `${verse.verse}. ${verse.text}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackRate;

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (e) => {
        console.warn("TTS Error:", e);
        if (window.speechSynthesis.paused) return;
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSpeakingVerse(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    setIsPaused(false);
    speakNext();
  };

  const handlePauseAudio = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSpeakingVerse(null);
  };

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
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[300px] lg:h-full overflow-hidden shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-[#d4af37]" />
          <span>Select Bible Book</span>
        </h3>
        
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="book-search-input"
            type="text"
            placeholder="Search books..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white dark:focus:bg-slate-900 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scrollable books container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Old Testament */}
          {(filteredOtBooks.length > 0) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-1">Old Testament</span>
              <div className="grid grid-cols-1 gap-1">
                {filteredOtBooks.map((book) => (
                  <button
                    id={`book-select-${book.id}`}
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex justify-between items-center cursor-pointer ${
                      selectedBook.id === book.id
                        ? 'bg-slate-900 dark:bg-slate-800 text-[#d4af37] font-semibold border border-slate-850'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{book.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{book.chapters} chs</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Testament */}
          {(filteredNtBooks.length > 0) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-1">New Testament</span>
              <div className="grid grid-cols-1 gap-1">
                {filteredNtBooks.map((book) => (
                  <button
                    id={`book-select-${book.id}`}
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex justify-between items-center cursor-pointer ${
                      selectedBook.id === book.id
                        ? 'bg-slate-900 dark:bg-slate-800 text-[#d4af37] font-semibold border border-slate-850'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{book.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{book.chapters} chs</span>
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
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 justify-between items-center shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-serif">{selectedBook.name}</span>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">Chapter</span>
              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-[320px] md:max-w-[420px] no-scrollbar">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    id={`chapter-select-${ch}`}
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedChapter === ch
                        ? 'bg-[#0f172a] dark:bg-slate-800 text-[#d4af37] border border-[#d4af37]/40 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
            <Sliders className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                <button
                  id={`font-size-${size}`}
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    fontSize === size
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  A<span className="text-[10px]">{size.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <span className="text-xs bg-[#0f172a] dark:bg-slate-900 text-[#d4af37] px-2 py-1 rounded-lg font-mono font-bold uppercase border border-slate-800">{activeTranslation}</span>
          </div>
        </div>

        {/* Audio Bible Player Console */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-[#d4af37] text-[#0f172a]' : 'bg-slate-800 text-[#d4af37]'}`}>
              <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider font-mono">Audio Bible Narrator</h4>
              <p className="text-[11px] text-slate-300">
                {isPlaying ? (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    Narrating {selectedBook.name} {selectedChapter} {currentSpeakingVerse ? `(Verse ${currentSpeakingVerse})` : ''}
                  </span>
                ) : isPaused ? (
                  <span className="text-amber-400">Audio narration paused</span>
                ) : (
                  <span>Listen to this chapter read aloud with custom playback speed</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed selection */}
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[10px] uppercase font-mono text-slate-400">Speed:</span>
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (isPlaying || isPaused) {
                    handlePlayAudio();
                  }
                }}
                className="bg-slate-800 border border-slate-700 text-xs text-[#d4af37] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d4af37] cursor-pointer font-bold"
              >
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x (Normal)</option>
                <option value="1.2">1.2x</option>
                <option value="1.5">1.5x</option>
              </select>
            </div>

            {/* Play/Pause Buttons */}
            {isPlaying ? (
              <button
                onClick={handlePauseAudio}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handlePlayAudio}
                className="px-4 py-1.5 bg-[#d4af37] hover:bg-yellow-500 text-[#0f172a] rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs animate-pulse"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPaused ? 'Resume' : 'Narrate Chapter'}</span>
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                onClick={handleStopAudio}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Stop Narration"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* Text Pane & Explainer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Verses Container */}
          <div className="md:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-y-auto shadow-sm flex flex-col justify-between">
            {loadingVerses ? (
              <div className="flex-grow flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <RefreshCw className="w-9 h-9 text-[#d4af37] animate-spin" />
                <p className="text-xs font-serif italic text-stone-500 dark:text-slate-400">Retrieving scripture chapters from secure dynamic API...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {verses.map((v) => {
                  const key = `${selectedBook.id}-${selectedChapter}-${v.verse}`;
                  const isSpeaking = currentSpeakingVerse === v.verse;
                  const verseHighlight = highlights.find(h => h.verse === v.verse);
                  
                  // Combine speaking and highlight styles nicely
                  let borderClass = 'border-l-2 border-transparent pl-4';
                  let bgClass = '';
                  
                  if (isSpeaking) {
                    borderClass = 'border-l-4 border-[#d4af37] pl-4';
                    bgClass = 'bg-[#d4af37]/10 dark:bg-[#d4af37]/20';
                  } else if (verseHighlight) {
                    if (verseHighlight.color === 'yellow') {
                      borderClass = 'border-l-4 border-amber-500 pl-4';
                      bgClass = 'bg-amber-100/60 dark:bg-amber-500/15';
                    } else if (verseHighlight.color === 'green') {
                      borderClass = 'border-l-4 border-emerald-500 pl-4';
                      bgClass = 'bg-emerald-50/70 dark:bg-emerald-500/15';
                    } else if (verseHighlight.color === 'blue') {
                      borderClass = 'border-l-4 border-sky-500 pl-4';
                      bgClass = 'bg-sky-50/70 dark:bg-sky-500/15';
                    } else if (verseHighlight.color === 'pink') {
                      borderClass = 'border-l-4 border-rose-500 pl-4';
                      bgClass = 'bg-rose-50/70 dark:bg-rose-500/15';
                    }
                  }

                  return (
                    <div
                      id={`verse-block-${v.verse}`}
                      key={v.verse}
                      className={`group relative py-2 pr-2 transition-all duration-300 rounded-r-lg ${borderClass} ${bgClass} hover:bg-slate-50/50 dark:hover:bg-slate-800/20`}
                    >
                      <p className={`${fontSizeClasses[fontSize]} ${isSpeaking ? 'text-[#0f172a] dark:text-[#d4af37] font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                        <sup className={`text-xs font-bold mr-1.5 font-sans select-none ${isSpeaking ? 'text-[#d4af37]' : 'text-slate-400 dark:text-slate-500'}`}>{v.verse}</sup>
                        {v.text}
                      </p>

                      {/* Action buttons (copy, bookmark, AI helper, highlight picker) */}
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-2 mt-2 transition-opacity animate-fadeIn flex-wrap">
                        <button
                          id={`btn-fav-verse-${v.verse}`}
                          onClick={() => toggleFavorite(v)}
                          className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                            isFavorite(v.verse) ? 'text-[#d4af37]' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                          }`}
                          title={isFavorite(v.verse) ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          id={`btn-copy-verse-${v.verse}`}
                          onClick={() => handleCopy(v)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                          title="Copy Reference"
                        >
                          {copiedId === key ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          id={`btn-explain-verse-${v.verse}`}
                          onClick={() => handleExplainVerse(v)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 dark:hover:bg-[#d4af37]/20 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="Explain with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>AI Explain</span>
                        </button>

                        {/* Highlights Picker */}
                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3 ml-1">
                          <button
                            id={`btn-highlight-yellow-${v.verse}`}
                            onClick={() => handleToggleHighlight(v.verse, 'yellow')}
                            className={`w-3.5 h-3.5 rounded-full bg-amber-300 hover:scale-125 transition-all cursor-pointer ${
                              verseHighlight?.color === 'yellow' ? 'ring-2 ring-amber-500 ring-offset-1 scale-110' : ''
                            }`}
                            title="Highlight Yellow"
                          />
                          <button
                            id={`btn-highlight-green-${v.verse}`}
                            onClick={() => handleToggleHighlight(v.verse, 'green')}
                            className={`w-3.5 h-3.5 rounded-full bg-emerald-300 hover:scale-125 transition-all cursor-pointer ${
                              verseHighlight?.color === 'green' ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110' : ''
                            }`}
                            title="Highlight Green"
                          />
                          <button
                            id={`btn-highlight-blue-${v.verse}`}
                            onClick={() => handleToggleHighlight(v.verse, 'blue')}
                            className={`w-3.5 h-3.5 rounded-full bg-sky-300 hover:scale-125 transition-all cursor-pointer ${
                              verseHighlight?.color === 'blue' ? 'ring-2 ring-sky-500 ring-offset-1 scale-110' : ''
                            }`}
                            title="Highlight Blue"
                          />
                          <button
                            id={`btn-highlight-pink-${v.verse}`}
                            onClick={() => handleToggleHighlight(v.verse, 'pink')}
                            className={`w-3.5 h-3.5 rounded-full bg-rose-300 hover:scale-125 transition-all cursor-pointer ${
                              verseHighlight?.color === 'pink' ? 'ring-2 ring-rose-500 ring-offset-1 scale-110' : ''
                            }`}
                            title="Highlight Pink"
                          />
                          {verseHighlight && (
                            <button
                              id={`btn-highlight-clear-${v.verse}`}
                              onClick={() => handleToggleHighlight(v.verse, null)}
                              className="p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors text-[10px] font-bold font-mono cursor-pointer flex items-center justify-center"
                              title="Clear Highlight"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500 italic font-mono">End of Chapter {selectedChapter}</span>
              <button
                id="ask-assistant-chapter"
                onClick={() => onAskAssistant(`I am currently reading ${selectedBook.name} Chapter ${selectedChapter}. Can you provide a comprehensive study guide of its key themes, cultural context, and key takeaways?`)}
                className="text-xs text-[#0f172a] dark:text-[#d4af37] hover:text-[#b45309] dark:hover:text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 font-sans"
              >
                <span>Ask AI Chat for Chapter Study Guide</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
              </button>
            </div>
          </div>

          {/* AI Explainer Pane */}
          <div className="bg-slate-50/50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-y-auto flex flex-col shadow-sm">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span className="font-serif">AI Biblical Explainer</span>
            </h4>

            {explainingVerse ? (
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                  Verse Context:
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 mb-4 font-serif">
                  "{verses.find(v => v.verse === explainingVerse)?.text}" 
                  <span className="block text-right text-xs font-bold font-sans mt-1 text-slate-500 dark:text-slate-400">
                    — {selectedBook.name} {selectedChapter}:{explainingVerse}
                  </span>
                </p>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                  {loadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                      <Sparkles className="w-6 h-6 animate-pulse text-[#d4af37]" />
                      <p className="text-xs">Analyzing Biblical text...</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line font-sans prose-slate dark:prose-invert text-xs leading-relaxed">
                      {aiExplanation}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3">
                <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">How to use AI Explain:</p>
                <p className="text-xs leading-relaxed max-w-[200px] text-slate-500 dark:text-slate-400">
                  Hover over any verse in the reader and click <span className="font-bold text-[#0f172a] dark:text-[#d4af37]">AI Explain</span> to receive immediate, deep spiritual and context commentary.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
