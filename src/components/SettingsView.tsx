import React, { useState, useEffect } from 'react';
import { Sliders, Book, Key, Check, Info, ShieldAlert, Sparkles, Smile } from 'lucide-react';

interface SettingsViewProps {
  activeTranslation: string;
  onChangeTranslation: (trans: string) => void;
  hasApiKey: boolean;
}

const TRANSLATIONS = [
  { id: 'NKJV', name: 'New King James Version (NKJV)', desc: 'Elegant and accurate modern update of the classic KJV text.' },
  { id: 'ESV', name: 'English Standard Version (ESV)', desc: 'Highly literal word-for-word translation preferred for deep study.' },
  { id: 'NIV', name: 'New International Version (NIV)', desc: 'Balanced thought-for-thought readability suitable for all ages.' },
  { id: 'KJV', name: 'King James Version (KJV)', desc: 'Classic, poetic 1611 authorized translation.' }
];

export default function SettingsView({
  activeTranslation,
  onChangeTranslation,
  hasApiKey
}: SettingsViewProps) {
  return (
    <div id="settings-view" className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 font-serif">Preferences & System Settings</h2>
        <p className="text-sm text-stone-500">Configure your study settings, active scripture translations, and secure AI credentials.</p>
      </div>

      {/* Translation Card */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold font-serif text-lg text-stone-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-[#854d0e]" />
          <span>Scripture Translation Preference</span>
        </h3>
        <p className="text-xs text-stone-500">Select which Biblical translation is used by default in your Bible Reader and study components.</p>
        
        <div className="grid grid-cols-1 gap-3">
          {TRANSLATIONS.map((trans) => (
            <button
              id={`setting-trans-${trans.id.toLowerCase()}`}
              key={trans.id}
              onClick={() => onChangeTranslation(trans.id)}
              className={`w-full text-left p-4 border rounded-xl transition-all flex items-start justify-between ${
                activeTranslation === trans.id
                  ? 'border-amber-800 bg-[#fefce8]/40 shadow-sm'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="space-y-1">
                <span className={`text-sm font-bold block ${activeTranslation === trans.id ? 'text-[#854d0e]' : 'text-stone-800'}`}>
                  {trans.name}
                </span>
                <span className="text-xs text-stone-500 leading-relaxed block">{trans.desc}</span>
              </div>
              
              {activeTranslation === trans.id && (
                <Check className="w-5 h-5 text-[#854d0e] shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Credentials Card */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold font-serif text-lg text-stone-800 flex items-center gap-2">
          <Key className="w-5 h-5 text-[#854d0e]" />
          <span>Gemini AI Connection Credentials</span>
        </h3>

        {/* API Key Status Bar */}
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          hasApiKey 
            ? 'bg-green-50/50 border-green-200 text-green-800' 
            : 'bg-amber-50/50 border-amber-200 text-[#854d0e]'
        }`}>
          {hasApiKey ? (
            <>
              <Smile className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">AI Active and Connected!</span>
                <p className="mt-0.5 text-stone-600">Your server-side Gemini API credentials are successfully loaded. Dynamic daily reflections, theological answers, and custom quizzes are fully operational.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Dynamic AI Features Locked (Offline Mode Active)</span>
                <p className="mt-0.5 text-stone-600">To unlock custom AI study reflections, custom word lookups, and dynamic quizzes, please define your API key in the environment.</p>
              </div>
            </>
          )}
        </div>

        {/* Setup guide */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>How to Configure securely:</span>
          </span>
          
          <ol className="text-xs text-stone-600 space-y-2.5 list-decimal pl-4 leading-relaxed font-sans">
            <li>
              Open the **Settings Menu** in the AI Studio editor frame on your left.
            </li>
            <li>
              Under **Secrets / Environment Variables**, find or add a variable named:
              <code className="mx-1 bg-stone-200 text-stone-800 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code>
            </li>
            <li>
              Paste your standard Gemini API Key as the value, and save.
            </li>
            <li>
              The app automatically reads this key server-side. **Do not hardcode keys into the source files.**
            </li>
          </ol>
        </div>

        <div className="pt-2 text-[11px] text-stone-400 leading-relaxed font-sans italic flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Fully compliant with Google Developer API Key and OAuth Privacy Guidelines.</span>
        </div>
      </div>
    </div>
  );
}
