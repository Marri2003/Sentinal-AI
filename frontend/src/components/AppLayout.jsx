import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, ShieldAlert, Zap, Globe, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return { title: 'Executive Threat Dashboard', subtitle: 'Live multi-modal phishing analytics & telemetry' };
      case '/analyze':
        return { title: 'Deep Threat Scanner', subtitle: 'Analyze text, metadata, and screenshots with XLM-RoBERTa & OCR' };
      case '/history':
        return { title: 'Detection Logs & Threat Audit', subtitle: 'Query, filter, export, and manage historical scan incidents' };
      case '/analytics':
        return { title: 'Security Analytics & Threat Patterns', subtitle: 'Telecom spoofing metrics and community threat vectors' };
      case '/reports':
        return { title: 'Incident Response Reports', subtitle: 'Generate structured cyber intelligence briefs' };
      case '/account':
        return { title: 'Identity & Access Management', subtitle: 'Manage your Supabase cryptographic session and credentials' };
      case '/settings':
        return { title: 'Platform Settings', subtitle: 'Configure detection thresholds and API integrations' };
      case '/help':
        return { title: 'Documentation & Knowledge Base', subtitle: 'Architecture specs, API reference, and FAQ' };
      case '/auth':
        return { title: 'Authentication Portal', subtitle: 'Sign in or register for cryptographic telemetry tracking' };
      default:
        return { title: 'SentinelAI Platform', subtitle: 'AI-Powered Multi-Modal Phishing Defense' };
    }
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-800/80 bg-[#0a0f1d]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
                {pageInfo.title}
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-400">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/analyze"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-glow flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Quick Scan</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 md:px-8 border-t border-slate-800/60 bg-[#0a0f1d]/40 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            <span>SentinelAI v2.0 • Defense Grade Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>FastAPI & XLM-RoBERTa Engine</span>
            <span>•</span>
            <span>Supabase PostgreSQL RLS</span>
            <span>•</span>
            <Link to="/help" className="text-cyan-400 hover:underline">API Docs</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
