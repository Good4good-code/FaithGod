import React, { useState, useEffect } from 'react';
import { Sliders, Book, Key, Check, Info, ShieldAlert, Sparkles, Smile, Sun, Moon, Monitor, Palette } from 'lucide-react';

interface SettingsViewProps {
  activeTranslation: string;
  onChangeTranslation: (trans: string) => void;
  hasApiKey: boolean;
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
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
  hasApiKey,
  theme,
  onChangeTheme
}: SettingsViewProps) {
  return (
    <div id="settings-view" className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a] dark:text-[#d4af37] font-serif">Preferences & System Settings</h2>
        <p className="text-sm text-stone-500 dark:text-slate-400">Configure your study settings, active scripture translations, visual theme, and secure AI credentials.</p>
      </div>

      {/* Visual Theme Mode Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-300">
        <h3 className="font-bold font-serif text-lg text-stone-800 dark:text-slate-100 flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#d4af37]" />
          <span>App Visual Theme Mode</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-slate-400">Choose between the original FaithGod Light Mode, Dark Mode, or sync with your System Default.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'light', name: 'Light Mode', desc: 'Poetic off-white backgrounds', icon: Sun },
            { id: 'dark', name: 'Dark Mode', desc: 'Cosmic deep navy & gold', icon: Moon },
            { id: 'system', name: 'System Default', desc: 'Follow device settings', icon: Monitor }
          ].map((item) => {
            const IconComponent = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                id={`setting-theme-${item.id}`}
                key={item.id}
                onClick={() => onChangeTheme(item.id as any)}
                className={`text-left p-4 border rounded-xl transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-[#d4af37] bg-amber-500/5 dark:bg-[#d4af37]/5 shadow-sm'
                    : 'border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400'}`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                  )}
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isSelected ? 'text-[#d4af37]' : 'text-stone-800 dark:text-slate-200'}`}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-slate-400 mt-0.5 block leading-tight">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Translation Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-300">
        <h3 className="font-bold font-serif text-lg text-stone-800 dark:text-slate-100 flex items-center gap-2">
          <Book className="w-5 h-5 text-[#d4af37]" />
          <span>Scripture Translation Preference</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-slate-400">Select which Biblical translation is used by default in your Bible Reader and study components.</p>
        
        <div className="grid grid-cols-1 gap-3">
          {TRANSLATIONS.map((trans) => (
            <button
              id={`setting-trans-${trans.id.toLowerCase()}`}
              key={trans.id}
              onClick={() => onChangeTranslation(trans.id)}
              className={`w-full text-left p-4 border rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                activeTranslation === trans.id
                  ? 'border-[#d4af37] bg-amber-500/5 dark:bg-[#d4af37]/5 shadow-sm'
                  : 'border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="space-y-1">
                <span className={`text-sm font-bold block ${activeTranslation === trans.id ? 'text-[#d4af37]' : 'text-stone-800 dark:text-slate-200'}`}>
                  {trans.name}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed block">{trans.desc}</span>
              </div>
              
              {activeTranslation === trans.id && (
                <Check className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Credentials Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-300">
        <h3 className="font-bold font-serif text-lg text-stone-800 dark:text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-[#d4af37]" />
          <span>Gemini AI Connection Credentials</span>
        </h3>

        {/* API Key Status Bar */}
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          hasApiKey 
            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' 
            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-[#d4af37]'
        }`}>
          {hasApiKey ? (
            <>
              <Smile className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">AI Active and Connected!</span>
                <p className="mt-0.5 text-stone-600 dark:text-slate-300">Your server-side Gemini API credentials are successfully loaded. Dynamic daily reflections, theological answers, and custom quizzes are fully operational.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-[#d4af37] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Dynamic AI Features Locked (Offline Mode Active)</span>
                <p className="mt-0.5 text-stone-600 dark:text-slate-300">To unlock custom AI study reflections, custom word lookups, and dynamic quizzes, please define your API key in the environment.</p>
              </div>
            </>
          )}
        </div>

        {/* Setup guide */}
        <div className="bg-stone-50 dark:bg-slate-900/60 rounded-xl p-5 border border-stone-100 dark:border-slate-800/80 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 font-mono flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>How to Configure securely:</span>
          </span>
          
          <ol className="text-xs text-stone-600 dark:text-slate-300 space-y-2.5 list-decimal pl-4 leading-relaxed font-sans">
            <li>
              Open the **Settings Menu** in the AI Studio editor frame on your left.
            </li>
            <li>
              Under **Secrets / Environment Variables**, find or add a variable named:
              <code className="mx-1 bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code>
            </li>
            <li>
              Paste your standard Gemini API Key as the value, and save.
            </li>
            <li>
              The app automatically reads this key server-side. **Do not hardcode keys into the source files.**
            </li>
          </ol>
        </div>

        <div className="pt-2 text-[11px] text-stone-400 dark:text-slate-500 leading-relaxed font-sans italic flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Fully compliant with Google Developer API Key and OAuth Privacy Guidelines.</span>
        </div>
      </div>
    </div>
  );
}
