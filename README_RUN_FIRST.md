# SentinelAI — complete runnable backend package

This package is based on the uploaded SentinelAI source code and dataset archives. It contains:
- Pipeline 1: multilingual SMS text classifier (XLM-RoBERTa fine-tuning)
- Pipeline 2: screenshot OCR using Tesseract, then text classifier scoring
- Pipeline 3: URL/sender metadata FFNN training and inference
- Weighted late-fusion module and FastAPI backend
- The supplied CSV datasets under `pipeline 1/` and `pipeline 3/`

## Important scope note
The supplied `pipeline 2/` directory contains no labeled image training set. The supplied implementation uses OCR and reuses the text model for image-extracted text; it does not train a standalone image CNN in this configuration. The source ZIP also does not include trained model weights or the XLM-RoBERTa tokenizer. Train models before launching the API. Training XLM-RoBERTa downloads `xlm-roberta-base` from Hugging Face and needs internet access for the first run.

## 1. Requirements
- Python 3.10 or 3.11 (recommended)
- Internet access for first-time package/model downloads
- 8 GB RAM minimum; 16 GB recommended for XLM-RoBERTa training
- Tesseract OCR installed separately for image OCR

### Install Tesseract
- Windows: install the UB Mannheim Tesseract build. Add its install folder to PATH, or set `TESSERACT_CMD` to the full `tesseract.exe` path.
- Ubuntu/Debian: `sudo apt-get update && sudo apt-get install -y tesseract-ocr`
- macOS: `brew install tesseract`

## 2. Create environment

### Windows PowerShell
```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Linux/macOS
```bash
python3.10 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If using an NVIDIA GPU, install the PyTorch build matching the machine's CUDA version from https://pytorch.org/get-started/locally/ before installing the remaining requirements.

## 3. Train models (run from this project root)
```bash
python train/train_text_model.py
python train/train_metadata_model.py
```
The text training script saves the XLM-RoBERTa checkpoint and tokenizer under `saved_models/`. The metadata script saves its FFNN checkpoint and scaler there. Training duration depends heavily on CPU/GPU and dataset size.

Pipeline 2 is OCR-based and does not need a separate trained image model. To use OCR, Tesseract must be installed and discoverable.

## 4. Start API
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open API documentation at `http://127.0.0.1:8000/docs` and health at `http://127.0.0.1:8000/health`.

## 5. Test API
In a second terminal, activate the same environment and run:
```bash
python test_full_pipeline.py
```

Example request (text-only):
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"URGENT: Verify your bank account immediately at http://fake-kyc-check.xyz"}'
```

## 6. Optional explanation API
Copy `.env.example` to `.env` and set `GROQ_API_KEY` only if you want the optional Groq-based justification endpoint. The detection API does not require a Groq key. Never commit or share your `.env` file.

## Troubleshooting
- `ModuleNotFoundError`: activate `.venv`, then run `pip install -r requirements.txt`.
- Hugging Face download failure: check internet/proxy access; the base model is downloaded on first training/inference.
- Tesseract not found: install the system OCR engine and add it to PATH, or set `TESSERACT_CMD`.
- Missing checkpoint: run both training commands before starting the API.
- Windows PowerShell activation blocked: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate.

## Research integrity
Do not report the metrics in `SentinelAI_Execution_Results.xlsx` as results from the original XLM-RoBERTa/FFNN models. That workbook explicitly labels its fallback sklearn experiment metrics. Record fresh metrics from the model-training scripts after successful training.
