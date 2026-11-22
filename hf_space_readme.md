---
title: SentinelAI Backend
emoji: 🛡️
colorFrom: red
colorTo: blue
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# 🛡️ SentinelAI — Multi-Modal Phishing Detection API

High-performance production microservice running:
- **XLM-RoBERTa** 1.1GB multilingual text classification
- **Tesseract OCR v5.5** screenshot processing
- **15-feature Feed-Forward Neural Network (FFNN)** for URL metadata
- **Dynamic Decision Fusion** with sender reputation & trust rules

### API Documentation
- Interactive Swagger Docs: `/docs`
- Health Check: `/health`
- Predict Endpoint: `POST /predict`
- Gradio Test Playground: `/gradio`
