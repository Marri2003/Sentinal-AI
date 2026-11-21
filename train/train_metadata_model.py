"""
Train a Feed Forward Neural Network (FFNN) for phishing detection
based on URL and sender metadata features.
Loads CSV files from pipeline 3/ and extracts 15 engineered features.
"""

import json
import os
import sys
import glob
import pickle
import logging
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from tqdm import tqdm

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add parent directory to path to import config and utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DEVICE, TRAINING_CONFIG, METADATA_MODEL_CONFIG, METADATA_FEATURES
from utils.preprocessing import extract_metadata_features

# Extract hyperparameters from config
EPOCHS = TRAINING_CONFIG["epochs"]
BATCH_SIZE = TRAINING_CONFIG["batch_size"]
LEARNING_RATE = TRAINING_CONFIG["learning_rate"]
VALIDATION_SPLIT = TRAINING_CONFIG["validation_split"]
RANDOM_SEED = TRAINING_CONFIG["random_seed"]
WEIGHT_DECAY = TRAINING_CONFIG["weight_decay"]
LABEL_SMOOTHING = TRAINING_CONFIG["label_smoothing"]
EARLY_STOPPING_PATIENCE = TRAINING_CONFIG["metadata_early_stopping_patience"]
PIN_MEMORY = torch.cuda.is_available()
NUM_WORKERS = min(4, os.cpu_count() or 1)

# Set random seeds for reproducibility
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)
torch.cuda.manual_seed_all(RANDOM_SEED)
if torch.cuda.is_available():
    torch.backends.cudnn.benchmark = True
INPUT_DIM = METADATA_MODEL_CONFIG["input_dim"]
HIDDEN_DIMS = METADATA_MODEL_CONFIG["hidden_dims"]
OUTPUT_DIM = METADATA_MODEL_CONFIG["output_dim"]
DROPOUT = METADATA_MODEL_CONFIG["dropout"]

# Paths (relative to project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPELINE_DIR = os.path.join(PROJECT_ROOT, "pipeline 3")
SAVE_MODEL_PATH = os.path.join(PROJECT_ROOT, "saved_models/metadata_model.pth")
SAVE_MODEL_LAST_PATH = os.path.join(PROJECT_ROOT, "saved_models/metadata_model_last.pth")
SAVE_SCALER_PATH = os.path.join(PROJECT_ROOT, "saved_models/metadata_scaler.pkl")
SAVE_METRICS_PATH = os.path.join(PROJECT_ROOT, "saved_models/metadata_training_metrics.json")

# Ensure output directory exists
os.makedirs(os.path.dirname(SAVE_MODEL_PATH), exist_ok=True)


class MetadataDataset(Dataset):
    """PyTorch dataset for metadata-based phishing detection."""
    
    def __init__(self, features, labels):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.long)
    
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        return {
            "features": self.features[idx],
            "labels": self.labels[idx]
        }


class MetadataFFNN(nn.Module):
    """Feed Forward Neural Network for metadata-based phishing detection."""
    
    def __init__(self, input_dim, hidden_dims, output_dim, dropout):
        super(MetadataFFNN, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        # Build hidden layers
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        # Output layer
        layers.append(nn.Linear(prev_dim, output_dim))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.network(x)


def load_data_from_pipeline():
    """
    Load URL-centric metadata training rows.

    Important:
    Training must use the same kind of raw inputs that inference sees
    (`url`, optional `sender`, optional `timestamp`). We intentionally skip
    datasets that only contain precomputed feature spaces that do not match
    the 15 engineered inference-time features.
    """
    csv_files = glob.glob(os.path.join(PIPELINE_DIR, "*.csv"))
    
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {PIPELINE_DIR}")
    
    logger.info(f"Found {len(csv_files)} CSV files")

    dataframes = []
    for csv_file in csv_files:
        filename = os.path.basename(csv_file)
        logger.info(f"Loading {filename}...")
        
        # Try different encodings
        df = None
        for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                df = pd.read_csv(csv_file, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logger.error(f"Error reading {filename} with {encoding}: {e}")
                break
        
        if df is None:
            logger.error(f"Could not read {filename} with any encoding. Skipping.")
            continue
        
        try:
            # Normalize column names to lowercase
            df.columns = df.columns.str.lower()
            
            # Handle different dataset formats
            if "huggingface" in filename.lower():
                # HuggingFace file uses url + status
                if "url" in df.columns and "status" in df.columns:
                    df_sub = df[["url", "status"]].copy()
                    df_sub = df_sub.rename(columns={"status": "label"})
                    df_sub["sender"] = None
                    df_sub["timestamp"] = None
                    dataframes.append(df_sub[["url", "sender", "timestamp", "label"]])
                else:
                    logger.warning(f"{filename} doesn't have expected url/status columns. Skipping.")
            
            elif "iscx" in filename.lower():
                # ISCX file in this repo only provides precomputed feature columns,
                # not the raw URL needed to match inference-time feature extraction.
                logger.warning(f"{filename} has no raw URL column; skipping to avoid feature mismatch.")
            
            elif "phiusiil" in filename.lower():
                # PhiUSIIL provides raw URL plus a label.
                if "url" in df.columns and "label" in df.columns:
                    df_sub = df[["url", "label"]].copy()
                    df_sub["sender"] = None
                    df_sub["timestamp"] = None
                    dataframes.append(df_sub[["url", "sender", "timestamp", "label"]])
                else:
                    logger.warning(f"{filename} doesn't have expected url/label columns. Skipping.")
            
            else:
                # Generic fallback: use only raw columns if present.
                if "url" in df.columns and "label" in df.columns:
                    df_sub = df[["url", "label"]].copy()
                    df_sub["sender"] = df["sender"] if "sender" in df.columns else None
                    df_sub["timestamp"] = df["timestamp"] if "timestamp" in df.columns else None
                    dataframes.append(df_sub[["url", "sender", "timestamp", "label"]])
                else:
                    logger.warning(f"{filename} doesn't have compatible raw URL columns. Skipping.")
                    
        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")

    if not dataframes:
        raise ValueError("No valid CSV files could be loaded")

    combined_df = pd.concat(dataframes, ignore_index=True)
    logger.info(f"Total records loaded: {len(combined_df)}")
    
    return combined_df


def encode_labels(df):
    """Encode labels as 0 (legitimate) and 1 (phishing)."""
    # Normalize label values
    if "label" in df.columns:
        df["label"] = df["label"].astype(str).str.lower().str.strip()
    else:
        raise ValueError("No 'label' column found in data")

    label_mapping = {
        "phishing": 1, "legitimate": 0, "non-phishing": 0,
        "ham": 0, "spam": 1, "1": 1, "0": 0, "yes": 1, "no": 0,
        "true": 1, "false": 0, "malicious": 1, "benign": 0
    }

    df["label"] = df["label"].map(lambda x: label_mapping.get(str(x).lower(), -1))

    # Remove any rows with unmapped labels
    df = df[df["label"] != -1]

    logger.info(f"Label distribution:\n{df['label'].value_counts()}")
    
    return df


def extract_features_batch(df):
    """Extract the same 15 engineered metadata features used at inference."""
    logger.info("Extracting inference-aligned metadata features from raw URL data...")
    features_list = []

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Extracting features"):
        url = row.get("url", None) if pd.notna(row.get("url")) else None
        sender = row.get("sender", None) if pd.notna(row.get("sender")) else None
        timestamp = row.get("timestamp", None) if pd.notna(row.get("timestamp")) else None

        features = extract_metadata_features(url=url, sender=sender, timestamp=timestamp)
        features_list.append(features)

    features_df = pd.DataFrame(features_list)
    features_df = features_df[METADATA_FEATURES]
    return features_df.values


def train_epoch(model, dataloader, optimizer, criterion):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    
    for batch in tqdm(dataloader, desc="Training"):
        optimizer.zero_grad()
        
        features = batch["features"].to(DEVICE, non_blocking=PIN_MEMORY)
        labels = batch["labels"].to(DEVICE, non_blocking=PIN_MEMORY)
        
        logits = model(features)
        loss = criterion(logits, labels)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    avg_loss = total_loss / len(dataloader)
    return avg_loss


def validate(model, dataloader, criterion):
    """Validate model and compute metrics."""
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0.0
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Validating"):
            features = batch["features"].to(DEVICE, non_blocking=PIN_MEMORY)
            labels = batch["labels"].to(DEVICE, non_blocking=PIN_MEMORY)
            
            logits = model(features)
            loss = criterion(logits, labels)
            predictions = torch.argmax(logits, dim=1)
            
            all_preds.extend(predictions.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            total_loss += loss.item()
    
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    
    accuracy = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, zero_division=0)
    recall = recall_score(all_labels, all_preds, zero_division=0)
    f1 = f1_score(all_labels, all_preds, zero_division=0)
    
    return {
        "loss": total_loss / len(dataloader) if len(dataloader) > 0 else 0.0,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "predictions": all_preds,
        "labels": all_labels
    }


class EarlyStopping:
    """Stop training when the monitored validation metric stops improving."""

    def __init__(self, patience=3, min_delta=0.0, mode="min"):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.best_metric = float("inf") if mode == "min" else float("-inf")
        self.best_epoch = 0
        self.best_state_dict = None
        self.epochs_without_improvement = 0
        self.should_stop = False

    def __call__(self, metric_value, epoch, model):
        if self.mode == "min":
            improved = metric_value < (self.best_metric - self.min_delta)
        else:
            improved = metric_value > (self.best_metric + self.min_delta)

        if improved:
            self.best_metric = metric_value
            self.best_epoch = epoch
            self.best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            self.epochs_without_improvement = 0
            return True

        self.epochs_without_improvement += 1
        if self.epochs_without_improvement >= self.patience:
            self.should_stop = True
        return False

    def restore_best_weights(self, model):
        if self.best_state_dict is not None:
            model.load_state_dict(self.best_state_dict)
            logger.info(f"Restored best weights from epoch {self.best_epoch} (metric: {self.best_metric:.4f})")


def sanity_check_metadata_model():
    """Verify trained metadata model can be loaded and makes predictions."""
    logger.info("Running sanity checks...")

    try:
        # Check model file exists
        if not os.path.exists(SAVE_MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {SAVE_MODEL_PATH}")
        logger.info(f"✓ Model file exists: {SAVE_MODEL_PATH}")

        # Check scaler file exists
        if not os.path.exists(SAVE_SCALER_PATH):
            raise FileNotFoundError(f"Scaler file not found at {SAVE_SCALER_PATH}")
        logger.info(f"✓ Scaler file exists: {SAVE_SCALER_PATH}")

        # Load scaler
        with open(SAVE_SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        logger.info("✓ Scaler loaded successfully")

        # Load model
        test_model = MetadataFFNN(INPUT_DIM, HIDDEN_DIMS, OUTPUT_DIM, DROPOUT).to(DEVICE)
        test_model.load_state_dict(torch.load(SAVE_MODEL_PATH, map_location=DEVICE))
        test_model.eval()
        logger.info("✓ Model loaded successfully")

        # Test single sample prediction
        test_features = np.random.randn(1, INPUT_DIM).astype(np.float32)
        test_features_normalized = scaler.transform(test_features)

        with torch.no_grad():
            features_tensor = torch.tensor(test_features_normalized, dtype=torch.float32).to(DEVICE)
            logits = test_model(features_tensor)
            prediction = torch.argmax(logits, dim=1).item()
            confidence = torch.softmax(logits, dim=1).max().item()

        label_name = "Phishing" if prediction == 1 else "Legitimate"
        logger.info(f"✓ Sample prediction successful (random test features)")
        logger.info(f"  Predicted: {label_name} (confidence: {confidence:.2%})")

        logger.info("✓ All sanity checks passed!")
        return True

    except Exception as e:
        logger.error(f"✗ Sanity check failed: {e}")
        return False


def main():
    logger.info("=" * 70)
    logger.info("Metadata-based Phishing Detection - FFNN Training")
    logger.info("=" * 70)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"CUDA Available: {torch.cuda.is_available()}")
    logger.info(f"Model Architecture: {INPUT_DIM} -> {' -> '.join(map(str, HIDDEN_DIMS))} -> {OUTPUT_DIM}")
    logger.info(f"Hyperparameters: Epochs={EPOCHS}, Batch Size={BATCH_SIZE}, LR={LEARNING_RATE}")
    logger.info(f"Features: {len(METADATA_FEATURES)} metadata features")

    # Load data
    logger.info("Loading data from pipeline 3/")
    df = load_data_from_pipeline()

    # Encode labels
    logger.info("Encoding labels...")
    df = encode_labels(df)

    # Remove duplicates and null values
    df = df.dropna(subset=["label"])
    logger.info(f"Data after cleaning: {len(df)} records")

    # Extract metadata features
    logger.info("Extracting metadata features...")
    features = extract_features_batch(df)
    labels = df["label"].values

    logger.info(f"Features shape: {features.shape}")
    actual_input_dim = features.shape[1]
    
    # Update INPUT_DIM if it doesn't match
    if actual_input_dim != INPUT_DIM:
        logger.warning(f"Feature dimension mismatch: config={INPUT_DIM}, actual={actual_input_dim}")
        logger.info(f"Using actual feature dimension: {actual_input_dim}")
        ACTUAL_INPUT_DIM = actual_input_dim
    else:
        ACTUAL_INPUT_DIM = INPUT_DIM

    # Normalize features
    logger.info("Normalizing features using StandardScaler...")
    scaler = StandardScaler()
    features = scaler.fit_transform(features)
    logger.info(f"Scaler fitted on {features.shape[0]} samples")

    # Train/validation split
    logger.info("Creating train/validation split...")
    from sklearn.model_selection import train_test_split

    train_features, val_features, train_labels, val_labels = train_test_split(
        features, labels, test_size=VALIDATION_SPLIT, random_state=RANDOM_SEED, stratify=labels
    )

    logger.info(f"Training set: {len(train_features)} samples")
    logger.info(f"Validation set: {len(val_features)} samples")

    # Create datasets and dataloaders
    logger.info("Creating datasets and dataloaders...")
    train_dataset = MetadataDataset(train_features, train_labels)
    val_dataset = MetadataDataset(val_features, val_labels)

    train_dataloader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS,
        pin_memory=PIN_MEMORY,
        persistent_workers=NUM_WORKERS > 0
    )
    val_dataloader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=PIN_MEMORY,
        persistent_workers=NUM_WORKERS > 0
    )
    logger.info(
        f"DataLoader settings: num_workers={NUM_WORKERS}, "
        f"pin_memory={PIN_MEMORY}, persistent_workers={NUM_WORKERS > 0}"
    )

    # Initialize model with actual input dimension
    logger.info("Initializing FFNN model...")
    model = MetadataFFNN(ACTUAL_INPUT_DIM, HIDDEN_DIMS, OUTPUT_DIM, DROPOUT).to(DEVICE)
    logger.info(f"Metadata model moved to device: {DEVICE}")

    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    logger.info(f"Total parameters: {total_params:,}")

    # Training setup
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING)
    early_stopping = EarlyStopping(
        patience=EARLY_STOPPING_PATIENCE,
        min_delta=0.001,
        mode="max"
    )

    # Training loop
    logger.info(f"Training for {EPOCHS} epochs with batch size {BATCH_SIZE}")
    
    # Training history
    history = {
        "train_loss": [],
        "val_loss": [],
        "val_accuracy": [],
        "val_precision": [],
        "val_recall": [],
        "val_f1": []
    }
    
    for epoch in range(EPOCHS):
        logger.info(f"Epoch {epoch + 1}/{EPOCHS}")
        
        # Train
        train_loss = train_epoch(model, train_dataloader, optimizer, criterion)
        history["train_loss"].append(train_loss)
        logger.info(f"Epoch {epoch + 1} - Training Loss: {train_loss:.4f}")
        
        # Validate
        val_metrics = validate(model, val_dataloader, criterion)
        history["val_loss"].append(val_metrics['loss'])
        history["val_accuracy"].append(val_metrics['accuracy'])
        history["val_precision"].append(val_metrics['precision'])
        history["val_recall"].append(val_metrics['recall'])
        history["val_f1"].append(val_metrics['f1'])
        
        logger.info(f"Epoch {epoch + 1} - Val Loss: {val_metrics['loss']:.4f}, "
                   f"Accuracy: {val_metrics['accuracy']:.4f}, "
                   f"Precision: {val_metrics['precision']:.4f}, "
                   f"Recall: {val_metrics['recall']:.4f}, "
                   f"F1: {val_metrics['f1']:.4f}")

        if early_stopping(val_metrics['f1'], epoch + 1, model):
            torch.save(model.state_dict(), SAVE_MODEL_PATH)
            logger.info(f"Best metadata model updated at {SAVE_MODEL_PATH} (val_f1: {val_metrics['f1']:.4f})")
        else:
            logger.info(
                f"No validation-F1 improvement for "
                f"{early_stopping.epochs_without_improvement}/{early_stopping.patience} epochs"
            )

        # Save scaler (only once, same for all epochs)
        if epoch == 0:
            with open(SAVE_SCALER_PATH, 'wb') as f:
                pickle.dump(scaler, f)
            logger.info(f"Scaler saved to {SAVE_SCALER_PATH}")

        if early_stopping.should_stop:
            logger.info(f"Early stopping triggered after epoch {epoch + 1}")
            break

    torch.save(model.state_dict(), SAVE_MODEL_LAST_PATH)
    logger.info(f"Last metadata checkpoint saved to {SAVE_MODEL_LAST_PATH}")

    early_stopping.restore_best_weights(model)
    torch.save(model.state_dict(), SAVE_MODEL_PATH)

    best_val_metrics = validate(model, val_dataloader, criterion)

    # Final validation metrics
    logger.info("FINAL EVALUATION RESULTS")
    logger.info(f"Best Epoch: {early_stopping.best_epoch}/{EPOCHS}")
    logger.info(f"Validation Metrics - Loss: {best_val_metrics['loss']:.4f}, "
               f"Accuracy: {best_val_metrics['accuracy']:.4f}, "
               f"Precision: {best_val_metrics['precision']:.4f}, "
               f"Recall: {best_val_metrics['recall']:.4f}, "
               f"F1-Score: {best_val_metrics['f1']:.4f}")

    cm = confusion_matrix(best_val_metrics['labels'], best_val_metrics['predictions'])
    logger.info(f"Confusion Matrix - TN: {cm[0, 0]}, FP: {cm[0, 1]}, FN: {cm[1, 0]}, TP: {cm[1, 1]}")
    
    # Training summary
    logger.info(f"Training Summary - Final Loss: {history['train_loss'][-1]:.4f}, "
               f"Min Loss: {min(history['train_loss']):.4f} (Epoch {history['train_loss'].index(min(history['train_loss'])) + 1}), "
               f"Max F1: {max(history['val_f1']):.4f} (Epoch {history['val_f1'].index(max(history['val_f1'])) + 1})")
    
    logger.info(f"Final Results - Accuracy: {best_val_metrics['accuracy']:.4f}, "
               f"Precision: {best_val_metrics['precision']:.4f}, "
               f"Recall: {best_val_metrics['recall']:.4f}, "
               f"F1: {best_val_metrics['f1']:.4f}")

    with open(SAVE_METRICS_PATH, 'w', encoding='utf-8') as f:
        json.dump(
            {
                "best_epoch": early_stopping.best_epoch,
                "epochs_trained": epoch + 1,
                "selection_metric": "f1",
                "best_validation_metrics": {
                    "loss": best_val_metrics["loss"],
                    "accuracy": best_val_metrics["accuracy"],
                    "precision": best_val_metrics["precision"],
                    "recall": best_val_metrics["recall"],
                    "f1": best_val_metrics["f1"],
                },
                "confusion_matrix": {
                    "tn": int(cm[0, 0]),
                    "fp": int(cm[0, 1]),
                    "fn": int(cm[1, 0]),
                    "tp": int(cm[1, 1]),
                },
            },
            f,
            indent=2
        )
    logger.info(f"Training metrics saved to {SAVE_METRICS_PATH}")
    
    # Run sanity checks
    if not sanity_check_metadata_model():
        logger.error("Training completed but sanity checks failed!")
        sys.exit(1)
    
    logger.info("Training completed successfully!")


if __name__ == "__main__":
    main()
