import React from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, PhoneCall, ExternalLink } from 'lucide-react';

export default function Help() {
  const faqs = [
    {
      q: "What is Smishing (SMS Phishing)?",
      a: "Smishing is a type of cyberattack where fraudsters send deceptive text messages designed to trick you into downloading malware, giving away sensitive personal info, or clicking links to fraudulent banking portals."
    },
    {
      q: "How does SentinelAI detect smishing?",
      a: "SentinelAI uses a 3-pipeline architecture: (1) Fine-tuned XLM-RoBERTa model analyzes semantic message text in multiple Indian languages; (2) Tesseract OCR extracts text from screenshots; (3) A Feedforward Neural Network analyzes metadata like sender entropy, URL shorteners, and suspicious domain extensions. Finally, Late Decision Fusion combines the signals."
    },
    {
      q: "Can I just upload a screenshot without typing the message?",
      a: "Yes! SentinelAI includes optical character recognition (OCR) powered by Tesseract. When you upload a screenshot of an SMS, the image pipeline extracts the text automatically and evaluates it."
    },
    {
      q: "Does SentinelAI store my messages or phone numbers?",
      a: "No. The backend API is completely stateless. It processes the input in RAM to compute model weights, returns the verdict, and immediately discards the data. Your personal messages are not logged or stored."
    },
    {
      q: "What should I do if a message is flagged as High Risk (SPAM)?",
      a: "1. Never click any links inside the message. 2. Never call the phone number provided in the message. 3. Never share OTPs, PINs, or bank passwords. 4. Block the sender number immediately. 5. Report the fraud to the Indian Cyber Crime Helpline (1930) or https://cybercrime.gov.in."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <div className="bg-white border border-border rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl text-primary">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions & Help</h1>
            <p className="text-sm text-slate-500">Learn how smishing works and how SentinelAI protects you.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {faqs.map((f, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl p-5 space-y-2 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="text-primary font-extrabold">Q:</span> {f.q}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Reporting Resources */}
      <div className="bg-orange-50/80 border border-orange-200 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-200 rounded-xl text-primary">
            <PhoneCall className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Official Indian Cybercrime Helplines</h2>
            <p className="text-xs text-slate-600">If you have been scammed or lost money, act immediately:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-4 rounded-xl border border-orange-200">
            <div className="text-xs font-semibold text-slate-500">National Cyber Crime Helpline</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">1930 (Toll Free)</div>
            <div className="text-xs text-slate-500 mt-1">Immediate financial fraud reporting (Golden Hour)</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-orange-200">
            <div className="text-xs font-semibold text-slate-500">National Cyber Crime Portal</div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-primary hover:underline flex items-center gap-1 mt-1"
            >
              cybercrime.gov.in <ExternalLink className="h-4 w-4" />
            </a>
            <div className="text-xs text-slate-500 mt-1">Ministry of Home Affairs portal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
