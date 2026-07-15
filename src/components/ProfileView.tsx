import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, LogIn, LogOut, UserPlus, Key, Check, 
  ShieldCheck, AlertCircle, RefreshCw, Calendar, Bookmark, Heart, Award, Edit2
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ProfileViewProps {
  onAuthChange?: (user: FirebaseUser | null) => void;
  favoritesCount: number;
  prayersCount: number;
}

export default function ProfileView({ onAuthChange, favoritesCount, prayersCount }: ProfileViewProps) {
  // Current user state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  // Sync state
  const [syncCount, setSyncCount] = useState({ favorites: 0, prayers: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (onAuthChange) onAuthChange(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Fetch stats if available
        fetchUserStats(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserStats = async (uid: string) => {
    try {
      // We can check Firestore to see if any user data is synchronized
      const favsRef = collection(db, 'favorites');
      const qFavs = query(favsRef, where('userId', '==', uid));
      const favsSnap = await getDocs(qFavs);

      const prayersRef = collection(db, 'prayers');
      const qPrayers = query(prayersRef, where('userId', '==', uid));
      const prayersSnap = await getDocs(qPrayers);

      setSyncCount({
        favorites: favsSnap.size,
        prayers: prayersSnap.size
      });
    } catch (e) {
      console.warn("Firestore count query failed:", e);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      setSuccessMessage('Successfully signed in with Google!');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('The Sign-In popup was blocked by your browser. Please allow popups for this site or try again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-In popup was closed before completion. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
    setSuccessMessage(null);
    setActionLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage('Successfully signed in!');
      // Clear forms
      setPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      setUser({ ...userCredential.user, displayName }); // Local update trigger
      setSuccessMessage('Account successfully created! Welcome to FaithGod.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err.message || 'Failed to register account.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSuccessMessage('Signed out successfully.');
    } catch (err: any) {
      setError('Failed to sign out.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !user) return;

    setError(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      await updateProfile(user, {
        displayName: newDisplayName
      });
      setUser({ ...user, displayName: newDisplayName });
      setSuccessMessage('Profile name updated successfully.');
      setIsEditingProfile(false);
    } catch (err: any) {
      setError('Failed to update profile name.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-[#0f172a] dark:text-[#d4af37] animate-spin" />
        <p className="text-stone-500 dark:text-slate-400 text-sm">Loading security state...</p>
      </div>
    );
  }

  // If user is logged in
  if (user) {
    return (
      <div id="profile-container" className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header Theme Banner */}
          <div className="h-32 bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 relative flex items-end p-6 border-b border-[#e2e8f0] dark:border-slate-800">
            <div className="absolute right-4 top-4 bg-[#ca8a04]/20 border border-[#ca8a04]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#d4af37] flex items-center gap-1.5 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Firebase Verified</span>
            </div>
            {/* User Icon Circle */}
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-[#0f172a] dark:text-[#d4af37] absolute -bottom-10 left-6">
              <span className="font-serif font-black text-2xl uppercase">
                {user.displayName ? user.displayName.substring(0, 2) : (user.email ? user.email.substring(0, 2) : 'FG')}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="pt-14 pb-6 px-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0f172a] dark:text-slate-100 font-serif flex items-center gap-2">
                  <span>{user.displayName || 'Faithful Companion'}</span>
                </h2>
                <p className="text-sm text-stone-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                  <span>{user.email}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-edit-profile"
                  onClick={() => {
                    setIsEditingProfile(!isEditingProfile);
                    setNewDisplayName(user.displayName || '');
                  }}
                  className="px-4 py-2 border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
                <button
                  id="btn-logout"
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {isEditingProfile && (
              <form onSubmit={handleUpdateProfile} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 animate-fadeIn">
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-400 font-mono">NEW DISPLAY NAME</label>
                <div className="flex gap-2">
                  <input
                    id="profile-display-name-input"
                    type="text"
                    className="flex-1 px-3 py-2 text-xs border border-stone-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    placeholder="Enter your name"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0f172a] dark:bg-slate-800 text-[#d4af37] text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 text-green-800 dark:text-green-400 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sync / Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 dark:text-slate-500 font-mono block">HIGHLIGHTS</span>
              <span className="text-xl font-bold text-stone-800 dark:text-slate-100">{favoritesCount}</span>
              <span className="text-[10px] text-green-600 dark:text-green-400 block">✓ Synced</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 dark:text-slate-500 font-mono block">PRAYER LOGS</span>
              <span className="text-xl font-bold text-stone-800 dark:text-slate-100">{prayersCount}</span>
              <span className="text-[10px] text-green-600 dark:text-green-400 block">✓ Synced</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 dark:text-slate-500 font-mono block">READING PLANS</span>
              <span className="text-xl font-bold text-stone-800 dark:text-slate-100">Active</span>
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block">Local storage backup</span>
            </div>
          </div>
        </div>

        {/* Firestore Persistence Note */}
        <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-[#0f172a] dark:text-[#d4af37] block">Secure Cloud Persistence Enabled</span>
            <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
              Because you are authenticated with Firebase, your reading stats, personal scripture bookmarks, and prayer journal records are durably saved to our secure Firestore cloud database. Your profile data syncs automatically across any browser session!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in (Show Auth Form)
  return (
    <div id="auth-container" className="max-w-md mx-auto py-8">
      <div className="bg-white dark:bg-[#0f172a] border border-[#e7e5e4] dark:border-slate-800 rounded-3xl p-8 shadow-md space-y-6">
        
        {/* Header styling with Navy and Gold accents */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f172a] dark:bg-slate-900 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] mx-auto shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-extrabold text-[#0f172a] dark:text-slate-100">
            {isForgotPassword 
              ? 'Reset Your Password' 
              : (isSignUp ? 'Create FaithGod Account' : 'Welcome Back')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            {isForgotPassword
              ? 'Enter your email to receive a secure recovery link'
              : (isSignUp ? 'Sign up to synchronize your prayers and scripture study records' : 'Sign in to access your saved Bible highlights and prayer logs')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 text-green-800 dark:text-green-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forgot Password Flow */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 font-mono uppercase block">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 dark:border-slate-800 rounded-xl bg-stone-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131f42] focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              id="btn-send-reset"
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 bg-[#0f172a] dark:bg-slate-900 hover:bg-slate-800 text-[#d4af37] hover:text-[#f39c12] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-[#d4af37]/20"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Send Recovery Link</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-[#0f172a] dark:text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Sign In & Sign Up Form */
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 font-mono uppercase block">YOUR NAME</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400 dark:text-slate-500" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 dark:border-slate-800 rounded-xl bg-stone-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131f42] focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 transition-all"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 font-mono uppercase block">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 dark:border-slate-800 rounded-xl bg-stone-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131f42] focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 font-mono uppercase block">PASSWORD</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[10px] text-stone-400 dark:text-slate-500 hover:text-[#0f172a] dark:hover:text-[#d4af37] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 dark:border-slate-800 rounded-xl bg-stone-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131f42] focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-700 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 bg-[#0f172a] dark:bg-slate-900 hover:bg-slate-800 text-[#d4af37] hover:text-[#f39c12] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-[#d4af37]/20"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />
              )}
              <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-stone-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-stone-400 dark:text-slate-500 text-[10px] font-bold font-mono">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-stone-200 dark:border-slate-800"></div>
            </div>

            {/* Google Sign-In Button */}
            <button
              id="btn-google-signin"
              type="button"
              disabled={actionLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs border border-stone-200 dark:border-slate-800"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Switch Mode Button */}
            <div className="text-center pt-2">
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#0f172a] dark:text-[#d4af37] hover:underline font-bold cursor-pointer bg-transparent border-none"
                >
                  {isSignUp ? 'Sign In Here' : 'Create One Free'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
