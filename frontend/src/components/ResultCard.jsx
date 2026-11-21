import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  Link as LinkIcon, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  FileText,
  Users
} from 'lucide-react';

export default function ResultCard({ result, justification, communityCount = 0 }) {
  if (!result) return null;

  const isSpam = result.decision === 'SPAM';
  const riskPercent = Math.round((result.final_score || 0) * 100);
  const textScore = result.pipeline_scores?.text != null ? Math.round(result.pipeline_scores.text * 100) : null;
  const metaScore = result.pipeline_scores?.metadata != null ? Math.round(result.pipeline_scores.metadata * 100) : null;
  const imgScore = result.pipeline_scores?.image != null ? Math.round(result.pipeline_scores.image * 100) : null;

  const weights = result.fusion_weights_used || { text: 0.7, metadata: 0.3, image: 0 };
  const words = result.explainability?.contributing_words || [];
  const features = result.explainability?.contributing_features || [];
  const ocrText = result.explainability?.ocr_text || null;

  const recommendations = isSpam
    ? {
        doList: [
          'Delete this message immediately from your inbox.',
          'Block the sender phone number on your phone.',
          'Report the number to 1930 (National Cyber Crime Helpline).',
          'Warn family and contacts if this scam impersonates an official body.'
        ],
        dontList: [
          'Do NOT click any URLs or bit.ly links inside the message.',
          'Do NOT call back any phone number listed in the text.',
          'NEVER share OTPs, UPI PINs, or bank passwords with anyone.',
          'Do NOT download any APK or file attachments sent via SMS.'
        ]
      }
    : {
        doList: [
          'Keep this transaction or alert for your records if needed.',
          'Verify legitimate communications directly through official banking apps.'
        ],
        dontList: [
          'Do not share OTPs even for legitimate messages.',
          'Never click links in SMS if the sender asks you to enter credentials.'
        ]
      };

  return (
    <div className="space-y-6">
      {/* 1. Main Decision Card */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span
            className={`px-4 py-2 rounded-full font-bold text-lg inline-flex items-center gap-2 ${
              isSpam ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {isSpam ? <AlertTriangle className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            {isSpam ? 'PHISHING / SPAM DETECTED' : 'LEGITIMATE MESSAGE'}
          </span>

          <div className="text-right">
            <span className="text-sm font-medium text-slate-500 mr-2">{result.confidence} Confidence</span>
            <span className={`text-3xl font-extrabold ${isSpam ? 'text-red-500' : 'text-green-600'}`}>
              {riskPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Overall Threat Score</span>
            <span>{riskPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isSpam ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${riskPercent}%` }}
            />
          </div>
        </div>

        <div className={`mt-4 p-3.5 rounded-xl text-sm ${isSpam ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {isSpam
            ? '⚠️ Warning: This message exhibits strong patterns of fraud, urgency, or suspicious sender behavior.'
            : '✓ Safety Notice: No typical smishing or phishing signatures were detected in this message.'}
        </div>

        {/* Community Telemetry Badge */}
        {communityCount > 0 && isSpam && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <Users className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">🚨 Crowdsourced Telemetry Alert</div>
              <div className="text-xs text-amber-800 mt-1 leading-relaxed">
                <strong>{communityCount} other user{communityCount > 1 ? 's' : ''}</strong> reported receiving similar scam messages matching this pattern or sender. This confirms an active ongoing smishing campaign.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Pipeline Breakdown */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Pipeline Modality Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Text Model */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>XLM-RoBERTa (Text)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {textScore !== null ? `${textScore}%` : 'N/A'}
            </div>
            {textScore !== null && (
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${textScore}%` }} />
              </div>
            )}
          </div>

          {/* Metadata Model */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LinkIcon className="h-4 w-4 text-primary" />
              <span>Metadata & URL</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {metaScore !== null ? `${metaScore}%` : 'N/A'}
            </div>
            {metaScore !== null && (
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${metaScore}%` }} />
              </div>
            )}
          </div>

          {/* Image Model */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Tesseract (OCR Image)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {imgScore !== null ? `${imgScore}%` : 'N/A'}
            </div>
            {imgScore !== null && (
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${imgScore}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Fusion Weights */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold">Dynamic Weights Reallocated:</span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-full font-medium">Text: {Math.round((weights.text || 0) * 100)}%</span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-full font-medium">Metadata: {Math.round((weights.metadata || 0) * 100)}%</span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-full font-medium">Image: {Math.round((weights.image || 0) * 100)}%</span>
        </div>
      </div>

      {/* 3. OCR Extracted Text Card (if image was processed) */}
      {ocrText && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Text Extracted from Image (Tesseract OCR)
          </h3>
          <blockquote className="border-l-4 border-primary bg-slate-50 p-4 rounded-r-xl text-slate-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {ocrText}
          </blockquote>
          <p className="text-xs text-slate-500">
            This text was automatically extracted by the Tesseract OCR engine and forwarded to XLM-RoBERTa for classification.
          </p>
        </div>
      )}

      {/* 4. Explainability - Trigger Words */}
      {words.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Key Suspicious Indicators (XLM-RoBERTa Token Attribution)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Tokens that contributed most heavily toward the smishing classification:
          </p>
          <div className="flex flex-wrap gap-2">
            {words.map((item, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  item.score > 0.6
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {item.word}{' '}
                <span className="opacity-75">({Math.round(item.score * 100)}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Explainability - Suspicious Metadata Features */}
      {features.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Suspicious Metadata Signals (FFNN)
          </h3>
          <div className="space-y-2 mt-3">
            {features.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{feat.feature}</span>
                  <span>{Math.round(feat.score * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${feat.score > 0.6 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.round(feat.score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. AI Justification (Optional) */}
      {justification && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Safety Explanation
          </h3>
          <blockquote className="border-l-4 border-primary bg-orange-50/40 p-4 rounded-r-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            {justification}
          </blockquote>
        </div>
      )}

      {/* 7. Actionable Security Recommendations */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Recommended Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DO */}
          <div className="p-4 rounded-xl bg-green-50/70 border border-green-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-green-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              What to DO
            </div>
            <ul className="text-xs text-green-950 space-y-1.5 pl-1">
              {recommendations.doList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DONT */}
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              What NOT to Do
            </div>
            <ul className="text-xs text-red-950 space-y-1.5 pl-1">
              {recommendations.dontList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
