"""
Evaluate saved SentinelAI backend models and report per-model metrics.

This script rebuilds the validation split used by each training pipeline and
computes accuracy, precision, recall, and F1 for every available model
artifact separately. Missing models or datasets are skipped with a reason.
"""

import io
import json
from contextlib import redirect_stdout
from pathlib import Path
from typing import Any, Dict

import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader
from transformers import AutoTokenizer

from config import (
    DEVICE,
    IMAGE_MODEL_PATH,
    METADATA_MODEL_PATH,
    METADATA_SCALER_PATH,
    TEXT_MODEL_PATH,
    TEXT_TOKENIZER_PATH,
    TRAINING_CONFIG,
)
from models.metadata_pipeline import MetadataPipeline
from models.text_pipeline import TextPipeline
from train.train_image_model import (
    MobileNetV2Classifier,
    PhishingImageDataset,
    load_images_from_pipeline,
    validate as validate_image_model,
    val_transforms,
)
from train.train_metadata_model import (
    encode_labels as encode_metadata_labels,
    extract_features_batch,
    load_data_from_pipeline as load_metadata_data,
)
from train.train_text_model import (
    MODEL_NAME,
    BATCH_SIZE,
    MAX_SEQ_LENGTH,
    DROPOUT,
    RANDOM_SEED,
    SAVE_TOKENIZER_PATH,
    SpamClassifier,
    SpamDataset,
    load_and_prepare_data,
)


PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_PATH = PROJECT_ROOT / "saved_models" / "evaluation_metrics.json"
VALIDATION_SPLIT = TRAINING_CONFIG["validation_split"]


def compute_metrics(y_true, y_pred) -> Dict[str, float]:
    """Compute binary classification metrics for positive class 1."""
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
    }


def skipped_result(reason: str) -> Dict[str, Any]:
    """Return a standardized skipped payload."""
    return {
        "status": "skipped",
        "reason": reason,
    }


def evaluate_text_model() -> Dict[str, Any]:
    """Evaluate the saved text model on the reconstructed validation split."""
    if not TEXT_MODEL_PATH.exists():
        return skipped_result(f"Missing model artifact: {TEXT_MODEL_PATH.name}")

    df = load_and_prepare_data()
    texts = df["text"].values
    labels = df["label"].values

    _, val_texts, _, val_labels = train_test_split(
        texts,
        labels,
        test_size=VALIDATION_SPLIT,
        random_state=RANDOM_SEED,
        stratify=labels,
    )

    tokenizer_path = SAVE_TOKENIZER_PATH if Path(SAVE_TOKENIZER_PATH).exists() else MODEL_NAME
    tokenizer = AutoTokenizer.from_pretrained(str(tokenizer_path))
    dataset = SpamDataset(val_texts, val_labels, tokenizer, max_length=MAX_SEQ_LENGTH)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = SpamClassifier(MODEL_NAME, dropout=DROPOUT).to(DEVICE)
    model.load_state_dict(torch.load(TEXT_MODEL_PATH, map_location=DEVICE))
    model.eval()

    raw_predictions = []
    with torch.no_grad():
        for batch in dataloader:
            logits = model(
                batch["input_ids"].to(DEVICE),
                batch["attention_mask"].to(DEVICE),
            )
            preds = torch.argmax(logits, dim=1)
            raw_predictions.extend(preds.cpu().numpy().tolist())

    text_pipeline = TextPipeline(
        model_path=str(TEXT_MODEL_PATH),
        tokenizer_path=str(TEXT_TOKENIZER_PATH) if TEXT_TOKENIZER_PATH.exists() else None,
    )

    rule_adjusted_predictions = []
    with redirect_stdout(io.StringIO()):
        for text in val_texts:
            score = text_pipeline.predict(str(text))
            rule_adjusted_predictions.append(1 if score > 0.5 else 0)

    return {
        "status": "ok",
        "samples": int(len(val_labels)),
        "metrics_raw_model": compute_metrics(val_labels, raw_predictions),
        "metrics_backend_pipeline": compute_metrics(val_labels, rule_adjusted_predictions),
    }


def evaluate_metadata_model() -> Dict[str, Any]:
    """Evaluate the saved metadata model on the reconstructed validation split."""
    if not METADATA_MODEL_PATH.exists():
        return skipped_result(f"Missing model artifact: {METADATA_MODEL_PATH.name}")
    if not METADATA_SCALER_PATH.exists():
        return skipped_result(f"Missing scaler artifact: {METADATA_SCALER_PATH.name}")

    df = load_metadata_data()
    df = encode_metadata_labels(df)
    df = df.dropna(subset=["label"]).reset_index(drop=True)

    train_df, val_df = train_test_split(
        df,
        test_size=VALIDATION_SPLIT,
        random_state=RANDOM_SEED,
        stratify=df["label"].values,
    )
    del train_df

    val_features = extract_features_batch(val_df)
    val_labels = val_df["label"].values

    metadata_pipeline = MetadataPipeline(model_path=str(METADATA_MODEL_PATH))
    if metadata_pipeline.scaler is not None:
        val_features = metadata_pipeline.scaler.transform(val_features)

    with torch.no_grad():
        logits = metadata_pipeline.model(torch.tensor(val_features, dtype=torch.float32).to(DEVICE))
        probabilities = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()

    raw_predictions = (probabilities > 0.5).astype(int)

    pipeline_predictions = []
    for row in val_df.itertuples(index=False):
        score = metadata_pipeline.predict(
            url=getattr(row, "url", None),
            sender=getattr(row, "sender", None),
            timestamp=getattr(row, "timestamp", None),
        )
        pipeline_predictions.append(1 if score is not None and score > 0.5 else 0)

    return {
        "status": "ok",
        "samples": int(len(val_labels)),
        "metrics_raw_model": compute_metrics(val_labels, raw_predictions),
        "metrics_backend_pipeline": compute_metrics(val_labels, pipeline_predictions),
    }


def evaluate_image_model() -> Dict[str, Any]:
    """Evaluate the saved image model if both data and artifact exist."""
    if not IMAGE_MODEL_PATH.exists():
        return skipped_result(f"Missing model artifact: {IMAGE_MODEL_PATH.name}")

    try:
        image_paths, labels = load_images_from_pipeline()
    except Exception as exc:
        return skipped_result(str(exc))

    _, val_paths, _, val_labels = train_test_split(
        image_paths,
        labels,
        test_size=VALIDATION_SPLIT,
        random_state=RANDOM_SEED,
        stratify=labels,
    )

    dataset = PhishingImageDataset(val_paths, val_labels, transforms=val_transforms)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = MobileNetV2Classifier(num_classes=2, pretrained=False).to(DEVICE)
    model.load_state_dict(torch.load(IMAGE_MODEL_PATH, map_location=DEVICE))
    model.eval()

    metrics = validate_image_model(model, dataloader)
    return {
        "status": "ok",
        "samples": int(len(val_labels)),
        "metrics_backend_pipeline": {
            "accuracy": float(metrics["accuracy"]),
            "precision": float(metrics["precision"]),
            "recall": float(metrics["recall"]),
            "f1": float(metrics["f1"]),
        },
    }


def main():
    results = {
        "device": str(DEVICE),
        "validation_split": VALIDATION_SPLIT,
        "models": {
            "text": evaluate_text_model(),
            "metadata": evaluate_metadata_model(),
            "image": evaluate_image_model(),
        },
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")

    print(json.dumps(results, indent=2))
    print(f"\nSaved evaluation report to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
