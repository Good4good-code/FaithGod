import React, { useState, useEffect } from 'react';
import { FavoriteVerse, PrayerItem, ReadingPlan, DailyVerse } from './types';
import { INITIAL_READING_PLANS } from './data/readingPlans';
import { getTodayVerse } from './data/dailyVerses';

// Components
import DailyVerseView from './components/DailyVerseView';
import BibleReader from './components/BibleReader';
import PrayerJournalView from './components/PrayerJournalView';
import FavoritesView from './components/FavoritesView';
import ReadingPlansView from './components/ReadingPlansView';
import BibleDictionaryView from './components/BibleDictionaryView';
import BibleQuizView from './components/BibleQuizView';
import SettingsView from './components/SettingsView';

// Icons
import { 
  Heart, BookOpen, Edit3, Bookmark, Award, Search, Trophy, Settings, 
  Menu, X, Sparkles, MessageCircle, Send, Moon, Sun, ArrowRight, BookMarked
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('daily-verse');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // App settings state
  const [activeTranslation, setActiveTranslation] = useState<string>('NKJV');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // default true, checked via fetch

  // Local persistence states
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);

  // AI Chat Assistant Drawer state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Load state on mount
  useEffect(() => {
    // Favorites
    const savedFavs = localStorage.getItem('faithgod_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Prayers
    const savedPrayers = localStorage.getItem('faithgod_prayers');
    if (savedPrayers) {
      setPrayers(JSON.parse(savedPrayers));
    } else {
      // Seed initial welcoming prayer
      const seed: PrayerItem[] = [
        {
          id: 'welcome-prayer',
          title: 'Welcome to FaithGod',
          request: 'May this Bible companion strengthen my faith, guide my daily steps, and provide comfort through scripture.',
          date: 'July 14',
          answered: false
        }
      ];
      setPrayers(seed);
      localStorage.setItem('faithgod_prayers', JSON.stringify(seed));
    }

    // Reading Plans
    const savedPlans = localStorage.getItem('faithgod_plans');
    if (savedPlans) {
      setReadingPlans(JSON.parse(savedPlans));
    } else {
      setReadingPlans(INITIAL_READING_PLANS);
      localStorage.setItem('faithgod_plans', JSON.stringify(INITIAL_READING_PLANS));
    }

    // Translation
    const savedTrans = localStorage.getItem('faithgod_trans');
    if (savedTrans) setActiveTranslation(savedTrans);

    // Verify key presence
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
    } catch {
      setHasApiKey(true); // default fallback
    }
  };

  // State savers
  const saveFavorites = (newFavs: FavoriteVerse[]) => {
    setFavorites(newFavs);
    localStorage.setItem('faithgod_favs', JSON.stringify(newFavs));
  };

  const savePrayers = (newPrayers: PrayerItem[]) => {
    setPrayers(newPrayers);
    localStorage.setItem('faithgod_prayers', JSON.stringify(newPrayers));
  };

  const savePlans = (newPlans: ReadingPlan[]) => {
    setReadingPlans(newPlans);
    localStorage.setItem('faithgod_plans', JSON.stringify(newPlans));
  };

  // Favorites Actions
  const handleAddFavorite = (fav: Omit<FavoriteVerse, 'id' | 'dateAdded'>) => {
    const isDup = favorites.some(f => f.bookId === fav.bookId && f.chapter === fav.chapter && f.verse === fav.verse);
    if (isDup) return;

    const newFav: FavoriteVerse = {
      ...fav,
      id: `${fav.bookId}-${fav.chapter}-${fav.verse}`,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    saveFavorites([newFav, ...favorites]);
  };

  const handleRemoveFavorite = (bookId: string, chapter: number, verse: number) => {
    const filtered = favorites.filter(f => !(f.bookId === bookId && f.chapter === chapter && f.verse === verse));
    saveFavorites(filtered);
  };

  const handleUpdateNotes = (bookId: string, chapter: number, verse: number, notes: string) => {
    const updated = favorites.map(f => {
      if (f.bookId === bookId && f.chapter === chapter && f.verse === verse) {
        return { ...f, notes };
      }
      return f;
    });
    saveFavorites(updated);
  };

  // Prayers Actions
  const handleAddPrayer = (title: string, request: string) => {
    const newPrayer: PrayerItem = {
      id: `prayer-${Date.now()}`,
      title,
      request,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      answered: false
    };
    savePrayers([newPrayer, ...prayers]);
  };

  const handleToggleAnswered = (id: string, note?: string) => {
    const updated = prayers.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          answered: !p.answered,
          answerNote: note || p.answerNote
        };
      }
      return p;
    });
    savePrayers(updated);
  };

  const handleDeletePrayer = (id: string) => {
    savePrayers(prayers.filter(p => p.id !== id));
  };

  // Reading Plans Actions
  const handleActivatePlan = (id: string) => {
    const updated = readingPlans.map(p => {
      if (p.id === id) {
        return { ...p, active: true };
      }
      return { ...p, active: false }; // deactivate others
    });
    savePlans(updated);
  };

  const handleCompleteDay = (planId: string, dayNum: number) => {
    const updated = readingPlans.map(p => {
      if (p.id === planId) {
        const updatedDays = p.days.map(d => {
          if (d.day === dayNum) {
            return { ...d, completed: !d.completed };
          }
          return d;
        });
        
        // Calculate next currentDay
        const nextIncomplete = updatedDays.find(d => !d.completed);
        const newCurrentDay = nextIncomplete ? nextIncomplete.day : p.durationDays;

        return { 
          ...p, 
          days: updatedDays,
          currentDay: newCurrentDay
        };
      }
      return p;
    });
    savePlans(updated);
  };

  const handleResetPlan = (planId: string) => {
    const updated = readingPlans.map(p => {
      if (p.id === planId) {
        const clearedDays = p.days.map(d => ({ ...d, completed: false }));
        return {
          ...p,
          active: false,
          currentDay: 1,
          days: clearedDays
        };
      }
      return p;
    });
    savePlans(updated);
  };

  const handleNavigateToPassage = (ref: string) => {
    // Set view to Bible reader and trigger search if needed
    setActiveTab('bible-reader');
  };

  const handleTranslationChange = (trans: string) => {
    setActiveTranslation(trans);
    localStorage.setItem('faithgod_trans', trans);
  };

  // Quick prompt triggering for Chat Drawer
  const handleAskAssistant = (prompt: string) => {
    setChatOpen(true);
    setChatMessage(prompt);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = chatMessage.trim();
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatHistory
        })
      });
      const data = await res.json();
      if (data.error) {
        setChatHistory([...newHistory, { role: 'assistant', text: `Study assistant is offline: ${data.error}` }]);
      } else {
        setChatHistory([...newHistory, { role: 'assistant', text: data.text }]);
      }
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', text: 'Connecting error. Please register GEMINI_API_KEY in the environment setting.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const menuItems = [
    { id: 'daily-verse', label: 'Daily Devotion', icon: Heart },
    { id: 'bible-reader', label: 'Bible Reader', icon: BookOpen },
    { id: 'prayer-journal', label: 'Prayer Journal', icon: Edit3 },
    { id: 'favorites', label: 'Study Highlights', icon: Bookmark },
    { id: 'reading-plans', label: 'Reading Plans', icon: Award },
    { id: 'dictionary', label: 'Bible Dictionary', icon: Search },
    { id: 'quiz', label: 'Trivia Quizzes', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'daily-verse':
        return (
          <DailyVerseView
            onFavoriteVerse={(v) => handleAddFavorite({
              bookId: 'today',
              bookName: 'Daily Verse',
              chapter: 0,
              verse: 0,
              text: `${v.verse} (${v.reference})`
            })}
            isFavorited={favorites.some(f => f.bookId === 'today')}
            onAskAssistant={handleAskAssistant}
          />
        );
      case 'bible-reader':
        return (
          <BibleReader
            favorites={favorites}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            onAskAssistant={handleAskAssistant}
            activeTranslation={activeTranslation}
          />
        );
      case 'prayer-journal':
        return (
          <PrayerJournalView
            prayers={prayers}
            onAddPrayer={handleAddPrayer}
            onToggleAnswered={handleToggleAnswered}
            onDeletePrayer={handleDeletePrayer}
          />
        );
      case 'favorites':
        return (
          <FavoritesView
            favorites={favorites}
            onRemoveFavorite={handleRemoveFavorite}
            onUpdateNotes={handleUpdateNotes}
            onAskAssistant={handleAskAssistant}
          />
        );
      case 'reading-plans':
        return (
          <ReadingPlansView
            plans={readingPlans}
            onActivatePlan={handleActivatePlan}
            onCompleteDay={handleCompleteDay}
            onResetPlan={handleResetPlan}
            onNavigateToPassage={handleNavigateToPassage}
          />
        );
      case 'dictionary':
        return <BibleDictionaryView />;
      case 'quiz':
        return <BibleQuizView />;
      case 'settings':
        return (
          <SettingsView
            activeTranslation={activeTranslation}
            onChangeTranslation={handleTranslationChange}
            hasApiKey={hasApiKey}
          />
        );
      default:
        return <div className="p-4">Select a view</div>;
    }
  };

  return (
    <div id="faithgod-app-container" className="min-h-screen bg-[#faf9f6] flex flex-col lg:flex-row text-[#1c1917] font-sans antialiased animate-fadeIn">
      
      {/* Sidebar Navigation */}
      <aside className="bg-white border-b lg:border-b-0 lg:border-r border-[#e7e5e4] w-full lg:w-64 shrink-0 flex flex-col justify-between lg:sticky lg:top-0 lg:h-screen z-30 shadow-sm lg:shadow-none">
        <div>
          {/* Header Branding */}
          <div className="px-6 py-5 border-b border-[#f5f5f4] flex justify-between items-center bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#854d0e] flex items-center justify-center text-white shadow-sm animate-fadeIn">
                <BookMarked className="w-4.5 h-4.5" />
              </div>
              <span className="font-serif font-extrabold text-stone-800 tracking-tight text-xl">FaithGod</span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Nav list - Desktop always shown, Mobile hidden unless toggled */}
          <nav className={`px-4 py-4 space-y-1 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#fefce8] text-[#854d0e] border border-[#fef08a]/80 shadow-sm font-bold'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-[#854d0e]' : 'text-stone-400 group-hover:text-stone-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Assistant Quick Access Button (Sidebar Bottom) */}
        <div className={`p-4 border-t border-[#f5f5f4] bg-stone-50/50 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
          <button
            id="btn-open-scholar-chat"
            onClick={() => setChatOpen(true)}
            className="w-full py-2.5 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI Scripture Assistant</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Floating live top bar for context details */}
        <header className="bg-white border-b border-[#e7e5e4] px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-stone-400 capitalize bg-stone-50 border border-stone-200/60 px-2 py-1 rounded-md">
              {activeTab.replace('-', ' ')}
            </span>
            <span className="text-xs text-stone-300">|</span>
            <span className="text-xs font-semibold text-stone-400 font-mono">{activeTranslation} Translation active</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick floating chat trigger */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="p-2 bg-stone-100 hover:bg-[#fefce8] hover:text-[#854d0e] rounded-xl text-stone-500 transition-all relative cursor-pointer"
              title="Open Study Companion Chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#854d0e] rounded-full animate-ping" />
            </button>
          </div>
        </header>

        {/* Selected Component View */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </div>
      </main>

      {/* Sliding AI Scripture Scholar Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity animate-fadeIn">
          
          {/* Backdrop closer click */}
          <div className="flex-1 animate-fadeIn" onClick={() => setChatOpen(false)} />

          {/* Drawer container */}
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-serif font-bold text-stone-800 text-lg">AI Scripture Scholar</span>
              </div>
              <button
                id="btn-close-chat"
                onClick={() => setChatOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfbf9]">
              {chatHistory.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#fefce8] flex items-center justify-center text-[#854d0e] mx-auto shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-stone-600 font-serif">Scripture Study Lounge</h4>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed">
                    Ask questions about chapters, Bible historical context, translation variations, or spiritual application of any verse!
                  </p>
                  
                  {/* Preset prompt pills */}
                  <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
                    <button
                      onClick={() => setChatMessage("Explain the historical context of the Gospel of Luke.")}
                      className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-left rounded-xl text-[11px] font-semibold text-[#854d0e] transition-colors cursor-pointer"
                    >
                      "Explain the context of Luke."
                    </button>
                    <button
                      onClick={() => setChatMessage("What are some key theological themes in Ephesians?")}
                      className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-left rounded-xl text-[11px] font-semibold text-[#854d0e] transition-colors cursor-pointer"
                    >
                      "Theological themes in Ephesians."
                    </button>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[10px] text-stone-400 font-mono uppercase mb-0.5 tracking-wider px-1">
                      {msg.role === 'user' ? 'You' : 'Scholar'}
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#854d0e] text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-stone-800 rounded-tl-none border border-stone-200/70 font-sans shadow-xs whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[10px] text-stone-400 font-mono uppercase mb-0.5">Scholar</span>
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-stone-400 animate-pulse flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Analyzing scripture references...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-stone-100 bg-white flex gap-2">
              <input
                id="chat-input-text"
                type="text"
                placeholder="Ask about scripture history, terms, themes..."
                className="flex-1 px-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50 focus:bg-white transition-all"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
              />
              <button
                id="btn-send-chat"
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="p-2 bg-[#854d0e] hover:bg-[#a16207] text-white rounded-xl disabled:opacity-45 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
