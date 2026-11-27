import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Analyze', path: '/analyze' },
    { name: 'Demo Showcase', path: '/demo' },
    { name: 'Architecture', path: '/architecture' },
    { name: 'About', path: '/about' },
    { name: 'Help & FAQ', path: '/help' },
    { name: 'Account & History', path: '/auth' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-100 rounded-xl text-primary">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Sentinel<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-primary hover:bg-slate-50 rounded-full transition"
          >
            Sign In / History
          </Link>
          <Link
            to="/analyze"
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-orange-600 rounded-full transition-all shadow-sm hover:shadow flex items-center gap-1.5"
          >
            Scan Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-orange-50 text-primary'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              to="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-full text-center text-xs font-bold uppercase tracking-wider text-white bg-primary block"
            >
              Scan Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
