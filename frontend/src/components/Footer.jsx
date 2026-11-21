import React from 'react';
import { Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-20 border-t border-slate-800">
      <div className="container mx-auto px-4 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-white text-lg">SentinelAI</span>
        </div>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Multi-Modal Phishing & Smishing Detection System powered by XLM-RoBERTa, OCR image analysis, and metadata fusion.
        </p>
        <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
          © {new Date().getFullYear()} SentinelAI. Protecting users against fraud.
        </div>
      </div>
    </footer>
  );
}
