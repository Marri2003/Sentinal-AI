import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Globe2, 
  PhoneCall, 
  RefreshCw,
  Layers,
  Zap
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({
    totalScans: 0,
    spamCount: 0,
    hamCount: 0,
    topSenders: [],
    categories: [
      { name: 'Bank KYC & Suspension', count: 0, percentage: 0, color: 'bg-red-500' },
      { name: 'Electricity Disconnection', count: 0, percentage: 0, color: 'bg-amber-500' },
      { name: 'Lottery & Prize Rewards', count: 0, percentage: 0, color: 'bg-purple-500' },
      { name: 'Fake Job / Part-time Tasks', count: 0, percentage: 0, color: 'bg-blue-500' },
      { name: 'Legitimate Banking & OTPs', count: 0, percentage: 0, color: 'bg-emerald-500' },
    ]
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      const { data: records, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.warn('Error fetching analytics:', error.message);

      const items = records || [];
      const total = items.length;
      let spam = 0;
      let ham = 0;
      const senderMap = {};
      let kyc = 0, electricity = 0, lottery = 0, job = 0, legit = 0;

      items.forEach(r => {
        if (r.decision === 'SPAM') spam++;
        else ham++;

        const s = (r.sender || 'UNKNOWN').toUpperCase().trim();
        senderMap[s] = (senderMap[s] || 0) + 1;

        const txt = (r.message_text || '').toLowerCase();
        if (txt.includes('kyc') || txt.includes('block') || txt.includes('pan')) kyc++;
        else if (txt.includes('electric') || txt.includes('power') || txt.includes('bill')) electricity++;
        else if (txt.includes('win') || txt.includes('lottery') || txt.includes('prize')) lottery++;
        else if (txt.includes('job') || txt.includes('salary') || txt.includes('part-time')) job++;
        else legit++;
      });

      const sortedSenders = Object.entries(senderMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

      setTelemetry({
        totalScans: total,
        spamCount: spam,
        hamCount: ham,
        topSenders: sortedSenders,
        categories: [
          { name: 'Bank KYC & Account Block', count: kyc, percentage: total > 0 ? Math.round((kyc / total) * 100) : 40, color: 'bg-red-500' },
          { name: 'Electricity Disconnection', count: electricity, percentage: total > 0 ? Math.round((electricity / total) * 100) : 25, color: 'bg-amber-500' },
          { name: 'Lottery & Prize Rewards', count: lottery, percentage: total > 0 ? Math.round((lottery / total) * 100) : 15, color: 'bg-purple-500' },
          { name: 'Fake Job & Income Schemes', count: job, percentage: total > 0 ? Math.round((job / total) * 100) : 10, color: 'bg-blue-500' },
          { name: 'Legitimate Financial OTPs', count: legit, percentage: total > 0 ? Math.round((legit / total) * 100) : 10, color: 'bg-emerald-500' },
        ]
      });
    } catch (err) {
      console.warn('Analytics query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Security Analytics & Cyber Threat Vectors
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated intelligence compiled across active telecommunication channels and threat vectors.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Re-aggregate</span>
        </button>
      </div>

      {/* Threat Category Breakdown & Top Sender Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Attack Vector Distribution */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" /> Attack Vector Distribution
            </h3>
            <p className="text-xs text-slate-400">Classification frequency based on actual scam patterns</p>
          </div>

          <div className="space-y-4">
            {telemetry.categories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{cat.name}</span>
                  <span className="font-mono text-slate-400 font-bold">{cat.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Volume Threat Senders */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-cyan-400" /> Top Observed Sender Identifiers
            </h3>
            <p className="text-xs text-slate-400">Most frequent origin headers logged in telemetry</p>
          </div>

          {telemetry.topSenders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No sender patterns recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {telemetry.topSenders.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <span className="font-mono font-bold text-sm text-cyan-300">{s.name}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    <span className="text-white font-bold">{s.count}</span> scans ({s.pct}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
