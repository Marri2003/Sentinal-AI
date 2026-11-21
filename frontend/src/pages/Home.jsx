import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Layers, 
  Cpu, 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Globe2
} from 'lucide-react';

export default function Home() {
  const stats = [
    { label: 'Detection Accuracy', value: '97.5%' },
    { label: 'Supported Languages', value: 'English, हिंदी, తెలుగు' },
    { label: 'Inference Speed', value: '< 1.5s' },
    { label: 'Modality Pipelines', value: '3 (Text, OCR, Meta)' }
  ];

  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-primary" />,
      title: 'Multilingual XLM-RoBERTa',
      description: 'Fine-tuned cross-lingual transformer specifically trained on Indian SMS patterns, Hinglish transliterations, and local regional phrasing.'
    },
    {
      icon: <Eye className="h-6 w-6 text-primary" />,
      title: 'Tesseract OCR Vision',
      description: 'Extracts embedded text, banking logos, and malicious URLs directly from uploaded screenshots, fake receipts, and payment notices.'
    },
    {
      icon: <Layers className="h-6 w-6 text-primary" />,
      title: 'Metadata FFNN Classifier',
      description: 'Feedforward Neural Network evaluating 15 engineered signals including sender entropy, URL shortening, and header legitimacy.'
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: 'Dynamic Decision Fusion',
      description: 'Intelligently redistributes weights when inputs miss certain modalities (e.g. text-only without image), preventing false alarms.'
    }
  ];

  const scamExamples = [
    {
      title: 'Bank KYC Expiry Threat',
      sample: 'URGENT: Your SBI account has been locked. Verify KYC immediately at bit.ly/sbi-verify or account will be closed.',
      type: 'Phishing',
      risk: '98% Risk'
    },
    {
      title: 'Electricity Cutoff Fraud',
      sample: 'Dear consumer, power will be disconnected at 9:30 PM due to unpaid bill. Call 9876543210 immediately.',
      type: 'Urgent Smishing',
      risk: '95% Risk'
    },
    {
      title: 'Government Scheme Scam',
      sample: 'PM Kisan Yojana: Rs. 6000 credited to your account. Download APK to claim: http://pm-kisan-claim.xyz',
      type: 'Malicious APK',
      risk: '99% Risk'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-primary text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="h-4 w-4" />
            AI-Powered Multi-Modal Phishing Protection
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Stop SMS Scammers Before <br className="hidden md:block" />
            <span className="text-primary">They Steal Your Savings</span>
          </h1>

          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SentinelAI analyzes SMS text, screenshot images, and sender metadata in real-time to detect sophisticated financial fraud, bank impersonation, and phishing links.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/analyze"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-white bg-primary hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              Scan a Message Now
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              to="/demo"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-slate-700 bg-white border border-border hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 text-base"
            >
              Try Interactive Demo
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-200/80">
            {stats.map((s, idx) => (
              <div key={idx} className="p-4 bg-white/70 backdrop-blur rounded-2xl border border-border shadow-xs">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            How SentinelAI Analyzes Threats
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Traditional spam filters only look at keywords. SentinelAI fuses three independent intelligence layers for unmatched accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-primary flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Upload or Paste</h3>
            <p className="text-sm text-slate-600">
              Paste suspicious SMS text, enter the sender number, or simply drag and drop a screenshot. OCR extracts the content automatically.
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-primary flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Multi-Modal Fusion</h3>
            <p className="text-sm text-slate-600">
              XLM-RoBERTa scans the text, OCR processes the image, and the FFNN analyzes URL shorteners and sender entropy in parallel.
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-primary flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Explainable Verdict</h3>
            <p className="text-sm text-slate-600">
              Get an instant risk score, highlighted trigger keywords, detected threat vectors, and recommended security actions.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Common Fraud Scenarios */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Trained on Real-World Threats
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              SentinelAI identifies deceptive patterns commonly used across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scamExamples.map((ex, idx) => (
              <div key={idx} className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                      {ex.type}
                    </span>
                    <span className="text-xs font-bold text-red-600">{ex.risk}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{ex.title}</h4>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    "{ex.sample}"
                  </p>
                </div>
                <Link
                  to="/demo"
                  className="text-xs font-bold text-primary hover:text-orange-600 flex items-center gap-1 pt-2"
                >
                  Test this scenario in demo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Advanced Security Features
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Built from scratch with modern deep learning and explainable AI principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex gap-4 items-start">
              <div className="p-3 bg-orange-50 rounded-xl flex-shrink-0">
                {feat.icon}
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-base">{feat.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="container mx-auto px-4 max-w-4xl text-center">
        <div className="bg-slate-900 text-white rounded-3xl p-10 md:p-14 space-y-6 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Ready to Verify a Suspicious SMS?
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Don't click that link or share an OTP. Scan it with SentinelAI's multi-modal inference pipeline right now.
          </p>
          <div className="pt-2">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-slate-900 bg-primary hover:bg-orange-400 transition-all text-base shadow-lg"
            >
              Start Free Scan <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
