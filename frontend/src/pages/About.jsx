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
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-10">
      {/* Overview Header */}
      <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-2xl text-primary">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              SentinelAI System Architecture
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Multi-modal smishing & phishing detection engine designed for Indian regional languages and mobile scams.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed pt-2">
          Traditional spam filters rely on static blocklists or simple keyword regex rules that fail against polymorphic attacks, Hinglish transliterations, and regional languages. SentinelAI solves this with a <strong>three-pipeline multi-modal deep learning architecture</strong> unified by a late decision fusion engine.
        </p>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
              <div className="text-xl font-extrabold text-slate-900">{m.value}</div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Pipelines Detailed Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          The Three Inference Pipelines
        </h2>

        {/* Pipeline 1: Text Analysis */}
        <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pipeline 1: Text Semantics (XLM-RoBERTa)</h3>
              <p className="text-xs text-slate-500">278 Million Parameter Multilingual Cross-Lingual Transformer</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              Fine-tuned on curated Indian SMS datasets featuring English, Hindi, Hinglish, and Telugu fraud vectors. The model uses eager self-attention mechanisms to map subtle urgency signals, coercive threats, and disguised bank impersonation.
            </p>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-950 font-medium">
              <strong>Explainability:</strong> Attention matrices extract per-token attribution scores, highlighting exact trigger words (such as "Verify", "blocked", "KYC", or shortened links) directly in the UI.
            </div>
          </div>
        </div>

        {/* Pipeline 2: Image & OCR */}
        <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-purple text-purple-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pipeline 2: Image Analysis (Tesseract OCR)</h3>
              <p className="text-xs text-slate-500">Computer Vision Preprocessing & Optical Character Recognition</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              Scammers frequently send screenshots of fake bank payment confirmations, electric cutoff notices, or QR payment threats to evade standard text filters.
            </p>
            <p>
              Pipeline 2 takes screenshot uploads, applies <strong>grayscale conversion, adaptive Gaussian thresholding, and non-local means denoising (fastNlMeans)</strong>, and uses Tesseract OCR to extract the embedded text, which is then scored by XLM-RoBERTa.
            </p>
          </div>
        </div>

        {/* Pipeline 3: Metadata FFNN */}
        <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Binary className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pipeline 3: Metadata & URL Feature Engineering</h3>
              <p className="text-xs text-slate-500">15-Feature Multi-Layer Perceptron (Feedforward Neural Network)</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              Analyzes non-semantic telemetry signals that scammers cannot easily hide:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-700">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">• is_shortened_url (bit.ly, tinyurl)</div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">• suspicious_tld (.xyz, .top, .app)</div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">• sender_entropy & special chars</div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">• suspicious_sender_header (TRAI headers)</div>
            </div>
          </div>
        </div>

        {/* Late Decision Fusion */}
        <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic Decision Fusion Engine</h3>
              <p className="text-xs text-slate-500">Adaptive Modality Weighting with Zero-Penalty Exclusion</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              In real-world usage, messages rarely contain all modalities at once (e.g. text only, or screenshot only). Rather than defaulting missing modalities to an arbitrary 0.5 score (which introduces false positives), SentinelAI mathematically reallocates weights dynamically:
            </p>
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl font-mono text-xs text-orange-950 space-y-1">
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
