import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  Compass, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Building2, 
  CreditCard, 
  KeyRound, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function SafetyAdvisoryCard({ advisoryData, classification }) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!advisoryData) return null;

  const advisory = advisoryData.advisory || advisoryData;
  const level = (advisory.advisory_level || 'LOW').toUpperCase();
  const warningSigns = advisory.warning_signs || [];
  const precautions = advisory.recommended_precautions || [];
  const explanation = advisory.contextual_explanation || '';
  const verification = advisory.verification_recommendation || '';
  const source = advisoryData.advisory_source || 'DETERMINISTIC_ADVISORY_ENGINE';

  // Visual Theme Based on Advisory Level
  const theme = {
    HIGH: {
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      border: 'border-rose-500/30 hover:border-rose-500/50',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      accentText: 'text-rose-400',
      levelText: 'High Advisory Risk'
    },
    MODERATE: {
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      accentText: 'text-amber-400',
      levelText: 'Moderate Advisory Risk'
    },
    LOW: {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      accentText: 'text-emerald-400',
      levelText: 'Low Advisory Risk'
    }
  }[level] || {
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    border: 'border-slate-800',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    accentText: 'text-cyan-400',
    levelText: 'Advisory Guidance'
  };

  const handleCopy = () => {
    const textToCopy = `[Sentinel-AI Safety Advisory]\nLevel: ${level}\n\nContext: ${explanation}\n\nVerification Protocol:\n${verification}\n\nPrecautions:\n${precautions.map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-3xl bg-[#0d1527] border ${theme.border} p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden transition-all duration-300 animate-in fade-in`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${theme.iconBg} ${theme.iconColor} border`}>
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                AI Safety Advisory
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${theme.badgeBg}`}>
                {theme.levelText}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proactive fraud education & precautions — works for both legitimate and phishing predictions.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            title="Copy Safety Advisory"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy Advisory'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Collapse Advisory' : 'Expand Advisory'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Precautionary Context Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Independent Safety Assessment
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>

          {/* Warning Signs Grid (if warning signs were isolated) */}
          {warningSigns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${theme.accentText}`} />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Identified Warning Signs ({warningSigns.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {warningSigns.map((sign, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-[#090e1c] border border-slate-800/90 space-y-1.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${sign.severity === 'HIGH' ? 'bg-rose-500' : sign.severity === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {sign.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                        {sign.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {sign.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Precautions Checklist */}
          {precautions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Recommended Precautions
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {precautions.map((precaution, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{precaution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Protocol Recommendation */}
          {verification && (
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-3">
              <Building2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Official Verification Protocol
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {verification}
                </p>
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Advisory Engine: {source === 'LLM' ? 'Groq Llama 3.1 Intelligence' : 'Grounded Precautionary Engine'}</span>
            </span>
            <span>Precautionary Notice • Model Classification: {classification || 'EVALUATED'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
