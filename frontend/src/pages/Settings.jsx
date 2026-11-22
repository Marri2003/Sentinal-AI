import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  Server, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const [threshold, setThreshold] = useState(45);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('sentinel_threshold', String(threshold));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1527] border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="h-6 w-6 text-cyan-400" />
            Detection & Platform Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tune multi-modal decision thresholds and verify cloud service endpoints.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Settings saved successfully in client configuration.</span>
          </div>
        )}

        {/* Threshold Adjustment */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" /> Threat Classification Threshold
              </h3>
              <p className="text-xs text-slate-400">
                Messages with fused risk score exceeding this threshold are flagged as SPAM/Phishing.
              </p>
            </div>
            <div className="font-mono text-cyan-400 font-bold text-lg self-start sm:self-auto">
              {threshold}%
            </div>
          </div>

          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>Aggressive Defense (20%)</span>
            <span>Balanced Default (45%)</span>
            <span>Conservative (80%)</span>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-glow"
          >
            Save Configuration
          </button>
        </div>

        {/* Cloud Endpoints & Environment Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" /> AI Microservice API
            </span>
            <div className="font-mono text-[11px] text-slate-400 break-all p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              {import.meta.env.VITE_API_BASE_URL || 'https://marrideepak-sentinelai-backend.hf.space'}
            </div>
            <span className="text-[10px] text-slate-500 block">Hugging Face Gradio & FastAPI Host</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" /> Active Deep Learning Pipelines
            </span>
            <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
              <li>• XLM-RoBERTa (1.1GB Base Transformer)</li>
              <li>• Tesseract OCR v5.5 (Multi-lingual)</li>
              <li>• 15-Feature Metadata FFNN</li>
              <li>• Late Decision Fusion Engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
