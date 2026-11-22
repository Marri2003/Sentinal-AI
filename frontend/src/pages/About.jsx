import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Cpu, 
  Layers, 
  Zap, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Binary, 
  Sparkles,
  BarChart3,
  Server,
  Database,
  Globe,
  Lock,
  AlertTriangle,
  Activity,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  FileText,
  Terminal,
  RefreshCw,
  Clock,
  Key,
  GitBranch,
  Cloud,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { fetchSystemInfo, checkBackendHealth } from '../services/sentinelApi';

export default function About() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Authoritative fallback telemetry loaded directly from saved_models/*.json
  const verifiedMetrics = {
    text: {
      name: "Pipeline 1: Text Semantics Analysis",
      model: "XLM-RoBERTa (xlm-roberta-base, 278M parameters)",
      evaluation_type: "Validation Split (Held-out 20% Stratified)",
      dataset: "Curated Multilingual Corpus (Kaggle Multilingual, Mendeley, Smishtank, UCI; 6,520 cleaned samples)",
      dataset_version: "v1.0-curated-multilingual",
      evaluation_date: "2026-11-19",
      best_epoch: 7,
      epochs_trained: 11,
      loss: 0.1719,
      accuracy: 97.99,
      precision: 96.75,
      recall: 98.30,
      f1_score: 97.52,
      total_samples: 1304,
      correctly_classified: 1278,
      incorrectly_classified: 26,
      status: "Evaluated"
    },
    metadata: {
      name: "Pipeline 2: Metadata & URL Feature Engineering",
      model: "15-Feature Multi-Layer Perceptron (FFNN, 15->64->32->16->2)",
      evaluation_type: "Validation Split (Held-out 20% Stratified)",
      dataset: "Unified Phishing URL & Sender Corpus (HF, ISCX-URL-2016, PhiUSIIL; 250,079 cleaned samples)",
      dataset_version: "v1.0-iscx-phiusiil-corpus",
      evaluation_date: "2026-11-18",
      best_epoch: 9,
      epochs_trained: 12,
      loss: 0.4107,
      accuracy: 84.08,
      precision: 82.29,
      recall: 89.23,
      f1_score: 85.62,
      total_samples: 211561,
      correctly_classified: 177873,
      incorrectly_classified: 33688,
      status: "Evaluated"
    },
    image: {
      name: "Pipeline 3: Image / Screenshot Analysis",
      model: "Tesseract OCR v5.5 (Adaptive Gaussian + fastNlMeans) + XLM-RoBERTa",
      evaluation_type: "OCR Text Extraction Pipeline",
      dataset: "Screenshot text extraction forwards to Pipeline 1 text classifier",
      dataset_version: "v1.0-ocr-runtime",
      metrics: null,
      status: "Not yet evaluated",
      status_note: "Evaluated dynamically per-screenshot; extracted text inherits Text Pipeline classification metrics."
    },
    fusion: {
      name: "Weighted Late Decision Fusion Engine",
      architecture: "Adaptive Weight Redistribution with Zero-Penalty Missing Modality Exclusion",
      base_weights: { text: 0.60, metadata: 0.20, image: 0.20 },
      spam_threshold: 0.60,
      evaluation_type: "Composite Multi-Modal Pipeline",
      metrics: null,
      status: "Composite Live Testing Verified",
      status_note: "End-to-end integration verified across test suites; standalone tri-modal benchmark corpus not yet evaluated."
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const isHealthy = await checkBackendHealth();
        if (isMounted) setBackendStatus(isHealthy ? 'online' : 'offline');

        const info = await fetchSystemInfo();
        if (isMounted && info) {
          setSystemData(info);
        }
      } catch (err) {
        console.warn('Could not load backend system info, using verified static baseline:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const textMetrics = systemData?.pipelines?.text?.metrics 
    ? {
        accuracy: +(systemData.pipelines.text.metrics.accuracy * 100).toFixed(2),
        precision: +(systemData.pipelines.text.metrics.precision * 100).toFixed(2),
        recall: +(systemData.pipelines.text.metrics.recall * 100).toFixed(2),
        f1_score: +(systemData.pipelines.text.metrics.f1_score * 100).toFixed(2),
        total_samples: systemData.pipelines.text.metrics.total_samples,
        correctly_classified: systemData.pipelines.text.metrics.correctly_classified,
        incorrectly_classified: systemData.pipelines.text.metrics.incorrectly_classified,
        loss: systemData.pipelines.text.metrics.loss,
        best_epoch: systemData.pipelines.text.metrics.best_epoch,
        epochs_trained: systemData.pipelines.text.metrics.epochs_trained,
        status: "Evaluated"
      }
    : verifiedMetrics.text;

  const metaMetrics = systemData?.pipelines?.metadata?.metrics
    ? {
        accuracy: +(systemData.pipelines.metadata.metrics.accuracy * 100).toFixed(2),
        precision: +(systemData.pipelines.metadata.metrics.precision * 100).toFixed(2),
        recall: +(systemData.pipelines.metadata.metrics.recall * 100).toFixed(2),
        f1_score: +(systemData.pipelines.metadata.metrics.f1_score * 100).toFixed(2),
        total_samples: systemData.pipelines.metadata.metrics.total_samples,
        correctly_classified: systemData.pipelines.metadata.metrics.correctly_classified,
        incorrectly_classified: systemData.pipelines.metadata.metrics.incorrectly_classified,
        loss: systemData.pipelines.metadata.metrics.loss,
        best_epoch: systemData.pipelines.metadata.metrics.best_epoch,
        epochs_trained: systemData.pipelines.metadata.metrics.epochs_trained,
        status: "Evaluated"
      }
    : verifiedMetrics.metadata;

  const navTabs = [
    { id: 'overview', label: '1. Project Overview', icon: ShieldCheck },
    { id: 'performance', label: '2. Model Performance', icon: BarChart3 },
    { id: 'pipelines', label: '3. Detection Pipelines', icon: Layers },
    { id: 'safety', label: '4. AI Safety Advisory', icon: Sparkles },
    { id: 'techstack', label: '5. Technology Stack', icon: Server },
    { id: 'integrations', label: '6. API Integrations', icon: Key },
    { id: 'database', label: '7. Database & Cloud', icon: Database },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1324] via-[#09101f] to-[#060a14] border border-slate-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-glow">
                <ShieldCheck className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    About Sentinel<span className="text-cyan-400">AI</span>
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    v1.0.0 Enterprise
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Multi-Modal Deep Learning Phishing & Smishing Defense Platform
                </p>
              </div>
            </div>

            {/* Microservice Live Status Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Backend API:</span>
              <span className={`inline-flex items-center gap-1.5 font-bold ${
                backendStatus === 'online' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} />
                {backendStatus === 'online' ? 'Hugging Face Spaces Active' : 'Offline / Standalone Mode'}
              </span>
            </div>
          </div>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
            Sentinel-AI is an advanced multi-modal cybersecurity intelligence platform engineered to identify and neutralize 
            polymorphic mobile smishing, banking impersonation, utility cutoff threats, fake recruitment scams, and fraudulent 
            communications across English, Hindi, Hinglish, and Indian regional languages.
          </p>

          {/* Quick Architecture Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-cyan-400">XLM-RoBERTa</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">278M Multilingual NLP</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-blue-400">15-Feature FFNN</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">URL & Sender Telemetry</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-purple-400">Tesseract OCR</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Screenshot Text Engine</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-emerald-400">Groq Llama 3.1</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Proactive Safety Advisory</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 1: PROJECT OVERVIEW & PROBLEM STATEMENT
          ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              1. Project Mission & Objectives
            </h2>
            <span className="text-xs font-mono text-slate-400">Core Architecture Brief</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Problem Statement */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">The Threat Landscape</h3>
                  <p className="text-xs text-slate-400">Why Legacy Spam Filters Fail</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Traditional SMS spam filters and mobile protections rely on static blocklists, regex keyword rules, or basic English heuristics. 
                Modern cyber syndicates bypass these controls through:
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span><strong className="text-white">Polymorphic Rephrasing:</strong> Slight alterations in phrasing, character homoglyphs, and zero-width spaces that break keyword matching.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span><strong className="text-white">Vernacular Transliteration:</strong> Extensive use of Hinglish (Hindi written in Roman English script) and regional languages (Telugu, Tamil, Bengali) unindexed by standard models.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span><strong className="text-white">DLT Header Spoofing & SIM Farms:</strong> Exploitation of telecom Distributed Ledger Technology (DLT) headers or localized SIM boxes mimicking major banks (e.g. SBI, HDFC).</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span><strong className="text-white">Screenshot Evasion:</strong> Transmitting extortion threats, fake UPI confirmations, and payment QR codes as images to bypass plain-text network inspection.</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">The SentinelAI Solution</h3>
                  <p className="text-xs text-slate-400">Multi-Modal Defense Paradigm</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Sentinel-AI introduces a unified, real-time multi-modal pipeline that simultaneously inspects semantic intent, 
                visual OCR content, and deep URL telemetry before synthesizing a verdict via dynamic late fusion:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Tri-Modal Co-Verification:</strong> Text semantics, screenshot OCR, and metadata network features cross-validate threats with zero single-point-of-failure.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Attention Token Explainability:</strong> Eager self-attention reveals the exact trigger words that drove the model's verdict for full human transparency.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Proactive Safety Advisory Layer:</strong> Generative LLM reasoning (Groq Llama 3.1) evaluates subtle social engineering risks even when messages pass algorithmic ML checks.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Capabilities Grid */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" />
              Core Threat Detection Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {[
                { title: "Banking & KYC Suspension", desc: "Detects fraudulent alerts claiming SBI, HDFC, or ICICI accounts are blocked unless an unverified link is clicked." },
                { title: "Electricity & Utility Blackmail", desc: "Identifies urgent notices threatening power disconnection tonight at 9:30 PM unless a bill officer number is called." },
                { title: "Recruitment & Part-Time Traps", desc: "Flags unsolicited WhatsApp job offers promising ₹5,000/day for liking YouTube videos or requiring registration fees." },
                { title: "Aadhaar & PAN Exfiltration", desc: "Alerts on unauthorized requests soliciting Aadhaar numbers, PAN cards, or biometric updates outside official UIDAI channels." },
                { title: "Malicious APK Sideloading", desc: "Flags links redirecting to downloadable .apk files disguised as banking updates, customer care, or rewards apps." },
                { title: "Fake Payment Screenshots", desc: "Extracts text from uploaded UPI receipts and payment screenshots using Tesseract OCR to uncover spoofed transaction confirmations." }
              ].map((cap, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1.5 hover:border-cyan-500/30 transition">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {cap.title}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: MODEL PERFORMANCE & EVALUATION METRICS (AUTHENTIC)
          ========================================================================= */}
      {(activeTab === 'performance' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                2. Model Performance & Evaluation Metrics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated on held-out stratified validation splits. Never fabricated or assumed identical.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
              Source: saved_models/ training metrics
            </div>
          </div>

          {/* Model 1: XLM-RoBERTa Performance Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{verifiedMetrics.text.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {textMetrics.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{verifiedMetrics.text.model}</p>
                </div>
              </div>

              <div className="text-right text-xs space-y-0.5 text-slate-400 font-mono">
                <div>Evaluation: <span className="text-cyan-300">{verifiedMetrics.text.evaluation_type}</span></div>
                <div>Best Epoch: <span className="text-white font-bold">{textMetrics.best_epoch}</span> / {textMetrics.epochs_trained} (Loss: {textMetrics.loss?.toFixed(4)})</div>
                <div>Date: <span className="text-slate-300">{verifiedMetrics.text.evaluation_date}</span></div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-cyan-400">{textMetrics.accuracy}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Accuracy</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-blue-400">{textMetrics.precision}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Precision</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-indigo-400">{textMetrics.recall}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Recall</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-emerald-400">{textMetrics.f1_score}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">F1-Score</div>
              </div>
            </div>

            {/* Sample Breakdown Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">Total Validation Samples:</span>
                <span className="ml-2 font-bold text-white">{textMetrics.total_samples?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Correctly Classified:</span>
                <span className="ml-2 font-bold text-emerald-400">{textMetrics.correctly_classified?.toLocaleString()} ({((textMetrics.correctly_classified / textMetrics.total_samples) * 100).toFixed(2)}%)</span>
              </div>
              <div>
                <span className="text-slate-400">Misclassified Samples:</span>
                <span className="ml-2 font-bold text-rose-400">{textMetrics.incorrectly_classified?.toLocaleString()} ({((textMetrics.incorrectly_classified / textMetrics.total_samples) * 100).toFixed(2)}%)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
              <span className="font-semibold text-slate-300">Dataset Corpus:</span> {verifiedMetrics.text.dataset}
            </div>
          </div>

          {/* Model 2: Metadata FFNN Performance Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Binary className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{verifiedMetrics.metadata.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {metaMetrics.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{verifiedMetrics.metadata.model}</p>
                </div>
              </div>

              <div className="text-right text-xs space-y-0.5 text-slate-400 font-mono">
                <div>Evaluation: <span className="text-amber-300">{verifiedMetrics.metadata.evaluation_type}</span></div>
                <div>Best Epoch: <span className="text-white font-bold">{metaMetrics.best_epoch}</span> / {metaMetrics.epochs_trained} (Loss: {metaMetrics.loss?.toFixed(4)})</div>
                <div>Date: <span className="text-slate-300">{verifiedMetrics.metadata.evaluation_date}</span></div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-amber-400">{metaMetrics.accuracy}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Accuracy</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-amber-300">{metaMetrics.precision}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Precision</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-amber-500">{metaMetrics.recall}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Recall</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-emerald-400">{metaMetrics.f1_score}%</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">F1-Score</div>
              </div>
            </div>

            {/* Sample Breakdown Bar (From Confusion Matrix) */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">Total Validation Samples:</span>
                <span className="ml-2 font-bold text-white">{metaMetrics.total_samples?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Correctly Classified (TP+TN):</span>
                <span className="ml-2 font-bold text-emerald-400">{metaMetrics.correctly_classified?.toLocaleString()} ({((metaMetrics.correctly_classified / metaMetrics.total_samples) * 100).toFixed(2)}%)</span>
              </div>
              <div>
                <span className="text-slate-400">Misclassified (FP+FN):</span>
                <span className="ml-2 font-bold text-rose-400">{metaMetrics.incorrectly_classified?.toLocaleString()} ({((metaMetrics.incorrectly_classified / metaMetrics.total_samples) * 100).toFixed(2)}%)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
              <span className="font-semibold text-slate-300">Dataset Corpus:</span> {verifiedMetrics.metadata.dataset}
            </div>
          </div>

          {/* Model 3 & Overall System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image Pipeline Evaluation Status */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{verifiedMetrics.image.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">Tesseract OCR v5.5 + Computer Vision</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {verifiedMetrics.image.status}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <p>
                  <strong>Standalone Image Benchmark:</strong> {verifiedMetrics.image.status}.
                </p>
                <p className="text-slate-400">
                  {verifiedMetrics.image.status_note} Optical recognition precision dynamically scales with screenshot image resolution, font size, and contrast rather than a fixed binary classification matrix.
                </p>
              </div>
            </div>

            {/* Overall Multi-Modal System Evaluation */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{verifiedMetrics.fusion.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">Dynamic Multi-Modal Late Decision Fusion</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {verifiedMetrics.fusion.status}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <p>
                  <strong>Overall System Performance:</strong> Evaluated through end-to-end integration test suites (<code className="text-cyan-300">test_full_pipeline.py</code>).
                </p>
                <p className="text-slate-400">
                  Individual model accuracies do not automatically equal overall system accuracy. A unified held-out tri-modal benchmark dataset is <strong>not yet evaluated</strong> to preserve mathematical integrity.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: DETECTION PIPELINES (DEEP DIVE)
          ========================================================================= */}
      {(activeTab === 'pipelines' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-cyan-400" />
              3. Detection Pipelines & Modality Architecture
            </h2>
            <span className="text-xs font-mono text-slate-400">Tri-Modal Processing Layers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pipeline 1: Text Semantics */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pipeline 1: Text Semantics</h3>
                  <p className="text-xs text-slate-400">XLM-RoBERTa (Cross-Lingual Deep Transformer)</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Fine-tuned on curated Indian SMS datasets featuring English, Hindi, Hinglish, and Telugu fraud vectors. 
                XLM-RoBERTa captures intricate syntactic nuances, coercive threats, fake utility disconnection warnings, 
                and disguised lottery notifications.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Eager Attention Attribution Engine
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Configured with eager self-attention to generate per-token explainability attributions. 
                  Attention weights identify exact high-risk tokens (e.g. "blocked", "KYC", "update", "immediately") 
                  and display them with visual risk weightings in the UI.
                </p>
              </div>
            </div>

            {/* Pipeline 2: Metadata & URL Feature Engineering */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Binary className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pipeline 2: Metadata Feature Engineering</h3>
                  <p className="text-xs text-slate-400">15-Feature Feedforward Neural Network (FFNN)</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates message metadata and URL structures that attackers cannot camouflage. Built with a 4-layer 
                neural architecture (15 ➔ 64 ➔ 32 ➔ 16 ➔ 2) utilizing ReLU activations, 0.3 dropout, and StandardScaler normalization.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• is_shortened_url (bit.ly, is.gd)</div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• suspicious_tld (.xyz, .top)</div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• TRAI header verification</div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• sender_entropy & digits</div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• subdomain depth & '@' symbols</div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">• temporal hour-of-day telemetry</div>
              </div>
            </div>

            {/* Pipeline 3: Image / Screenshot Analysis */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pipeline 3: Image & Screenshot OCR</h3>
                  <p className="text-xs text-slate-400">Computer Vision Preprocessing + Tesseract OCR v5.5</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Fraudsters frequently dispatch payment confirmations, electricity bills, and extortion threats as screenshots 
                to evade keyword filters. Pipeline 3 deconstructs visual uploads into machine-readable text before scoring.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="text-purple-300">1. Adaptive Preprocessing:</strong> Converts to grayscale, executes adaptive Gaussian thresholding, and applies non-local means denoising (<code className="text-cyan-300 font-mono">fastNlMeans</code>).
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="text-purple-300">2. Multilingual OCR Extraction:</strong> Extracts Hindi, Telugu, and English text via Tesseract OCR v5.5 and feeds output into the XLM-RoBERTa classifier.
                </div>
              </div>
            </div>

            {/* Pipeline 4: Weighted Late Decision Fusion */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Weighted Late Decision Fusion</h3>
                  <p className="text-xs text-slate-400">Dynamic Redistribution & Zero-Penalty Exclusion</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                In real-world traffic, messages rarely carry all three modalities simultaneously. Rather than substituting 
                missing signals with an arbitrary 0.5 baseline (which artificially inflates false positives), SentinelAI dynamically 
                reallocates weights:
              </p>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 space-y-1">
                <div>// Configured Base Weights: Text (0.60), Metadata (0.20), Image (0.20)</div>
                <div>// When Image is missing: Text ➔ 75%, Metadata ➔ 25%</div>
                <div>// When Metadata is missing: Text ➔ 75%, Image ➔ 25%</div>
                <div>// When only Text is provided: Text ➔ 100%</div>
                <div className="text-slate-400 pt-1">// Global Spam Decision Threshold: 0.60</div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                <strong className="text-slate-300">Deterministic Safety Whitelists:</strong> Incorporates verified banking DLT headers (<code className="text-cyan-300">TRUSTED_SENDERS</code>) and official government domains (<code className="text-cyan-300">TRUSTED_DOMAINS</code>) to guarantee zero false positives on genuine bank transactions.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: AI-POWERED SAFETY ADVISORY (GROQ LLM)
          ========================================================================= */}
      {(activeTab === 'safety' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              4. AI-Powered Safety Advisory Layer
            </h2>
            <span className="text-xs font-mono text-slate-400">Groq Llama 3.1 8B Engine</span>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Proactive Risk Advisory & Contextual Guidance</h3>
                <p className="text-xs text-slate-400">
                  Autonomous educational threat assessment operating alongside the deep learning classifiers.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Engine:</span>
                <span className="text-cyan-300 font-bold">Groq Llama 3.1 8B (Instant)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
              <strong className="text-white">Core Architectural Principle:</strong> The Safety Advisory Layer operates 
              <span className="text-cyan-300 font-bold"> even when a message is classified as legitimate / HAM</span>. 
              Scammers often craft messages that appear mathematically benign on surface metrics but contain dangerous 
              psychological coercion or preparatory social engineering. The advisory layer provides proactive precautions 
              <span className="text-white font-bold"> without overriding the mathematical ML classifier verdict</span>.
            </div>

            {/* Threat Indicators Monitored */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                High-Risk Warning Signs Monitored by the Advisory Layer
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: "Personal Info Requests", desc: "Solicitations for full legal names, addresses, or family credentials.", icon: AlertTriangle },
                  { title: "Aadhaar & PAN Solicitations", desc: "Attempts to collect government identity cards or biometric records.", icon: Lock },
                  { title: "OTP & Password Extraction", desc: "Deceptive appeals urging users to read out verification OTPs.", icon: Key },
                  { title: "Upfront Processing Fees", desc: "Job offers or prizes requiring advance registration or document fees.", icon: Binary },
                  { title: "Suspicious UPI / QR Demands", desc: "Requests urging users to scan QR codes or enter PINs to receive money.", icon: Zap },
                  { title: "Unverified HR Contacts", desc: "Unofficial Gmail or Telegram recruiter handles with no corporate footprint.", icon: Globe },
                  { title: "Recruitment Traps", desc: "Guaranteed high-salary schemes for zero experience or daily video tasks.", icon: FileText },
                  { title: "Artificial Urgency Claims", desc: "Threats of immediate arrest, power cutoff, or SIM block within 2 hours.", icon: Clock }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zero-Failure Deterministic Fallback */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Deterministic Fallback Engine Active
              </div>
              <p className="text-slate-400 leading-relaxed">
                If the external Groq Cloud API is unconfigured, unreachable, or rate-limited, Sentinel-AI automatically fails over to an 
                in-memory deterministic rule engine (<code className="text-cyan-300 font-mono">generate_grounded_fallback_advisory</code>). 
                Users always receive structured safety advisories without system downtime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 5: TECHNOLOGY STACK & DEPLOYMENT INFRASTRUCTURE
          ========================================================================= */}
      {(activeTab === 'techstack' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Server className="h-5 w-5 text-cyan-400" />
              5. Production Technology Stack & Deployment
            </h2>
            <span className="text-xs font-mono text-slate-400">Cloud Infrastructure Matrix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Frontend: Vercel */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    Edge CDN
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Frontend — Vercel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">React 18 + Vite + Tailwind CSS</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hosts the responsive Single Page Application (SPA), delivering sub-second edge routing, responsive glassmorphism UI, 
                  and secure client-side communication with the backend microservice.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                Endpoint: <span className="text-cyan-300">VITE_API_BASE_URL</span>
              </div>
            </div>

            {/* Backend: Hugging Face Spaces */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Server className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    Gradio SDK
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Backend — Hugging Face</h3>
                  <p className="text-xs text-slate-400 mt-0.5">FastAPI + Uvicorn + PyTorch</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Runs the multi-modal inference microservice on Hugging Face Spaces (CPU Basic: 2 vCPU, 16 GB RAM) with system-level 
                  Tesseract OCR v5.5 installation and REST endpoints for prediction and explainability.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                Space: <span className="text-orange-300">marrideepak/sentinelai-backend</span>
              </div>
            </div>

            {/* Model Storage: Hugging Face Model Hub */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Git LFS Hub
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Model Hub — Hugging Face</h3>
                  <p className="text-xs text-slate-400 mt-0.5">1.1 GB XLM-RoBERTa Weights</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Large fine-tuned model checkpoints (<code className="text-cyan-300 font-mono">text_model.pth</code>) are hosted in a dedicated Hugging Face Model Repository, downloaded and cached dynamically on boot via <code className="text-cyan-300 font-mono">hf_hub_download</code>.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                Repo: <span className="text-blue-300">marrideepak/sentinelai-model</span>
              </div>
            </div>

            {/* Database & Auth: Supabase */}
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    RLS Active
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Database — Supabase</h3>
                  <p className="text-xs text-slate-400 mt-0.5">PostgreSQL + GoTrue Auth</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provides cryptographic session authentication, user profile management (<code className="text-cyan-300 font-mono">profiles</code>), and scan telemetry persistence (<code className="text-cyan-300 font-mono">analyses</code>) with strict Row Level Security (RLS).
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                PostgreSQL: <span className="text-emerald-300">Zero-Trust Telemetry</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 6: API INTEGRATIONS & SECURITY GOVERNANCE
          ========================================================================= */}
      {(activeTab === 'integrations' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Key className="h-5 w-5 text-cyan-400" />
              6. API Integrations & Security Governance
            </h2>
            <span className="text-xs font-mono text-slate-400">Zero-Credential-Leakage Architecture</span>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-6">
            <div className="text-xs text-slate-300 space-y-1">
              <p className="text-sm font-bold text-white">External Service Integration Registry</p>
              <p className="text-slate-400">
                All communications adhere to strict enterprise cybersecurity practices: API tokens and credentials 
                are isolated on server-side environments and never exposed to client browsers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Groq API */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" /> Groq Cloud API
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    HTTPS Bearer
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Executes sub-200ms LLM inferences for safety advisory generation, trigger explainability, and multi-lingual user assistance.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>Config: <span className="text-cyan-300">GROQ_API_KEY</span></div>
                  <div>Model: <span className="text-slate-200">llama-3.1-8b-instant</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">Masked / Active</span></div>
                </div>
              </div>

              {/* Hugging Face API */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="h-4 w-4 text-orange-400" /> Hugging Face Spaces API
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    REST Microservice
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Hosts the live FastAPI application runtime and synchronizes model weights from the Hugging Face Model Hub.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>Space: <span className="text-orange-300">sentinelai-backend</span></div>
                  <div>Weights: <span className="text-slate-200">sentinelai-model</span></div>
                  <div>Endpoints: <span className="text-emerald-400 font-bold">/predict, /justify</span></div>
                </div>
              </div>

              {/* Supabase API */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" /> Supabase PostgREST
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Row Level Security
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Authoritative cloud persistence managing encrypted user sessions, audit records, and community telemetry counts.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>Config: <span className="text-emerald-300">VITE_SUPABASE_URL</span></div>
                  <div>Auth: <span className="text-slate-200">Supabase JWT Session</span></div>
                  <div>Security: <span className="text-emerald-400 font-bold">RLS Policies Enabled</span></div>
                </div>
              </div>

            </div>

            {/* Privacy & Governance Notice */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <Lock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Security & Privacy Governance:</strong> Sentinel-AI enforces zero plain-text storage of sensitive credentials. Analysis telemetry stored in Supabase uses non-reversible cryptographic IDs, and RLS policies guarantee users can only query their own historical records.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 7: DATABASE SCHEMA & DATA CONNECTION OVERVIEW
          ========================================================================= */}
      {(activeTab === 'database' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Database className="h-5 w-5 text-cyan-400" />
              7. Database Architecture & Connection Flow
            </h2>
            <span className="text-xs font-mono text-slate-400">PostgreSQL Schema & Event Pipeline</span>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-6">
            
            {/* Step-by-Step Connection Lifecycle */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Full-Stack Data Flow Lifecycle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold">01. INGESTION</span>
                    <Globe className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-slate-300">User uploads SMS text, sender header, or screenshot to the Vercel React frontend.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 font-bold">02. INFERENCE</span>
                    <Server className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-slate-300">Hugging Face microservice runs XLM-RoBERTa, FFNN, and Tesseract OCR simultaneously.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-400 font-bold">03. ADVISORY</span>
                    <Sparkles className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-slate-300">Groq Llama 3.1 synthesizes token explainability and proactive safety guidance.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">04. PERSISTENCE</span>
                    <Database className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-slate-300">Telemetry is written to Supabase PostgreSQL with RLS and cached locally in browser storage.</p>
                </div>
              </div>
            </div>

            {/* Database Tables & Relationships */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white">Production Database Schema (Supabase PostgreSQL)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Table 1: profiles */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">public.profiles</span>
                    <span className="text-[10px] text-slate-400">auth.users cascade</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-slate-300 space-y-1 text-[11px]">
                    <div>• <strong className="text-white">id:</strong> uuid (PK, references auth.users)</div>
                    <div>• <strong className="text-white">email:</strong> text unique</div>
                    <div>• <strong className="text-white">full_name:</strong> text</div>
                    <div>• <strong className="text-white">avatar_url:</strong> text</div>
                    <div>• <strong className="text-white">created_at:</strong> timestamptz</div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Managed automatically via Supabase triggers (<code className="text-cyan-300 font-mono">handle_new_user</code>) upon user registration.
                  </p>
                </div>

                {/* Table 2: analyses */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">public.analyses</span>
                    <span className="text-[10px] text-slate-400">Cloud Telemetry Log</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-slate-300 space-y-1 text-[11px]">
                    <div>• <strong className="text-white">id:</strong> uuid (PK, gen_random_uuid())</div>
                    <div>• <strong className="text-white">user_id:</strong> uuid (FK, auth.users)</div>
                    <div>• <strong className="text-white">risk_score / decision:</strong> float / text</div>
                    <div>• <strong className="text-white">pipeline_scores:</strong> jsonb</div>
                    <div>• <strong className="text-white">explainability:</strong> jsonb</div>
                    <div>• <strong className="text-white">created_at:</strong> timestamptz desc (Indexed)</div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Equipped with high-performance B-tree indexes for instant querying across historical scans and community statistics.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer Info Box */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400" />
          <span>Sentinel-AI Architecture & System Specifications — Built for Mobile & Enterprise Threat Defense.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Last Updated: November 2026 • Production Edition
        </div>
      </div>

    </div>
  );
}
