"""
Configuration and hyperparameters for ReturnClip sofa condition classification.
"""

import os
from pathlib import Path

# Project structure
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
LOGS_DIR = PROJECT_ROOT / "logs"

# Ensure directories exist
for d in [MODELS_DIR, LOGS_DIR]:
    d.mkdir(exist_ok=True)

# Dataset configuration
CLASSES = ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}
IDX_TO_CLASS = {i: c for i, c in enumerate(CLASSES)}

# Train/Val/Test split ratios
TRAIN_SPLIT = 0.70
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15

# OPTIMIZED FOR GPU: 150-image dataset (50 per class)
# Collection target: ~4-5 hours (50 CLEAN + 50 LIGHT + 50 HEAVY)
# Training time: ~5-8 minutes on NVIDIA GPU

# Image processing
IMG_SIZE = 224  # For MobileNetV2
IMG_CHANNELS = 3
MEAN = [0.485, 0.456, 0.406]  # ImageNet normalization
STD = [0.229, 0.224, 0.225]

# Model training
BATCH_SIZE = 32
NUM_EPOCHS = 30              # GPU is fast, keep high epochs for accuracy
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
EARLY_STOPPING_PATIENCE = 5
USE_GPU = True               # Auto-detect NVIDIA GPU

# Data augmentation
AUGMENTATION_CONFIG = {
    "brightness": 0.2,
    "contrast": 0.15,
    "saturation": 0.15,
    "hflip": 0.5,
    "rotation": 8,
    "zoom_min": 0.85,
    "zoom_max": 1.0,
}

# Google Vision API (optional)
GOOGLE_VISION_ENABLED = False
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

# Return policy mapping
RETURN_POLICY = {
    "CLEAN": {
        "recommendation": "FULL_REFUND",
        "refund_percent": 100,
        "message": "Item meets return standards. Full refund approved.",
    },
    "LIGHT_DAMAGE": {
        "recommendation": "PARTIAL_REFUND",
        "refund_percent": 65,
        "message": "Item has minor damage. Partial refund offered.",
    },
    "HEAVY_DAMAGE": {
        "recommendation": "REJECT_RETURN",
        "refund_percent": 0,
        "message": "Item damage exceeds return policy. Return rejected.",
    },
}

# Confidence thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.85
LOW_CONFIDENCE_THRESHOLD = 0.65
REQUIRES_HUMAN_REVIEW_THRESHOLD = 0.65  # Anything below this flags for review
NON_SOFA_THRESHOLD = 0.35  # Reject as non-sofa if max confidence below this

# Damage types for tagging
DAMAGE_TYPES = [
    "tears",
    "stains",
    "scratches",
    "sagging",
    "frame",
    "missing",
    "seams",
    "pet",
    "water",
    "wear",
]

# Severity levels per damage type
SEVERITY_LEVELS = ["LIGHT", "MODERATE", "SEVERE"]

# Annotation CSV columns
ANNOTATION_COLUMNS = [
    "image_filename",
    "condition_class",
    "damage_types",
    "severity_of_primary_damage",
    "affected_region",
    "confidence_of_label",
    "source",
    "date_labeled",
    "ambiguous_flag",
    "notes",
]

# Source types
SOURCE_TYPES = ["shopify", "marketplace", "manual", "synthetic"]

# Logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = "INFO"
