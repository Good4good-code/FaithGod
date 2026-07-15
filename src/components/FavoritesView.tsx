import React, { useState } from 'react';
import { FavoriteVerse } from '../types';
import { Bookmark, Trash2, Calendar, Edit3, Save, Sparkles, AlertCircle } from 'lucide-react';

interface FavoritesViewProps {
  favorites: FavoriteVerse[];
  onRemoveFavorite: (bookId: string, chapter: number, verse: number) => void;
  onUpdateNotes: (bookId: string, chapter: number, verse: number, notes: string) => void;
  onAskAssistant: (prompt: string) => void;
}

export default function FavoritesView({
  favorites,
  onRemoveFavorite,
  onUpdateNotes,
  onAskAssistant
}: FavoritesViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleStartEdit = (fav: FavoriteVerse) => {
    const id = `${fav.bookId}-${fav.chapter}-${fav.verse}`;
    setEditingId(id);
    setNoteText(fav.notes || '');
  };

  const handleSaveNotes = (fav: FavoriteVerse) => {
    onUpdateNotes(fav.bookId, fav.chapter, fav.verse, noteText.trim());
    setEditingId(null);
  };

  return (
    <div id="favorites-view" className="max-w-4xl mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a] dark:text-[#d4af37] font-serif">Favorite Verses & Study Notes</h2>
        <p className="text-sm text-stone-500 dark:text-slate-400">Your personalized treasure chest of God's Word, paired with your personal study reflections.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-12 text-center text-stone-400 dark:text-slate-500 space-y-3 shadow-sm">
          <Bookmark className="w-8 h-8 text-stone-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-stone-600 dark:text-slate-400">No favorite verses yet</h4>
          <p className="text-xs max-w-xs mx-auto text-stone-400 dark:text-slate-500">
            Browse the Bible in the <span className="font-semibold text-[#d4af37]">Bible Reader</span> and tap the bookmark icon on any verse to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {favorites.map((fav) => {
            const key = `${fav.bookId}-${fav.chapter}-${fav.verse}`;
            const isEditing = editingId === key;

            return (
              <div
                id={`favorite-card-${key}`}
                key={key}
                className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-stone-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#0f172a] dark:text-[#d4af37] uppercase tracking-wider font-mono">
                      {fav.bookName} {fav.chapter}:{fav.verse}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-slate-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>Saved on {fav.dateAdded}</span>
                    </div>
                  </div>

                  <button
                    id={`btn-remove-favorite-${key}`}
                    onClick={() => onRemoveFavorite(fav.bookId, fav.chapter, fav.verse)}
                    className="text-stone-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Verse Text */}
                <p className="text-lg text-stone-700 dark:text-slate-200 italic font-serif leading-relaxed mt-3 border-l-2 border-stone-200 dark:border-slate-800 pl-4">
                  "{fav.text}"
                </p>

                {/* Study Notes Section */}
                <div className="mt-4 bg-stone-50 dark:bg-slate-900/40 rounded-xl p-4 border border-stone-100 dark:border-slate-800/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      <span>Study Notes & Reflections</span>
                    </span>

                    {!isEditing && (
                      <button
                        id={`btn-edit-note-${key}`}
                        onClick={() => handleStartEdit(fav)}
                        className="text-xs font-semibold text-[#0f172a] dark:text-[#d4af37] hover:text-[#d4af37] hover:underline"
                      >
                        {fav.notes ? 'Edit Notes' : 'Add Study Notes'}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        id="note-textarea"
                        rows={2}
                        placeholder="Write your study notes, insights, questions, or prayers about this verse..."
                        className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 text-stone-800 dark:text-slate-100"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-stone-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(fav)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-[#d4af37] bg-[#0f172a] dark:bg-[#131f42] border border-[#d4af37]/20 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3 text-[#d4af37]" />
                          <span>Save Notes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {fav.notes ? (
                        fav.notes
                      ) : (
                        <span className="text-stone-400 dark:text-slate-500 italic">No notes added yet. Record your insights or theological queries about this verse here.</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Footer AI Assist Integration */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800/50 flex justify-between items-center text-xs">
                  <button
                    id={`btn-ai-study-fav-${key}`}
                    onClick={() => onAskAssistant(`Can you explain the historical and linguistic context of ${fav.bookName} ${fav.chapter}:${fav.verse}? Here is the verse: "${fav.text}". I also noted this reflection: "${fav.notes || ''}"`)}
                    className="text-[#d4af37] hover:text-[#0f172a] dark:hover:text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Study with AI Assistant</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
