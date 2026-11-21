# SentinelAI — Current Task

> This file tracks the **immediate active work**. Update it whenever you start or finish a task. Other agents should read this first to avoid duplicate work.

---

## 🎯 Active Task

**Task**: Fix critical blockers to make the system end-to-end runnable  
**Status**: 🔴 Blocked — `saved_models/` is empty; models not trained  
**Priority**: HIGH  
**Started**: 2026-11-17  

---

## 📋 Immediate To-Do (Ordered)

### 1. 🔴 Fix Metadata Architecture Mismatch — CRITICAL
**File**: `models/metadata_pipeline.py`  
**Problem**: The FFNN class defined in `models/metadata_pipeline.py` for inference may have different layer names or structure than the class in `train/train_metadata_model.py`. This causes `state_dict` mismatch when the saved model is loaded for API inference, resulting in an untrained (random) metadata model.

**How to fix**:
1. Open `train/train_metadata_model.py` — find the `MetadataModel` class (or equivalent)
2. Open `models/metadata_pipeline.py` — find the inference model class
3. Ensure both define **exactly the same** layer names, dimensions, and dropout positions
4. The training definition is authoritative — update the inference class to match

**Verification**: After training, run `python -c "from models.metadata_pipeline import MetadataPipeline; p = MetadataPipeline('saved_models/metadata_model.pth'); print('OK')"` — should print OK without warnings.

---

### 2. 🔴 Train Models — REQUIRED BEFORE API START
**Commands** (from project root, with `.venv` activated):
```bash
python train/train_text_model.py
# Expected time: 20–30 min | Saves: saved_models/text_model_best.pth + text_tokenizer/

python train/train_metadata_model.py
# Expected time: 45 min | Saves: saved_models/metadata_model.pth + metadata_scaler.pkl
```

**After training text model**:
- Check which epoch had best validation accuracy in the logs
- If `text_model.pth` points to last epoch, manually copy the best epoch checkpoint:
  ```bash
  # Example if epoch 5 was best:
  copy saved_models\text_model_epoch_5.pth saved_models\text_model.pth
  ```

---

### 3. 🟡 Add Best-Checkpoint Auto-Restore to Text Training
**File**: `train/train_text_model.py`  
**Problem**: Training saves all epoch checkpoints but sets `text_model.pth` to the most recent epoch, not the best validation accuracy epoch.  
**Fix**: After training loop ends, copy best checkpoint file to `text_model.pth` automatically.

```python
# After training loop — pseudocode
best_epoch_path = f"saved_models/text_model_epoch_{best_epoch}.pth"
shutil.copy(best_epoch_path, "saved_models/text_model.pth")
logger.info(f"Restored best checkpoint from epoch {best_epoch}")
```

---

### 4. 🟡 Validate False Positive Reduction
**File**: `test_full_pipeline.py`  
**What to test** (after training + API start):
- OTP message from `HDFCBK` → must be **HAM**
- Amazon shipment notification → must be **HAM**
- Court notice / tax warning → must be **HAM**
- Classic phishing with `.tk` URL → must be **SPAM**
- Lottery scam with IP address URL → must be **SPAM**

**Target**: 4+ of 5 test cases passing (80%+)

---

### 5. 🟢 Freeze Dependency Versions
**File**: `requirements.txt`  
**Problem**: Current pins target Python 3.10/3.11 but environment runs 3.14.0.  
**Fix**: After successful training + API validation, run:
```bash
pip freeze > requirements_frozen.txt
```
Keep `requirements.txt` as minimum spec, add `requirements_frozen.txt` as exact reproduction spec.

---

## ✅ Recently Completed

- [x] **2026-11-17**: Full codebase audit and documentation — created `HANDOFF.md`, `LOG.md`, `CURRENT_TASK.md`, `PHASES.md`
- [x] **2026-03-18**: Applied 7 training improvements (data, hyperparams, scheduler, rules, fusion weights)
- [x] **2026-03-19**: Completed first full training run; achieved 99.46% text accuracy, 98.00% metadata accuracy
- [x] **2026-03-18**: Added synthetic hard negatives (200 samples), oversampling, warmup scheduler
- [x] **2026-03-18**: Added `SAFE_PATTERNS` + `PHISHING_PATTERNS` + `apply_rules()` post-processing

---

## 🧪 How to Verify This Task is Done

Run the following and confirm all pass:

```bash
# 1. Models exist
ls saved_models/text_model.pth
ls saved_models/metadata_model.pth
ls saved_models/metadata_scaler.pkl
ls saved_models/text_tokenizer/

# 2. API starts cleanly
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Look for: "✓ Text model loaded", "✓ Metadata model loaded", "🎉 All models loaded successfully!"

# 3. Health check
curl http://localhost:8000/health
# Expect: {"status":"healthy","models_loaded":{"text_model":true,"metadata_model":true,...}}

# 4. Full test suite
python test_full_pipeline.py
# Target: 80%+ pass rate
```

---

## 🔧 Working Context

- **Working dir**: `c:\Users\Deepak\OneDrive\Documents\projects\SentinelAI_Complete_Project`
- **Python env**: `.venv` (Python 3.14.0 installed)
- **Key env var**: `GROQ_API_KEY` in `.env` (optional — only for `/justify` and `/chat`)
- **Frontend**: External at `sentinelfrontend.vercel.app` — not in this repo
- **GPU**: Not confirmed available; CPU training expected

---

*Last updated: 2026-11-17 22:46 IST*
