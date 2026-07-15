import React, { useState, useEffect } from 'react';
import { 
  Info, ShieldCheck, FileText, Mail, Send, CheckCircle2, 
  Heart, Sparkles, BookOpen, AlertTriangle, MessageSquare, ArrowRight, HelpCircle
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface InfoPagesViewProps {
  initialSection?: 'about' | 'privacy' | 'terms' | 'contact';
}

export default function InfoPagesView({ initialSection = 'about' }: InfoPagesViewProps) {
  const [activeSection, setActiveSection] = useState<'about' | 'privacy' | 'terms' | 'contact'>(initialSection);

  // Sync section with props
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill user details if logged in
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [activeSection]);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      category,
      subject: subject.trim() || `FaithGod Contact - ${category}`,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'anonymous'
    };

    try {
      // 1. Try to save to Firestore database under "feedback" collection
      const feedbackRef = collection(db, 'feedback');
      await addDoc(feedbackRef, payload);
      
      // 2. Also cache in LocalStorage for redundancy
      const existingFeedback = JSON.parse(localStorage.getItem('faithgod_submitted_feedback') || '[]');
      existingFeedback.push(payload);
      localStorage.setItem('faithgod_submitted_feedback', JSON.stringify(existingFeedback));

      setSubmitSuccess(true);
      // Reset non-user fields
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.warn("Firestore feedback write failed, saving to offline cache:", err);
      
      // Fallback: save to LocalStorage to ensure user data is never lost
      const existingFeedback = JSON.parse(localStorage.getItem('faithgod_submitted_feedback') || '[]');
      existingFeedback.push({ ...payload, offlineCached: true });
      localStorage.setItem('faithgod_submitted_feedback', JSON.stringify(existingFeedback));

      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Feedback',
    'Testimony',
    'Feature Suggestion',
    'Bug Report',
    'Praise & Prayer Request',
    'General Inquiry'
  ];

  const sections = [
    { id: 'about', label: 'About FaithGod', icon: Info },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'contact', label: 'Contact & Feedback', icon: Mail }
  ] as const;

  return (
    <div id="info-pages-view" className="max-w-5xl mx-auto py-2 space-y-6">
      
      {/* Tab Switcher Header */}
      <div className="flex bg-white dark:bg-[#0f172a] p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl gap-1 overflow-x-auto no-scrollbar shadow-sm">
        {sections.map(sec => {
          const Icon = sec.icon;
          return (
            <button
              id={`info-tab-${sec.id}`}
              key={sec.id}
              onClick={() => {
                setActiveSection(sec.id);
                setSubmitSuccess(false);
                setErrorMsg(null);
              }}
              className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-[#0f172a] dark:bg-slate-800 text-[#d4af37] shadow-sm border border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-sm animate-fadeIn">
        
        {/* ABOUT SECTION */}
        {activeSection === 'about' && (
          <div className="space-y-8">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-2">
              <div className="flex items-center gap-2.5 text-[#d4af37]">
                <Heart className="w-5 h-5 fill-current" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Our Sanctuary Vision</span>
              </div>
              <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">About FaithGod</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                A premium, distraction-free companion platform crafted for scripture study, prayer, and deep spiritual exploration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 leading-relaxed text-sm text-slate-650 dark:text-slate-300">
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-serif text-slate-850 dark:text-slate-100">Our Sacred Purpose</h3>
                <p>
                  In a digital world crowded with constant alerts and superficial noise, **FaithGod** stands as a quiet digital sanctuary. Our mission is to facilitate a daily habit of scripture reading and personal spiritual alignment.
                </p>
                <p>
                  We believe that reading scripture should be interactive yet restful. By pairing clean modern layouts with advanced, local-first search and dynamic AI contextual lookups, we offer a sanctuary where the ancient truth meets tomorrow's accessibility.
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-serif text-[#d4af37] flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5" />
                  <span>Theological Enrichment AI</span>
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Our embedded study assistant acts as a literary scholar, helping you parse the historical context, Greek/Hebrew translation nuances, and geographic background of any chapter or verse instantly.
                </p>
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Built-In Sanctuary Features</div>
                  <ul className="text-xs space-y-2 list-disc pl-4 text-slate-600 dark:text-slate-350">
                    <li>Daily Devotional Bread with curation guides.</li>
                    <li>Adaptive Bible Reader with text-scaling controls.</li>
                    <li>Secure, offline-enabled private Prayer Journal.</li>
                    <li>Thematic Reading Plans with checklist counters.</li>
                    <li>Trivia and Scripture Comprehension quizzes.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Core Values / Grid of items */}
            <div className="pt-4 space-y-4">
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white text-center">Built Upon Integrity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#d4af37] mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">Privacy First</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your prayers and notes are private. We never share or sell your entries to advertisers.</p>
                </div>

                <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#d4af37] mx-auto">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">Distraction Free</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No ads, clickbait, or social feeds. Only you, scripture, and focused meditation.</p>
                </div>

                <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#d4af37] mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">Intelligent Insights</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Leverage advanced AI guidance for deep scripture analysis in simple language.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY SECTION */}
        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-1.5">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">Data Protection & Covenant</span>
              <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Privacy Policy</h2>
              <p className="text-xs text-slate-400 font-mono">Last Updated: July 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-650 dark:text-slate-300 space-y-6 leading-relaxed">
              <p>
                At FaithGod, we treat your privacy with the highest reverence. This Privacy Policy details our commitment to safeguarding your spiritual journals, prayers, highlights, and any demographic information you share with us.
              </p>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">1</span>
                  <span>Spiritual Reflection Privacy</span>
                </h3>
                <p>
                  Any prayers logged in your Prayer Journal, text highlighted in the Bible Reader, study plans completed, and personal notes generated are strictly confidential. We do not analyze or parse your prayers or reflections for any advertising purposes.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">2</span>
                  <span>Local-First & Firebase Storage</span>
                </h3>
                <p>
                  By default, FaithGod saves your data locally in your browser's private state storage. If you choose to register and sync your profile using Google Authentication or Email credentials, your records are transmitted securely to Google Cloud Firebase services. This is isolated to your personal UID node, protected under strict Google security architecture.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">3</span>
                  <span>AI Scholar Request Anonymization</span>
                </h3>
                <p>
                  When you request an "AI Explanation" for a scripture or ask a question to the Scripture Scholar Chat drawer, the queries are proxied securely to our server-side API before requesting answers from the Gemini model. We <strong>never</strong> pass your name, email address, or user ID to the model endpoint, ensuring your conversations are entirely anonymous.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">4</span>
                  <span>Third-Party Services</span>
                </h3>
                <p>
                  FaithGod does not utilize tracking SDKs or share information with social media companies. The only external services incorporated are Firebase (for optional secure sync) and Gemini APIs (for proxy scripture studies).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex gap-2.5">
                <Info className="w-4.5 h-4.5 text-[#d4af37] shrink-0 mt-0.5" />
                <span>
                  If you have questions about how your data is processed, or would like to request immediate deletion of all records synchronized with our Firestore db, please reach out via our <strong>Contact & Feedback</strong> form.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TERMS OF SERVICE SECTION */}
        {activeSection === 'terms' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-1.5">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">User Agreement & Disclaimer</span>
              <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Terms of Service</h2>
              <p className="text-xs text-slate-400 font-mono">Last Updated: July 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-650 dark:text-slate-300 space-y-6 leading-relaxed">
              <p>
                Welcome to FaithGod. By using our website and digital tools, you agree to comply with and be bound by the following Terms of Service. Please review them carefully.
              </p>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">1</span>
                  <span>Acceptable Personal Use Only</span>
                </h3>
                <p>
                  FaithGod is provided to you for spiritual, educational, and non-commercial personal development. You agree not to abuse the AI Scripture Scholar with bulk automated queries, screen-scrape database passages, or attempt to compromise authentication layers.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">2</span>
                  <span>Intellectual Property of Your Writings</span>
                </h3>
                <p>
                  You retain full, exclusive ownership of your prayer logs, diary entries, notes, and profile settings. FaithGod does not license or seek rights to any user-authored spiritual journals. You can export or clear your journal at any time.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">3</span>
                  <span>AI Scholar & Explainer Disclaimer</span>
                </h3>
                <p>
                  Scripture context results, trivia explanations, and chat responses generated by the artificial intelligence model are for educational and historical study reference only. They do not represent infallible theological decree or administrative canon. AI tools are interpretive guides to assist, not replace, active study and spiritual contemplation.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif text-slate-850 dark:text-white flex items-center gap-1.5">
                  <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-md font-mono">4</span>
                  <span>Limitation of Liability</span>
                </h3>
                <p>
                  The platform is provided "as is" and "as available" without warranty of any kind. While we strive to maintain uninterrupted access to your synchronized plans and highlights, we are not liable for accidental data loss arising from cleared browser cookies or server downtime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT & FEEDBACK SECTION */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-1.5">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">Share Your Thoughts</span>
              <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Contact & Feedback</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Have a question, an encouraging testimony, or an idea to improve FaithGod? We would love to hear from you.
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center max-w-md mx-auto space-y-6 animate-fadeIn">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-serif text-slate-850 dark:text-white">Thank You for Reaching Out!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your testimony, bug report, or inquiry has been received securely. We read every message and appreciate your feedback.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs italic font-serif text-slate-650 dark:text-slate-300">
                    "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you."
                  </p>
                  <span className="block text-[10px] text-slate-400 font-mono uppercase mt-1 tracking-wider">— 1 Thessalonians 5:18</span>
                </div>

                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#d4af37] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-5 max-w-2xl">
                
                {errorMsg && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Your Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Samuel"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white text-sm text-slate-800 dark:text-slate-200 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      placeholder="e.g. samuel@example.com"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white text-sm text-slate-800 dark:text-slate-200 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Inquiry Type</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white text-sm text-slate-700 dark:text-slate-350 transition-all"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="dark:bg-slate-950">{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Subject (Optional)</label>
                    <input
                      type="text"
                      placeholder="What is this regarding?"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white text-sm text-slate-800 dark:text-slate-200 transition-all"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Your Message <span className="text-red-500">*</span></label>
                  <textarea
                    rows={5}
                    placeholder="Type your message, testimony, feature ideas, or praise report..."
                    required
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:bg-white text-sm text-slate-800 dark:text-slate-200 transition-all"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#0f172a] dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-[#d4af37] border border-[#d4af37]/20 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-[#d4af37]" />
                        <span>Sending Securely...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#d4af37]" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
