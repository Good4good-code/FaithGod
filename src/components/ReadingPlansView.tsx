import React from 'react';
import { ReadingPlan, ReadingPlanDay } from '../types';
import { BookOpen, CheckCircle2, Circle, Play, ArrowRight, Award, Trash2 } from 'lucide-react';

interface ReadingPlansViewProps {
  plans: ReadingPlan[];
  onActivatePlan: (id: string) => void;
  onCompleteDay: (planId: string, dayNum: number) => void;
  onResetPlan: (planId: string) => void;
  onNavigateToPassage: (reference: string) => void;
}

export default function ReadingPlansView({
  plans,
  onActivatePlan,
  onCompleteDay,
  onResetPlan,
  onNavigateToPassage
}: ReadingPlansViewProps) {
  
  const activePlan = plans.find(p => p.active);
  const inactivePlans = plans.filter(p => !p.active);

  const calculateProgress = (plan: ReadingPlan) => {
    const completedCount = plan.days.filter(d => d.completed).length;
    return Math.round((completedCount / plan.durationDays) * 100);
  };

  const parseReferenceForNavigation = (ref: string) => {
    // e.g. "John 3", "Matthew 6:25-34", "Psalms 23"
    onNavigateToPassage(ref);
  };

  return (
    <div id="reading-plans-view" className="max-w-4xl mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 font-serif">Bible Study & Reading Plans</h2>
        <p className="text-sm text-stone-500">Form deep habits by engaging with scripture using highly structured thematic paths.</p>
      </div>

      {/* Active Reading Plan Section */}
      {activePlan ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0f172a] font-mono">Active Reading Plan</span>
              <h3 className="text-2xl font-bold text-stone-800 font-serif">{activePlan.title}</h3>
              <p className="text-sm text-stone-600 max-w-2xl">{activePlan.description}</p>
            </div>
            
            <button
              id={`btn-reset-plan-${activePlan.id}`}
              onClick={() => onResetPlan(activePlan.id)}
              className="text-xs font-semibold text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 border border-stone-200 rounded-lg cursor-pointer"
              title="Cancel and Reset Plan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Plan</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#d4af37]" />
                <span>Overall Progress</span>
              </span>
              <span className="font-mono font-bold text-[#0f172a]">{calculateProgress(activePlan)}% Completed</span>
            </div>
            <div className="w-full bg-stone-200/60 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#0f172a] h-full rounded-full transition-all duration-500" 
                style={{ width: `${calculateProgress(activePlan)}%` }}
              />
            </div>
          </div>

          {/* Days breakdown list */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Daily Assignments</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activePlan.days.map((day) => (
                <div
                  id={`plan-day-card-${day.day}`}
                  key={day.day}
                  className={`p-4 border rounded-xl flex items-center justify-between transition-all ${
                    day.completed
                      ? 'border-green-100 bg-green-50/20 text-stone-500'
                      : 'border-stone-200 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      id={`btn-complete-day-${day.day}`}
                      onClick={() => onCompleteDay(activePlan.id, day.day)}
                      className={`shrink-0 transition-colors cursor-pointer ${
                        day.completed ? 'text-green-600' : 'text-stone-300 hover:text-[#0f172a]'
                      }`}
                    >
                      {day.completed ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <div className="overflow-hidden">
                      <span className="text-xs text-stone-400 font-mono">Day {day.day}</span>
                      <p className="font-semibold text-sm truncate font-serif text-stone-800">{day.title}</p>
                      
                      {/* References tags */}
                      <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                        {day.references.map((ref, idx) => (
                          <button
                            id={`btn-nav-ref-${day.day}-${idx}`}
                            key={idx}
                            onClick={() => parseReferenceForNavigation(ref)}
                            className="text-[11px] font-semibold text-[#0f172a] hover:text-[#d4af37] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-0.5"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Read {ref}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!day.completed && (
                    <button
                      onClick={() => parseReferenceForNavigation(day.references[0])}
                      className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-[#0f172a] shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Prompt to select a plan if none active */
        <div className="bg-[#0f172a]/5 border border-slate-200 rounded-2xl p-6 text-center text-stone-600 font-serif text-sm">
          💡 You don't have an active Bible reading plan right now. Choose one below to start your study journey!
        </div>
      )}

      {/* Available Plans Browser */}
      <div className="space-y-4">
        <h3 className="font-bold text-stone-800 font-serif text-lg">Available Reading Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inactivePlans.map((plan) => (
            <div
              id={`inactive-plan-card-${plan.id}`}
              key={plan.id}
              className="bg-white border border-[#e7e5e4] hover:border-stone-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md font-mono uppercase">
                    {plan.category}
                  </span>
                  <span className="text-xs font-bold text-stone-400 font-mono">
                    {plan.durationDays} Days Duration
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold font-serif text-lg text-stone-800">{plan.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">{plan.description}</p>
                </div>
              </div>

              <button
                id={`btn-start-plan-${plan.id}`}
                onClick={() => onActivatePlan(plan.id)}
                className="mt-6 w-full py-2 bg-stone-50 border border-stone-200 hover:bg-[#0f172a] hover:text-[#d4af37] text-stone-700 hover:border-[#0f172a] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Reading Plan</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
