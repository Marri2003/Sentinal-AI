import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Scan, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Zap, 
  Lock,
  Database,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../App';
import { supabase, isSupabaseConfigured, getUserScans, getCommunitySpamCount } from '../services/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    phishingCount: 0,
    legitimateCount: 0,
    suspiciousCount: 0,
    avgThreatScore: 0,
  });
  const [recentScans, setRecentScans] = useState([]);
  const [communityThreats, setCommunityThreats] = useState(0);

  useEffect(() => {
    fetchDashboardData();

    // Listen for instant reactive updates when a scan completes anywhere in the app
    const handleScanCompleted = () => {
      fetchDashboardData();
    };

    window.addEventListener('sentinel_scan_completed', handleScanCompleted);
    return () => {
      window.removeEventListener('sentinel_scan_completed', handleScanCompleted);
    };
  }, [user?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user-specific scan records via unified dual-tier service (cloud + local sync)
      const userRecords = await getUserScans(user?.id || null);

      // 2. Calculate actual real statistics from database rows
      const total = userRecords.length;
      let phishing = 0;
      let legitimate = 0;
      let suspicious = 0;
      let scoreSum = 0;

      userRecords.forEach((item) => {
        const score = typeof item.risk_score === 'number' ? item.risk_score : 0;
        scoreSum += score;
        if (item.decision === 'SPAM') {
          phishing++;
        } else if (score >= 0.35 && score < 0.6) {
          suspicious++;
        } else {
          legitimate++;
        }
      });

      setStats({
        totalScans: total,
        phishingCount: phishing,
        legitimateCount: legitimate,
        suspiciousCount: suspicious,
        avgThreatScore: total > 0 ? Math.round((scoreSum / total) * 100) : 0,
      });

      setRecentScans(userRecords.slice(0, 6));

      // 3. Query community spam intelligence count
      const commTelemetry = await getCommunitySpamCount();
      setCommunityThreats(commTelemetry.count || phishing || 0);
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Security Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#070b14] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span>LIVE DEFENSE TELEMETRY</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              AI-Powered Threat Protection Center
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Real-time deep multi-modal smishing analysis running XLM-RoBERTa cross-lingual transformers, Tesseract OCR screenshot extraction, and late decision fusion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
            <Link
              to="/analyze"
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition shadow-glow flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              <span>Launch Threat Scan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards (Actual Database Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scanned */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans Run</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-white">
              {loading ? '...' : stats.totalScans}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Personal scan audit history</span>
            </div>
          </div>
        </div>

        {/* Phishing Threats Detected */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-red-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Phishing Detected</span>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-red-400">
              {loading ? '...' : stats.phishingCount}
            </div>
            <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1.5">
              <span>High severity smishing attacks</span>
            </div>
          </div>
        </div>

        {/* Legitimate Messages (Ham) */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Legitimate (Ham)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {loading ? '...' : stats.legitimateCount}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1.5">
              <span>Verified benign notifications</span>
            </div>
          </div>
        </div>

        {/* Average Threat Score / Risk Index */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Avg Risk Score</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-amber-400">
              {loading ? '...' : `${stats.avgThreatScore}%`}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1.5">
              <span>Multi-modal fused risk average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid: Security Breakdown & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-[#0d1527] border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" /> Threat Classification Ratio
            </h3>
            <p className="text-xs text-slate-400">Actual database distribution for this account</p>
          </div>

          {stats.totalScans === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Database className="h-8 w-8 mx-auto text-slate-600" />
              <div className="text-xs font-semibold">No scan telemetry recorded yet</div>
              <Link to="/analyze" className="text-xs text-cyan-400 hover:underline inline-block">
                Run your first analysis →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Phishing bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Phishing / Smishing
                  </span>
                  <span className="font-mono text-red-400 font-bold">
                    {Math.round((stats.phishingCount / stats.totalScans) * 100)}% ({stats.phishingCount})
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${(stats.phishingCount / stats.totalScans) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Legitimate bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Legitimate (Ham)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round((stats.legitimateCount / stats.totalScans) * 100)}% ({stats.legitimateCount})
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(stats.legitimateCount / stats.totalScans) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Community telemetry pill */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-cyan-400" />
                    <span>Crowdsourced Community Intelligence</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-white">{communityThreats}</span> total confirmed phishing vectors cataloged across the SentinelAI telemetry network.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/analytics"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <span>View Deep Telemetry Patterns</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Scan Incidents Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0d1527] border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" /> Recent Threat Scans
              </h3>
              <p className="text-xs text-slate-400">Latest analyzed messages from your database</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              View Full History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <Scan className="h-10 w-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-400">No scans recorded yet</div>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                Paste suspicious SMS messages, sender headers, or upload screenshots to begin building your detection history.
              </p>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition"
              >
                Scan Message Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Sender</th>
                    <th className="pb-3">Content Excerpt</th>
                    <th className="pb-3 text-center">Threat Risk</th>
                    <th className="pb-3 text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentScans.map((scan) => {
                    const isSpam = scan.decision === 'SPAM';
                    return (
                      <tr key={scan.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-200">
                          {scan.sender || 'UNKNOWN'}
                        </td>
                        <td className="py-3 text-slate-300 max-w-xs truncate pr-4">
                          {scan.message_text || '(Screenshot OCR analysis)'}
                        </td>
                        <td className="py-3 text-center font-mono font-bold">
                          <span className={isSpam ? 'text-red-400' : 'text-emerald-400'}>
                            {Math.round((scan.risk_score || 0) * 100)}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                            isSpam
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {scan.decision}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
