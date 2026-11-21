import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Send, 
  Image as ImageIcon, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Loader2, 
  Globe2, 
  X, 
  Sparkles,
  Trash2
} from 'lucide-react';
import { predictPhishing, checkBackendHealth, getJustification } from '../services/sentinelApi';
import { logScanToCommunity, getCommunitySpamCount } from '../services/supabase';
import ResultCard from '../components/ResultCard';

const PRELOAD_SAMPLES = [
  {
    label: '🚨 Urgent SBI KYC Phishing',
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
  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applySample = (sample) => {
    setPhone(sample.phone);
    setMessage(sample.text);
    setError(null);
    setResult(null);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) {
      setError('Please provide SMS text or upload a screenshot to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setJustification(null);

    // Live progress message simulation
    const steps = [
      'Preprocessing inputs and extracting metadata...',
      imageFile ? 'Extracting text using Tesseract OCR...' : 'Tokenizing text with XLM-RoBERTa...',
      'Evaluating cross-lingual embeddings...',
      'Performing multi-modal decision fusion...'
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
      // Extract URL from message if present
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

      // Log to Supabase and query crowdsourced community spam telemetry
      const effectiveText = message.trim() || res.explainability?.ocr_text || '';
      logScanToCommunity({
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

      // Attempt AI justification asynchronously
      getJustification(res, language, effectiveText)
        .then(setJustification)
        .catch(() => {});

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Analysis failed. Make sure the backend server is running on http://127.0.0.1:8000.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
      {/* Backend Status Alert */}
      {!backendOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Backend Offline:</span> Cannot reach <code>http://127.0.0.1:8000/health</code>. Ensure your FastAPI backend is running via <code>run_windows.bat</code>.
          </div>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-2xl text-primary">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Scan & Analyze SMS</h1>
              <p className="text-xs text-slate-500">Multi-modal phishing detection supporting text, screenshots, and metadata.</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full w-fit">
            <Globe2 className="h-4 w-4 text-slate-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="english">English</option>
              <option value="hindi">हिंदी (Hindi)</option>
              <option value="telugu">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>

        {/* Quick Preload Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Quick Test Scenarios:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRELOAD_SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySample(s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-orange-50 hover:text-primary hover:border-orange-200 border border-slate-200 transition-all text-slate-700"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScan} className="space-y-5">
          {/* Sender Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              Sender Phone Number / Header (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210 or VK-HDFCBK"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono placeholder:font-sans"
            />
          </div>

          {/* Message Text */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                SMS / Message Content {imagePreview && <span className="text-slate-400 font-normal">(Optional when screenshot uploaded)</span>}
              </label>
              <span className="text-xs text-slate-400">{message.length} chars</span>
            </div>
            <textarea
              rows={4}
              placeholder="Paste suspicious text here... (or leave blank if uploading screenshot below)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm leading-relaxed"
            />
          </div>

          {/* Screenshot Upload with OCR */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              Upload Screenshot (Tesseract OCR Enabled)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleImageChange}
              className="hidden"
              id="screenshot-input"
            />

            {!imagePreview ? (
              <label
                htmlFor="screenshot-input"
                className="border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-orange-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all block space-y-2"
              >
                <ImageIcon className="h-8 w-8 mx-auto text-slate-400" />
                <div className="text-sm font-semibold text-slate-700">
                  Click to upload screenshot or drag and drop
                </div>
                <div className="text-xs text-slate-400">
                  PNG, JPG or JPEG up to 5MB. Tesseract OCR will read the text automatically.
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-white">
                  <img src={imagePreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{imageFile?.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {((imageFile?.size || 0) / 1024).toFixed(1)} KB • Ready for OCR extraction
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scan Button */}
          <button
            type="submit"
            disabled={loading || (!message.trim() && !imageFile)}
            className="w-full py-4 px-6 rounded-full font-bold text-white bg-primary hover:bg-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{loadingStep || 'Analyzing threat...'}</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Run Phishing Detection Scan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="pt-2">
        <ResultCard result={result} justification={justification} communityCount={communityCount} />
      </div>
    </div>
  );
}
