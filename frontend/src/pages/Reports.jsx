import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  ExternalLink,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';

export default function Reports() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, spam: 0, ham: 0 });
  const [latestThreats, setLatestThreats] = useState([]);

  useEffect(() => {
    if (supabase) {
      supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(5)
        .then(({ data }) => {
          const items = data || [];
          setLatestThreats(items);
          const spam = items.filter(i => i.decision === 'SPAM').length;
          setStats({ total: items.length, spam, ham: items.length - spam });
        });
    }
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan-400" />
            Executive Incident Brief & Cyber Advisory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official threat intelligence report formatted for security teams and law enforcement documentation.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-glow self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Structured Security Brief */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            <span className="font-mono uppercase text-slate-500 block">Report Classification</span>
            <span className="font-bold text-white text-sm">RESTRICTED • TELECOM THREAT INTELLIGENCE</span>
          </div>
          <div className="text-right">
            <span className="font-mono uppercase text-slate-500 block">Generation Date</span>
            <span className="font-mono text-cyan-300 font-bold">{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Advisory Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-1">
            <div className="font-bold flex items-center gap-2 text-sm text-red-400">
              <ShieldAlert className="h-4 w-4" /> Cyber Fraud Protocol (India - MHA)
            </div>
            <p className="leading-relaxed">
              If victimized by phishing or unauthorized debit transactions, immediately lodge an alert on the National Cyber Crime Reporting Portal (<span className="font-mono underline">cybercrime.gov.in</span>) or call toll-free helpline <span className="font-bold font-mono text-white">1930</span> within 2 hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
            <div className="font-bold flex items-center gap-2 text-sm text-cyan-400">
              <ShieldCheck className="h-4 w-4" /> TRAI DLT Verification Standard
            </div>
            <p className="leading-relaxed">
              Legitimate commercial banking notifications in India require a registered 6-character alpha header prefixed with an operator circle code (e.g., <span className="font-mono font-bold text-white">AD-HDFCBK</span>, <span className="font-mono font-bold text-white">VK-SBIBNK</span>). Unregistered 10-digit mobile numbers sending banking alerts are fraudulent.
            </p>
          </div>
        </div>

        {/* Recent Cataloged Threats */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Recent Incident Catalog
          </h3>
          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60">
            {latestThreats.map((threat, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{threat.sender || 'UNKNOWN'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      threat.decision === 'SPAM' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {threat.decision}
                    </span>
                  </div>
                  <p className="text-slate-400 max-w-lg truncate">{threat.message_text || '(Screenshot Analysis)'}</p>
                </div>
                <div className="text-right font-mono text-slate-400">
                  Risk: <span className="text-white font-bold">{Math.round((threat.risk_score || 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
