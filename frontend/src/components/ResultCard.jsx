import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  Link as LinkIcon, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Terminal,
  Activity,
  Layers,
  Phone
} from 'lucide-react';

export default function ResultCard({ result, justification, communityCount = 0 }) {
  if (!result) return null;

  const isSpam = result.decision === 'SPAM';
  const riskPercent = Math.round((result.final_score || 0) * 100);
  const confidence = result.confidence || 'HIGH';
  const textScore = result.pipeline_scores?.text != null ? Math.round(result.pipeline_scores.text * 100) : null;
  const metaScore = result.pipeline_scores?.metadata != null ? Math.round(result.pipeline_scores.metadata * 100) : null;
  const imgScore = result.pipeline_scores?.image != null ? Math.round(result.pipeline_scores.image * 100) : null;

  const weights = result.fusion_weights_used || { text: 0.7, metadata: 0.3, image: 0 };
  const words = result.explainability?.contributing_words || [];
  const features = result.explainability?.contributing_features || [];
  const ocrText = result.explainability?.ocr_text || null;

  const recommendations = isSpam
    ? {
        doList: [
          'Delete this message immediately from your messaging inbox.',
          'Block the sender phone number / SMS header on your device.',
          'Report the sender header to 1930 (National Cyber Crime Helpline).',
          'Warn family and organizational contacts if this attack impersonates an official bank or government body.'
        ],
        dontList: [
          'Do NOT click any embedded URLs, shortened bit.ly links, or web domains.',
          'Do NOT dial back any phone numbers or reply SMS shortcodes.',
          'NEVER share OTPs, UPI PINs, passwords, or KYC details with anyone.',
          'Do NOT install APKs, remote access apps (AnyDesk/TeamViewer), or attachments.'
        ]
      }
    : {
        doList: [
          'Keep this transaction or notification for your financial records if authentic.',
          'Always verify critical banking alerts directly within your official mobile banking application.'
        ],
        dontList: [
          'Do not share transactional OTPs even if the SMS appears completely authentic.',
          'Never click links in SMS messages that prompt you to enter net banking credentials.'
        ]
      };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Main Threat Verdict Dossier */}
      <div className={`p-6 md:p-8 rounded-3xl border transition-all ${
        isSpam 
          ? 'bg-gradient-to-br from-red-950/40 via-[#0d1527] to-[#070b14] border-red-500/40 shadow-glow-red' 
          : 'bg-gradient-to-br from-emerald-950/40 via-[#0d1527] to-[#070b14] border-emerald-500/40 shadow-glow-green'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl border ${
              isSpam 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {isSpam ? <ShieldAlert className="h-9 w-9" /> : <ShieldCheck className="h-9 w-9" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isSpam ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isSpam ? 'CONFIRMED PHISHING / SMISHING' : 'VERIFIED LEGITIMATE (HAM)'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Confidence: <span className="text-white font-bold">{confidence}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isSpam ? 'High Risk Threat Detected' : 'Message Verified Safe'}
              </h2>
            </div>
          </div>

          {/* Threat Risk Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl sm:self-start">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Overall Threat Risk</span>
              <span className={`text-3xl font-mono font-black ${isSpam ? 'text-red-400' : 'text-emerald-400'}`}>
                {riskPercent}%
              </span>
            </div>
            <div className={`h-12 w-2 rounded-full ${isSpam ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className={`mt-6 p-4 rounded-2xl border text-xs flex items-center gap-3 ${
          isSpam 
            ? 'bg-red-500/10 border-red-500/20 text-red-200' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
        }`}>
          {isSpam ? <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
          <span>
            {isSpam 
              ? 'Warning: This message exhibits high-risk urgency triggers, unauthorized shortcode actions, or deceptive domain patterns.'
              : 'Safe: This communication aligns with verified sender profiles and transactional banking protocols with no deceptive URLs.'}
          </span>
        </div>
      </div>

      {/* 2. Pipeline Modality Breakdown & Dynamic Fusion Weights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Text Pipeline */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" /> XLM-RoBERTa (Text)
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {textScore != null ? `${textScore}%` : 'N/A'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 transition-all duration-500" 
              style={{ width: `${textScore || 0}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Fusion Weight: {Math.round((weights.text || 0) * 100)}%
          </div>
        </div>

        {/* Metadata Pipeline */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-blue-400" /> Metadata & URL FFNN
            </span>
            <span className="font-mono text-blue-400 font-bold">
              {metaScore != null ? `${metaScore}%` : 'N/A'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${metaScore || 0}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Fusion Weight: {Math.round((weights.metadata || 0) * 100)}%
          </div>
        </div>

        {/* OCR Image Pipeline */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-400" /> Tesseract OCR (Image)
            </span>
            <span className="font-mono text-purple-400 font-bold">
              {imgScore != null ? `${imgScore}%` : 'N/A'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500" 
              style={{ width: `${imgScore || 0}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Fusion Weight: {Math.round((weights.image || 0) * 100)}%
          </div>
        </div>
      </div>

      {/* 3. Token Attribution Cloud (Explainable AI) */}
      {words.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" /> Key Suspicious Indicators (XLM-RoBERTa Token Attribution)
            </h3>
            <p className="text-xs text-slate-400">Tokens contributing most heavily toward threat classification:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map((item, idx) => {
              const score = typeof item === 'object' ? item.attribution : null;
              const word = typeof item === 'object' ? item.token : item;
              return (
                <span 
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5 shadow-xs"
                >
                  <span>{word}</span>
                  {score != null && (
                    <span className="text-[10px] px-1 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                      {Math.round(score * 100)}%
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Actionable Incident Response Playbook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What to DO */}
        <div className="p-6 rounded-3xl bg-[#0d1527] border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" /> Recommended Actions (What to DO)
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {recommendations.doList.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What NOT to DO */}
        <div className="p-6 rounded-3xl bg-[#0d1527] border border-red-500/20 space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <XCircle className="h-5 w-5" /> Threat Defense Rules (What NOT to Do)
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {recommendations.dontList.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
