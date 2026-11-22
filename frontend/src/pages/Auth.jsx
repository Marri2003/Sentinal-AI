import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  LogIn, 
  UserPlus, 
  LogOut, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Database,
  ArrowRight
} from 'lucide-react';
import { 
  signIn, 
  signUp, 
  signOut, 
  resendConfirmation,
  getUserScanHistory, 
  isSupabaseConfigured 
} from '../services/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function Auth() {
  const { user, loading: authLoading } = useAuth(); // Use global auth — no duplicate getCurrentUser calls
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load history when user becomes available (from global auth context)
  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [user]); // Re-runs whenever the global auth state changes

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const records = await getUserScanHistory(15);
      setHistory(records);
    } catch (err) {
      console.warn('History load error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: authError } = await signIn(email, password);
        if (authError) throw authError;
        setMessage('Signed in successfully!');
        // Global auth context (App.jsx) will update `user` automatically via onAuthStateChange
        // No need to manually setUser() — the useEffect above watching `user` triggers loadHistory()
      } else {
        const { data, error: authError } = await signUp(email, password, fullName);
        if (authError) throw authError;
        setMessage('Registration successful! Please check your email if confirmation is enabled, or sign in.');
        // If email confirmation is disabled in Supabase, the user is immediately set by onAuthStateChange
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError('Please enter your email address in the field below to resend confirmation.');
      return;
    }
    setResending(true);
    setResendMessage(null);
    try {
      const { error: resendErr } = await resendConfirmation(email.trim());
      if (resendErr) throw resendErr;
      setResendMessage('Verification email sent! Check your inbox & spam folder.');
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation link.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    // Global auth context will clear `user` via onAuthStateChange
    setHistory([]);
    setMessage('Logged out successfully.');
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. If User is Logged In -> Show Dashboard & Scan History
  if (user) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        {/* User Profile Header */}
        <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-primary flex items-center justify-center font-bold text-xl">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/analyze"
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-orange-600 transition flex items-center gap-1.5 shadow-sm"
            >
              New Scan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Scan History Section */}
        <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> My Scan History & Threats
            </h2>
            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading database records...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium">No previous scans recorded yet.</p>
              <Link
                to="/analyze"
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                Scan an SMS message or screenshot now →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Sender</th>
                    <th className="pb-3">Message Excerpt</th>
                    <th className="pb-3">Risk Score</th>
                    <th className="pb-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => {
                    const isSpam = item.decision === 'SPAM';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">
                          {item.sender || 'Unknown'}
                        </td>
                        <td className="py-3 text-slate-600 max-w-xs truncate">
                          {item.message_text || '(Screenshot OCR analysis)'}
                        </td>
                        <td className="py-3">
                          <span className={`text-xs font-bold ${isSpam ? 'text-red-500' : 'text-green-600'}`}>
                            {Math.round((item.risk_score || 0) * 100)}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase ${
                              isSpam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {item.decision}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Login / Sign Up Form
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      {/* Notice if Supabase keys not set */}
      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Database className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Supabase Setup Required</div>
            <div className="text-slate-600 mt-1">
              Add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> to connect user accounts to your Supabase PostgreSQL database.
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-3xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-orange-100 rounded-2xl text-primary mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {isLogin
              ? 'Sign in to access your scam reports and history'
              : 'Join SentinelAI community protection network'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              !isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('email not confirmed') && (
              <div className="pt-2 border-t border-red-200/60 flex flex-col gap-2 text-slate-700">
                <p>
                  Your account requires email verification. Check your inbox and spam folder for the confirmation link.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResendConfirmation}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-2xs font-bold uppercase tracking-wider hover:bg-orange-600 disabled:opacity-50 transition shadow-xs"
                  >
                    {resending ? 'Sending...' : 'Resend Confirmation Email'}
                  </button>
                  {resendMessage && (
                    <span className="text-green-700 font-semibold">{resendMessage}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required={!isLogin}
                  placeholder="Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
