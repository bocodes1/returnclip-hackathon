"""
Utility functions for data loading, preprocessing, and return policy logic.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from config import (
    IMG_SIZE,
    MEAN,
    STD,
    AUGMENTATION_CONFIG,
    RETURN_POLICY,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    REQUIRES_HUMAN_REVIEW_THRESHOLD,
    DAMAGE_TYPES,
)


class SofaImageTransforms:
    """Image transformations for sofa condition classification."""

    @staticmethod
    def get_train_transforms():
        """Augmented transforms for training."""
        return transforms.Compose(
            [
                transforms.RandomHorizontalFlip(AUGMENTATION_CONFIG["hflip"]),
                transforms.RandomRotation(AUGMENTATION_CONFIG["rotation"]),
                transforms.ColorJitter(
                    brightness=AUGMENTATION_CONFIG["brightness"],
                    contrast=AUGMENTATION_CONFIG["contrast"],
                    saturation=AUGMENTATION_CONFIG["saturation"],
                ),
                transforms.RandomResizedCrop(
                    IMG_SIZE,
                    scale=(
                        AUGMENTATION_CONFIG["zoom_min"],
                        AUGMENTATION_CONFIG["zoom_max"],
                    ),
                    interpolation=Image.BILINEAR,
                ),
                transforms.ToTensor(),
                transforms.Normalize(mean=MEAN, std=STD),
            ]
        )

    @staticmethod
    def get_val_transforms():
        """Standard transforms for validation/test (no augmentation)."""
        return transforms.Compose(
            [
                transforms.Resize((IMG_SIZE, IMG_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(mean=MEAN, std=STD),
            ]
        )

    @staticmethod
    def get_inference_transforms():
        """Transforms for inference (same as val)."""
        return SofaImageTransforms.get_val_transforms()


class ImageLoader:
    """Load and validate sofa images."""

    VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    @staticmethod
    def load_image(image_path: Path) -> Image.Image:
        """Load image from path. Resize if needed."""
        img = Image.open(image_path).convert("RGB")
        # Ensure minimum size
        if min(img.size) < 100:
            print(f"Warning: {image_path} is very small ({img.size})")
        return img

    @staticmethod
    def get_image_metadata(image_path: Path) -> Dict:
        """Extract metadata from filename."""
        # Expected format:
        # [CONDITION]_[SOURCE]_[DATE]_[DAMAGE_TYPE]_[INDEX].jpg
        parts = image_path.stem.split("_")
        try:
            return {
                "filename": image_path.name,
                "condition": parts[0],
                "source": parts[1],
                "date": parts[2],
                "damage_type": parts[3],
                "index": parts[4],
            }
        except (IndexError, ValueError):
            return {
                "filename": image_path.name,
                "condition": "UNKNOWN",
                "source": "UNKNOWN",
            }

    @staticmethod
    def is_valid_image(image_path: Path) -> bool:
        """Check if file is a valid image."""
        return (
            image_path.suffix.lower() in ImageLoader.VALID_EXTENSIONS
            and image_path.is_file()
        )


class ReturnPolicyEngine:
    """Map model predictions to business return outcomes."""

    @staticmethod
    def get_recommendation(
        condition_class: str, confidence: float
    ) -> Dict:
        """Get return recommendation based on condition and confidence."""

        # Check if requires human review
        requires_review = confidence < REQUIRES_HUMAN_REVIEW_THRESHOLD

        if requires_review:
            return {
                "condition_class": condition_class,
                "confidence": confidence,
                "recommendation": "ESCALATE_TO_HUMAN",
                "refund_percent": None,
                "message": "Assessment uncertain. Escalating to human specialist.",
                "requires_human_review": True,
                "review_reason": f"Low confidence ({confidence:.2f})",
            }

        # Get policy for condition
        policy = RETURN_POLICY.get(condition_class, RETURN_POLICY["LIGHT_DAMAGE"])

        return {
            "condition_class": condition_class,
            "confidence": confidence,
            "recommendation": policy["recommendation"],
            "refund_percent": policy["refund_percent"],
            "message": policy["message"],
            "requires_human_review": False,
            "review_reason": "",
        }

    @staticmethod
    def generate_output_json(
        condition_class: str,
        confidence: float,
        damage_types: List[str] = None,
        affected_regions: List[Dict] = None,
        image_id: str = "unknown",
    ) -> Dict:
        """Generate full JSON output for inference."""

        if damage_types is None:
            damage_types = []

        recommendation = ReturnPolicyEngine.get_recommendation(
            condition_class, confidence
        )

        # Alternative predictions (for transparency)
        alternatives = []
        for cls_name, cls_conf in [
            (c, confidence * (0.9 if c != condition_class else 1.0))
            for c in IDX_TO_CLASS.values()
        ]:
            if cls_name != condition_class:
                alternatives.append(
                    {
                        "condition_class": cls_name,
                        "confidence": max(0, min(1, cls_conf * 0.1)),
                        "reason": f"Alternative: {cls_name}",
                    }
                )

        return {
            "sofa_condition_assessment": {
                "image_id": image_id,
                "primary_verdict": {
                    "condition_class": condition_class,
                    "confidence": float(confidence),
                    "recommendation": recommendation["recommendation"],
                },
                "damage_analysis": {
                    "damage_types_detected": damage_types,
                    "damage_descriptions": [
                        {"type": dt, "severity": "UNKNOWN"} for dt in damage_types
                    ],
                },
                "return_eligibility": {
                    "returnable": recommendation["recommendation"]
                    != "REJECT_RETURN",
                    "refund_recommendation": recommendation["recommendation"],
                    "estimated_refund_percent": recommendation["refund_percent"],
                    "reason": recommendation["message"],
                },
                "confidence_and_flags": {
                    "overall_confidence": float(confidence),
                    "requires_human_review": recommendation[
                        "requires_human_review"
                    ],
                    "review_reason": recommendation["review_reason"],
                },
                "alternative_outcomes": alternatives,
            }
        }


class DatasetBuilder:
    """Build train/val/test splits from raw data."""

    @staticmethod
    def create_splits_from_csv(csv_path: Path) -> Tuple[List[Path], List[Path], List[Path]]:
        """
        Create train/val/test splits from annotation CSV.

        CSV should have columns:
        image_filename, condition_class, ...
        """
        import pandas as pd
        from sklearn.model_selection import train_test_split

        df = pd.read_csv(csv_path)

        # Stratified split by condition_class
        train, temp = train_test_split(
            df, test_size=0.30, random_state=42, stratify=df["condition_class"]
        )
        val, test = train_test_split(
            temp, test_size=0.50, random_state=42, stratify=temp["condition_class"]
        )

        return (
            train["image_filename"].tolist(),
            val["image_filename"].tolist(),
            test["image_filename"].tolist(),
        )

    @staticmethod
    def build_image_list_from_folders(raw_data_dir: Path) -> List[Tuple[Path, str]]:
        """
        Build list of (image_path, condition_class) from organized folders.

        Expected structure:
        raw_data_dir/
            CLEAN/
                *.jpg
            LIGHT_DAMAGE/
                *.jpg
            HEAVY_DAMAGE/
                *.jpg
        """
        images = []
        for condition_class in ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]:
            class_dir = raw_data_dir / condition_class
            if class_dir.exists():
                for img_path in class_dir.iterdir():
                    if ImageLoader.is_valid_image(img_path):
                        images.append((img_path, condition_class))
        return images


def create_annotation_csv_template(output_path: Path):
    """Create empty annotation CSV template."""
    import pandas as pd
    from config import ANNOTATION_COLUMNS

    df = pd.DataFrame(columns=ANNOTATION_COLUMNS)
    df.to_csv(output_path, index=False)
    print(f"Created annotation template at {output_path}")
