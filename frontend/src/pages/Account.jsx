import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock,
  Database,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../App';
import { signOut, supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handlePasswordReset = async () => {
    if (!user?.email || !supabase) return;
    setResetting(true);
    setMessage(null);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (resetErr) throw resetErr;
      setMessage('Password reset email dispatched! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to trigger password recovery.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-[#0d1527] border border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
        <User className="h-12 w-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Not Signed In</h2>
        <p className="text-xs text-slate-400">
          Sign in or create an account to view and manage your cryptographic session credentials.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Profile Overview Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-glow">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-mono">{user.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Session</span>
          </button>
        </div>

        {/* Security Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">Unique Cryptographic User ID</span>
            <div className="font-mono text-cyan-300 break-all">{user.id}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">Account Creation Date</span>
            <div className="font-mono text-slate-300">
              {user.created_at ? new Date(user.created_at).toLocaleString() : 'Active'}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Reset Action */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" /> Password Management
            </h4>
            <p className="text-xs text-slate-400">
              Send a cryptographically signed recovery token to your registered email.
            </p>
          </div>

          <button
            onClick={handlePasswordReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <Lock className="h-4 w-4" />}
            <span>{resetting ? 'Sending...' : 'Send Password Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
