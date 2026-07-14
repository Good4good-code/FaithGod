import React, { useState } from 'react';
import { PrayerItem } from '../types';
import { Calendar, CheckCircle2, Circle, Trash2, Heart, Plus, Sparkles, Filter, Smile, Edit3 } from 'lucide-react';

interface PrayerJournalViewProps {
  prayers: PrayerItem[];
  onAddPrayer: (title: string, request: string) => void;
  onToggleAnswered: (id: string, note?: string) => void;
  onDeletePrayer: (id: string) => void;
}

export default function PrayerJournalView({
  prayers,
  onAddPrayer,
  onToggleAnswered,
  onDeletePrayer
}: PrayerJournalViewProps) {
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'answered'>('all');
  
  // State for entering the answer note when marking as answered
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerNote, setAnswerNote] = useState('');

  // AI Encouragement state for requests
  const [loadingEncouragement, setLoadingEncouragement] = useState<string | null>(null);
  const [encouragements, setEncouragements] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) return;
    onAddPrayer(title.trim(), request.trim());
    setTitle('');
    setRequest('');
    setShowForm(false);
  };

  const handleStartAnswering = (id: string) => {
    setAnsweringId(id);
    setAnswerNote('');
  };

  const handleSaveAnswer = (id: string) => {
    onToggleAnswered(id, answerNote.trim());
    setAnsweringId(null);
    setAnswerNote('');
  };

  const handleGetEncouragement = async (item: PrayerItem) => {
    setLoadingEncouragement(item.id);
    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Provide a short (1-2 sentences), deeply comforting, biblical encouragement and a supportive Bible reference for someone praying about: "${item.title} - ${item.request}". Be extremely gentle, loving, and encouraging.`
        })
      });
      const data = await res.json();
      if (data.text) {
        setEncouragements(prev => ({ ...prev, [item.id]: data.text }));
      }
    } catch (err) {
      setEncouragements(prev => ({ ...prev, [item.id]: 'May God hear your prayer and grant you perfect peace. (Philippians 4:6-7)' }));
    } finally {
      setLoadingEncouragement(null);
    }
  };

  const filteredPrayers = prayers.filter(p => {
    if (activeTab === 'active') return !p.answered;
    if (activeTab === 'answered') return p.answered;
    return true;
  });

  return (
    <div id="prayer-journal-view" className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 font-serif">Prayer Journal</h2>
          <p className="text-sm text-stone-500">Commit your concerns to God and build a record of His faithfulness.</p>
        </div>
        
        <button
          id="btn-new-prayer"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#854d0e] hover:bg-[#a16207] text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Prayer Entry</span>
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <form id="prayer-form" onSubmit={handleSubmit} className="bg-white border border-[#e7e5e4] p-6 rounded-2xl shadow-sm space-y-4 animate-fadeIn">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Title / Topic</label>
            <input
              id="prayer-title-input"
              type="text"
              placeholder="e.g., Healing for Grandmother, Career Guidance"
              className="w-full px-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Request Details / Journal Entry</label>
            <textarea
              id="prayer-request-input"
              rows={3}
              placeholder="Write your prayers, thoughts, and specific requests..."
              className="w-full px-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              id="btn-cancel-prayer"
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-stone-500 hover:bg-stone-50 text-sm font-semibold rounded-xl border border-stone-200"
            >
              Cancel
            </button>
            <button
              id="btn-submit-prayer"
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 text-white text-sm font-semibold rounded-xl"
            >
              Add Entry
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex gap-4">
          {(['all', 'active', 'answered'] as const).map(tab => (
            <button
              id={`prayer-tab-${tab}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-semibold capitalize relative transition-all cursor-pointer ${
                activeTab === tab
                  ? 'text-[#854d0e]'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <span>{tab === 'active' ? 'Active Requests' : tab === 'answered' ? 'Answered Prayers' : 'All Requests'}</span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#854d0e] rounded-full" />
              )}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-400 font-mono">{prayers.length} total entries</span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredPrayers.length === 0 ? (
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-12 text-center text-stone-400 space-y-2 shadow-sm">
            <Heart className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="text-sm font-semibold text-stone-600">No prayer entries found</h4>
            <p className="text-xs max-w-xs mx-auto">Use the button above to add your first prayer request or journal entry.</p>
          </div>
        ) : (
          filteredPrayers.map((item) => (
            <div
              id={`prayer-card-${item.id}`}
              key={item.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between ${
                item.answered ? 'border-green-100 bg-green-50/10' : 'border-[#e7e5e4]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    id={`btn-toggle-answered-${item.id}`}
                    onClick={() => item.answered ? onToggleAnswered(item.id) : handleStartAnswering(item.id)}
                    className={`mt-1 transition-colors shrink-0 cursor-pointer bg-transparent border-none ${
                      item.answered ? 'text-green-600' : 'text-stone-300 hover:text-stone-400'
                    }`}
                  >
                    {item.answered ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
                  </button>

                  <div className="space-y-1">
                    <h3 className={`font-bold font-serif text-lg ${item.answered ? 'text-stone-500 line-through' : 'text-stone-800'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`btn-delete-prayer-${item.id}`}
                  onClick={() => onDeletePrayer(item.id)}
                  className="text-stone-400 hover:text-red-500 p-1 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Request Description */}
              <p className="text-sm text-stone-600 pl-8 mt-3 whitespace-pre-line leading-relaxed">
                {item.request}
              </p>

              {/* Answer details */}
              {item.answered && item.answerNote && (
                <div className="mt-4 pl-8 border-l-2 border-green-200 bg-green-50/40 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5" />
                    <span>How God Answered:</span>
                  </span>
                  <p className="text-sm text-stone-600 italic">
                    "{item.answerNote}"
                  </p>
                </div>
              )}

              {/* Save Answer Note block */}
              {answeringId === item.id && (
                <div className="mt-4 pl-8 space-y-3 bg-stone-50 p-4 rounded-xl">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Record God's Answer (Optional)</label>
                  <textarea
                    id="answer-note-input"
                    rows={2}
                    placeholder="Describe how your prayer was answered..."
                    className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
                    value={answerNote}
                    onChange={(e) => setAnswerNote(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setAnsweringId(null)}
                      className="px-3 py-1 text-xs font-semibold text-stone-500 bg-white border border-stone-200 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveAnswer(item.id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md cursor-pointer"
                    >
                      Save & Mark Answered
                    </button>
                  </div>
                </div>
              )}

              {/* AI Scripture Comfort */}
              {!item.answered && (
                <div className="mt-4 pl-8">
                  {encouragements[item.id] ? (
                    <div className="bg-amber-50/50 border border-amber-100/60 p-3.5 rounded-xl text-xs text-stone-600 leading-relaxed flex items-start gap-2 animate-fadeIn font-serif">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{encouragements[item.id]}</span>
                    </div>
                  ) : (
                    <button
                      id={`btn-ai-comfort-${item.id}`}
                      onClick={() => handleGetEncouragement(item)}
                      disabled={loadingEncouragement === item.id}
                      className="text-xs font-semibold text-[#854d0e] hover:text-[#a16207] flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{loadingEncouragement === item.id ? 'Reflecting on scripture...' : 'Receive AI Scripture Encouragement'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
