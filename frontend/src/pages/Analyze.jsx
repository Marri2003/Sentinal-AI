import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Image as ImageIcon, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Loader2, 
  Globe2, 
  X, 
  Sparkles,
  Trash2,
  UploadCloud,
  CheckCircle2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { predictPhishing, checkBackendHealth, getJustification } from '../services/sentinelApi';
import { logScanToCommunity, getCommunitySpamCount } from '../services/supabase';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../App';

const PRELOAD_SAMPLES = [
  {
    label: '🚨 Urgent SBI KYC Smishing',
    phone: '+919876543210',
    text: 'URGENT: Your SBI bank account will be blocked today. Verify your KYC immediately at http://bit.ly/sbi-kyc-verify to avoid suspension.'
  },
  {
    label: '⚡ Electricity Disconnection Scam',
    phone: '+918076543210',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the sub-station because your bill was not updated. Contact official immediately at 9876543210.'
  },
  {
    label: '✅ Legitimate HDFC Bank Alert (Ham)',
    phone: 'HDFCBK',
    text: 'INR 2,450.00 debited from A/c **7890 on 21-Nov-2026 at FLIPKART INDIA. Avl Bal: INR 34,210.50. If not you, SMS BLOCK to 56767.'
  }
];

export default function Analyze() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('english');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [backendOnline, setBackendOnline] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [justification, setJustification] = useState(null);
  const [communityCount, setCommunityCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  const handleImage = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot exceeds 5MB size limit. Please upload a smaller image.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImage(e.dataTransfer.files[0]);
    }
  };

  const clearForm = () => {
    setPhone('');
    setMessage('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setResult(null);
    setJustification(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applySample = (sample) => {
    setPhone(sample.phone);
    setMessage(sample.text);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setResult(null);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) {
      setError('Please provide message text or upload a screenshot to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setJustification(null);

    const steps = [
      'Extracting sender header and URL signatures...',
      imageFile ? 'Executing Tesseract OCR on screenshot...' : 'Generating XLM-RoBERTa cross-lingual embeddings...',
      'Evaluating Feed-Forward Neural Network for domain risk...',
      'Performing dynamic multi-modal decision fusion...'
    ];
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
      }
    }, 700);

    try {
      const urlMatch = message.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(?:com|org|net|in|xyz|co|io)[^\s]*)/i);
      const extractedUrl = urlMatch ? urlMatch[0] : '';

      let base64Image = null;
      if (imagePreview) {
        base64Image = imagePreview.split(',')[1];
      }

      const payload = {
        text: message.trim(),
        image: base64Image,
        metadata: {
          sender: phone.trim() || '',
          url: extractedUrl,
          timestamp: new Date().toISOString()
        }
      };

      const res = await predictPhishing(payload);
      clearInterval(stepInterval);
      setResult(res);

      const effectiveText = message.trim() || res.explainability?.ocr_text || '';
      logScanToCommunity({
        userId: user?.id || null,
        messageText: effectiveText,
        sender: payload.metadata.sender,
        phone: payload.metadata.sender,
        detectedUrl: payload.metadata.url,
        riskScore: res.final_score,
        decision: res.decision,
        confidence: res.confidence,
        pipelineScores: res.pipeline_scores,
        explainability: res.explainability,
      }).catch(() => {});

      getCommunitySpamCount(payload.metadata.sender, effectiveText)
        .then((telemetry) => setCommunityCount(telemetry.count))
        .catch(() => setCommunityCount(0));

      getJustification(res, language, effectiveText)
        .then(setJustification)
        .catch(() => {});

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Analysis failed. Please verify the AI backend microservice is operational.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Backend Status Warning if Offline */}
      {!backendOnline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold">AI Microservice Warning:</span> Hugging Face backend is connecting or spinning up. Scans will retry automatically.
          </div>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="rounded-3xl bg-[#0d1527] border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Card Header & Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Deep Multi-Modal Threat Scanner
              </h2>
              <p className="text-xs text-slate-400">
                Inspect SMS text, telecom DLT headers, URLs, and OCR screenshot evidence.
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full w-fit">
            <Globe2 className="h-4 w-4 text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="english" className="bg-[#0d1527] text-white">English</option>
              <option value="hindi" className="bg-[#0d1527] text-white">हिंदी (Hindi)</option>
              <option value="telugu" className="bg-[#0d1527] text-white">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>

        {/* Quick Preload Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Test Attack Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRELOAD_SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySample(s)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 text-slate-300 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScan} className="space-y-5">
          {/* Sender Phone or Header */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-400" />
              Sender Phone Number / Telecom Header (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. VK-HDFCBK, AD-SBIBNK, or +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-sm font-mono text-white placeholder:text-slate-500 placeholder:font-sans focus:outline-none transition"
            />
          </div>

          {/* Message Text Input with Character Counter */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                SMS / Message Content {imagePreview && <span className="text-slate-500 font-normal">(Optional when screenshot uploaded)</span>}
              </label>
              <span className="text-[11px] font-mono text-slate-500">{message.length} chars</span>
            </div>
            <textarea
              rows={4}
              placeholder="Paste suspicious SMS text here... (or drag & drop a screenshot below)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:outline-none transition"
            />
          </div>

          {/* Screenshot Upload with Drag & Drop OCR */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              Upload Evidence Screenshot (Tesseract OCR v5.5)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              className="hidden"
              id="screenshot-input"
            />

            {!imagePreview ? (
              <label
                htmlFor="screenshot-input"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all block space-y-2 ${
                  dragActive 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : 'border-slate-800 hover:border-cyan-500/40 bg-slate-900/50 hover:bg-slate-900'
                }`}
              >
                <UploadCloud className="h-8 w-8 mx-auto text-cyan-400/80" />
                <div className="text-xs font-semibold text-slate-300">
                  Drop screenshot here or <span className="text-cyan-400 underline">browse files</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  PNG, JPG or JPEG up to 5MB. Optical Character Recognition will extract text automatically.
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-950">
                  <img src={imagePreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{imageFile?.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {((imageFile?.size || 0) / 1024).toFixed(1)} KB • Ready for Tesseract OCR
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                  title="Remove screenshot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons: Clear & Analyze */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={clearForm}
              className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-2"
              title="Clear all fields"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              disabled={loading || (!message.trim() && !imageFile)}
              className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{loadingStep || 'Executing Decision Fusion...'}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Execute Threat Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="pt-2">
        <ResultCard result={result} justification={justification} communityCount={communityCount} />
      </div>
    </div>
  );
}
