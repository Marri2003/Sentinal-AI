# SentinelAI — Complete Project Structure & Function Reference

> **Purpose**: One-stop map of every file, its functions, what each does, what inputs/outputs it handles, known issues, and what still needs work. Read this instead of opening every source file.

---

## 📂 Root-Level Files

| File | Purpose | Status |
|------|---------|--------|
| `config.py` | Central configuration for the entire project | ✅ Complete |
| `requirements.txt` | Python dependencies (pinned for 3.10/3.11) | ⚠️ Needs update for 3.14 |
| `.env.example` | Template for environment variables | ✅ Complete |
| `__init__.py` | Root package marker | ✅ Trivial |
| `HANDOFF.md` | Agent/tool briefing document | ✅ Created |
| `LOG.md` | Development history | ✅ Created |
| `CURRENT_TASK.md` | Active work tracking | ✅ Created |
| `PHASES.md` | Full project lifecycle | ✅ Created |
| `PROJECT_STRUCTURE.md` | This file | ✅ Created |
| `README.md` | Full project documentation (1288 lines) | ✅ Complete |
| `README_RUN_FIRST.md` | Quick setup + run guide | ✅ Complete |
| `CHANGES_APPLIED.md` | Log of 7 training improvements applied | ✅ Historical |
| `post_training_information.md` | Past training session results & bugs | ✅ Historical |
| `run_windows.bat` | Windows batch runner | ✅ |
| `run_linux_mac.sh` | Unix shell runner | ✅ |
| `train_models_windows.bat` | Windows batch for training | ✅ |
| `setup_git.sh` | Git setup helper | ✅ |
| `sample_phishing_sms.png` | Sample phishing image for testing | ✅ |

---

## ⚙️ `config.py` — Central Configuration

**Single source of truth** for all constants, paths, model settings, and tuning parameters.

### Constants & What They Do

```python
# API Settings
API_TITLE, API_VERSION, API_DESCRIPTION   # FastAPI metadata
CORS_ORIGINS                              # Allowed frontend origins:
                                          #   localhost:8080, 5173, 3000
                                          #   sentinelfrontend.vercel.app

# Groq LLM (for /justify and /chat)
GROQ_API_KEY    # From .env file — optional; fallbacks exist
GROQ_API_URL    # https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL      # llama-3.1-8b-instant

# Model file paths
TEXT_MODEL_PATH        # saved_models/text_model.pth
IMAGE_MODEL_PATH       # saved_models/image_model.pth  (unused — OCR approach)
METADATA_MODEL_PATH    # saved_models/metadata_model.pth
TEXT_TOKENIZER_PATH    # saved_models/text_tokenizer/
METADATA_SCALER_PATH   # saved_models/metadata_scaler.pkl

# Model architecture configs
TEXT_MODEL_CONFIG      # xlm-roberta-base, max_length=256, num_labels=2, dropout=0.1
IMAGE_MODEL_CONFIG     # mobilenet_v2, num_classes=2, input_size=(224,224)
METADATA_MODEL_CONFIG  # input_dim=15, hidden_dims=[64,32,16], output_dim=2, dropout=0.3

# Fusion
FUSION_WEIGHTS         # text=0.60, metadata=0.20, image=0.20
SPAM_THRESHOLD         # 0.45  ← lowered to reduce false positives
CONFIDENCE_THRESHOLDS  # HIGH: >0.75 or <0.25 | MEDIUM: >0.40 | LOW: 0.40–0.60

# Trust lists (90+ entries)
TRUSTED_DOMAINS    # amazon.in, hdfcbank.com, .gov.in, .edu, etc.
TRUSTED_SENDERS    # HDFCBK, SBIBNK, AMAZON, AIRTEL, IRCTC, etc.
SUSPICIOUS_DOMAIN_PATTERNS  # .xyz, .tk, .ml, .ga, .cf, .site

# Training hyperparameters (all in TRAINING_CONFIG dict)
epochs = 20
batch_size = 8
learning_rate = 3e-5
warmup_steps = 100
early_stopping_patience = 4           # for text
metadata_early_stopping_patience = 3  # for metadata
label_smoothing = 0.05
weight_decay = 1e-4
text_calibration_temperature = 1.6    # softens overconfident text scores
metadata_calibration_temperature = 1.8
probability_floor = 0.02
probability_ceiling = 0.98

# 15 feature names for metadata pipeline (order matters — matches scaler)
METADATA_FEATURES = [
    "url_length", "url_num_dots", "url_num_digits", "url_num_special_chars",
    "url_entropy", "is_shortened_url", "has_ip_address", "has_at_symbol",
    "sender_length", "sender_has_numbers", "sender_has_special_chars",
    "hour_of_day", "is_weekend", "url_has_https", "url_suspicious_tld"
]

# LLM config for /justify
JUSTIFY_SYSTEM_PROMPT   # Hardcoded English system prompt (fallback if no Groq key)
LLM_CONFIG              # provider, model, max_tokens=2000, temperature=0.3
```

**Needs Update**:
- `DEFAULT_SCORES` dict is deprecated (marked as such) but still present — can be removed
- `IMAGE_MODEL_CONFIG` references `mobilenet_v2` which is not actively trained

---

## 🌐 `app/` — FastAPI Application

### `app/models.py` — Pydantic Schemas

All request/response data models. No business logic here.

| Class | Type | Fields | Used By |
|-------|------|--------|---------|
| `MetadataInput` | Request | `sender`, `url`, `timestamp` | `/predict` |
| `PredictionRequest` | Request | `text`, `image` (base64), `metadata` | `/predict` |
| `PipelineScores` | Response | `text`, `metadata`, `image` (all Optional[float]) | `/predict` |
| `ContributingWord` | Response | `word`, `score` | `/predict` explainability |
| `ContributingFeature` | Response | `feature`, `score` | `/predict` explainability |
| `Explainability` | Response | `contributing_words[]`, `contributing_features[]`, `ocr_text` | `/predict` |
| `FusionWeightsUsed` | Response | `text`, `metadata`, `image` | `/predict` |
| `PredictionResponse` | Response | `final_score`, `decision`, `confidence`, `pipeline_scores`, `explainability`, `fusion_weights_used` | `/predict` |
| `HealthResponse` | Response | `status`, `models_loaded{}`, `timestamp` | `/health` |
| `ErrorResponse` | Response | `error`, `message`, `details` | All error cases |
| `JustifyRequest` | Request | Full prediction output + `language` + `original_message` | `/justify` |
| `JustifyResponse` | Response | `justification` (string) | `/justify` |
| `ChatRequest` | Request | `user_message`, `language` | `/chat` |
| `ChatResponse` | Response | `response` (string) | `/chat` |

**Validator**: `PredictionRequest.validate_text()` — strips empty strings, returns `None`.

---

### `app/main.py` — FastAPI Endpoints

**Global instances** (initialized at startup):
```python
text_pipeline: TextPipeline
image_pipeline: ImagePipeline
metadata_pipeline: MetadataPipeline
fusion_module: DecisionFusion
```

#### Functions & Endpoints

| Function/Endpoint | Type | What It Does |
|-------------------|------|-------------|
| `startup_event()` | `@app.on_event("startup")` | Loads all 4 models; raises on failure |
| `shutdown_event()` | `@app.on_event("shutdown")` | Logs shutdown |
| `root()` | `GET /` | Returns API info and endpoint list |
| `health_check()` | `GET /health` | Returns `{status, models_loaded{}, timestamp}` |
| `predict(request)` | `POST /predict` | Main detection endpoint — runs all 3 pipelines → fusion → returns PredictionResponse |
| `build_justify_user_prompt(request)` | Helper | Formats prediction result into LLM user prompt string |
| `get_justify_system_prompt(language)` | Helper | Returns language-specific system prompt for 6 languages |
| `call_groq_api(system, user)` | Async | Calls Groq REST API; returns `None` on failure |
| `get_fallback_justification(decision, score, language)` | Helper | Returns hardcoded explanation when Groq fails; 6 languages × 5 scenarios |
| `generate_justification(...)` | Async | Tries Groq → falls back to hardcoded |
| `justify(request)` | `POST /justify` | Accepts full prediction output → returns human-readable justification |
| `call_groq_chat_api(message, language)` | Async | Calls Groq for chatbot response |
| `chat(request)` | `POST /chat` | Cybersecurity chatbot endpoint |
| `http_exception_handler` | Error handler | Returns `{error, message, details}` JSON |
| `general_exception_handler` | Error handler | Catches unhandled exceptions |

**`/predict` Flow** (line-by-line logic):
1. Validate at least one modality provided
2. Run Pipeline 1 if `request.text` → get `text_score` + `contributing_words`
3. Run Pipeline 2 if `request.image` → get `image_score` + `ocr_extracted_text`
4. Run Pipeline 3 if `request.metadata` and `metadata.url` → get `metadata_score` + `contributing_features`
5. Call `fusion_module.fuse(text_score, metadata_score, image_score, url_text_score, url, sender)`
6. Build and return `PredictionResponse`

**Supported Languages** (`/justify` and `/chat`): `english`, `hindi`, `telugu`, `marathi`, `urdu`, `tamil`

**Needs**:
- Input size validation (no max text length or image byte limit enforced)
- Rate limiting
- Request logging middleware

---

## 🤖 `models/` — Inference Pipelines

### `models/text_pipeline.py` — XLM-RoBERTa Text Classifier

**Purpose**: Classify SMS text as SPAM (1) or HAM (0) using fine-tuned XLM-RoBERTa.

#### Key Constants

```python
TEXT_TEMPERATURE = 1.6    # From TRAINING_CONFIG; softens overconfident outputs
PROBABILITY_FLOOR = 0.02
PROBABILITY_CEILING = 0.98

# 70+ safe pattern regexes (English + Telugu + Hindi)
SAFE_PATTERNS = [
    r'\botp\b', r'valid for \d+', r'do not share',
    r'\bdelivered\b', r'payment.*received', r'debited.*account',
    r'hallticket', r'itr.*filed', r'incometax\.gov', ...
]

# 10+ phishing pattern regexes
PHISHING_PATTERNS = [
    r'click here.*verify', r'account.*suspend', r'win.*prize',
    r'verify.*account.*immediately', r'kyc.*update', ...
]
```

#### Classes & Functions

| Item | What It Does |
|------|-------------|
| `TextTokenContribution` dataclass | `word: str, score: float` — one attention-weighted token |
| `TextAnalysisResult` dataclass | `score, raw_score, label, contributing_words[], rules_fired[], explanation` |
| `apply_rules(text, raw_score)` | Rule engine: if ≥2 safe hits and 0 phishing hits → cap score at 0.30. If ≥2 phishing hits and 0 safe hits → boost score to 0.70. Returns `(adjusted_score, rules_fired[])` |
| `SentinelTextClassifier(nn.Module)` | XLM-RoBERTa encoder + dropout + linear head (768→2) |
| `SentinelTextClassifier.forward(input_ids, attention_mask)` | Returns logits `(batch, 2)` |
| `TextPipeline.__init__(model_path, tokenizer_path)` | Loads tokenizer + model weights; falls back gracefully if files missing |
| `TextPipeline.predict(text)` | Returns spam probability float; applies temperature calibration + rules |
| `TextPipeline.predict_with_explanation(text, top_k=5)` | Returns `TextAnalysisResult` with attention-based contributing words |
| `TextPipeline._extract_contributing_words(text, top_k)` | Runs tokenizer → model → softmax attention → maps subword tokens back to words |

**How Attention Extraction Works**:
1. Tokenize text → get `input_ids`, `attention_mask`
2. Extract encoder's last hidden state
3. Use `attention_mask` to weight hidden states → compute per-token importance
4. Merge subword tokens back into words
5. Sort by importance → return top-k

**Needs**:
- Multi-language attention merging (currently best-effort for Arabic/Devanagari subwords)
- Attention extraction uses a heuristic approximation, not true transformer attention heads

---

### `models/image_pipeline.py` — OCR Image Classifier

**Purpose**: Extract text from images via OCR, then re-score using `TextPipeline`.

> ⚠️ **No CNN is trained**. MobileNetV2 referenced in `config.py` is not used in inference. All image classification flows through Tesseract → TextPipeline.

#### Classes & Functions

| Item | What It Does |
|------|-------------|
| `ImageAnalysisResult` dataclass | `score (Optional[float]), ocr_text, text_length, explanation, ocr_success` |
| `ImagePipeline.__init__(text_pipeline)` | Checks `cv2` and `pytesseract` availability; lazy-loads `TextPipeline` if not provided |
| `ImagePipeline._load_image(image_input)` | Accepts: PIL Image, file path, raw base64 string, `data:image/...;base64,...`, bytes |
| `ImagePipeline._preprocess_for_ocr(image)` | Grayscale → adaptive threshold → denoise (uses OpenCV if available, PIL fallback) |
| `ImagePipeline._extract_text_ocr(image)` | Tesseract with `--oem 3 --psm 6`; supports multilingual OCR |
| `ImagePipeline.predict(image_input)` | Returns `score` or `None` if OCR fails or text < 10 chars |
| `ImagePipeline.analyze(image_input)` | Full analysis returning `ImageAnalysisResult` |
| `ImagePipeline.predict_with_ocr(image_input)` | Returns `(score, ocr_text, explanation)` tuple |
| `analyze_image(image_input, text_pipeline)` | Module-level convenience function |
| `check_dependencies()` | Returns `{opencv: bool, pytesseract: bool, tesseract_path: bool}` |

**Returns `None` (not 0.5) when**:
- OCR fails (Tesseract not installed, corrupt image)
- Extracted text < 10 characters
- Text pipeline unavailable

**Setup Requirements**:
- `pip install pytesseract pillow opencv-python`
- Tesseract binary installed: Windows → UB Mannheim installer; Linux → `apt install tesseract-ocr`
- Set `TESSERACT_CMD` env var if Tesseract is not on `PATH`

---

### `models/metadata_pipeline.py` — FFNN URL/Metadata Classifier

**Purpose**: Classify messages as phishing based on URL structure, sender ID, and temporal features.

#### Helper Functions (module-level)

| Function | Input | Output | What It Does |
|----------|-------|--------|-------------|
| `extract_registered_domain(url)` | URL string | `"domain.tld"` | Uses tldextract |
| `looks_like_brand_spoof(url)` | URL string | `bool` | Detects URLs embedding trusted brand names (e.g. `hdfc.secure-login.xyz`) |
| `calibrate_probability(prob, temperature)` | float, float | float | Temperature scaling via logit space |
| `check_spam_number(phone)` | Sender string | 0.0–1.0 | Heuristic: known safe senders→0.05, 10-digit numbers→0.65, mixed→0.55 |
| `check_url_text(url)` | URL string | 0.0–1.0 | Rule-based: checks phishing keywords, suspicious TLDs, IP addresses, shortened URLs, brand spoofs |

#### Classes

| Item | What It Does |
|------|-------------|
| `FeatureContribution` dataclass | `feature: str, score: float, value: float` |
| `MetadataAnalysisResult` dataclass | `score, label, contributing_features[], suspicious_indicators{}, explanation, url_text_score` |
| `MetadataClassifier(nn.Module)` | FFNN: `15 → 64 → 32 → 16 → 2` with ReLU + Dropout(0.3) wrapped in `nn.Sequential` as `self.network` |
| `MetadataClassifier.forward(x)` | Returns logits `(batch, 2)` |
| `MetadataClassifier.get_first_layer_weights()` | Returns `self.network[0].weight.data` for feature importance |
| `MetadataPipeline.__init__(model_path)` | Loads scaler (pickle) + model weights; handles `model.`/`module.`/`network.` prefix mismatches |
| `MetadataPipeline._load_model_weights(path)` | Smart loader: tries exact match, then strips `model.`/`module.`, then adds `network.` |
| `MetadataPipeline._verify_model_loading()` | Runs dummy forward pass `(1,15) → (1,2)` to confirm model is functional |
| `MetadataPipeline.preprocess(url, sender, timestamp)` | Calls `extract_metadata_features()` → scales → returns tensor + raw array |
| `MetadataPipeline._compute_feature_importance(tensor, raw, top_k)` | `importance = abs(input) × abs(weight_norm)` for first layer; normalizes top-k |
| `MetadataPipeline.predict(url, sender, timestamp)` | Returns `None` if no URL provided (fusion ignores it) |
| `MetadataPipeline.predict_with_explanation(...)` | Full result: score + features + url_text_score + suspicious_indicators |
| `MetadataPipeline.predict_with_indicators(...)` | Legacy wrapper returning `(score, dict, str)` tuple |
| `MetadataPipeline._generate_explanation(score, features, indicators)` | Builds human-readable explanation string |

**Returns `None` when**: No URL provided, or model not loaded → fusion excludes this modality.

**Architecture Note**: `MetadataClassifier` stores layers in `self.network` (a `nn.Sequential`). The key `network.0.weight` is the first linear layer weight. The training script's model must use this same structure.

---

## 🔀 `fusion/decision_fusion.py` — Late Fusion Module

**Purpose**: Combine scores from all 3 pipelines into a single spam/ham decision.

#### Classes & Functions

| Item | What It Does |
|------|-------------|
| `ConfidenceLevel(Enum)` | `HIGH`, `MEDIUM`, `LOW` |
| `FusionResult` dataclass | `label, score, confidence, modalities_used[], individual_scores{}, weights_applied{}` |
| `FusionResult.to_dict()` | JSON-serializable dict |
| `DecisionFusion.__init__(threshold)` | Sets threshold (default from config: 0.45) |
| `DecisionFusion._is_trusted_domain(url)` | Checks `TRUSTED_DOMAINS` via tldextract |
| `DecisionFusion._looks_like_trusted_spoof(url)` | Checks if brand tokens appear in URL but not in registered domain |
| `DecisionFusion._is_suspicious_domain(url)` | Checks `SUSPICIOUS_DOMAIN_PATTERNS` |
| `DecisionFusion._is_trusted_sender(sender)` | Checks `TRUSTED_SENDERS` (exact match, uppercase) |
| `DecisionFusion._calculate_confidence(score)` | HIGH if >0.75 or <0.25; MEDIUM if >0.60 or <0.40; LOW otherwise |
| `DecisionFusion._redistribute_weights(modalities)` | Normalizes base weights proportionally to available modalities |
| `DecisionFusion.fuse(text, metadata, image, url_text_score, url, sender)` | **Main method** — see flow below |
| `DecisionFusion.fuse_simple(...)` | Returns `(label, score, confidence)` tuple |
| `DecisionFusion.set_threshold(t)` | Updates threshold |
| `DecisionFusion.get_config()` | Returns current weights + threshold |
| `DecisionFusion.compute_weights_for_modalities(list)` | Static utility to preview weight redistribution |
| `fuse_predictions(...)` | Module-level convenience function |

**`fuse()` Logic Flow**:
```
1. Collect non-None scores → {text, metadata, image}
2. Special case: if only text and text_score > 0.85 → use text directly (weight=1.0)
3. Otherwise: redistribute weights proportionally, compute weighted sum
4. Apply url_text_score boost:
     ≥ 0.75 → +0.06
     ≥ 0.50 → +0.03
5. Apply image confidence boost:
     ≥ 0.80 → +0.12
     ≥ 0.60 → +0.06
6. Trust adjustments:
     is_trusted_spoof       → +0.22  (punish brand spoofing)
     trusted domain + sender → -0.25  (strong trust bonus)
     either trusted          → -0.15  (moderate trust bonus)
     suspicious domain       → +0.08  (penalty)
7. Clamp to [0.02, 0.98]
8. label = "SPAM" if score > 0.45 else "HAM"
9. Return FusionResult
```

**Weight Redistribution Examples**:
| Available | text | metadata | image |
|-----------|------|---------|-------|
| All 3 | 0.60 | 0.20 | 0.20 |
| text + meta | 0.75 | 0.25 | — |
| text + image | 0.75 | — | 0.25 |
| text only | 1.00 | — | — |
| meta only | — | 1.00 | — |

---

## 🏋️ `train/` — Training Scripts

### `train/train_text_model.py` — XLM-RoBERTa Fine-tuning

**Run**: `python train/train_text_model.py` from project root

#### Classes & Functions

| Item | What It Does |
|------|-------------|
| `SpamDataset(Dataset)` | Tokenizes text on-the-fly; `__getitem__` returns `{input_ids, attention_mask, label}` |
| `SentinelTextClassifier(nn.Module)` | Same as inference: XLM-RoBERTa encoder + dropout + Linear(768→2) |
| `generate_synthetic_hard_negatives()` | Creates 200 synthetic legitimate messages (OTP, bank debits, deliveries, UPI) with `random.seed(42)` |
| `load_and_prepare_data()` | Full ETL pipeline — see steps below |
| `train_epoch(model, loader, optimizer, scheduler, device)` | One training epoch; calls `scheduler.step()` after each batch |
| `evaluate(model, loader, device)` | Returns `(accuracy, precision, recall, f1)` |
| `save_checkpoint(model, tokenizer, epoch, val_acc, is_best)` | Saves `text_model_epoch_N.pth`; copies to `text_model_best.pth` if best |
| `main()` | Orchestrates: load data → build model → train loop → save |

**`load_and_prepare_data()` Steps**:
1. Load 4 CSVs from `pipeline 1/`
2. Normalize labels: `ham→0`, `spam/smishing/phishing→1`; `>= 2` label value → spam
3. Load `hard_negatives.csv`, `hard_negatives_edge.csv`, `hard_positives.csv`, `translated_phishing.csv`
4. Text cleaning (lowercase, strip URLs, phone numbers, whitespace)
5. Deduplicate on text
6. Add 200 synthetic hard negatives (generated in-code)
7. Oversample spam to ~40% ratio using `sklearn.utils.resample`
8. Print dataset summary
9. Train/val split (80/20 stratified)

**Outputs** (all in `saved_models/`):
- `text_model_epoch_N.pth` for each epoch
- `text_model_best.pth` — checkpoint with highest val accuracy
- `text_model_last.pth` — final epoch checkpoint
- `text_model.pth` — symlink/copy to best (use this for inference)
- `text_tokenizer/` — tokenizer files for XLM-RoBERTa
- `text_training_metrics.json` — per-epoch metrics

**Needs**:
- Confirm `text_model.pth` is automatically updated to point to best epoch (the script has `save_checkpoint` with `is_best` logic — verify it copies to `text_model.pth` correctly)

---

### `train/train_metadata_model.py` — FFNN Training

**Run**: `python train/train_metadata_model.py` from project root

#### Classes & Functions

| Item | What It Does |
|------|-------------|
| `MetadataDataset(Dataset)` | Wraps features array + labels as tensors |
| `MetadataFFNN(nn.Module)` | FFNN: `15 → 64 → 32 → 16 → 2` — **must match `MetadataClassifier` in `models/metadata_pipeline.py`** |
| `load_and_prepare_data()` | Loads 3 CSVs from `pipeline 3/`; extracts 15 features per URL; scales with `StandardScaler` |
| `train_epoch(model, loader, optimizer, device)` | One training epoch with `AdamW`, `LabelSmoothingCrossEntropyLoss` |
| `evaluate(model, loader, device)` | Returns `(accuracy, precision, recall, f1, confusion_matrix)` |
| `main()` | Trains → saves model + scaler + metrics |

**Data Loading Notes**:
- One HuggingFace CSV skipped (missing label column) — handled with try/except
- Uses `extract_metadata_features(url, sender, timestamp)` from `utils/preprocessing.py`
- `StandardScaler` fitted on training data, saved as `metadata_scaler.pkl`

**Outputs**:
- `metadata_model.pth` — final model (best checkpoint if early stopping used)
- `metadata_model_last.pth` — last epoch
- `metadata_scaler.pkl` — fitted StandardScaler
- `metadata_training_metrics.json`

> ⚠️ **Architecture Consistency**: `MetadataFFNN` in this file must have identical layer names to `MetadataClassifier` in `models/metadata_pipeline.py`. Both currently use `self.network = nn.Sequential(...)`. Confirmed compatible as of this audit.

---

### `train/train_image_model.py` — MobileNetV2 Training (INACTIVE)

**Status**: 🟡 Present but not part of active pipeline. No labeled image dataset available. The inference path uses OCR only. Skip this file.

---

### `train/hard_negatives_augment.py`

**Purpose**: Augment the training set with hard negative samples (legitimate messages that look suspicious).

| Function | What It Does |
|----------|-------------|
| `generate_hard_negatives()` | Generates templates for OTP, banking, delivery, government messages |
| `save_to_csv(samples, path)` | Writes generated samples to `pipeline 1/hard_negatives.csv` |

---

### `train/translate_augment.py`

**Purpose**: Translate English phishing samples to Hindi and Telugu for multilingual training data.

| Function | What It Does |
|----------|-------------|
| `translate_texts(texts, target_lang)` | Uses Google Translate API (requires internet) |
| `generate_translated_dataset()` | Selects 500 spam + 500 ham → translates to Hindi + Telugu → saves to `translated_phishing.csv` |

---

### `train/debug_data_loading.py`

**Purpose**: Diagnostic script to inspect dataset loading issues. Run standalone to debug CSV column mismatches or label encoding problems.

---

## 🔧 `utils/preprocessing.py` — Shared Utilities

**Used by**: `models/metadata_pipeline.py`, `train/train_metadata_model.py`, `models/text_pipeline.py`

#### Functions

| Function | Input | Output | What It Does |
|----------|-------|--------|-------------|
| `extract_url_from_text(text)` | str | `str\|None` | Regex-extracts first HTTP/HTTPS URL from text |
| `calculate_entropy(text)` | str | float | Shannon entropy of string characters |
| `is_shortened_url(url)` | str | bool | Checks against `SHORTENED_URL_DOMAINS` list via tldextract |
| `has_ip_address(url)` | str | bool | Regex: `\d{1-3}.\d{1-3}.\d{1-3}.\d{1-3}` |
| `has_suspicious_tld(url)` | str | bool | Checks against `SUSPICIOUS_TLDS` list |
| `extract_metadata_features(url, sender, timestamp)` | Optional strs | `Dict[str, float]` | Returns all 15 features as a dict (key order matches `METADATA_FEATURES`) |
| `detect_spam_in_metadata(url, sender, time, date, mobile_number)` | Optional strs | `Dict[str, Any]` | Returns dict of triggered suspicious indicators |
| `detect_spam_keywords(text)` | str | `List[str]` | Returns list of matching `SUSPICIOUS_KEYWORDS` from config |
| `preprocess_image(image_path)` | str | PIL Image | Resizes to 224×224, normalizes for MobileNetV2 (not currently used in inference) |

**`extract_metadata_features()` — 15 Features Computed**:
```python
url_length              # len(url)
url_num_dots            # url.count('.')
url_num_digits          # count of digit chars
url_num_special_chars   # count of @#$%-_ etc.
url_entropy             # Shannon entropy of URL string
is_shortened_url        # domain in SHORTENED_URL_DOMAINS
has_ip_address          # IP pattern in URL
has_at_symbol           # '@' in URL
sender_length           # len(sender) or 0
sender_has_numbers      # any digit in sender
sender_has_special_chars # any special char in sender
hour_of_day             # parsed from timestamp (0-23), 12 if unknown
is_weekend              # 1 if Sat/Sun, 0 otherwise
url_has_https           # url.startswith('https')
url_suspicious_tld      # TLD in SUSPICIOUS_TLDS
```

---

## 🧪 Test & Evaluation Scripts

### `test_full_pipeline.py`

**Purpose**: End-to-end API test suite — sends real HTTP requests to running server.

**Run**: `python test_full_pipeline.py` (requires API running on `localhost:8000`)

**Test Cases Covered**:
1. Classic phishing (bit.ly URL, 3:45 AM) → expect SPAM HIGH
2. HDFC Bank OTP from HDFCBK → expect HAM HIGH
3. Amazon delivery from AMAZON → expect HAM HIGH
4. Fake UPI screenshot (image) → expect SPAM MEDIUM
5. Lottery scam with IP URL → expect SPAM HIGH
6. Telugu phishing (.tk) → expect SPAM HIGH
7. Hindi banking scam (.xyz) → expect SPAM HIGH
8. BESCOM electricity notice → expect HAM MEDIUM
9. Sophisticated ICICI phishing → expect SPAM HIGH

**Target pass rate**: 80%+ (4–5 of first 5 cases minimum)

---

### `test_api.py`

**Purpose**: Unit-level API tests using `httpx` (not full server tests).

Tests individual endpoint schemas and response format validation.

---

### `test_import.py`

**Purpose**: Smoke test — verifies all modules can be imported without errors.

Run first after setup: `python test_import.py`

---

### `evaluate_saved_models.py`

**Purpose**: Post-training evaluation — loads a saved checkpoint and runs inference on a held-out test set, printing confusion matrix, precision, recall, F1.

**Use when**: After training completes, to compare epoch checkpoints and pick the best one.

---

### `check_packages.py`

**Purpose**: Verifies all required packages are installed and importable.

---

## 📦 Data Directories

### `pipeline 1/` — Text Training Data

| File | Rows | Label Column | Notes |
|------|------|-------------|-------|
| `UCI SMS Spam Collection pipeline 1.csv` | 5,572 | `label` (ham/spam) | Classic benchmark |
| `Mendeley SMS Phishing Dataset pipeline 1.csv` | 5,971 | `LABEL` (HAM/Smishing/Spam) | Includes URL/email/phone cols |
| `Kaggle Multilingual Spam Data pipeline 1.csv` | 5,572 | `labels` (ham/spam) | Extended UCI |
| `smishtank dataset pipeline 1.csv` | 1,062 | `Malicious` | 23 feature columns; real-world smishing |
| `hard_negatives.csv` | ~49 | `label` | Manually curated harsh-but-legitimate messages |
| `hard_negatives_edge.csv` | varies | `label` | Extreme edge cases |
| `hard_positives.csv` | varies | `label` | Known phishing edge cases |
| `translated_phishing.csv` | 860 | `label` | Hindi (430) + Telugu (430) translations |

### `pipeline 3/` — URL Metadata Training Data

| File | Rows | Notes |
|------|------|-------|
| `PhiUSIIL_Phishing_URL_Dataset pipeline 3.csv` | 235,795 | Primary training dataset; 56 features (15 used) |
| `ISCX-URL-2016 Dataset (CIC) pipeline 3.csv` | 36,707 | Multi-class; binary-ized for training |
| `HuggingFace phishing-dataset pipeline 3.csv` | ~90,000 | ⚠️ One file had missing label col; skipped in training |

### `pipeline 2/` — Image Training Data

**Status**: 🔴 Empty / Not present. No labeled image dataset. OCR approach used instead.

### `saved_models/` — Trained Model Weights

**Current Status**: 🔴 EMPTY (only `.gitkeep`)

**After training, will contain**:
```
saved_models/
├── text_model.pth               ← Use this for inference (should = best epoch)
├── text_model_best.pth          ← Best validation accuracy checkpoint
├── text_model_last.pth          ← Final epoch checkpoint
├── text_model_epoch_1.pth       ← Per-epoch checkpoints
├── text_model_epoch_N.pth
├── text_training_metrics.json
├── text_tokenizer/              ← XLM-RoBERTa tokenizer files
│   ├── config.json
│   ├── sentencepiece.bpe.model
│   └── tokenizer.json
├── metadata_model.pth           ← Use this for inference
├── metadata_model_last.pth
├── metadata_scaler.pkl          ← Fitted StandardScaler (required)
└── metadata_training_metrics.json
```

---

## 🔄 Data Flow Diagram

```
SMS Input (text + optional image + optional metadata)
        │
        ├──────────────────────────────────────────────────────┐
        │                          │                           │
        ▼                          ▼                           ▼
┌───────────────┐      ┌─────────────────────┐    ┌──────────────────────┐
│  Pipeline 1   │      │    Pipeline 2        │    │    Pipeline 3        │
│  TextPipeline │      │   ImagePipeline      │    │  MetadataPipeline    │
│               │      │                      │    │                      │
│ XLM-RoBERTa  │      │ Tesseract OCR        │    │ extract_metadata_    │
│ tokenize text │      │ → extracted text     │    │ features(url,sender, │
│ → 768-dim emb │      │ → TextPipeline.      │    │   timestamp)         │
│ → Linear 768→2│      │   predict(ocr_text) │    │ → StandardScaler     │
│ → softmax     │      │ → score or None      │    │ → FFNN 15→64→32→16→2│
│ → temperature │      │   if OCR fails       │    │ → softmax            │
│   calibration │      │   or text <10 chars  │    │ → temperature calib  │
│ → apply_rules │      │                      │    │ → check_spam_number  │
│               │      │                      │    │ → check_url_text     │
│ Returns:      │      │ Returns:             │    │                      │
│ text_score    │      │ image_score (None?)  │    │ Returns:             │
│ contributing_ │      │ ocr_text             │    │ metadata_score       │
│   words[]     │      │                      │    │ url_text_score       │
│ rules_fired[] │      │                      │    │ contributing_        │
└───────┬───────┘      └──────────┬──────────┘    │   features[]         │
        │                         │               └──────────┬───────────┘
        └─────────────────────────┴────────────────────────┐ │
                                                           │ │
                                                           ▼ ▼
                                            ┌──────────────────────────┐
                                            │    DecisionFusion.fuse() │
                                            │                          │
                                            │ 1. Collect non-None scores│
                                            │ 2. Redistribute weights  │
                                            │ 3. Weighted sum          │
                                            │ 4. url_text_score boost  │
                                            │ 5. image confidence boost│
                                            │ 6. Trust adjustments     │
                                            │ 7. Clamp [0.02, 0.98]   │
                                            │ 8. label = score > 0.45  │
                                            │                          │
                                            │ Returns: FusionResult    │
                                            └────────────┬─────────────┘
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │   PredictionResponse     │
                                            │   final_score, decision  │
                                            │   confidence, scores     │
                                            │   explainability         │
                                            │   fusion_weights_used    │
                                            └──────────────────────────┘
                                                         │
                                              Optional: POST /justify
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │  Groq Llama 3.1 8B       │
                                            │  → 2-3 sentence          │
                                            │  justification in        │
                                            │  user's language         │
                                            └──────────────────────────┘
```

---

## 📋 Pending Updates Tracker

### Critical (Blocks functionality)
- [ ] **Train models**: Run `python train/train_text_model.py` and `python train/train_metadata_model.py` — `saved_models/` is empty
- [ ] **Verify metadata arch consistency**: Confirm `MetadataFFNN` in `train/train_metadata_model.py` and `MetadataClassifier` in `models/metadata_pipeline.py` have identical layer structures (both use `self.network = nn.Sequential` — appears consistent but verify on actual training run)

### High Priority
- [ ] **Auto-select best text checkpoint**: Confirm `save_checkpoint(is_best=True)` correctly copies `text_model_best.pth` → `text_model.pth` after training
- [ ] **Freeze dependencies**: After successful training, run `pip freeze > requirements_frozen.txt` for exact reproduction on Python 3.14
- [ ] **Validate false positive rate**: Run `test_full_pipeline.py`; target ≥4/5 on critical test cases (OTP, delivery, BESCOM)

### Medium Priority
- [ ] **Remove deprecated `DEFAULT_SCORES`** from `config.py` (marked as deprecated)
- [ ] **Add `/predict` input limits**: max text length (~1000 chars), max image size (~5 MB)
- [ ] **Add best-epoch metric logging**: Currently logs per-epoch val accuracy; add precision/recall/F1 for text model too
- [ ] **Pipeline 2 image dataset**: Collect labeled phishing screenshots if CNN approach is desired later

### Low Priority
- [ ] **Rate limiting** on API endpoints
- [ ] **Request/response logging** middleware for observability
- [ ] **Docker Compose** configuration
- [ ] **PostgreSQL + Redis** setup for production
- [ ] **Frontend** (`sentinelfrontend.vercel.app`) — external; not in this repo

---

## 🔑 Environment Variables (`.env`)

```bash
GROQ_API_KEY=your_key_here        # Required for /justify and /chat endpoints
                                   # Optional — fallback justifications work without it
TESSERACT_CMD=C:\path\to\tesseract.exe  # Optional — only needed if Tesseract not on PATH
```

---

## 🚀 Quick Commands Reference

```bash
# Setup
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Smoke test imports
python test_import.py

# Train (order matters — text first, then metadata)
python train/train_text_model.py
python train/train_metadata_model.py

# Evaluate trained models
python evaluate_saved_models.py

# Start API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Full pipeline test (requires API running)
python test_full_pipeline.py

# Single curl test
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"URGENT: Your account is blocked. Click: bit.ly/verify123"}'

# Health check
curl http://localhost:8000/health
```

---

*Last updated: 2026-11-17 | Audited by: AI Agent (Antigravity) | Python 3.14 / FastAPI / PyTorch*
