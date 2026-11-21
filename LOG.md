# SentinelAI — Development Log

> Reverse-chronological log of all significant changes, decisions, and debugging sessions.

---

## 2026-11-17 — Repository Audit & Documentation Pass

**Author**: AI Agent (Antigravity)  
**Scope**: Full codebase audit; created HANDOFF.md, LOG.md, CURRENT_TASK.md, PHASES.md

### Findings

- `saved_models/` is **completely empty** (only `.gitkeep`). No trained weights present.
- `requirements.txt` pins Python 3.10/3.11 versions but actual environment is Python 3.14.0, requiring override installs.
- CORS config references `sentinelfrontend.vercel.app` — frontend is external to this repository.
- `post_training_information.md` documents a past training session (from ~2026-03-19) where models were trained and tested but no weights were committed.

### Architecture Decisions Confirmed

- Pipeline 2 (Image) uses **OCR-only approach** — no standalone CNN is trained. Tesseract extracts text from images, then Pipeline 1 scores that text. `train/train_image_model.py` exists but is not part of the active inference path.
- Decision fusion uses **dynamic weight redistribution** (not defaulting missing modalities to 0.5). This is a correct design choice to avoid false positives.
- `/justify` endpoint is a **secondary LLM enrichment layer** — the core classification works without Groq API key.

---

## 2026-03-19 — Post-Training Analysis (from `post_training_information.md`)

**Author**: Previous Session  
**Scope**: First full training run + API validation

### Results

| Run | Model | Best Epoch | Val Accuracy |
|-----|-------|-----------|--------------|
| Baseline (3 epochs) | Text (XLM-RoBERTa) | 3 | 98.93% |
| Extended (15 epochs) | Text (XLM-RoBERTa) | 5 | **99.46%** |
| Baseline (3 epochs) | Metadata (FFNN) | 3 | 97.51% |
| Extended (10 epochs) | Metadata (FFNN) | 10 | **98.00%** |

### Issues Found

1. **False positives on legitimate transactional messages** after training:
   - Amazon shipment notification → classified as SPAM
   - HDFC-style OTP message → classified as SPAM
   - Root cause: missing modalities default to 0.5; formula `score = 0.5*text + 0.25` pushes high-text-score benign messages over threshold
   
2. **Metadata API architecture mismatch**:
   - `state_dict` layer names between `train/train_metadata_model.py` and `models/metadata_pipeline.py` differ
   - Metadata model may load as random/untrained in the API process
   - **Status: UNRESOLVED**

3. **Best checkpoint not auto-selected**:
   - `text_model.pth` points to epoch 15, not epoch 5 (best)
   - Manually swapped to epoch 5 checkpoint for production testing in that session
   - **Status: Needs automation**

### Operational Actions Taken

- Switched `text_model.pth` → epoch 5 checkpoint manually for that session
- API health check confirmed reachable at `/health`

---

## 2026-03-18 — Improvements Applied (from `CHANGES_APPLIED.md`)

**Author**: Previous Session  
**Scope**: 7 targeted improvements to data, training, inference, and fusion

### Changes Summary

| # | Area | Change | File |
|---|------|--------|------|
| 1 | Data | Added `generate_synthetic_hard_negatives()` — 200 synthetic legitimate messages (OTP, delivery, banking, UPI) | `train/train_text_model.py` |
| 2 | Data | Added `resample()` oversampling to balance spam ratio to ~40% | `train/train_text_model.py` |
| 3 | Training | Epochs 15→20, batch 16→8, LR 2e-5→3e-5, patience 3→4 | `config.py` |
| 4 | Training | Added `get_linear_schedule_with_warmup` scheduler (100 warmup steps) | `train/train_text_model.py` |
| 5 | Inference | Added `SAFE_PATTERNS` (14 regex) + `PHISHING_PATTERNS` (10 regex) + `apply_rules()` post-processing | `models/text_pipeline.py` |
| 6 | Fusion | Weights: text 50%→45%, meta 30%→40%, image 20%→15%; Threshold 0.6→0.68 | `config.py` |
| 7 | Verification | Enhanced training summary printing | `train/train_text_model.py` |

> ⚠️ **Note**: The fusion weights in this log entry (Step 6) represent an intermediate state. The final `config.py` has been further updated: text=0.60, meta=0.20, image=0.20, threshold=0.45. The README and config.py reflect the latest values.

### Expected Outcomes

- Total training rows: 10,000+ (up from 6,520 baseline)
- Spam ratio: 38–42% (up from 15–20%)
- False positive pass rate target: 80%+ (up from 40%)

---

## 2026-03-17 — Initial Baseline Training

**Author**: Previous Session  
**Scope**: First training run to establish baseline metrics

### Environment

- Python 3.14.0 in `.venv`
- Dependency conflicts resolved: `tldextract` missing, installed manually
- `requirements.txt` pins incompatible with Python 3.14 — resolved with newer compatible versions

### Dataset Stats (Pipeline 1)

- Raw rows loaded: 18,045
- Rows after normalization/filtering: 6,520
- Train/Val split: 5,216 / 1,304

### Dataset Stats (Pipeline 3)

- One HuggingFace file skipped (missing label column)
- Total rows: 272,502
- After label cleaning: 250,079
- Train/Val split: 200,063 / 50,016

---

## Decision Log — Architecture Choices

| Decision | Choice Made | Rationale |
|----------|-------------|-----------|
| Missing modality handling | Exclude from fusion + redistribute weights | Avoids 0.5 default bias causing false positives |
| Image pipeline | OCR + text re-scoring (no CNN) | No labeled image training set available; OCR generalizes well |
| Multilingual support | XLM-RoBERTa base | Native cross-lingual embeddings for 100+ languages |
| Explainability | Attention weights + Groq LLM | Human-readable output for non-technical users |
| Spam threshold | 0.45 (lowered from 0.60/0.68) | Prioritize recall; reduce harsh-but-legitimate false positives |
| Synthetic hard negatives | 200 generated + CSV hard negatives | Real training data lacks sufficient benign transactional examples |
| Score calibration | Temperature scaling (1.6 text, 1.8 meta) | Soften overconfident model outputs near 0 and 1 |
