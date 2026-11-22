import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Binary, 
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function About() {
  const metrics = [
    { label: 'XLM-RoBERTa Accuracy', value: '97.99%' },
    { label: 'Text F1-Score', value: '97.52%' },
    { label: 'Metadata Model F1', value: '85.60%' },
    { label: 'Base Fusion Weights', value: '60% / 20% / 20%' }
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Overview Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              SentinelAI System Architecture
            </h1>
            <p className="text-xs text-slate-400">
              Multi-modal smishing & phishing detection engine designed for Indian regional languages and mobile scams.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pt-2">
          Traditional spam filters rely on static blocklists or simple keyword regex rules that fail against polymorphic attacks, Hinglish transliterations, and regional languages. SentinelAI solves this with a <strong className="text-cyan-400">three-pipeline multi-modal deep learning architecture</strong> unified by a late decision fusion engine.
        </p>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
              <div className="text-xl font-black text-cyan-400">{m.value}</div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Pipelines Detailed Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-cyan-400" />
          The Three Inference Pipelines
        </h2>

        {/* Pipeline 1: Text Analysis */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Cpu className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pipeline 1: Text Semantics (XLM-RoBERTa)</h3>
              <p className="text-xs text-slate-400">278 Million Parameter Multilingual Cross-Lingual Transformer</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Fine-tuned on curated Indian SMS datasets featuring English, Hindi, Hinglish, and Telugu fraud vectors. The model uses eager self-attention mechanisms to map subtle urgency signals, coercive threats, and disguised bank impersonation.
            </p>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-300 font-medium">
              <strong className="text-cyan-400">Explainability:</strong> Attention matrices extract per-token attribution scores, highlighting exact trigger words (such as "Verify", "blocked", "KYC", or shortened links) directly in the UI.
            </div>
          </div>
        </div>

        {/* Pipeline 2: Image & OCR */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Eye className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pipeline 2: Image Analysis (Tesseract OCR)</h3>
              <p className="text-xs text-slate-400">Computer Vision Preprocessing & Optical Character Recognition</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Scammers frequently send screenshots of fake bank payment confirmations, electric cutoff notices, or QR payment threats to evade standard text filters.
            </p>
            <p>
              Pipeline 2 takes screenshot uploads, applies <strong className="text-white">grayscale conversion, adaptive Gaussian thresholding, and non-local means denoising (fastNlMeans)</strong>, and uses Tesseract OCR to extract the embedded text, which is then scored by XLM-RoBERTa.
            </p>
          </div>
        </div>

        {/* Pipeline 3: Metadata FFNN */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Binary className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pipeline 3: Metadata & URL Feature Engineering</h3>
              <p className="text-xs text-slate-400">15-Feature Multi-Layer Perceptron (Feedforward Neural Network)</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Analyzes non-semantic telemetry signals that scammers cannot easily hide:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-cyan-300">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">• is_shortened_url (bit.ly, tinyurl)</div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">• suspicious_tld (.xyz, .top, .app)</div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">• sender_entropy & special chars</div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">• suspicious_sender_header (TRAI headers)</div>
            </div>
          </div>
        </div>

        {/* Late Decision Fusion */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Decision Fusion Engine</h3>
              <p className="text-xs text-slate-400">Adaptive Modality Weighting with Zero-Penalty Exclusion</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              In real-world usage, messages rarely contain all modalities at once (e.g. text only, or screenshot only). Rather than defaulting missing modalities to an arbitrary 0.5 score (which introduces false positives), SentinelAI mathematically reallocates weights dynamically:
            </p>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-xs text-cyan-300 space-y-1">
              <div>// Base Weights: Text (0.60), Metadata (0.20), Image (0.20)</div>
              <div>// When Image is missing: Text ➡️ 75%, Metadata ➡️ 25%</div>
              <div>// When Metadata is missing: Text ➡️ 75%, Image ➡️ 25%</div>
              <div>// When only Image is provided: Image ➡️ 100%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
