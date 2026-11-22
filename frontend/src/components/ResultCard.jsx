import React, { useState, useEffect } from 'react';
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
  Phone,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  Globe2,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { getJustification } from '../services/sentinelApi';

export default function ResultCard({ result, justification, communityCount = 0 }) {
  const [copied, setCopied] = useState(false);
  const [currentJustification, setCurrentJustification] = useState(justification);
  const [activeLang, setActiveLang] = useState('english');
  const [langLoading, setLangLoading] = useState(false);
  
  // Collapsible Section State
  const [collapseIndicators, setCollapseIndicators] = useState(false);
  const [collapseAttack, setCollapseAttack] = useState(false);
  const [collapseActions, setCollapseActions] = useState(false);
  const [collapseTechnical, setCollapseTechnical] = useState(false);

  useEffect(() => {
    setCurrentJustification(justification);
  }, [justification]);

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

  // Handle both string and structured object responses
  const summaryText = typeof currentJustification === 'object' && currentJustification?.summary 
    ? currentJustification.summary 
    : (typeof currentJustification === 'string' ? currentJustification : null);

  const structured = typeof currentJustification === 'object' ? currentJustification?.structured : null;
  const explanation = structured?.explanation || null;

  // Actions lists: prioritize structured engine if provided
  const doList = explanation?.recommended_actions?.length 
    ? explanation.recommended_actions 
    : (isSpam ? [
        'Delete this message immediately from your messaging inbox.',
        'Block the sender phone number / SMS header on your device.',
        'Report the sender header to 1930 (National Cyber Crime Helpline).',
        'Warn family and organizational contacts if this attack impersonates an official entity.'
      ] : [
        'Keep this notification for your financial or personal records.',
        'Verify critical alerts directly within your official mobile banking application.'
      ]);

  const dontList = explanation?.dont_actions?.length 
    ? explanation.dont_actions 
    : (isSpam ? [
        'Do NOT click any embedded URLs, shortened bit.ly links, or web domains.',
        'Do NOT dial back any phone numbers or reply SMS shortcodes.',
        'NEVER share OTPs, UPI PINs, passwords, or KYC details with anyone.',
        'Do NOT install APKs, remote access apps (AnyDesk/TeamViewer), or attachments.'
      ] : [
        'Do not share transactional OTPs even if the SMS appears completely authentic.',
        'Never click links in SMS messages that prompt you to enter net banking credentials.'
      ]);

  const handleCopyExplanation = () => {
    const textToCopy = summaryText || (explanation ? `${explanation.summary}\n\nAttack: ${explanation.possible_attack}\nImpact: ${explanation.potential_impact}` : '');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadDossier = () => {
    const dossierData = {
      timestamp: new Date().toISOString(),
      detection: {
        verdict: result.decision,
        risk_score: result.final_score,
        confidence: result.confidence,
        pipeline_scores: result.pipeline_scores,
        fusion_weights: result.fusion_weights_used
      },
      llm_explanation: structured || { summary: summaryText },
      evidence: {
        words,
        features,
        ocr_text: ocrText
      }
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dossierData, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `sentinelai_incident_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // On-the-fly language switch
  const switchExplanationLanguage = async (newLang) => {
    setActiveLang(newLang);
    setLangLoading(true);
    try {
      const resp = await getJustification(result, newLang, ocrText || '');
      setCurrentJustification(resp);
    } catch (err) {
      console.warn('Language switch warning:', err);
    } finally {
      setLangLoading(false);
    }
  };

  const languages = [
    { code: 'english', label: 'English' },
    { code: 'hindi', label: 'हिंदी (Hindi)' },
    { code: 'telugu', label: 'తెలుగు (Telugu)' },
    { code: 'urdu', label: 'اردو (Urdu)' },
    { code: 'tamil', label: 'தமிழ் (Tamil)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Detection Result (Section A) */}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isSpam ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isSpam ? 'CONFIRMED PHISHING / SMISHING' : 'VERIFIED LEGITIMATE (HAM)'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Confidence: <span className="text-white font-bold">{confidence}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-cyan-400" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isSpam ? (explanation?.possible_attack || 'High Risk Threat Detected') : 'Message Verified Safe'}
              </h2>
            </div>
          </div>

          {/* Threat Risk Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl sm:self-start">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Threat Risk Score</span>
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
              ? (explanation?.potential_impact ? `Threat Impact: ${explanation.potential_impact}` : 'Warning: This message exhibits high-risk urgency triggers or deceptive patterns.')
              : 'Safe: This communication aligns with verified sender profiles and transactional banking protocols.'}
          </span>
        </div>
      </div>

      {/* 2. Structured AI Explanation Card (Section B & Section F Multilingual) */}
      {(summaryText || explanation) && (
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-cyan-500/30 space-y-6 shadow-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>AI Security Explanation & Threat Analysis</span>
                  {structured?.explanation_source && (
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {structured.explanation_source === 'LLM' ? '⚡ Groq Llama 3.1' : '🛡️ Evidence-Grounded Engine'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Natural language breakdown grounded in verified model signals</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyExplanation}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                title="Copy explanation text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadDossier}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                title="Download JSON incident report"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          {/* Multilingual Explanation Switcher (Section F) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 uppercase mr-1">
              <Globe2 className="h-3.5 w-3.5 text-cyan-400" /> View in Language:
            </span>
            {languages.map((l) => (
              <button
                key={l.code}
                disabled={langLoading}
                onClick={() => switchExplanationLanguage(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeLang === l.code 
                    ? 'bg-cyan-500 text-slate-950 font-bold' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {l.label}
              </button>
            ))}
            {langLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 ml-1" />}
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">Executive Summary</span>
            <p>{explanation?.summary || summaryText}</p>
          </div>

          {/* Section C: Grounded Evidence Indicators */}
          {explanation?.reasons?.length > 0 && (
            <div className="space-y-3 pt-2">
              <div 
                onClick={() => setCollapseIndicators(!collapseIndicators)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5 group-hover:text-cyan-400 transition">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Detected Grounded Indicators ({explanation.reasons.length})
                </span>
                <button className="text-slate-400 group-hover:text-white transition">
                  {collapseIndicators ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>

              {!collapseIndicators && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {explanation.reasons.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{item.indicator}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.severity === 'HIGH' 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : item.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 truncate">
                        "{item.evidence}"
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section D: Attack Analysis & Sender/URL Intelligence */}
          {(explanation?.possible_attack || explanation?.sender_analysis || explanation?.url_risk) && (
            <div className="space-y-3 pt-2">
              <div 
                onClick={() => setCollapseAttack(!collapseAttack)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5 group-hover:text-cyan-400 transition">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" /> Attack Vector & Entity Analysis
                </span>
                <button className="text-slate-400 group-hover:text-white transition">
                  {collapseAttack ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>

              {!collapseAttack && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  {explanation?.possible_attack && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 text-red-400" /> Identified Attack Technique
                      </span>
                      <p className="text-white font-bold">{explanation.possible_attack}</p>
                    </div>
                  )}
                  {explanation?.potential_impact && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400" /> Potential Impact
                      </span>
                      <p className="text-slate-300">{explanation.potential_impact}</p>
                    </div>
                  )}
                  {explanation?.sender_analysis && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <Phone className="h-3 w-3 text-cyan-400" /> Sender Verification
                      </span>
                      <p className="text-slate-300">{explanation.sender_analysis}</p>
                    </div>
                  )}
                  {explanation?.url_risk && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-cyan-400" /> Destination URL Intelligence
                      </span>
                      <p className="text-slate-300">{explanation.url_risk}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Section E: Actionable Incident Response Playbook */}
      <div className="space-y-3">
        <div 
          onClick={() => setCollapseActions(!collapseActions)}
          className="flex items-center justify-between cursor-pointer group px-2"
        >
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 group-hover:text-white transition">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Actionable Incident Response Playbook
          </span>
          <button className="text-slate-400 group-hover:text-white transition">
            {collapseActions ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!collapseActions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What to DO */}
            <div className="p-6 rounded-3xl bg-[#0d1527] border border-emerald-500/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" /> Recommended Actions (What to DO)
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {doList.map((rec, i) => (
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
                {dontList.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 4. Technical Modality Pipelines & Token Attribution Cloud */}
      <div className="space-y-3">
        <div 
          onClick={() => setCollapseTechnical(!collapseTechnical)}
          className="flex items-center justify-between cursor-pointer group px-2"
        >
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 group-hover:text-white transition">
            <Layers className="h-3.5 w-3.5 text-cyan-400" /> Multi-Modal Pipeline Breakdown & Token Attribution
          </span>
          <button className="text-slate-400 group-hover:text-white transition">
            {collapseTechnical ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!collapseTechnical && (
          <div className="space-y-4">
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

            {/* Token Attribution Cloud */}
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
                    const score = typeof item === 'object' ? item.score || item.attribution : null;
                    const word = typeof item === 'object' ? item.word || item.token : item;
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
          </div>
        )}
      </div>

      {/* 5. Official Indian Cyber Crime Reporting Escalation */}
      {isSpam && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Escalate Fraud Incident to Authorities</h4>
              <p className="text-xs text-slate-400">National Cyber Crime Reporting Portal (MHA / I4C) & Toll-Free Helpline</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:1930"
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <span>Call Helpline 1930</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>cybercrime.gov.in</span>
              <Terminal className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
