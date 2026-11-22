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
  Info,
  Maximize2
} from 'lucide-react';
import MermaidDiagram from '../components/MermaidDiagram';
import { fetchSystemInfo, checkBackendHealth } from '../services/sentinelApi';

export default function About({ defaultTab = 'architecture' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [archSubTab, setArchSubTab] = useState('complete');
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Authoritative verified telemetry directly from training JSON artifacts
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

  // =========================================================================
  // VERIFIED MERMAID FLOWCHART DEFINITIONS
  // =========================================================================

  const chartComplete = `flowchart TD
    User(["Client Browser / User Device"]) -->|1. HTTPS Request| Frontend["Vercel Frontend (React 18 SPA)"]
    
    subgraph Supabase_Auth ["Supabase Identity Layer"]
        Frontend <-->|Auth Tokens / Session Check| Auth["Supabase GoTrue JWT Auth"]
        Auth --> Session["Authenticated User Session"]
    end
    
    subgraph HF_Microservice ["Hugging Face Production Microservice (FastAPI + Gradio SDK)"]
        Frontend -->|2. POST /predict| Router["FastAPI Input Router & Validator"]
        
        Router -->|"text"| P1["Pipeline 1: Text Semantics"]
        Router -->|"metadata (url, sender)"| P2["Pipeline 2: Metadata Feature Extractor"]
        Router -->|"image (base64)"| P3["Pipeline 3: Image / OCR Preprocessor"]
        
        subgraph Text_Model ["Text Model"]
            P1 --> XLM["XLM-RoBERTa (278M params)<br/>SentencePiece BPE Tokenizer"]
            XLM --> TextScore["Text Risk Score (0.0 - 1.0)<br/>+ Token Attention Matrix"]
        end
        
        subgraph Metadata_Model ["Metadata Model"]
            P2 --> Feat15["15-Feature Vector<br/>StandardScaler Normalization"]
            Feat15 --> FFNN["Feedforward Neural Net (FFNN)<br/>15 -> 64 -> 32 -> 16 -> 2"]
            FFNN --> MetaScore["Metadata Risk Score (0.0 - 1.0)"]
        end
        
        subgraph OCR_Model ["Vision OCR"]
            P3 --> CV["OpenCV Preprocessing<br/>Adaptive Gaussian + fastNlMeans"]
            CV --> Tesseract["Tesseract OCR v5.5<br/>(hin, tel, eng)"]
            Tesseract -->|Extracted Text| P1
            Tesseract --> OCRScore["OCR Extracted Text Score"]
        end
        
        TextScore --> Fusion["Weighted Late Decision Fusion Engine<br/>Base Weights: 60% Text, 20% Meta, 20% Image<br/>Adaptive Missing Modality Redistribution<br/>Trusted Domain & Sender Whitelist Rules"]
        MetaScore --> Fusion
        OCRScore --> Fusion
        
        Fusion --> Decision["Final Prediction Output<br/>Decision: SPAM / HAM<br/>Final Score: 0.0 - 1.0<br/>Confidence: HIGH / MED / LOW"]
    end
    
    Decision -->|3. Synchronous Response| Frontend
    
    subgraph Groq_Advisory ["Groq Cloud Inference (Async Parallel)"]
        Frontend -->|4. POST /advisory & /justify| AdvisoryAPI["Advisory Endpoint"]
        AdvisoryAPI --> Groq["Groq Cloud API (Llama 3.1 8B)<br/>GROQ_API_KEY"]
        Groq --> AdvisoryCard["Structured Safety Advisory Card<br/>Contextual Guidance on PII, Fees, UPI"]
    end
    
    subgraph Supabase_DB ["Supabase PostgreSQL (Authoritative Cloud Source)"]
        Frontend -->|5. PostgREST with RLS| DB["public.analyses Table<br/>Cloud Telemetry Log"]
        DB --> Analytics["Security Analytics & Dashboard<br/>Historical Threat Audit Logs"]
        Analytics --> Frontend
    end
    
    AdvisoryCard --> Frontend`;

  const chartTextPipeline = `flowchart LR
    Msg["Raw SMS / Message Text"] --> Pre["Text Preprocessing<br/>Regex Normalization & Whitespace Strip"]
    Pre --> Tok["SentencePiece BPE Tokenizer<br/>max_length = 128 tokens"]
    Tok --> Enc["XLM-RoBERTa Transformer Encoder<br/>12-Layer, 768-Hidden, 12-Heads<br/>278 Million Parameters"]
    Enc --> Cls["Pooled [CLS] Token Representation<br/>Vector Size: 768"]
    Enc --> Attn["Eager Self-Attention Weights Matrix<br/>Per-Token Attribution Scoring"]
    Cls --> Drop["Dropout (p = 0.3)"]
    Drop --> Head["Classification Head<br/>Linear Layer (768 -> 2)"]
    Head --> Softmax["Softmax Activation"]
    Softmax --> Prob["Spam Probability Output (0.0 - 1.0)"]
    Attn --> Tokens["Trigger Token Highlight Map<br/>(e.g., 'blocked', 'KYC', 'link')"]`;

  const chartMetadataPipeline = `flowchart TD
    Meta["Message Metadata Input<br/>URL, Sender Phone/Header, Timestamp"] --> Extract["15-Feature Extraction Engine"]
    
    subgraph Features ["15 Extracted Numerical Features"]
        Extract --> F1["1. url_length"]
        Extract --> F2["2. url_num_dots"]
        Extract --> F3["3. url_num_digits"]
        Extract --> F4["4. url_num_special_chars"]
        Extract --> F5["5. url_entropy"]
        Extract --> F6["6. is_shortened_url (bit.ly, is.gd)"]
        Extract --> F7["7. has_ip_address"]
        Extract --> F8["8. has_at_symbol"]
        Extract --> F9["9. sender_length"]
        Extract --> F10["10. sender_has_numbers"]
        Extract --> F11["11. sender_has_special_chars"]
        Extract --> F12["12. hour_of_day"]
        Extract --> F13["13. is_weekend"]
        Extract --> F14["14. url_has_https"]
        Extract --> F15["15. url_suspicious_tld (.xyz, .top)"]
    end
    
    Features --> Scaler["StandardScaler Normalization<br/>metadata_scaler.pkl"]
    Scaler --> Tensor["PyTorch FloatTensor (1, 15)"]
    
    subgraph FFNN_Arch ["FFNN Classifier (15 -> 64 -> 32 -> 16 -> 2)"]
        Tensor --> L1["Linear (15 -> 64) + ReLU + Dropout(0.3)"]
        L1 --> L2["Linear (64 -> 32) + ReLU + Dropout(0.3)"]
        L2 --> L3["Linear (32 -> 16) + ReLU + Dropout(0.3)"]
        L3 --> L4["Linear (16 -> 2)"]
    end
    
    L4 --> MetaSoftmax["Softmax Activation"]
    MetaSoftmax --> MetaProb["Metadata Phishing Score (0.0 - 1.0)<br/>Feature Importance Attribution"]`;

  const chartImagePipeline = `flowchart TD
    ImgInput["Screenshot Upload<br/>(Base64 / Multipart PNG/JPG)"] --> Decode["Image Decompression & PIL Loading"]
    
    subgraph CV_Pipe ["Computer Vision Preprocessing"]
        Decode --> Gray["1. Grayscale Conversion"]
        Gray --> Thresh["2. Adaptive Gaussian Thresholding<br/>cv2.adaptiveThreshold"]
        Thresh --> Denoise["3. Non-Local Means Denoising<br/>cv2.fastNlMeansDenoising"]
    end
    
    subgraph OCR_Engine ["Optical Character Recognition"]
        Denoise --> Tess["Tesseract OCR Engine v5.5<br/>Pytesseract Interface"]
        Tess --> Langs["Language Packs: eng + hin + tel<br/>(--oem 3 --psm 6)"]
        Langs --> RawText["Extracted String Buffer"]
    end
    
    RawText --> Check{"Text Length >= 5 chars?"}
    Check -->|No / Blank| Fallback["image_score = None<br/>(Modality Excluded from Fusion)"]
    Check -->|Yes| Fwd["Forward to TextPipeline (XLM-RoBERTa)<br/>models/text_pipeline.py"]
    Fwd --> ImgScore["Image Risk Score (0.0 - 1.0)<br/>+ OCR Transcribed Content Display"]`;

  const chartFusion = `flowchart TD
    Inputs["Individual Pipeline Probabilities<br/>Text Score, Metadata Score, Image Score"] --> AvailCheck{"Check Available Modalities<br/>(Zero-Penalty Exclusion)"}
    
    AvailCheck -->|All 3 Available| W3["Text: 60% | Metadata: 20% | Image: 20%"]
    AvailCheck -->|Image Missing| W2A["Text: 75% | Metadata: 25%"]
    AvailCheck -->|Metadata Missing| W2B["Text: 75% | Image: 25%"]
    AvailCheck -->|Only Text Available| W1A["Text: 100%"]
    AvailCheck -->|Only Metadata Available| W1B["Metadata: 100%"]
    AvailCheck -->|Only Image Available| W1C["Image: 100%"]
    
    W3 --> WeightedSum["Compute Weighted Sum Score"]
    W2A --> WeightedSum
    W2B --> WeightedSum
    W1A --> WeightedSum
    W1B --> WeightedSum
    W1C --> WeightedSum
    
    subgraph SafetyRules ["Deterministic Safety Rules & Whitelists"]
        WhitelistCheck{"Trusted Domain or Sender?<br/>TRUSTED_DOMAINS / TRUSTED_SENDERS"}
        WhitelistCheck -->|Match Found| ForceSafe["Clamp Score to 0.0 (HAM)<br/>(e.g., SBIINB, HDFCBK, gov.in)"]
        WhitelistCheck -->|No Match| Clamping["Score Clamping [0.001, 0.999]"]
    end
    
    WeightedSum --> WhitelistCheck
    ForceSafe --> FinalScore["Final Combined Threat Score (0.0 - 1.0)"]
    Clamping --> FinalScore
    
    FinalScore --> ThreshCheck{"Score >= SPAM_THRESHOLD (0.60)?"}
    ThreshCheck -->|Yes| SPAM["Verdict: SPAM (Phishing Detected)"]
    ThreshCheck -->|No| HAM["Verdict: HAM (Legitimate Message)"]
    
    SPAM --> Conf["Assign Confidence Level:<br/>HIGH: > 0.85 or < 0.15<br/>MEDIUM: 0.60 - 0.85 or 0.15 - 0.40<br/>LOW: 0.40 - 0.60"]
    HAM --> Conf`;

  const chartSafetyAdvisory = `flowchart TD
    MsgInput["Original User Message Text<br/>+ OCR Extracted Text + ML Prediction"] --> Req["POST /advisory Endpoint"]
    
    subgraph Prompt_Engine ["Prompt Engineering & Injection Defenses"]
        Req --> Guard["System Prompt Guardrails<br/>Enforce Independent Educational Assessment"]
        Guard --> Schema["Structured Output JSON Schema<br/>advisory_level: HIGH | MODERATE | LOW"]
    end
    
    Schema --> GroqCheck{"Is GROQ_API_KEY Configured & Reachable?"}
    
    subgraph Groq_Call ["Groq Cloud Inference"]
        GroqCheck -->|Yes| GroqAPI["Groq Chat Completions API<br/>Model: llama-3.1-8b-instant<br/>Sub-200ms Execution"]
        GroqAPI --> Evaluator["8 Risk Dimension Evaluator:<br/>1. PII Solicitations<br/>2. Aadhaar & PAN Card Requests<br/>3. OTP & Password Extraction<br/>4. Upfront Processing/Job Fees<br/>5. Suspicious Payment & UPI QR<br/>6. Unverified HR/WhatsApp Handles<br/>7. Recruitment Scam Traps<br/>8. Urgent Coercive Claims"]
        Evaluator --> LLMResp["LLM Structured Advisory Response"]
    end
    
    subgraph Fallback_Engine ["Zero-Downtime Deterministic Fallback"]
        GroqCheck -->|No / Network Error / Rate Limit| FallbackFunc["generate_grounded_fallback_advisory()<br/>Heuristic Regex & Rule Matrix"]
        FallbackFunc --> FallbackResp["Deterministic Structured Advisory"]
    end
    
    LLMResp --> FinalAdvisory["Final Safety Advisory Object<br/>advisory_level, warnings, recommendations"]
    FallbackResp --> FinalAdvisory
    
    FinalAdvisory --> NonOverride["Non-Overriding Safety Principle:<br/>Precautionary guidance does NOT override ML score"]
    NonOverride --> UIRender["Render in SafetyAdvisoryCard Component"]`;

  const chartDeployment = `flowchart TD
    subgraph Client_Tier ["Client Browser Tier"]
        Browser["User Browser / Mobile Device"]
    end
    
    subgraph Vercel_Tier ["Vercel Edge Platform"]
        Browser <-->|HTTPS Web Traffic / CDN| Vercel["Vercel Global Edge Network<br/>React 18 + Vite SPA"]
    end
    
    subgraph HF_Tier ["Hugging Face Cloud Infrastructure"]
        Vercel -->|HTTPS REST API /predict, /justify, /advisory| HF_Space["Hugging Face Space (Gradio SDK)<br/>marrideepak/sentinelai-backend<br/>CPU Basic: 2 vCPU, 16 GB RAM"]
        HF_Hub["Hugging Face Model Hub (Git LFS)<br/>marrideepak/sentinelai-model<br/>1.1 GB text_model.pth Weights"] -.->|Boot Cache Download via hf_hub_download| HF_Space
    end
    
    subgraph Groq_Tier ["Groq Cloud API"]
        HF_Space -->|HTTPS Bearer Auth (GROQ_API_KEY)| GroqAPI["Groq LPU Inference Cloud<br/>llama-3.1-8b-instant"]
    end
    
    subgraph Supabase_Tier ["Supabase Managed Cloud Platform"]
        Browser <-->|HTTPS GoTrue JWT Auth| SupaAuth["Supabase Authentication Service"]
        Browser <-->|HTTPS PostgREST API with RLS| SupaPG["Supabase PostgreSQL Database<br/>public.profiles & public.analyses"]
    end`;

  const chartDependencies = `flowchart TD
    subgraph Browser_Deps ["Browser / Frontend Dependencies (package.json)"]
        F1["react (18.3.1)"]
        F2["react-dom (18.3.1)"]
        F3["react-router-dom (6.28.0)"]
        F4["@supabase/supabase-js (2.46.1)"]
        F5["lucide-react (0.462.0)"]
        F6["tailwindcss (3.4.15) & vite (6.0.1)"]
    end
    
    subgraph Backend_Deps ["Backend Microservice Dependencies (requirements.txt & packages.txt)"]
        subgraph Sys_Pkg ["Linux System Packages (packages.txt)"]
            S1["tesseract-ocr (v5.5)"]
            S2["tesseract-ocr-hin (Hindi Language Pack)"]
            S3["tesseract-ocr-tel (Telugu Language Pack)"]
            S4["libgl1 & libglib2.0-0"]
        end
        
        subgraph Web_Py ["Web Framework & Runtime"]
            W1["fastapi (>=0.111.0)"]
            W2["uvicorn[standard] (>=0.27.0)"]
            W3["pydantic (>=2.5.3)"]
            W4["gradio (4.44.0)"]
            W5["httpx (>=0.26.0) & loguru"]
        end
        
        subgraph ML_Py ["Machine Learning & Computer Vision"]
            M1["torch (PyTorch Engine)"]
            M2["transformers (>=4.36.2)"]
            M3["sentencepiece (>=0.1.99)"]
            M4["huggingface-hub (>=0.23.0)"]
            M5["scikit-learn (>=1.4.0)"]
            M6["numpy & pandas"]
            M7["pytesseract (>=0.3.10)"]
            M8["opencv-python-headless (>=4.8.0)"]
            M9["Pillow (>=10.0.0)"]
            M10["tldextract (>=5.1.0)"]
        end
        
        subgraph Model_Checkpoints ["Trained Checkpoint Artifacts (saved_models/)"]
            C1["text_model.pth (1.11 GB XLM-RoBERTa Weights)"]
            C2["text_tokenizer/ (SentencePiece BPE vocab & config)"]
            C3["metadata_model.pth (18 KB FFNN Weights)"]
            C4["metadata_scaler.pkl (809 B StandardScaler)"]
        end
    end`;

  const topNavTabs = [
    { id: 'architecture', label: 'System Architecture', icon: Layers },
    { id: 'performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'overview', label: 'Project Overview', icon: ShieldCheck },
  ];

  const archSubTabs = [
    { id: 'complete', label: 'Complete System Flow', icon: Zap },
    { id: 'pipelines', label: 'Detection Pipelines (A-E)', icon: Cpu },
    { id: 'dependencies', label: 'Model & Env Dependencies', icon: GitBranch },
    { id: 'deployment', label: 'Deployment & Cloud', icon: Cloud },
    { id: 'api_security', label: 'API & Database Lifecycle', icon: Key },
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
                <Layers className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Sentinel<span className="text-cyan-400">AI</span> Architecture & System Specifications
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    Production Grade
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Multi-Modal Deep Learning, OCR Vision, Decision Fusion & Cloud Telemetry Engine
                </p>
              </div>
            </div>

            {/* Microservice Live Status Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Microservice:</span>
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
            A visual and technical specification of the entire Sentinel-AI ecosystem: client interactions, 
            microservice routing, multi-lingual transformer inference, computer vision OCR, dynamic decision fusion, 
            Groq Llama 3.1 safety advisory reasoning, and Supabase PostgreSQL persistence with Row-Level Security.
          </p>

          {/* Quick Architecture Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-cyan-400">60% / 20% / 20%</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Base Fusion Weights</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-blue-400">0.60 Threshold</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">SPAM Decision Gate</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-purple-400">Tesseract v5.5</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">OCR + XLM Scoring</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-lg md:text-xl font-black text-emerald-400">&lt; 150ms Ingest</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Edge Microservice Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {topNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all ${
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
          SECTION: SYSTEM ARCHITECTURE (WITH INTERACTIVE MERMAID DIAGRAMS)
          ========================================================================= */}
      {activeTab === 'architecture' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Subtabs for Architecture Section */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {archSubTabs.map((st) => {
              const Icon = st.icon;
              const isSelected = archSubTab === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setArchSubTab(st.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* 1. Complete System Flow */}
          {archSubTab === 'complete' && (
            <div className="space-y-6">
              <MermaidDiagram
                id="complete_system"
                title="End-to-End System Architecture & Data Flow"
                subtitle="Client browser requests, Hugging Face microservice inference, Groq advisory, and Supabase cloud persistence"
                chart={chartComplete}
                legend={[
                  { color: 'bg-cyan-400', label: 'Frontend & Microservice Router' },
                  { color: 'bg-blue-400', label: 'Machine Learning Pipelines' },
                  { color: 'bg-purple-400', label: 'Vision OCR & Image Engine' },
                  { color: 'bg-emerald-400', label: 'Supabase PostgreSQL & Auth' },
                  { color: 'bg-amber-400', label: 'Groq LLM Safety Layer' }
                ]}
              />

              {/* Responsibilities Breakdown (10 Core Components) */}
              <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  Responsibilities of the 10 Core Architectural Components
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-cyan-300">1. User / Client Browser:</strong>
                    <p className="text-slate-300">Captures SMS text, phone sender headers, URLs, and screenshot uploads. Provides interactive feedback and token visualization.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-cyan-300">2. Vercel Frontend:</strong>
                    <p className="text-slate-300">React 18 Single Page Application deployed on Vercel's Edge Network for global low-latency content delivery and client orchestration.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-blue-300">3. Backend API (Hugging Face Spaces):</strong>
                    <p className="text-slate-300">FastAPI microservice running on CPU Basic (16 GB RAM) with Gradio SDK entrypoint (<code className="text-cyan-300 font-mono">app.py</code>). Exposes <code className="text-cyan-300 font-mono">/predict</code>, <code className="text-cyan-300 font-mono">/justify</code>, and <code className="text-cyan-300 font-mono">/advisory</code>.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-blue-300">4. XLM-RoBERTa Text Model:</strong>
                    <p className="text-slate-300">278M parameter transformer fine-tuned on multilingual Indian smishing vectors (English, Hindi, Hinglish, Telugu) with token-level self-attention attribution.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-amber-300">5. FFNN Metadata Classifier:</strong>
                    <p className="text-slate-300">15-feature neural network extracting non-semantic signals: domain entropy, URL length, shortened link indicators, TRAI sender headers, and temporal features.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-purple-300">6. Tesseract OCR v5.5 Engine:</strong>
                    <p className="text-slate-300">Processes screenshot images via OpenCV adaptive Gaussian thresholding and fastNlMeans denoising. Extracted text is directly scored by the XLM-RoBERTa text model.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-cyan-300">7. Weighted Late Fusion Engine:</strong>
                    <p className="text-slate-300">Combines available pipeline outputs using base weights (60% Text, 20% Metadata, 20% Image) with zero-penalty exclusion when modalities are missing.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-emerald-300">8. Groq Cloud LLM API:</strong>
                    <p className="text-slate-300">Runs Llama 3.1 8B in under 200ms to formulate human-readable explainability and proactive safety advisories independently of the ML classifier score.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-emerald-300">9. Supabase Authentication:</strong>
                    <p className="text-slate-300">GoTrue JWT session authentication managing secure login, user profiles, and cryptographic access control directly from the frontend.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <strong className="text-emerald-300">10. Supabase PostgreSQL Database:</strong>
                    <p className="text-slate-300">Managed PostgreSQL database with Row-Level Security (RLS) storing user profiles and historical scan telemetry (<code className="text-cyan-300 font-mono">public.analyses</code>) with B-tree indexes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Detailed Pipelines (A-E) */}
          {archSubTab === 'pipelines' && (
            <div className="space-y-8">
              
              {/* Pipeline A: Text Semantics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline A: Text Analysis Pipeline (XLM-RoBERTa)</h3>
                    <p className="text-xs text-slate-400">Deep Semantic Analysis with Eager Attention Explainability</p>
                  </div>
                </div>
                <MermaidDiagram
                  id="pipe_text"
                  title="Pipeline A: XLM-RoBERTa End-to-End Processing"
                  subtitle="Tokenization, 12-layer transformer encoder, pooling, dropout, linear head, and attention attribution matrix"
                  chart={chartTextPipeline}
                />
                <div className="p-4 rounded-2xl bg-[#0c1324] border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p><strong>Technical Specifics:</strong> Base encoder <code className="text-cyan-300 font-mono">xlm-roberta-base</code> (278M parameters). Tokenized with a SentencePiece BPE tokenizer (<code className="text-cyan-300 font-mono">max_length = 128</code>). Uses pooled <code className="text-cyan-300 font-mono">[CLS]</code> token representation passed through a 0.3 dropout layer and a linear classifier head (<code className="text-cyan-300 font-mono">768 ➔ 2</code>). Eager attention extracts per-token weights for transparent visual trigger word highlights.</p>
                </div>
              </div>

              {/* Pipeline B: Metadata Analysis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Binary className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline B: Metadata Analysis Pipeline (FFNN)</h3>
                    <p className="text-xs text-slate-400">15-Feature Engineering, Normalization & Multi-Layer Perceptron</p>
                  </div>
                </div>
                <MermaidDiagram
                  id="pipe_meta"
                  title="Pipeline B: 15-Feature Metadata Classifier"
                  subtitle="Extracts 15 URL/sender features, scales via StandardScaler, and executes 4-layer FFNN classification"
                  chart={chartMetadataPipeline}
                />
                <div className="p-4 rounded-2xl bg-[#0c1324] border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p><strong>15 Verified Metadata Features:</strong> <code className="text-cyan-300 font-mono">url_length, url_num_dots, url_num_digits, url_num_special_chars, url_entropy, is_shortened_url, has_ip_address, has_at_symbol, sender_length, sender_has_numbers, sender_has_special_chars, hour_of_day, is_weekend, url_has_https, url_suspicious_tld</code>.</p>
                  <p>Normalized using <code className="text-cyan-300 font-mono">metadata_scaler.pkl</code> and fed to PyTorch neural architecture (15 ➔ 64 ➔ 32 ➔ 16 ➔ 2) with ReLU activations and 0.3 dropout.</p>
                </div>
              </div>

              {/* Pipeline C: Image / Screenshot Analysis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline C: Image & Screenshot Analysis (Tesseract OCR)</h3>
                    <p className="text-xs text-slate-400">OpenCV Preprocessing & Dual Pipeline Verification</p>
                  </div>
                </div>
                <MermaidDiagram
                  id="pipe_image"
                  title="Pipeline C: Computer Vision Preprocessing & OCR Pipeline"
                  subtitle="Adaptive Gaussian thresholding, fastNlMeans denoising, Tesseract OCR v5.5, and forward to XLM-RoBERTa"
                  chart={chartImagePipeline}
                />
                <div className="p-4 rounded-2xl bg-[#0c1324] border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p><strong>OCR-to-Text Integration Verified:</strong> Screenshots are loaded, converted to grayscale, thresholded with <code className="text-cyan-300 font-mono">cv2.adaptiveThreshold</code>, and denoised with <code className="text-cyan-300 font-mono">cv2.fastNlMeansDenoising</code>. Extracted text from Tesseract v5.5 is verified for minimum length (&ge; 5 characters) and forwarded directly into the <code className="text-cyan-300 font-mono">TextPipeline</code> for deep classification scoring.</p>
                </div>
              </div>

              {/* Pipeline D: Weighted Late Decision Fusion */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline D: Weighted Late Decision Fusion Engine</h3>
                    <p className="text-xs text-slate-400">Adaptive Dynamic Redistribution & Whitelist Override Rules</p>
                  </div>
                </div>
                <MermaidDiagram
                  id="pipe_fusion"
                  title="Pipeline D: Dynamic Late Decision Fusion Logic"
                  subtitle="Mathematically reweights available modalities without defaulting missing values to 0.5"
                  chart={chartFusion}
                />
                <div className="p-4 rounded-2xl bg-[#0c1324] border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
                  <p>// Base Configured Weights: Text (0.60), Metadata (0.20), Image (0.20)</p>
                  <p>// When Image is missing: Text ➔ 75%, Metadata ➔ 25%</p>
                  <p>// When Metadata is missing: Text ➔ 75%, Image ➔ 25%</p>
                  <p>// Whitelist check: Trusted DLT headers (SBIINB, HDFCBK) and domains (gov.in, sbi.co.in) force safe classification (0.0 HAM)</p>
                </div>
              </div>

              {/* Pipeline E: AI Safety Advisory Pipeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline E: AI Safety Advisory Layer (Groq LLM)</h3>
                    <p className="text-xs text-slate-400">Contextual Reasoning & Zero-Downtime Deterministic Fallback</p>
                  </div>
                </div>
                <MermaidDiagram
                  id="pipe_advisory"
                  title="Pipeline E: Groq Llama 3.1 Proactive Advisory Engine"
                  subtitle="Evaluates 8 risk dimensions independently of ML scores, with automatic failover to deterministic engine"
                  chart={chartSafetyAdvisory}
                />
                <div className="p-4 rounded-2xl bg-[#0c1324] border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p><strong>Non-Overriding Guarantee:</strong> The Groq LLM advisory evaluates subtle psychological coercion, upfront registration fees, Aadhaar/PAN requests, and fake HR numbers even for legitimate-scored messages, generating educational advice without altering the objective probability calculation.</p>
                </div>
              </div>

            </div>
          )}

          {/* 3. Model Dependencies */}
          {archSubTab === 'dependencies' && (
            <div className="space-y-6">
              <MermaidDiagram
                id="arch_dependencies"
                title="Model & Environment Dependency Graph"
                subtitle="Distinction between browser-side runtime packages and backend machine learning dependencies"
                chart={chartDependencies}
                legend={[
                  { color: 'bg-cyan-400', label: 'Frontend Browser Packages' },
                  { color: 'bg-blue-400', label: 'Python ML & Web Libraries' },
                  { color: 'bg-purple-400', label: 'Trained Weight Checkpoints' },
                  { color: 'bg-emerald-400', label: 'Linux System Binaries' }
                ]}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-[#0c1324] border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Server className="h-4 w-4 text-cyan-400" /> Backend Dependencies (requirements.txt)
                  </h4>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    <li>• <span className="text-cyan-300">fastapi &gt;= 0.111.0</span> (REST framework)</li>
                    <li>• <span className="text-cyan-300">torch</span> (PyTorch neural runtime)</li>
                    <li>• <span className="text-cyan-300">transformers &gt;= 4.36.2</span> (Hugging Face)</li>
                    <li>• <span className="text-cyan-300">sentencepiece &gt;= 0.1.99</span> (XLM Tokenizer)</li>
                    <li>• <span className="text-cyan-300">huggingface-hub &gt;= 0.23.0</span> (Weight cache)</li>
                    <li>• <span className="text-cyan-300">opencv-python-headless &gt;= 4.8.0</span> (Vision)</li>
                    <li>• <span className="text-cyan-300">pytesseract &gt;= 0.3.10</span> (OCR binding)</li>
                    <li>• <span className="text-cyan-300">tldextract &gt;= 5.1.0</span> (URL parsing)</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1324] border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" /> Frontend Dependencies (package.json)
                  </h4>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    <li>• <span className="text-blue-300">react (18.3.1) & react-dom</span> (UI core)</li>
                    <li>• <span className="text-blue-300">react-router-dom (6.28.0)</span> (Client routing)</li>
                    <li>• <span className="text-blue-300">@supabase/supabase-js (2.46.1)</span> (Cloud DB & Auth)</li>
                    <li>• <span className="text-blue-300">lucide-react (0.462.0)</span> (Cybersecurity icons)</li>
                    <li>• <span className="text-blue-300">tailwindcss (3.4.15)</span> (Responsive design)</li>
                    <li>• <span className="text-blue-300">vite (6.0.1)</span> (Edge build tool)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 4. Deployment Architecture */}
          {archSubTab === 'deployment' && (
            <div className="space-y-6">
              <MermaidDiagram
                id="arch_deployment"
                title="Infrastructure & Cloud Deployment Architecture"
                subtitle="Vercel Edge, Hugging Face Spaces & Model Hub, Supabase PostgreSQL, and Groq Cloud"
                chart={chartDeployment}
                legend={[
                  { color: 'bg-slate-400', label: 'Vercel Edge Frontend' },
                  { color: 'bg-orange-400', label: 'Hugging Face Microservice' },
                  { color: 'bg-blue-400', label: 'HF Git LFS Model Hub' },
                  { color: 'bg-emerald-400', label: 'Supabase Managed Cloud' },
                  { color: 'bg-amber-400', label: 'Groq Cloud LPU' }
                ]}
              />

              <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
                <h4 className="text-sm font-bold text-white">Cross-Service Communications & Credentials Isolation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <strong className="text-cyan-300">Vercel to Hugging Face Spaces:</strong>
                    <p className="text-slate-400">Communicates through public HTTPS REST endpoints (<code className="text-cyan-300 font-mono">POST /predict</code>, <code className="text-cyan-300 font-mono">POST /advisory</code>) configured via <code className="text-cyan-300 font-mono">VITE_API_BASE_URL</code>.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <strong className="text-orange-300">Hugging Face Spaces to Model Hub:</strong>
                    <p className="text-slate-400">On startup, <code className="text-cyan-300 font-mono">hf_hub_download</code> downloads the 1.1 GB fine-tuned <code className="text-cyan-300 font-mono">text_model.pth</code> from <code className="text-cyan-300 font-mono">marrideepak/sentinelai-model</code> into the container's cache.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <strong className="text-amber-300">Backend to Groq Cloud:</strong>
                    <p className="text-slate-400">Executes server-to-server HTTPS requests using the secret environment variable <code className="text-cyan-300 font-mono">GROQ_API_KEY</code>. The client browser has zero access to this key.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <strong className="text-emerald-300">Frontend to Supabase PostgreSQL:</strong>
                    <p className="text-slate-400">Uses <code className="text-cyan-300 font-mono">VITE_SUPABASE_ANON_KEY</code>. Strict Row Level Security (RLS) ensures users can insert telemetry and select only their own scan history.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. API & Database Lifecycle */}
          {archSubTab === 'api_security' && (
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-cyan-400" />
                    End-to-End API Communication & Security Governance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Step-by-step lifecycle of an incoming scan request, error handling, and prompt-injection defense.
                  </p>
                </div>

                {/* 6-Stage Lifecycle Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-cyan-400 font-bold">STAGE 1: Client Validation</div>
                    <p className="text-slate-300">Vercel client validates input. Text, screenshot, or URL metadata must be provided before dispatching to <code className="text-cyan-300 font-mono">POST /predict</code>.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-blue-400 font-bold">STAGE 2: Backend Sanitization</div>
                    <p className="text-slate-300">FastAPI Pydantic models validate structure. Image base64 strings are checked for malicious payloads and decompressed with PIL.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-purple-400 font-bold">STAGE 3: Multi-Modal Scoring</div>
                    <p className="text-slate-300">Pipelines run in parallel. Missing modalities are mathematically excluded. Dynamic late fusion synthesizes final verdict and confidence.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-amber-400 font-bold">STAGE 4: Groq LLM Advisory</div>
                    <p className="text-slate-300">Asynchronous request to <code className="text-cyan-300 font-mono">POST /advisory</code> analyzes 8 high-risk fraud dimensions. Strict system prompt defends against prompt injection.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-emerald-400 font-bold">STAGE 5: Cloud Persistence</div>
                    <p className="text-slate-300">Frontend writes telemetry to Supabase <code className="text-cyan-300 font-mono">public.analyses</code> with user UUID. Dual-persistence writes to local storage for offline resilience.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-rose-400 font-bold">STAGE 6: Fail-Safe Guardrails</div>
                    <p className="text-slate-300">If Groq Cloud is offline or rate-limited, the deterministic fallback engine activates automatically, preventing any API timeout or error.</p>
                  </div>
                </div>

                {/* Security Principles Checklist */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Security Architecture Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Zero client exposure of <code className="text-cyan-300 font-mono">GROQ_API_KEY</code></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Supabase Row-Level Security (RLS) active on all tables</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Prompt-injection guardrails in LLM system prompts</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Stateless FastAPI microservice with no hardcoded credentials</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          SECTION: MODEL PERFORMANCE (AUTHENTIC KPI CARDS)
          ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Verified Model Performance Metrics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Computed from actual held-out 20% stratified validation splits. Never fabricated or assumed identical.
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
          SECTION: PROJECT OVERVIEW & PROBLEM STATEMENT
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* The Threat Landscape */}
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

          {/* Capabilities Grid */}
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
