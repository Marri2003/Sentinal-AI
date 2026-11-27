import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Zap, 
  GitBranch, 
  Cloud, 
  Database, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  Server, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  Globe, 
  Lock, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import MermaidDiagram from '../components/MermaidDiagram';

// ---------------------------------------------------------------------------
// 7 VERIFIED MERMAID ARCHITECTURE DIAGRAMS (Strict Mermaid 10 Syntax)
// ---------------------------------------------------------------------------

const chartComplete = `flowchart TD
    User["Client Browser / User Device"] -->|1. HTTPS Web Traffic| Frontend["Vercel Frontend (React 18 SPA)"]
    
    subgraph Client_Frontend ["1. Client and Frontend"]
        Frontend --> RouterNav["React Router DOM v6"]
        RouterNav --> Views["Threat Scanner • History • Telemetry Dashboard"]
    end

    subgraph Auth_Security ["2. Authentication and Security"]
        Frontend -->|GoTrue Client SDK| SupaAuth["Supabase GoTrue JWT Auth"]
        SupaAuth --> SessionJWT["Cryptographic JWT Session Token"]
        SessionJWT -->|Bearer Authorization| Frontend
    end

    subgraph Backend_Services ["3. Backend and API Services"]
        Frontend -->|2. POST /predict| FastAPIRouter["FastAPI Input Router and Validator"]
        FastAPIRouter --> Ingest["Payload Validation and Ingest Buffer"]
        FastAPIRouter --> Health["GET /health and GET /system/info"]
    end

    subgraph ML_Pipelines ["4. AI/ML Detection Pipelines"]
        Ingest -->|text| P1["Pipeline 1: Text Semantics"]
        Ingest -->|metadata| P2["Pipeline 2: Metadata Feature Extractor"]
        Ingest -->|image| P3["Pipeline 3: Image / OCR Preprocessor"]
        
        P1 --> XLM["XLM-RoBERTa (278M parameters)<br/>SentencePiece BPE Tokenizer"]
        XLM --> TextScore["Text Risk Score (0.0 to 1.0)<br/>Attention Attribution Matrix"]
        
        P2 --> Scaler["15-Feature Extractor<br/>StandardScaler Normalization"]
        Scaler --> FFNN["Feedforward Neural Network (FFNN)<br/>15 to 64 to 32 to 16 to 2"]
        FFNN --> MetaScore["Metadata Risk Score (0.0 to 1.0)"]
        
        P3 --> CVPre["OpenCV Preprocessing<br/>Adaptive Gaussian and fastNlMeans"]
        CVPre --> Tess["Tesseract OCR v5.5 Engine<br/>eng + hin + tel Language Packs"]
        Tess -->|Extracted Text| P1
        Tess --> OCRScore["OCR Extracted Text Score"]
    end

    subgraph Decision_Fusion ["5. Fusion and Decision Engine"]
        TextScore --> FusionEng["Weighted Late Decision Fusion<br/>Base Weights: 60% Text, 20% Meta, 20% Image<br/>Adaptive Missing Modality Redistribution<br/>Trusted Domain and Sender Whitelists"]
        MetaScore --> FusionEng
        OCRScore --> FusionEng
        
        FusionEng --> Verdict["Final Threat Classification<br/>Verdict: SPAM or HAM<br/>Score: 0.0 to 1.0 • Threshold: 0.60<br/>Confidence: HIGH, MEDIUM, LOW"]
    end

    Verdict -->|3. Synchronous Response| Frontend

    subgraph LLM_Explainability ["6. LLM Explainability and Safety"]
        Frontend -->|4. POST /advisory and /justify| AdvisoryEndpoint["FastAPI Advisory Endpoint"]
        AdvisoryEndpoint --> GroqAPI["Groq Cloud API (Llama 3.1 8B)<br/>GROQ_API_KEY"]
        GroqAPI --> AdvisoryCard["Structured Safety Advisory Card<br/>PII, Job Fees, Bank KYC, UPI Warning"]
        AdvisoryEndpoint -->|Zero-Downtime Fallback| LocalHeuristic["Deterministic Heuristic Fallback Engine"]
    end

    AdvisoryCard --> Frontend

    subgraph Database_Persistence ["7. Database and Persistence"]
        Frontend -->|5. PostgREST with RLS| SupaPG["Supabase PostgreSQL Cloud DB"]
        SupaPG --> ProfilesTbl["public.profiles (User Identity and Roles)"]
        SupaPG --> AnalysesTbl["public.analyses (Cryptographic Telemetry Audit)"]
        AnalysesTbl --> HistoryView["Dashboard Telemetry and Threat History"]
        HistoryView --> Frontend
    end

    subgraph Cloud_Infrastructure ["8. External Cloud Infrastructure"]
        VercelHost["Vercel Global Edge CDN"] -.-> Frontend
        HFSpace["Hugging Face Spaces (CPU Basic 2 vCPU 16GB)"] -.-> FastAPIRouter
        HFHub["Hugging Face Model Hub (Git LFS)"] -->|hf_hub_download text_model.pth| XLM
    end`;

const chartPipelines = `flowchart TD
    RawInput["Incoming Scan Payload<br/>Text Message, Sender/URL Metadata, Screenshot Image"] --> Dispatcher["Pipeline Input Dispatcher"]

    subgraph Text_Pipeline ["Pipeline 1: Multilingual Text Semantics"]
        Dispatcher -->|SMS Text String| CleanText["Regex Cleaning and Whitespace Normalization"]
        CleanText --> Tokenizer["SentencePiece BPE Tokenizer (max_length = 128)"]
        Tokenizer --> XLMEncoder["XLM-RoBERTa Transformer Encoder (12-Layers, 768-Hidden)"]
        XLMEncoder --> ClsPool["Pooled [CLS] Token Representation (768-dim)"]
        XLMEncoder --> AttnMatrix["Eager Self-Attention Weights Matrix"]
        ClsPool --> Dropout["Dropout Layer (p = 0.3)"]
        Dropout --> TextLinear["Linear Classification Head (768 to 2)"]
        TextLinear --> TextSoftmax["Softmax Layer"]
        TextSoftmax --> TextProb["Text Phishing Probability (0.0 to 1.0)"]
        AttnMatrix --> Highlights["Suspicious Trigger Word Attribution Map"]
    end

    subgraph Metadata_Pipeline ["Pipeline 2: Metadata Feature Engineering"]
        Dispatcher -->|Sender and URL| FeatEngine["15-Feature Mathematical Extractor"]
        FeatEngine --> F1to15["Features: URL Length, Dot Count, Digit Count, Special Chars,<br/>Entropy, Shortener Flag, IP Address, At Symbol, Sender Length,<br/>Sender Numbers, Sender Specials, Hour, Weekend, HTTPS, Bad TLD"]
        F1to15 --> ScalerPickle["StandardScaler Transformation (metadata_scaler.pkl)"]
        ScalerPickle --> TensorConvert["PyTorch FloatTensor (1, 15)"]
        TensorConvert --> FFNNModel["Feedforward Neural Network (15 to 64 to 32 to 16 to 2)"]
        FFNNModel --> MetaSoftmax["Softmax Layer"]
        MetaSoftmax --> MetaProb["Metadata Phishing Probability (0.0 to 1.0)"]
    end

    subgraph Vision_Pipeline ["Pipeline 3: Screenshot OCR Extraction"]
        Dispatcher -->|Image Upload (Base64)| ImgDecoder["Pillow Image Loading and Validation"]
        ImgDecoder --> GrayConv["Grayscale Transformation"]
        GrayConv --> AdaptiveThresh["Adaptive Gaussian Thresholding (cv2.adaptiveThreshold)"]
        AdaptiveThresh --> Denoising["Fast Non-Local Means Denoising (cv2.fastNlMeans)"]
        Denoising --> TessOCR["Tesseract OCR v5.5 (eng + hin + tel, OEM 3, PSM 6)"]
        TessOCR --> TextBuffer["Extracted Transcribed String Buffer"]
        TextBuffer --> LenGate{"Is Text Length at least 5 chars?"}
        LenGate -->|Yes| RouteToText["Forward Transcribed Text to XLM-RoBERTa"]
        LenGate -->|No or Blank| ExcludeModality["Set image_score = None (Exclude Modality)"]
        RouteToText --> ImgProb["Image Phishing Probability (0.0 to 1.0)"]
    end

    TextProb --> LateFusion["Weighted Late Decision Fusion Engine"]
    MetaProb --> LateFusion
    ImgProb --> LateFusion
    ExcludeModality --> LateFusion`;

const chartFusion = `flowchart TD
    Scores["Pipeline Outputs: text_score, metadata_score, image_score"] --> GateCheck{"Check Modality Availability"}

    subgraph Adaptive_Weight_Redistribution ["Adaptive Dynamic Weight Allocation"]
        GateCheck -->|All 3 Available| W3["Text: 60% • Metadata: 20% • Image: 20%"]
        GateCheck -->|Image Excluded| W2A["Text: 75% • Metadata: 25%"]
        GateCheck -->|Metadata Excluded| W2B["Text: 75% • Image: 25%"]
        GateCheck -->|Only Text Available| W1A["Text: 100%"]
        GateCheck -->|Only Metadata Available| W1B["Metadata: 100%"]
        GateCheck -->|Only Image Available| W1C["Image: 100%"]
    end

    W3 --> CalcSum["Compute Raw Weighted Score Sum:<br/>Score = Sum(Weight_i * Prob_i)"]
    W2A --> CalcSum
    W2B --> CalcSum
    W1A --> CalcSum
    W1B --> CalcSum
    W1C --> CalcSum

    subgraph Deterministic_Rules ["Deterministic Whitelist Guardrails"]
        CalcSum --> WhitelistCheck{"Is Sender or URL in Whitelist?<br/>(e.g., SBIINB, HDFCBK, gov.in)"}
        WhitelistCheck -->|Match Found| SafeClamp["Hard Override: Score = 0.0 (HAM Safe)"]
        WhitelistCheck -->|No Match| NormalClamp["Clamp Score to Safe Interval [0.001, 0.999]"]
    end

    SafeClamp --> DecisionGate{"Is Final Score at least 0.60 Threshold?"}
    NormalClamp --> DecisionGate

    subgraph Decision_Output ["Decision Output and Confidence"]
        DecisionGate -->|Score at least 0.60| SpamVerdict["Final Verdict: SPAM (Fraud Alert)"]
        DecisionGate -->|Score below 0.60| HamVerdict["Final Verdict: HAM (Legitimate)"]

        SpamVerdict --> ConfBand["Confidence Rating:<br/>HIGH: Score above 0.85 or below 0.15<br/>MEDIUM: 0.60 to 0.85 or 0.15 to 0.40<br/>LOW: 0.40 to 0.60"]
        HamVerdict --> ConfBand
    end`;

const chartDeployment = `flowchart TD
    subgraph Client_Layer ["Client Device and Browser Layer"]
        UserDevice["User Browser • Mobile Device • Desktop Workstation"]
    end

    subgraph Vercel_Platform ["Vercel Global Edge Infrastructure"]
        UserDevice -->|HTTPS Web Traffic / TLS 1.3| VercelEdge["Vercel Global Edge Network"]
        VercelEdge --> ReactApp["React 18 SPA + Vite Production Bundle"]
        ReactApp --> ClientState["Client State • Lucide Icons • Tailwind Styling"]
    end

    subgraph HuggingFace_Space ["Hugging Face Production Space (marrideepak/sentinelai-backend)"]
        ReactApp -->|REST API Calls (/predict, /advisory, /justify)| HFRuntime["Hugging Face Space Runtime (Gradio 4.44.0 SDK)"]
        HFRuntime --> FastAPIApp["FastAPI Engine (uvicorn worker, port 7860)"]
        FastAPIApp --> PyTorchEngine["PyTorch 2.13.0 CPU/ZeroGPU Inference"]
        FastAPIApp --> TesseractHost["Linux Tesseract v5.5 Engine + Language Packs"]
    end

    subgraph HuggingFace_Hub ["Hugging Face Model Repository (marrideepak/sentinelai-model)"]
        FastAPIApp -->|hf_hub_download at boot cache| HubRepo["Git LFS Model Storage"]
        HubRepo --> ModelWeights["1.11 GB text_model.pth Checkpoint File"]
    end

    subgraph Groq_Cloud ["Groq LPU Inference Cloud"]
        FastAPIApp -->|HTTPS Bearer Authentication (GROQ_API_KEY)| GroqEngine["Groq Cloud API (llama-3.1-8b-instant)"]
        GroqEngine --> InferenceLPU["Language Processing Unit (LPU) Sub-200ms Execution"]
    end

    subgraph Supabase_Platform ["Supabase Managed Cloud Platform"]
        ReactApp -->|HTTPS GoTrue Auth API| SupaAuthService["Supabase Authentication Service"]
        ReactApp -->|HTTPS PostgREST API with JWT and RLS| SupaPostgres["Supabase PostgreSQL 15 Database Cluster"]
        SupaPostgres --> PgTables["Tables: public.profiles and public.analyses"]
    end`;

const chartDatabase = `erDiagram
    AUTH_USERS ||--o| PROFILES : "has one profile (1:1)"
    AUTH_USERS ||--o{ ANALYSES : "owns historical analyses (1:N)"

    AUTH_USERS {
        uuid id PK "Supabase cryptographic auth ID"
        string email "Registered user email address"
        timestamp created_at "Account creation timestamp"
        timestamp last_sign_in_at "Last authenticated session timestamp"
    }

    PROFILES {
        uuid id PK,FK "References auth.users.id (ON DELETE CASCADE)"
        string full_name "User display name"
        string role "Access control role: admin, analyst, or user"
        timestamp updated_at "Profile last modified timestamp"
    }

    ANALYSES {
        uuid id PK "Unique analysis record identifier"
        uuid user_id FK "References auth.users.id (Row Level Security Key)"
        text text_content "Scanned SMS message or transcribed text"
        string sender "Sender phone number, email, or DLT header"
        string url "Extracted or provided suspicious web link"
        string prediction "Classification verdict: SPAM or HAM"
        float risk_score "Combined multi-modal risk score (0.0 to 1.0)"
        string confidence "Confidence level: HIGH, MEDIUM, or LOW"
        jsonb model_predictions "Detailed breakdown: text, meta, image scores"
        jsonb metadata "Raw extracted features and telecom telemetry"
        jsonb safety_advisory "AI-generated safety guidance and action items"
        timestamp created_at "Incident scan timestamp"
    }`;

const chartWorkflow = `sequenceDiagram
    autonumber
    actor User as User / Client Browser
    participant FE as Vercel Frontend (React SPA)
    participant Auth as Supabase Auth (GoTrue)
    participant BE as FastAPI Backend (Hugging Face)
    participant Models as Multi-Modal Inference Pipelines
    participant Groq as Groq LLM (Llama 3.1)
    participant DB as Supabase PostgreSQL (RLS)

    User->>FE: 1. Input message text, sender, URL, or screenshot
    FE->>Auth: 2. Verify active JWT session token
    Auth-->>FE: 3. Session valid (user_id confirmed)
    
    FE->>BE: 4. Synchronous POST /predict {text, metadata, image}
    BE->>Models: 5. Execute Text, Metadata, and OCR Pipelines
    Models-->>BE: 6. Return Text (0.98), Metadata (0.84), OCR scores
    BE->>BE: 7. Compute Weighted Decision Fusion and Whitelists
    BE-->>FE: 8. Return verdict (SPAM), score (0.94), and token attention
    
    FE->>BE: 9. Asynchronous parallel POST /advisory {text, prediction}
    BE->>Groq: 10. Query Llama 3.1 8B with strict risk guardrails
    Groq-->>BE: 11. Return JSON {advisory_level: HIGH, guidance: [...]}
    BE-->>FE: 12. Return structured safety advisory payload
    
    FE->>DB: 13. Persist record into public.analyses via PostgREST
    DB-->>FE: 14. Record saved successfully
    FE->>User: 15. Render Result Card, Token Highlights, and Safety Advisory`;

const chartModelDependencies = `flowchart TD
    subgraph Frontend_Stack ["Frontend Runtime Dependencies (package.json)"]
        F1["react (v18.3.1) and react-dom (v18.3.1)"]
        F2["react-router-dom (v6.28.0)"]
        F3["@supabase/supabase-js (v2.46.1)"]
        F4["lucide-react (v0.462.0)"]
        F5["tailwindcss (v3.4.15) and vite (v6.0.1)"]
    end

    subgraph Linux_Packages ["OS-Level Dependencies (packages.txt)"]
        S1["tesseract-ocr (v5.5 Optical Character Recognition)"]
        S2["tesseract-ocr-hin (Hindi Language Training Pack)"]
        S3["tesseract-ocr-tel (Telugu Language Training Pack)"]
        S4["libgl1 and libglib2.0-0 (OpenCV Native Shared Libraries)"]
    end

    subgraph Python_Libraries ["Backend Python Libraries (requirements.txt)"]
        P1["fastapi (v0.111.0+) and uvicorn (v0.27.0+)"]
        P2["pydantic (v2.5.3+) and httpx (v0.26.0+)"]
        P3["torch (v2.13.0 ZeroGPU Compatible Engine)"]
        P4["transformers (v4.36.2+) and sentencepiece (v0.1.99+)"]
        P5["huggingface-hub (v0.23.0+) and scikit-learn (v1.4.0+)"]
        P6["pytesseract (v0.3.10+) and opencv-python-headless (v4.8.0+)"]
        P7["Pillow (v10.0.0+) and tldextract (v5.1.0+)"]
        P8["gradio (v4.44.0) and spaces (v0.52.1)"]
    end

    subgraph Trained_Checkpoints ["Trained Checkpoint Artifacts (saved_models/)"]
        C1["text_model.pth (1.11 GB XLM-RoBERTa Fine-Tuned Weights)"]
        C2["text_tokenizer/ (SentencePiece BPE Vocab and Configs)"]
        C3["metadata_model.pth (18 KB 15-Feature FFNN Weights)"]
        C4["metadata_scaler.pkl (809 B StandardScaler Parameters)"]
    end

    C1 --> P3
    C2 --> P4
    C3 --> P3
    C4 --> P5
    S1 --> P6
    S4 --> P6`;

export default function Architecture() {
  const [activeSection, setActiveSection] = useState('complete');

  const sections = [
    { id: 'complete', label: '1. Complete System Architecture', icon: Layers },
    { id: 'pipelines', label: '2. AI/ML Detection Pipelines', icon: Cpu },
    { id: 'fusion', label: '3. Weighted Decision Fusion', icon: Zap },
    { id: 'workflow', label: '4. End-to-End Analysis Workflow', icon: Activity },
    { id: 'deployment', label: '5. Cloud & Deployment Infrastructure', icon: Cloud },
    { id: 'dependencies', label: '6. Model & Environment Dependencies', icon: GitBranch },
    { id: 'database', label: '7. Database & Entity Architecture', icon: Database },
    { id: 'security', label: '8. API & Security Specifications', icon: Key },
    { id: 'techstack', label: '9. Technology Stack', icon: Server },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1324] via-[#09101f] to-[#060a14] border border-slate-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            SentinelAI Technical Architecture & System Specifications
          </div>
          
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            System Architecture & Engineering Specs
          </h1>
          
          <p className="text-slate-300 text-xs md:text-sm max-w-4xl leading-relaxed">
            A comprehensive, verified technical blueprint of the entire Sentinel-AI ecosystem: client browser interactions, 
            FastAPI microservice routing, multilingual transformer inference with XLM-RoBERTa, computer vision OCR with Tesseract v5.5, 
            adaptive weighted decision fusion, Groq Llama 3.1 safety advisory reasoning, and Supabase PostgreSQL persistence with Row-Level Security.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-base md:text-lg font-black text-cyan-400 font-mono">60% / 20% / 20%</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Base Fusion Weights</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-base md:text-lg font-black text-blue-400 font-mono">0.60 Gate</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">SPAM Decision Threshold</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-base md:text-lg font-black text-purple-400 font-mono">Tesseract v5.5</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">OCR Vision Preprocessing</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center">
              <div className="text-base md:text-lg font-black text-emerald-400 font-mono">Sub-200ms</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Groq LPU Advisory Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {sections.map((sec) => {
          const TabIcon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 1: COMPLETE SYSTEM ARCHITECTURE (DIAGRAM 1)
          ========================================================================= */}
      {(activeSection === 'complete' || activeSection === 'all') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                Complete System Architecture Diagram
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing all 8 architectural containers: Client Frontend, Authentication, API Services, ML Pipelines, Decision Fusion, LLM Explainability, Database, and Cloud Topology.
              </p>
            </div>
          </div>

          <MermaidDiagram
            id="arch_complete"
            title="Complete Sentinel-AI System Architecture"
            subtitle="Verified multi-modal telemetry flow from user input to decision fusion, Groq advisory, and Supabase RLS persistence"
            chart={chartComplete}
            legend={[
              { color: 'bg-cyan-400', label: 'Vercel Frontend & React 18 SPA' },
              { color: 'bg-blue-400', label: 'Supabase GoTrue Auth & PostgreSQL' },
              { color: 'bg-purple-400', label: 'FastAPI Backend & ML Pipelines' },
              { color: 'bg-amber-400', label: 'Groq Cloud Llama 3.1 Advisory' },
              { color: 'bg-emerald-400', label: 'Hugging Face Spaces & Model Hub' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 2: AI/ML DETECTION PIPELINES (DIAGRAM 2)
          ========================================================================= */}
      {(activeSection === 'pipelines' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              AI/ML Detection Pipelines Deep-Dive
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Detailed breakdown of the 3 parallel detection pipelines: Multilingual Text Semantics, 15-Feature Metadata Classifier, and Vision OCR extraction.
            </p>
          </div>

          <MermaidDiagram
            id="arch_pipelines"
            title="AI/ML Tri-Modal Detection Pipelines"
            subtitle="SentencePiece Tokenization, XLM-RoBERTa Transformer, 15-Feature FFNN, and Tesseract OCR OpenCV Preprocessor"
            chart={chartPipelines}
            legend={[
              { color: 'bg-cyan-400', label: 'Pipeline 1: XLM-RoBERTa Transformer (278M parameters)' },
              { color: 'bg-blue-400', label: 'Pipeline 2: 15-Feature FFNN (15 -> 64 -> 32 -> 16 -> 2)' },
              { color: 'bg-purple-400', label: 'Pipeline 3: Tesseract OCR (eng + hin + tel) + Adaptive Gaussian' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 3: WEIGHTED DECISION FUSION (DIAGRAM 3)
          ========================================================================= */}
      {(activeSection === 'fusion' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              Weighted Late Decision Fusion Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Dynamic modality redistribution with zero-penalty missing modality handling, deterministic whitelists, and score clamping.
            </p>
          </div>

          <MermaidDiagram
            id="arch_fusion"
            title="Weighted Late Decision Fusion Engine"
            subtitle="Configured base weights (60% Text, 20% Meta, 20% Image), adaptive fallback normalization, and threshold gate (0.60)"
            chart={chartFusion}
            legend={[
              { color: 'bg-cyan-400', label: 'Dynamic Weight Normalization Matrix' },
              { color: 'bg-emerald-400', label: 'Trusted Sender / Domain Whitelist Override' },
              { color: 'bg-amber-400', label: 'Decision Threshold (0.60 SPAM Gate)' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 4: END-TO-END WORKFLOW (DIAGRAM 6)
          ========================================================================= */}
      {(activeSection === 'workflow' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              End-to-End Message Analysis Lifecycle
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete step-by-step sequence of one message through client input, synchronous ML prediction, asynchronous Groq advisory, and Supabase PostgREST persistence.
            </p>
          </div>

          <MermaidDiagram
            id="arch_workflow"
            title="End-to-End Threat Analysis Sequence Diagram"
            subtitle="Strict synchronous prediction response followed by parallel advisory generation and cloud database commit"
            chart={chartWorkflow}
            legend={[
              { color: 'bg-cyan-400', label: 'Synchronous REST Execution (POST /predict)' },
              { color: 'bg-amber-400', label: 'Parallel Advisory Execution (POST /advisory)' },
              { color: 'bg-blue-400', label: 'Supabase PostgREST RLS Insertion' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 5: INFRASTRUCTURE & DEPLOYMENT (DIAGRAM 4)
          ========================================================================= */}
      {(activeSection === 'deployment' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cloud className="h-5 w-5 text-cyan-400" />
              Cloud Infrastructure & Deployment Topology
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Vercel Global Edge Network, Hugging Face Production Spaces (ZeroGPU / CPU Basic), Hugging Face Model Hub, Groq LPU Cloud, and Supabase Managed Cloud.
            </p>
          </div>

          <MermaidDiagram
            id="arch_deployment"
            title="Production Cloud Deployment Topology"
            subtitle="Edge frontend hosting, isolated ML microservice, Hugging Face Model Hub weight caching, and cloud database"
            chart={chartDeployment}
            legend={[
              { color: 'bg-cyan-400', label: 'Vercel Edge Network (React 18 SPA)' },
              { color: 'bg-purple-400', label: 'Hugging Face Spaces (FastAPI + Gradio SDK)' },
              { color: 'bg-amber-400', label: 'Groq Cloud Inference (llama-3.1-8b-instant)' },
              { color: 'bg-blue-400', label: 'Supabase PostgreSQL 15 Managed Cluster' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 6: MODEL DEPENDENCIES (DIAGRAM 7)
          ========================================================================= */}
      {(activeSection === 'dependencies' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-cyan-400" />
              Model Checkpoints & System Dependencies
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Exact relationship between saved model checkpoints, SentencePiece tokenizers, Python machine learning packages, and Linux OCR runtime binaries.
            </p>
          </div>

          <MermaidDiagram
            id="arch_dependencies"
            title="Model Artifacts & Environment Dependencies"
            subtitle="Saved weights, PyTorch engine, Tesseract OCR system packages, and web framework dependencies"
            chart={chartModelDependencies}
            legend={[
              { color: 'bg-cyan-400', label: 'Frontend npm Packages (package.json)' },
              { color: 'bg-purple-400', label: 'Python Backend Libraries (requirements.txt)' },
              { color: 'bg-blue-400', label: 'Linux OCR Packages (packages.txt)' },
              { color: 'bg-amber-400', label: 'Trained Model Checkpoints (saved_models/)' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 7: DATABASE ARCHITECTURE (DIAGRAM 5)
          ========================================================================= */}
      {(activeSection === 'database' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              Database Architecture & Entity Relationships
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Supabase PostgreSQL relational schema, Row-Level Security (RLS) policies, JSONB threat telemetry fields, and foreign key cascades.
            </p>
          </div>

          <MermaidDiagram
            id="arch_database"
            title="Supabase PostgreSQL Entity-Relationship Diagram"
            subtitle="auth.users to public.profiles (1:1) and public.analyses (1:N) with Row-Level Security enforcement"
            chart={chartDatabase}
            legend={[
              { color: 'bg-cyan-400', label: 'Identity Table: auth.users (Supabase Managed)' },
              { color: 'bg-blue-400', label: 'Profile Table: public.profiles' },
              { color: 'bg-purple-400', label: 'Telemetry Table: public.analyses' },
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          SECTION 8: API COMMUNICATION & SECURITY
          ========================================================================= */}
      {(activeSection === 'security' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-400" />
              API Communication & Security Protocol Specifications
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographic tokens, authorization headers, endpoint schemas, and rate-limiting safeguards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Terminal className="h-4 w-4" /> Endpoints Specification
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                  <span className="text-emerald-400 font-bold">POST</span> <span className="text-white">/predict</span>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Ingests text, base64 screenshot, and metadata. Executes tri-modal inference and weighted fusion synchronously.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                  <span className="text-emerald-400 font-bold">POST</span> <span className="text-white">/advisory</span>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Evaluates message against 8 social engineering risk dimensions via Groq Llama 3.1 with deterministic fallback.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                  <span className="text-cyan-400 font-bold">GET</span> <span className="text-white">/system/info</span>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Returns verified model parameters, training checkpoints, fusion thresholds, and live microservice telemetry.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Lock className="h-4 w-4" /> Cryptographic Security & Zero-Trust
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>GoTrue JWT Sessions:</strong> Stateless cryptographically signed bearer tokens with automatic client-side refresh.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Row-Level Security (RLS):</strong> PostgreSQL enforcement guarantees users can only access their own analysis audit records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Server-Side Secret Isolation:</strong> GROQ_API_KEY and Hugging Face tokens are strictly housed server-side.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 9: TECHNOLOGY STACK
          ========================================================================= */}
      {(activeSection === 'techstack' || activeSection === 'all') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="h-5 w-5 text-cyan-400" />
              Comprehensive Technology Stack
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end framework, runtime, library, and cloud infrastructure specification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-2">
              <div className="text-cyan-400 font-bold text-xs uppercase font-mono">Frontend Tier</div>
              <div className="text-white font-extrabold text-sm">React 18 & Vite</div>
              <p className="text-slate-400 text-xs">Tailwind CSS v3.4, Lucide React icons, React Router v6, ErrorBoundary resilience.</p>
            </div>
            <div className="p-5 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-2">
              <div className="text-purple-400 font-bold text-xs uppercase font-mono">Backend Microservice</div>
              <div className="text-white font-extrabold text-sm">FastAPI & PyTorch</div>
              <p className="text-slate-400 text-xs">Uvicorn ASGI, Gradio SDK, Hugging Face Spaces deployment, ZeroGPU runtime.</p>
            </div>
            <div className="p-5 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-2">
              <div className="text-blue-400 font-bold text-xs uppercase font-mono">Cloud Database</div>
              <div className="text-white font-extrabold text-sm">Supabase PostgreSQL 15</div>
              <p className="text-slate-400 text-xs">PostgREST API, Row-Level Security, GoTrue JWT authentication, JSONB telemetry.</p>
            </div>
            <div className="p-5 rounded-3xl bg-[#0c1324] border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase font-mono">AI Reasoning</div>
              <div className="text-white font-extrabold text-sm">Groq LPU & Llama 3.1</div>
              <p className="text-slate-400 text-xs">Sub-200ms generative social engineering risk analysis with deterministic heuristic fallback.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
