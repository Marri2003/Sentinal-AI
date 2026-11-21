# SentinelAI — Project Phases

> This document tracks the full lifecycle of SentinelAI development from inception to production deployment. Use it to understand what has been done, what is in progress, and what comes next.

---

## Phase Overview

```
Phase 1: Foundation & Design          ✅ COMPLETE
Phase 2: Data Pipeline                ✅ COMPLETE
Phase 3: Model Training               🔄 IN PROGRESS (models untrained in repo)
Phase 4: Inference & API              🔄 PARTIAL (API ready; bugs remain)
Phase 5: Explainability & Chat        ✅ COMPLETE (code complete; needs Groq key)
Phase 6: Testing & Calibration        ⏳ PENDING (needs trained models)
Phase 7: Production Hardening         ⏳ PENDING
Phase 8: Deployment & Scaling         ⏳ PENDING
```

---

## Phase 1: Foundation & Design ✅ COMPLETE

**Goal**: Define system architecture, choose technology stack, establish repository structure.

### Deliverables Completed

- [x] Multi-modal 3-pipeline architecture designed (Text + Image + URL Metadata)
- [x] Late-fusion strategy chosen: dynamic weight redistribution (not fixed 0.5 defaults)
- [x] XLM-RoBERTa selected as text backbone (multilingual, 100+ languages)
- [x] FastAPI + Uvicorn chosen for production API
- [x] Pydantic schemas defined for all request/response models
- [x] `config.py` central configuration established
- [x] Repository structure created with proper module separation

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| NLP model | XLM-RoBERTa base (270M params) | Multilingual + handles Hindi/Telugu/Urdu natively |
| Image approach | OCR-first (no CNN training) | No labeled image dataset available; Tesseract generalizes |
| Fusion strategy | Dynamic late-stage weighted fusion | Missing modalities should not pollute scores with 0.5 |
| Explainability | Attention weights + LLM narrative | Non-technical users need human-readable explanations |
| Threshold | Lowered (0.45) | Prioritize reducing false positives on harsh-but-legitimate |

---

## Phase 2: Data Pipeline ✅ COMPLETE

**Goal**: Collect, clean, preprocess, and augment training data for all three pipelines.

### Pipeline 1 — Text Datasets

| Dataset | Samples | Status |
|---------|---------|--------|
| UCI SMS Spam Collection | 5,572 | ✅ Present in `pipeline 1/` |
| Mendeley SMS Phishing | 5,971 | ✅ Present in `pipeline 1/` |
| Kaggle Multilingual Spam | 5,572 | ✅ Present in `pipeline 1/` |
| Smishtank Dataset | 1,062 | ✅ Present in `pipeline 1/` |
| Hard Negatives (manual CSV) | ~49 | ✅ `pipeline 1/hard_negatives.csv` |
| Hard Negatives Edge Cases | — | ✅ `pipeline 1/hard_negatives_edge.csv` |
| Hard Positives | — | ✅ `pipeline 1/hard_positives.csv` |
| Translated Phishing (Hindi+Telugu) | 860 | ✅ `pipeline 1/translated_phishing.csv` |
| Synthetic Hard Negatives (generated) | 200 | ✅ Generated in-code via `generate_synthetic_hard_negatives()` |

**Total effective training data**: ~10,000+ rows (after dedup, oversampling, synthetic injection)

### Pipeline 3 — URL Metadata Datasets

| Dataset | Samples | Status |
|---------|---------|--------|
| PhiUSIIL Phishing URL Dataset | 235,795 | ✅ Present in `pipeline 3/` |
| ISCX-URL-2016 (CIC) | 36,707 | ✅ Present in `pipeline 3/` |
| HuggingFace phishing-dataset | ~90,000 | ✅ Present (1 file had missing label col — skipped) |

**Total effective training data**: ~250,079 rows (after label cleaning)

### Preprocessing Implementations

- [x] Label normalization (ham=0, spam/smishing/phishing=1)
- [x] Text cleaning (URL removal, phone normalization, lowercase, whitespace)
- [x] Class balancing via `sklearn.utils.resample` oversampling (~40% spam ratio)
- [x] 15 URL/sender/temporal feature extraction for metadata pipeline
- [x] StandardScaler normalization for metadata features
- [x] Stratified train/val splits (80/20)

---

## Phase 3: Model Training 🔄 IN PROGRESS

**Goal**: Train all three pipeline models to production-quality accuracy.

### Pipeline 1: Text Model (XLM-RoBERTa)

| Run | Epochs | Best Val Accuracy | Status |
|-----|--------|------------------|--------|
| Baseline | 3 | 98.93% | ✅ Done (historical) |
| Extended | 15 | **99.46%** (epoch 5) | ✅ Done (historical) |
| Current (repo) | — | — | 🔴 NOT TRAINED — `saved_models/` empty |

**Training command**: `python train/train_text_model.py`  
**Expected time**: 20–30 minutes (CPU), ~1.5h with 20 epochs  
**Output**: `saved_models/text_model_best.pth`, `saved_models/text_tokenizer/`

**Key hyperparameters (current config)**:
- Epochs: 20, Batch: 8, LR: 3e-5, Warmup: 100 steps
- Early stopping patience: 4
- Label smoothing: 0.05, Weight decay: 1e-4

### Pipeline 2: Image Model (MobileNetV2)

**Status**: 🟡 NOT APPLICABLE  
The active implementation uses **OCR-only approach** — Tesseract extracts text from images, then Pipeline 1 scores that text. `train/train_image_model.py` exists but is not part of the active inference path. No standalone CNN training is planned until labeled image data is available.

**Output (at inference)**: OCR text string → fed to `TextPipeline.predict_with_explanation()`

### Pipeline 3: Metadata Model (FFNN)

| Run | Epochs | Best Val Accuracy | F1 | Status |
|-----|--------|------------------|----|--------|
| Baseline | 3 | 97.51% | 97.93% | ✅ Done (historical) |
| Extended | 10 | **98.00%** (epoch 10) | **98.33%** | ✅ Done (historical) |
| Current (repo) | — | — | — | 🔴 NOT TRAINED |

**Training command**: `python train/train_metadata_model.py`  
**Expected time**: ~45 minutes (CPU)  
**Output**: `saved_models/metadata_model.pth`, `saved_models/metadata_scaler.pkl`

**Architecture**: 15 → 64 → 32 → 16 → 2 (ReLU + Dropout 0.3)

### Open Issues for This Phase

- [ ] **Fix architecture mismatch** between `train/train_metadata_model.py` and `models/metadata_pipeline.py` before training
- [ ] **Auto-select best checkpoint** at end of text training (not just last epoch)
- [ ] Re-run training after fixes and verify no `state_dict` warnings

---

## Phase 4: Inference & API 🔄 PARTIAL

**Goal**: Production-quality FastAPI backend with all three pipelines and fusion.

### Completed

- [x] FastAPI app with CORS, logging, exception handlers
- [x] `/predict` endpoint with multi-modal input, dynamic fusion, explainability
- [x] `/health` endpoint with per-model load status
- [x] Dynamic weight redistribution (excludes missing modalities, normalizes remaining)
- [x] Trust-based score adjustment (90+ verified domains/senders in `config.py`)
- [x] Spoof detection (`_looks_like_trusted_spoof()`) for URLs embedding trusted brand names
- [x] Confidence levels (HIGH/MEDIUM/LOW) based on score thresholds
- [x] Rule-based post-processing (`SAFE_PATTERNS`, `PHISHING_PATTERNS`, `apply_rules()`)
- [x] Temperature calibration for text (1.6) and metadata (1.8) scores
- [x] Score floor (0.02) and ceiling (0.98) to prevent exact saturation

### Remaining

- [ ] **Fix metadata architecture mismatch** (critical — model loads as random)
- [ ] **Validate false positive behavior** after training with real transactional messages
- [ ] Add `/predict` input validation (max text length, image size limits)
- [ ] Add request/response logging middleware for observability

---

## Phase 5: Explainability & Chat ✅ COMPLETE (code complete)

**Goal**: LLM-powered human-readable explanations and cybersecurity chatbot.

### Completed

- [x] `/justify` endpoint: accepts full `/predict` output → generates 2–3 sentence explanation
- [x] Language-specific system prompts for 6 languages (English, Hindi, Telugu, Marathi, Urdu, Tamil)
- [x] Fallback justifications (hardcoded, language-aware) when Groq API fails
- [x] `/chat` endpoint: cybersecurity assistant chatbot with language-specific responses
- [x] `GROQ_API_KEY` environment variable setup (`.env.example` provided)
- [x] Attention weight extraction for contributing words
- [x] Feature importance extraction for contributing metadata features
- [x] OCR text passthrough in explainability response

### Dependencies

- Groq API key in `.env` file (optional — fallbacks exist without it)
- Model: `llama-3.1-8b-instant` via Groq's OpenAI-compatible endpoint

---

## Phase 6: Testing & Calibration ⏳ PENDING

**Goal**: Comprehensive testing, threshold calibration, and false positive reduction validation.

**Blocked by**: Phase 3 (models must be trained first)

### Planned Tests

- [ ] **Unit tests** per pipeline (`test_import.py`, `test_api.py`)
- [ ] **End-to-end tests** (`test_full_pipeline.py`) — 9 test cases defined in README
- [ ] **False positive audit**: Run 50+ legitimate transactional messages; target <5% FPR
- [ ] **Threshold calibration**: Plot precision-recall curve on validation set; select optimal threshold
- [ ] **Multilingual tests**: Hindi, Telugu, Urdu, Tamil phishing messages
- [ ] **Edge case tests**: Legitimate-but-harsh messages (court notices, eviction, tax warnings)
- [ ] **Metadata architecture validation**: Verify no `state_dict` warnings on model load

### Test Cases Defined (from README)

| # | Input | Expected | Priority |
|---|-------|----------|----------|
| 1 | Classic phishing, bit.ly URL, 3:45 AM | SPAM HIGH | P0 |
| 2 | HDFC Bank OTP from HDFCBK | HAM HIGH | P0 |
| 3 | Amazon delivery from AMAZON | HAM HIGH | P0 |
| 4 | Fake UPI screenshot (image) | SPAM MEDIUM | P1 |
| 5 | Lottery scam with IP address URL | SPAM HIGH | P0 |
| 6 | Telugu phishing (.tk domain) | SPAM HIGH | P1 |
| 7 | Hindi banking scam (.xyz domain) | SPAM HIGH | P1 |
| 8 | BESCOM electricity overdue (legitimate) | HAM MEDIUM | P0 |
| 9 | Sophisticated ICICI phishing | SPAM HIGH | P1 |

---

## Phase 7: Production Hardening ⏳ PENDING

**Goal**: Security, reliability, and observability for production deployment.

### Planned

- [ ] Add authentication to `/predict` (API key or OAuth)
- [ ] Add rate limiting (e.g., 100 req/min per client)
- [ ] Add request size limits (max text length, max image bytes)
- [ ] Persistent logging to PostgreSQL (prediction history, model versions)
- [ ] Redis caching for repeated identical requests
- [ ] Prometheus metrics endpoint (`/metrics`)
- [ ] Docker containerization (`Dockerfile` + `docker-compose.yml`)
- [ ] CI/CD pipeline (GitHub Actions) for training + test validation
- [ ] Model versioning and A/B testing framework
- [ ] Freeze `requirements_frozen.txt` for exact reproducibility

---

## Phase 8: Deployment & Scaling ⏳ PENDING

**Goal**: Cloud deployment, horizontal scaling, and monitoring.

### Planned

- [ ] Docker image published to registry
- [ ] Kubernetes deployment configuration
- [ ] NGINX reverse proxy with SSL termination
- [ ] Cloud deployment (AWS EC2 g4dn.xlarge or GCP T4)
- [ ] Load balancer configuration
- [ ] Database setup (PostgreSQL for logs, Redis for cache)
- [ ] Frontend integration with `sentinelfrontend.vercel.app`
- [ ] Monitoring dashboards (Grafana + Prometheus)
- [ ] Alert rules for high false positive rate or model degradation

---

## Progress Summary

| Phase | Status | Blocking |
|-------|--------|---------|
| 1. Foundation & Design | ✅ Complete | — |
| 2. Data Pipeline | ✅ Complete | — |
| 3. Model Training | 🔄 In Progress | Arch mismatch bug; models untrained |
| 4. Inference & API | 🔄 Partial | Metadata arch bug; needs trained models |
| 5. Explainability & Chat | ✅ Code Complete | Needs Groq API key to activate |
| 6. Testing & Calibration | ⏳ Pending | Phase 3 completion |
| 7. Production Hardening | ⏳ Pending | Phase 6 completion |
| 8. Deployment & Scaling | ⏳ Pending | Phase 7 completion |

---

*Last updated: 2026-11-17 | Next milestone: Fix metadata arch bug → Train models → Run test suite*
