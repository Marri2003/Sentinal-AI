"""
SentinelAI Hugging Face Space Entrypoint (Gradio SDK)
Serves the complete FastAPI multi-modal phishing detection microservice
along with an interactive Gradio inspection UI on port 7860.
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
from app.main import app as fastapi_app

try:
    import gradio as gr

    # Build an interactive preview UI for direct testing inside Hugging Face
    def gradio_predict(sms_text, sender_id, url_input):
        import urllib.request
        import json
        
        # Test directly via local FastAPI instance
        from app.models import PredictionRequest, MetadataInput
        from app.main import predict
        import asyncio
        
        req = PredictionRequest(
            text=sms_text if sms_text.strip() else None,
            metadata=MetadataInput(
                sender=sender_id.strip() if sender_id.strip() else None,
                url=url_input.strip() if url_input.strip() else None
            ) if (sender_id.strip() or url_input.strip()) else None
        )
        
        loop = asyncio.new_event_loop()
        res = loop.run_until_complete(predict(req))
        loop.close()
        
        return {
            "Decision": res.decision,
            "Risk Score": f"{round(res.final_score * 100, 2)}%",
            "Confidence": res.confidence,
            "Pipeline Scores": {
                "Text": res.pipeline_scores.text,
                "Metadata": res.pipeline_scores.metadata,
                "Image": res.pipeline_scores.image
            }
        }

    with gr.Blocks(title="SentinelAI — Phishing Detection API") as demo:
        gr.Markdown("# 🛡️ SentinelAI — Multi-Modal Phishing Detection Backend")
        gr.Markdown(
            "This Hugging Face Space hosts the production multi-modal AI backend for SentinelAI.\n"
            "- **REST API Endpoints:** `/predict`, `/health`, `/docs` (Swagger UI)\n"
            "- **Models Active:** XLM-RoBERTa (1.1GB), 15-feature Metadata FFNN, Tesseract OCR v5.5, Decision Fusion"
        )
        
        with gr.Row():
            with gr.Column():
                txt_in = gr.Textbox(
                    lines=3,
                    label="SMS Message Text",
                    placeholder="e.g. URGENT: Your bank account will be blocked today. Verify KYC immediately at http://bit.ly/bank-verify"
                )
                sender_in = gr.Textbox(label="Sender Phone / ID (Optional)", placeholder="e.g. +919876543210 or SBI-ALERT")
                url_in = gr.Textbox(label="URL inside SMS (Optional)", placeholder="e.g. http://bit.ly/bank-verify")
                btn = gr.Button("Analyze Threat", variant="primary")
            
            with gr.Column():
                out = gr.JSON(label="AI Threat Detection Output")
        
        btn.click(fn=gradio_predict, inputs=[txt_in, sender_in, url_in], outputs=out)

    # Mount Gradio UI at /gradio or root, while keeping all FastAPI routes intact
    app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

except Exception as e:
    print(f"[INFO] Gradio initialization notice: {e}. Falling back to pure FastAPI.")
    app = fastapi_app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting SentinelAI Backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
