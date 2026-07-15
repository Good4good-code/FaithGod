import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Sparkles, Trophy, HelpCircle, ArrowRight, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const OFFLINE_QUIZ: QuizQuestion[] = [
  {
    question: "Who was chosen by God to lead the Israelites out of slavery in Egypt?",
    options: ["Abraham", "David", "Moses", "Joshua"],
    answerIndex: 2,
    explanation: "Moses was called by God through the burning bush to confront Pharaoh and lead the Hebrew people out of Egypt, as detailed in the Book of Exodus."
  },
  {
    question: "Which of the following is NOT one of the four Gospels in the New Testament?",
    options: ["Matthew", "Mark", "Acts", "John"],
    answerIndex: 2,
    explanation: "The four Gospels are Matthew, Mark, Luke, and John. The Book of Acts is a work of historical narrative detailing the early Church."
  },
  {
    question: "In what city was Jesus Christ born?",
    options: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"],
    answerIndex: 2,
    explanation: "Jesus was born in Bethlehem in Judea, fulfilling the Old Testament prophecy of Micah 5:2, as recorded in Matthew 2 and Luke 2."
  },
  {
    question: "What is the longest book in the Bible?",
    options: ["Genesis", "Psalms", "Isaiah", "Jeremiah"],
    answerIndex: 1,
    explanation: "The Book of Psalms contains 150 individual poems, prayers, and songs, making it the longest book by chapter count and content."
  },
  {
    question: "What was the occupation of the Apostle Simon Peter before he followed Jesus?",
    options: ["Tax Collector", "Fisherman", "Tentmaker", "Carpenter"],
    answerIndex: 1,
    explanation: "Peter and his brother Andrew were fishermen on the Sea of Galilee when Jesus called them, saying, 'Follow Me, and I will make you fishers of men' (Matthew 4:19)."
  }
];

const TOPICS = [
  "General Bible Knowledge",
  "The Life of Jesus",
  "Genesis & Creation",
  "Parables of Christ",
  "Old Testament Heroes",
  "Paul's Letters & Epistles",
  "Wisdom & Psalms"
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function BibleQuizView() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTIES[1]);
  
  // Game state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 means lobby
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartOfflineQuiz = () => {
    setQuestions(OFFLINE_QUIZ);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setErrorMsg('');
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(`AI generation failed: ${data.error}`);
        // Fallback to offline quiz automatically
        handleStartOfflineQuiz();
      } else if (data.quiz && Array.isArray(data.quiz)) {
        setQuestions(data.quiz);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setHasSubmitted(false);
      } else {
        throw new Error('Invalid format received');
      }
    } catch (err) {
      setErrorMsg('Dynamic AI generation failed. Launching the offline companion quiz on General Bible History instead.');
      handleStartOfflineQuiz();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || hasSubmitted) return;
    setHasSubmitted(true);
    if (selectedOption === questions[currentIndex].answerIndex) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setCurrentIndex(currentIndex + 1);
  };

  const handleReset = () => {
    setCurrentIndex(-1);
    setQuestions([]);
    setScore(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setErrorMsg('');
  };

  const currentQuestionObj = questions[currentIndex];

  return (
    <div id="bible-quiz-view" className="max-w-3xl mx-auto py-4">
      {/* Quiz Lobby */}
      {currentIndex === -1 && !loading && (
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#0f172a]/10 dark:bg-slate-800/50 flex items-center justify-center text-[#0f172a] mx-auto shadow-sm">
              <Trophy className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-800 dark:text-slate-100">Bible Wisdom Quizzes</h2>
            <p className="text-sm text-stone-500 dark:text-slate-400">Test your knowledge, explore deep scripture trivia, and learn background histories with detailed study comments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Topic Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono">Select Topic</label>
              <select
                id="quiz-topic-select"
                className="w-full p-2.5 bg-stone-50 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 text-sm font-medium text-stone-700 dark:text-slate-200"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {TOPICS.map(topic => (
                  <option key={topic} value={topic} className="dark:bg-slate-900">{topic}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono">Select Difficulty</label>
              <div className="flex bg-stone-50 dark:bg-slate-900/40 p-1 border border-stone-200 dark:border-slate-800 rounded-xl gap-1">
                {DIFFICULTIES.map(diff => (
                  <button
                    id={`quiz-diff-${diff.toLowerCase()}`}
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-100 shadow-sm border border-stone-200/50'
                        : 'text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-xs text-stone-600 dark:text-slate-300 p-4 rounded-xl flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              id="btn-play-offline-quiz"
              onClick={handleStartOfflineQuiz}
              className="flex-1 py-3 border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 text-sm font-semibold rounded-2xl transition-all cursor-pointer bg-white dark:bg-slate-900"
            >
              Play Starter Offline Quiz
            </button>
            <button
              id="btn-start-ai-quiz"
              onClick={handleGenerateQuiz}
              className="flex-1 py-3 bg-[#0f172a] dark:bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-850 text-[#d4af37] hover:text-[#f39c12] border border-[#d4af37]/20 text-sm font-semibold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Dynamic AI Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {loading && (
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Sparkles className="w-10 h-10 text-[#d4af37] animate-spin mx-auto" />
          <h3 className="text-xl font-serif font-semibold text-stone-800 dark:text-slate-200">Compiling Scripture Questions...</h3>
          <p className="text-xs text-stone-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
            Gemini is selecting relevant verses, designing competitive questions, and formatting historical commentary.
          </p>
        </div>
      )}

      {/* Game Playing view */}
      {currentIndex >= 0 && currentIndex < questions.length && (
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          {/* Header Progress and score */}
          <div className="flex justify-between items-center text-xs font-semibold text-stone-400 dark:text-slate-500 font-mono">
            <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
            <span>SCORE: {score}/{questions.length}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-[#0f172a] dark:bg-[#d4af37] h-full rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800 dark:text-slate-100 leading-snug">
            {currentQuestionObj.question}
          </h3>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestionObj.options.map((opt, idx) => {
              let btnClass = "border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50 hover:border-stone-300 dark:hover:border-slate-700";
              
              if (selectedOption === idx && !hasSubmitted) {
                btnClass = "border-[#d4af37] bg-[#d4af37]/10 dark:bg-[#d4af37]/15 text-stone-800 dark:text-slate-100 font-semibold";
              }

              if (hasSubmitted) {
                if (idx === currentQuestionObj.answerIndex) {
                  // correct choice
                  btnClass = "border-green-300 dark:border-green-800/60 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 font-semibold";
                } else if (selectedOption === idx) {
                  // selected incorrect choice
                  btnClass = "border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300";
                } else {
                  // non-selected incorrect choice
                  btnClass = "border-stone-100 dark:border-slate-800/40 bg-white dark:bg-slate-900 text-stone-400 dark:text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  id={`quiz-option-${idx}`}
                  key={idx}
                  onClick={() => !hasSubmitted && setSelectedOption(idx)}
                  disabled={hasSubmitted}
                  className={`w-full text-left p-4 border rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                >
                  <span>{opt}</span>
                  {hasSubmitted && idx === currentQuestionObj.answerIndex && (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  {hasSubmitted && selectedOption === idx && idx !== currentQuestionObj.answerIndex && (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {hasSubmitted && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-2 animate-fadeIn font-sans">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Scripture Explanation</span>
              </span>
              <p className="text-xs text-stone-600 leading-relaxed font-serif whitespace-pre-line">
                {currentQuestionObj.explanation}
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end pt-4 border-t border-stone-100">
            {!hasSubmitted ? (
              <button
                id="btn-quiz-submit"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                Submit Answer
              </button>
            ) : (
              <button
                id="btn-quiz-next"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>{currentIndex === questions.length - 1 ? 'View Summary' : 'Next Question'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Finished Summary View */}
      {currentIndex >= questions.length && (
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[#0f172a]/10 dark:bg-slate-800/50 flex items-center justify-center text-[#0f172a] mx-auto shadow-sm">
            <Trophy className="w-8 h-8 text-[#d4af37]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-slate-100">Quiz Completed!</h3>
            <p className="text-sm text-stone-500 dark:text-slate-400">Let's see how well you did with these Scripture questions.</p>
          </div>

          {/* Score display */}
          <div className="bg-[#fafaf9] dark:bg-slate-900 border border-stone-100 dark:border-slate-800 py-6 px-12 rounded-2xl max-w-xs mx-auto">
            <span className="block text-4xl font-extrabold text-[#0f172a] dark:text-[#d4af37] font-mono">{score} / {questions.length}</span>
            <span className="text-xs text-stone-400 dark:text-slate-500 font-mono uppercase tracking-wider">Correct Answers</span>
          </div>

          {/* Inspirational advice */}
          <p className="text-sm text-stone-600 dark:text-slate-300 max-w-sm mx-auto italic font-serif">
            {score === questions.length 
              ? "Marvelous! You have shown a flawless comprehension of biblical historical and covenant scriptures! Keep studying!"
              : score >= questions.length / 2 
                ? "Wonderful attempt! Your knowledge is strong, and studying continues to grow your wisdom and understanding."
                : "A good starting journey! Scripture study is a lifetime walk. Keep reading and exploring the Word."}
          </p>

          <div className="flex gap-3 justify-center pt-4">
            <button
              id="btn-quiz-retry"
              onClick={handleReset}
              className="px-5 py-2.5 border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-all bg-white dark:bg-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / Other Topics</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
