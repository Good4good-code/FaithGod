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
  User as FirebaseUser
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
        <RefreshCw className="w-8 h-8 text-[#0f172a] animate-spin" />
        <p className="text-stone-500 text-sm">Loading security state...</p>
      </div>
    );
  }

  // If user is logged in
  if (user) {
    return (
      <div id="profile-container" className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden shadow-sm">
          {/* Header Theme Banner */}
          <div className="h-32 bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] relative flex items-end p-6 border-b border-[#e2e8f0]">
            <div className="absolute right-4 top-4 bg-[#ca8a04]/20 border border-[#ca8a04]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#d4af37] flex items-center gap-1.5 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Firebase Verified</span>
            </div>
            {/* User Icon Circle */}
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-[#0f172a] absolute -bottom-10 left-6">
              <span className="font-serif font-black text-2xl uppercase">
                {user.displayName ? user.displayName.substring(0, 2) : (user.email ? user.email.substring(0, 2) : 'FG')}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="pt-14 pb-6 px-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0f172a] font-serif flex items-center gap-2">
                  <span>{user.displayName || 'Faithful Companion'}</span>
                </h2>
                <p className="text-sm text-stone-500 font-mono flex items-center gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
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
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
                <button
                  id="btn-logout"
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {isEditingProfile && (
              <form onSubmit={handleUpdateProfile} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                <label className="block text-xs font-bold text-stone-600 font-mono">NEW DISPLAY NAME</label>
                <div className="flex gap-2">
                  <input
                    id="profile-display-name-input"
                    type="text"
                    className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                    placeholder="Enter your name"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0f172a] text-[#d4af37] text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sync / Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 font-mono block">HIGHLIGHTS</span>
              <span className="text-xl font-bold text-stone-800">{favoritesCount}</span>
              <span className="text-[10px] text-green-600 block">✓ Synced</span>
            </div>
          </div>

          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 font-mono block">PRAYER LOGS</span>
              <span className="text-xl font-bold text-stone-800">{prayersCount}</span>
              <span className="text-[10px] text-green-600 block">✓ Synced</span>
            </div>
          </div>

          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 font-mono block">READING PLANS</span>
              <span className="text-xl font-bold text-stone-800">Active</span>
              <span className="text-[10px] text-stone-500 block">Local storage backup</span>
            </div>
          </div>
        </div>

        {/* Firestore Persistence Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-[#0f172a] block">Secure Cloud Persistence Enabled</span>
            <p className="text-stone-600 leading-relaxed">
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
      <div className="bg-white border border-[#e7e5e4] rounded-3xl p-8 shadow-md space-y-6">
        
        {/* Header styling with Navy and Gold accents */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f172a] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] mx-auto shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-extrabold text-[#0f172a]">
            {isForgotPassword 
              ? 'Reset Your Password' 
              : (isSignUp ? 'Create FaithGod Account' : 'Welcome Back')}
          </h2>
          <p className="text-xs text-stone-500">
            {isForgotPassword
              ? 'Enter your email to receive a secure recovery link'
              : (isSignUp ? 'Sign up to synchronize your prayers and scripture study records' : 'Sign in to access your saved Bible highlights and prayer logs')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forgot Password Flow */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 font-mono uppercase block">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
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
              className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-[#d4af37] hover:text-[#f39c12] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-[#d4af37]/20"
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
                className="text-xs text-[#0f172a] hover:underline font-semibold cursor-pointer"
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
                <label className="text-[11px] font-bold text-stone-500 font-mono uppercase block">YOUR NAME</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 font-mono uppercase block">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-stone-500 font-mono uppercase block">PASSWORD</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[10px] text-stone-400 hover:text-[#0f172a] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
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
              className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-[#d4af37] hover:text-[#f39c12] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-[#d4af37]/20"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />
              )}
              <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
            </button>

            {/* Switch Mode Button */}
            <div className="text-center pt-2">
              <p className="text-xs text-stone-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#0f172a] hover:underline font-bold cursor-pointer"
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
