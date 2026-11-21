import React, { useState } from 'react';
import { Sparkles, Shield, AlertTriangle, Send, Loader2, ArrowRight } from 'lucide-react';
import { predictPhishing, getJustification } from '../services/sentinelApi';
import ResultCard from '../components/ResultCard';

const SCENARIOS = [
  {
    id: 1,
    title: 'Urgent Bank KYC Suspension (Phishing)',
    category: 'Bank Fraud',
    badge: 'High Risk (Spam)',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    phone: '+918076543210',
    text: 'URGENT: Your SBI account has been temporarily suspended due to KYC verification pending. Click here to verify immediately: bit.ly/sbi-kyc-2024 or your account will be closed within 24 hours. Customer care: 1800-XXXX',
    explanation: 'Contains urgent coercive language, short expiration deadline, and an obfuscated bit.ly URL mimicking an official bank domain.'
  },
  {
    id: 2,
    title: 'Electricity Bill Disconnection Scam',
    category: 'Utility Scam',
    badge: 'High Risk (Spam)',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    phone: '+919988776655',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the electric office because your previous month bill was not updated. Please immediately contact our power officer at 9876543210. Thank you.',
    explanation: 'Uses fear tactics threatening nighttime power disconnection to panic victims into calling an unofficial personal mobile number.'
  },
  {
    id: 3,
    title: 'Government Scheme / PM Kisan Subsidy Fake Link',
    category: 'Government Fraud',
    badge: 'High Risk (Spam)',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    phone: '+917012345678',
    text: 'PM-Kisan Yojana Alert: 17th installment of Rs. 6,000 has been credited to your Aadhaar-linked account. Click to verify receipt and download payment voucher: http://pmkisan-gov-subsidy.xyz/verify',
    explanation: 'Exploits welfare schemes with a fraudulent non-governmental (.xyz) domain that impersonates an official government portal.'
  },
  {
    id: 4,
    title: 'Legitimate Bank Transaction Alert (Safe Ham)',
    category: 'Legitimate Banking',
    badge: 'Safe (Ham)',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    phone: 'HDFCBK',
    text: 'INR 1,850.00 debited from A/c **4321 on 21-Nov-2026 at AMAZON PAY INDIA. Avl Bal: INR 45,230.12. If not you, SMS BLOCK to 56767 or call 18002026161. - HDFC Bank',
    explanation: 'Legitimate bank alphanumeric sender ID (HDFCBK), specific account mask, standard balance disclosure, and toll-free helpline.'
  }
];

export default function Demo() {
  const [selectedId, setSelectedId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [justification, setJustification] = useState(null);

  const current = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  const handleRunDemo = async () => {
    setLoading(true);
    setResult(null);
    setJustification(null);

    try {
      const urlMatch = current.text.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(?:com|org|net|in|xyz|co|io)[^\s]*)/i);
      const extractedUrl = urlMatch ? urlMatch[0] : '';

      const payload = {
        text: current.text,
        metadata: {
          sender: current.phone,
          url: extractedUrl,
          timestamp: new Date().toISOString()
        }
      };

      const res = await predictPhishing(payload);
      setResult(res);

      getJustification(res, 'english', current.text)
        .then(setJustification)
        .catch(() => {});
    } catch (err) {
      console.error('Demo scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
      {/* Header */}
      <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-2xl text-primary">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Interactive Demo Showcase</h1>
            <p className="text-xs text-slate-500">
              Evaluate real-world fraud patterns against your trained SentinelAI models with 1 click.
            </p>
          </div>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Select a Threat Scenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedId;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(sc.id);
                    setResult(null);
                    setJustification(null);
                  }}
                  className={`p-4 text-left rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-orange-50/40 shadow-sm ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{sc.category}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{sc.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Preview */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Sender: <strong className="text-slate-800 font-mono">{current.phone}</strong></span>
            <span>Scenario #{current.id}</span>
          </div>

          <blockquote className="text-xs text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-sans italic">
            "{current.text}"
          </blockquote>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-700">Attack Anatomy:</strong> {current.explanation}
          </p>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleRunDemo}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-full font-bold text-white bg-primary hover:bg-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Inference with XLM-RoBERTa...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Analyze This Scenario
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="pt-2">
          <ResultCard result={result} justification={justification} />
        </div>
      )}
    </div>
  );
}
