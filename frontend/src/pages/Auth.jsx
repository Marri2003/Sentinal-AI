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
  ArrowRight,
  LayoutDashboard
} from 'lucide-react';
import { 
  signIn, 
  signUp, 
  signOut, 
  resendConfirmation,
  isSupabaseConfigured 
} from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Auth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResendMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginErr } = await signIn(email, password);
        if (loginErr) throw loginErr;
        setMessage('Authenticated successfully. Redirecting...');
        setTimeout(() => navigate('/dashboard'), 600);
      } else {
        const { data, error: signupErr } = await signUp(email, password, fullName);
        if (signupErr) throw signupErr;
        
        if (data?.session) {
          setMessage('Account created and verified! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 600);
        } else {
          setMessage('Account registered! Please check your inbox to confirm your email before signing in.');
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many') || err.status === 429) {
        setError('Authentication rate limit reached. Please wait 60 seconds before retrying.');
      } else {
        setError(msg || 'Authentication operation failed.');
      }
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
    setMessage('Logged out successfully.');
  };

  if (authLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // 1. If User is Logged In -> Show Authenticated Portal
  if (user) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-[#0d1527] border border-slate-800 text-center space-y-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-glow">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-2xs font-bold uppercase tracking-wider">
              Active Cryptographic Session
            </span>
            <h1 className="text-2xl font-black text-white pt-2">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </h1>
            <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-cyan-400" /> {user.email}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to="/dashboard"
              className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-2 text-xs font-bold transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Go to Threat Dashboard</span>
            </Link>

            <Link
              to="/history"
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center gap-2 text-xs font-bold transition"
            >
              <History className="h-4 w-4 text-cyan-400" />
              <span>View Scan History</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4">
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Login / Sign Up Form
  return (
    <div className="max-w-md mx-auto py-8 animate-in fade-in duration-300">
      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <Database className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Supabase Setup Required</div>
            <div className="text-slate-400 mt-1">
              Add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to connect user accounts to PostgreSQL.
            </div>
          </div>
        </div>
      )}

      <div className="p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-2 shadow-glow">
            <ShieldCheck className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isLogin ? 'Security Portal Sign In' : 'Register Operator Account'}
          </h1>
          <p className="text-xs text-slate-400">
            {isLogin
              ? 'Access real-time telemetry, threat logs, and history'
              : 'Join SentinelAI community threat intelligence network'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              isLogin ? 'bg-[#0a0f1d] text-cyan-400 shadow-sm border border-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              !isLogin ? 'bg-[#0a0f1d] text-cyan-400 shadow-sm border border-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('email not confirmed') && (
              <div className="pt-2 border-t border-red-500/20 flex flex-col gap-2 text-slate-300">
                <p>
                  Your account requires email verification. Check your inbox and spam folder for the confirmation link.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResendConfirmation}
                    className="px-3 py-1.5 bg-cyan-500 text-slate-950 rounded-lg text-2xs font-black uppercase tracking-wider hover:bg-cyan-400 disabled:opacity-50 transition"
                  >
                    {resending ? 'Sending...' : 'Resend Confirmation Email'}
                  </button>
                  {resendMessage && (
                    <span className="text-emerald-400 font-semibold">{resendMessage}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required={!isLogin}
                  placeholder="Officer / Analyst Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="analyst@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold tracking-wide transition shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Security Token...</span>
              </>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In Session</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Operator Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
