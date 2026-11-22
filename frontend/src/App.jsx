import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Demo from './pages/Demo';
import About from './pages/About';
import Help from './pages/Help';
import Auth from './pages/Auth';
import { supabase, isSupabaseConfigured } from './services/supabase';

// Global auth context — avoids each page calling getCurrentUser() independently
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

    // 1. Get the current session on mount (handles page refresh / browser reopen)
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
    <AuthContext.Provider value={{ user, loading: authLoading }}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-orange-100 selection:text-orange-900">
          <Navbar />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
