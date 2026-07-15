import React, { useState, useEffect } from 'react';
import { FavoriteVerse, PrayerItem, ReadingPlan, DailyVerse, Highlight } from './types';
import { INITIAL_READING_PLANS } from './data/readingPlans';
import { getTodayVerse } from './data/dailyVerses';

// Firebase
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Components
import DailyVerseView from './components/DailyVerseView';
import BibleReader from './components/BibleReader';
import PrayerJournalView from './components/PrayerJournalView';
import FavoritesView from './components/FavoritesView';
import ReadingPlansView from './components/ReadingPlansView';
import BibleDictionaryView from './components/BibleDictionaryView';
import BibleQuizView from './components/BibleQuizView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import InfoPagesView from './components/InfoPagesView';

// Icons
import { 
  Heart, BookOpen, Edit3, Bookmark, Award, Search, Trophy, Settings, 
  Menu, X, Sparkles, MessageCircle, Send, Moon, Sun, ArrowRight, BookMarked, User
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('daily-verse');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // App settings state
  const [activeTranslation, setActiveTranslation] = useState<string>('NKJV');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // default true, checked via fetch
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('faithgod_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  // Apply Theme class to document root
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('faithgod_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // User auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Local persistence states
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);

  // AI Chat Assistant Drawer state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Sync state on Auth Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch Favorites from Firestore
        try {
          const favsRef = collection(db, 'favorites');
          const qFavs = query(favsRef, where('userId', '==', user.uid));
          const favsSnap = await getDocs(qFavs);
          const fbFavs: FavoriteVerse[] = [];
          favsSnap.forEach((doc) => {
            const data = doc.data();
            fbFavs.push({
              id: data.id,
              bookId: data.bookId,
              bookName: data.bookName,
              chapter: data.chapter,
              verse: data.verse,
              text: data.text,
              notes: data.notes || '',
              dateAdded: data.dateAdded
            });
          });
          
          // Merge local-only ones to firestore if they don't exist
          const localFavs = JSON.parse(localStorage.getItem('faithgod_favs') || '[]');
          const mergedFavs = [...fbFavs];

          for (const local of localFavs) {
            const exists = fbFavs.some(f => f.bookId === local.bookId && f.chapter === local.chapter && f.verse === local.verse);
            if (!exists) {
              const docId = `${user.uid}_${local.id}`;
              await setDoc(doc(db, 'favorites', docId), { ...local, userId: user.uid });
              mergedFavs.push(local);
            }
          }
          setFavorites(mergedFavs);
          localStorage.setItem('faithgod_favs', JSON.stringify(mergedFavs));
        } catch (err) {
          console.error("Error syncing favorites with Firestore:", err);
        }

        // Fetch Prayers from Firestore
        try {
          const prayersRef = collection(db, 'prayers');
          const qPrayers = query(prayersRef, where('userId', '==', user.uid));
          const prayersSnap = await getDocs(qPrayers);
          const fbPrayers: PrayerItem[] = [];
          prayersSnap.forEach((doc) => {
            const data = doc.data();
            fbPrayers.push({
              id: data.id,
              title: data.title,
              request: data.request,
              date: data.date,
              answered: data.answered,
              answerNote: data.answerNote || ''
            });
          });

          // Merge local-only ones to firestore
          const localPrayers = JSON.parse(localStorage.getItem('faithgod_prayers') || '[]');
          const mergedPrayers = [...fbPrayers];
          for (const local of localPrayers) {
            const exists = fbPrayers.some(p => p.id === local.id);
            if (!exists) {
              await setDoc(doc(db, 'prayers', `${user.uid}_${local.id}`), { ...local, userId: user.uid });
              mergedPrayers.push(local);
            }
          }
          setPrayers(mergedPrayers);
          localStorage.setItem('faithgod_prayers', JSON.stringify(mergedPrayers));
        } catch (err) {
          console.error("Error syncing prayers with Firestore:", err);
        }

        // Fetch Highlights from Firestore
        try {
          const highlightsRef = collection(db, 'highlights');
          const qHighlights = query(highlightsRef, where('userId', '==', user.uid));
          const highlightsSnap = await getDocs(qHighlights);
          const fbHighlights: Highlight[] = [];
          highlightsSnap.forEach((doc) => {
            const data = doc.data();
            fbHighlights.push({
              id: data.id || doc.id,
              userId: data.userId,
              bookId: data.bookId,
              bookName: data.bookName || '',
              chapter: data.chapter,
              verse: data.verse,
              color: data.color,
              createdAt: data.createdAt
            });
          });

          // Merge local-only highlights into firestore
          const localHighlights = JSON.parse(localStorage.getItem('faithgod_highlights') || '[]');
          const mergedHighlights = [...fbHighlights];

          for (const local of localHighlights) {
            const exists = fbHighlights.some(h => h.bookId === local.bookId && h.chapter === local.chapter && h.verse === local.verse);
            if (!exists) {
              const docId = `${user.uid}_${local.bookId}_${local.chapter}_${local.verse}`;
              const syncedHighlight = {
                ...local,
                id: docId,
                userId: user.uid
              };
              await setDoc(doc(db, 'highlights', docId), syncedHighlight);
              mergedHighlights.push(syncedHighlight);
            }
          }
          localStorage.setItem('faithgod_highlights', JSON.stringify(mergedHighlights));
        } catch (err) {
          console.error("Error syncing highlights with Firestore:", err);
        }
      } else {
        // If logged out, load from local storage only
        const savedFavs = localStorage.getItem('faithgod_favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        else setFavorites([]);

        const savedPrayers = localStorage.getItem('faithgod_prayers');
        if (savedPrayers) setPrayers(JSON.parse(savedPrayers));
      }
    });

    return () => unsubscribe();
  }, []);

  // Load state on mount for static settings / plans
  useEffect(() => {
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
  const handleAddFavorite = async (fav: Omit<FavoriteVerse, 'id' | 'dateAdded'>) => {
    const isDup = favorites.some(f => f.bookId === fav.bookId && f.chapter === fav.chapter && f.verse === fav.verse);
    if (isDup) return;

    const newFav: FavoriteVerse = {
      ...fav,
      id: `${fav.bookId}-${fav.chapter}-${fav.verse}`,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    const updatedFavs = [newFav, ...favorites];
    saveFavorites(updatedFavs);

    if (currentUser) {
      try {
        const docId = `${currentUser.uid}_${newFav.id}`;
        await setDoc(doc(db, 'favorites', docId), { ...newFav, userId: currentUser.uid });
      } catch (err) {
        console.error("Failed to persist favorite to firestore:", err);
      }
    }
  };

  const handleRemoveFavorite = async (bookId: string, chapter: number, verse: number) => {
    const filtered = favorites.filter(f => !(f.bookId === bookId && f.chapter === chapter && f.verse === verse));
    saveFavorites(filtered);

    if (currentUser) {
      try {
        const favId = `${bookId}-${chapter}-${verse}`;
        const docId = `${currentUser.uid}_${favId}`;
        await deleteDoc(doc(db, 'favorites', docId));
      } catch (err) {
        console.error("Failed to delete favorite from firestore:", err);
      }
    }
  };

  const handleUpdateNotes = async (bookId: string, chapter: number, verse: number, notes: string) => {
    const updated = favorites.map(f => {
      if (f.bookId === bookId && f.chapter === chapter && f.verse === verse) {
        return { ...f, notes };
      }
      return f;
    });
    saveFavorites(updated);

    if (currentUser) {
      try {
        const favId = `${bookId}-${chapter}-${verse}`;
        const docId = `${currentUser.uid}_${favId}`;
        const existingFav = favorites.find(f => f.bookId === bookId && f.chapter === chapter && f.verse === verse);
        if (existingFav) {
          await setDoc(doc(db, 'favorites', docId), { ...existingFav, notes, userId: currentUser.uid });
        }
      } catch (err) {
        console.error("Failed to update favorite notes in firestore:", err);
      }
    }
  };

  // Prayers Actions
  const handleAddPrayer = async (title: string, request: string) => {
    const newPrayer: PrayerItem = {
      id: `prayer-${Date.now()}`,
      title,
      request,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      answered: false
    };
    const updatedPrayers = [newPrayer, ...prayers];
    savePrayers(updatedPrayers);

    if (currentUser) {
      try {
        const docId = `${currentUser.uid}_${newPrayer.id}`;
        await setDoc(doc(db, 'prayers', docId), { ...newPrayer, userId: currentUser.uid });
      } catch (err) {
        console.error("Failed to persist prayer to firestore:", err);
      }
    }
  };

  const handleToggleAnswered = async (id: string, note?: string) => {
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

    if (currentUser) {
      try {
        const target = updated.find(p => p.id === id);
        if (target) {
          const docId = `${currentUser.uid}_${id}`;
          await setDoc(doc(db, 'prayers', docId), { ...target, userId: currentUser.uid });
        }
      } catch (err) {
        console.error("Failed to update prayer answered state in firestore:", err);
      }
    }
  };

  const handleDeletePrayer = async (id: string) => {
    const filtered = prayers.filter(p => p.id !== id);
    savePrayers(filtered);

    if (currentUser) {
      try {
        const docId = `${currentUser.uid}_${id}`;
        await deleteDoc(doc(db, 'prayers', docId));
      } catch (err) {
        console.error("Failed to delete prayer from firestore:", err);
      }
    }
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
    { id: 'profile', label: 'My Profile', icon: User },
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
            currentUser={currentUser}
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
      case 'profile':
        return (
          <ProfileView 
            favoritesCount={favorites.length}
            prayersCount={prayers.length}
          />
        );
      case 'settings':
        return (
          <SettingsView
            activeTranslation={activeTranslation}
            onChangeTranslation={handleTranslationChange}
            hasApiKey={hasApiKey}
            theme={theme}
            onChangeTheme={setTheme}
          />
        );
      case 'about':
        return <InfoPagesView initialSection="about" />;
      case 'privacy':
        return <InfoPagesView initialSection="privacy" />;
      case 'terms':
        return <InfoPagesView initialSection="terms" />;
      case 'contact':
        return <InfoPagesView initialSection="contact" />;
      default:
        return <div className="p-4">Select a view</div>;
    }
  };

  return (
    <div id="faithgod-app-container" className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] flex flex-col lg:flex-row text-[#0f172a] dark:text-slate-100 font-sans antialiased animate-fadeIn transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="bg-[#0f172a] border-b lg:border-b-0 lg:border-r border-slate-800 w-full lg:w-64 shrink-0 flex flex-col justify-between lg:sticky lg:top-0 lg:h-screen z-30 shadow-md">
        <div>
          {/* Header Branding */}
          <div className="px-6 py-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center text-[#0f172a] shadow-md animate-fadeIn">
                <BookMarked className="w-4.5 h-4.5" />
              </div>
              <span className="font-serif font-extrabold text-[#d4af37] tracking-tight text-xl">FaithGod</span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white transition-colors"
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-slate-800 text-[#d4af37] border-l-4 border-[#d4af37] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Assistant Quick Access Button (Sidebar Bottom) */}
        <div className={`p-4 border-t border-slate-800 bg-slate-950/20 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
          <button
            id="btn-open-scholar-chat"
            onClick={() => setChatOpen(true)}
            className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b45309] text-[#0f172a] hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#0f172a] hover:text-white" />
            <span>AI Scripture Assistant</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Floating live top bar for context details */}
        <header className="bg-white dark:bg-[#0f172a] border-b border-[#e2e8f0] dark:border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-500 dark:text-[#d4af37] uppercase bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md">
              {activeTab.replace('-', ' ')}
            </span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{activeTranslation} Translation active</span>
            {currentUser && (
              <>
                <span className="text-xs text-slate-300">|</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Synced as {currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick floating chat trigger */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-[#0f172a] dark:hover:text-white rounded-xl text-slate-500 dark:text-slate-400 transition-all relative cursor-pointer"
              title="Open Study Companion Chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#d4af37] rounded-full animate-ping" />
            </button>
          </div>
        </header>

        {/* Selected Component View */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col justify-between">
          <div className="flex-grow">
            {renderActiveView()}
          </div>
          
          {/* Footer Navigation */}
          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800/60 pb-6 text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400 dark:text-slate-500">
              <button 
                id="footer-nav-about" 
                onClick={() => {
                  setActiveTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-[#d4af37] dark:hover:text-[#d4af37] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                About FaithGod
              </button>
              <button 
                id="footer-nav-privacy" 
                onClick={() => {
                  setActiveTab('privacy');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-[#d4af37] dark:hover:text-[#d4af37] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Privacy Policy
              </button>
              <button 
                id="footer-nav-terms" 
                onClick={() => {
                  setActiveTab('terms');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-[#d4af37] dark:hover:text-[#d4af37] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Terms of Service
              </button>
              <button 
                id="footer-nav-contact" 
                onClick={() => {
                  setActiveTab('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-[#d4af37] dark:hover:text-[#d4af37] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Contact & Feedback
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 font-mono tracking-wide">
              &copy; {new Date().getFullYear()} FaithGod Platform. Built with Reverence.
            </p>
          </footer>
        </div>
      </main>

      {/* Sliding AI Scripture Scholar Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 dark:bg-black/60 backdrop-blur-xs z-50 flex justify-end transition-opacity animate-fadeIn">
          
          {/* Backdrop closer click */}
          <div className="flex-1 animate-fadeIn" onClick={() => setChatOpen(false)} />

          {/* Drawer container */}
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#0f172a] dark:bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span className="font-serif font-bold text-white text-lg">AI Scripture Scholar</span>
              </div>
              <button
                id="btn-close-chat"
                onClick={() => setChatOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer animate-fadeIn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0a0f1d]">
              {chatHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[#0f172a] dark:text-white mx-auto shadow-sm">
                    <Sparkles className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-serif">Scripture Study Lounge</h4>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed text-slate-500 dark:text-slate-400">
                    Ask questions about chapters, Bible historical context, translation variations, or spiritual application of any verse!
                  </p>
                  
                  {/* Preset prompt pills */}
                  <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
                    <button
                      onClick={() => setChatMessage("Explain the historical context of the Gospel of Luke.")}
                      className="px-3 py-2 bg-white dark:bg-[#131f42] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left rounded-xl text-[11px] font-semibold text-[#0f172a] dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      "Explain the context of Luke."
                    </button>
                    <button
                      onClick={() => setChatMessage("What are some key theological themes in Ephesians?")}
                      className="px-3 py-2 bg-white dark:bg-[#131f42] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left rounded-xl text-[11px] font-semibold text-[#0f172a] dark:text-slate-200 transition-colors cursor-pointer"
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
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase mb-0.5 tracking-wider px-1">
                      {msg.role === 'user' ? 'You' : 'Scholar'}
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0f172a] dark:bg-[#131f42] text-white border-l-4 border-[#d4af37] rounded-tr-none shadow-sm'
                          : 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/70 dark:border-slate-800 font-sans shadow-xs whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase mb-0.5">Scholar</span>
                  <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 dark:text-slate-300 animate-pulse flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
                    <span>Analyzing scripture references...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex gap-2">
              <input
                id="chat-input-text"
                type="text"
                placeholder="Ask about scripture history, terms, themes..."
                className="flex-1 px-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-[#131f42] transition-all"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
              />
              <button
                id="btn-send-chat"
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="p-2 bg-[#0f172a] dark:bg-[#131f42] hover:bg-slate-800 text-[#d4af37] rounded-xl disabled:opacity-45 transition-colors cursor-pointer"
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
