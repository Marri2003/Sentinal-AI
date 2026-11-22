import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Scan, 
  History, 
  BarChart3, 
  FileText, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../App';
import { signOut } from '../services/supabase';
import { checkBackendHealth } from '../services/sentinelApi';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    checkBackendHealth()
      .then(setBackendOnline)
      .catch(() => setBackendOnline(false));

    // Periodic heartbeat every 45s
    const interval = setInterval(() => {
      checkBackendHealth()
        .then(setBackendOnline)
        .catch(() => setBackendOnline(false));
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scan & Analyze', path: '/analyze', icon: Scan, badge: 'AI' },
    { name: 'Detection History', path: '/history', icon: History },
    { name: 'Security Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Incident Reports', path: '/reports', icon: FileText },
    { name: 'My Account', path: '/account', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Docs', path: '/help', icon: HelpCircle },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0f1d] border-r border-slate-800/80 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400 shadow-glow">
            <ShieldCheck className="h-6 w-6 text-cyan-400 group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                SENTINEL<span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Threat Intel Cloud
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Backend Engine Live Status */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Activity className="h-3.5 w-3.5 text-cyan-400" /> AI Microservice:
          </span>
          <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            backendOnline === null
              ? 'text-slate-400 bg-slate-800'
              : backendOnline
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {backendOnline === null ? 'Pinging...' : backendOnline ? 'Operational' : 'Degraded'}
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {user.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/auth"
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" />
            {!collapsed && <span>Sign In / Register</span>}
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className={`hidden md:block sticky top-0 h-screen transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
