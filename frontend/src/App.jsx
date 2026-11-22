import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Account from './pages/Account';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Auth from './pages/Auth';
import Demo from './pages/Demo';
import { supabase, isSupabaseConfigured } from './services/supabase';

// Lazy load About & Architecture section for clean code-splitting
const About = lazy(() => import('./pages/About'));

// Page loading skeleton fallback
function PageFallback() {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
      <p className="text-sm text-slate-400 font-mono">Loading SentinelAI Module...</p>
    </div>
  );
}

// Global auth context — avoids duplicate getCurrentUser calls
export const AuthContext = createContext({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    // 1. Get current session on mount (reads from localStorage instantly)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // 2. Listen to sign-in / sign-out / token refresh events globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, loading: authLoading }}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route 
                path="/about" 
                element={
                  <Suspense fallback={<PageFallback />}>
                    <About />
                  </Suspense>
                } 
              />
              <Route 
                path="/architecture" 
                element={
                  <Suspense fallback={<PageFallback />}>
                    <About defaultTab="architecture" />
                  </Suspense>
                } 
              />
              <Route path="/demo" element={<Demo />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}
