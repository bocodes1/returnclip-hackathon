"""
Inference script for sofa condition classification.
Load a trained model and make predictions on new images.
"""

import logging
from pathlib import Path
import torch
from torchvision import models
import torch.nn as nn
from PIL import Image

from config import (
    IMG_SIZE,
    CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    MODELS_DIR,
    NON_SOFA_THRESHOLD,
)
from utils import SofaImageTransforms, ReturnPolicyEngine, ImageLoader

logger = logging.getLogger(__name__)


class SofaClassifier:
    """Inference wrapper for sofa condition classification."""

    def __init__(self, model_path: Path, device="cpu"):
        """
        Initialize classifier with trained model.

        Args:
            model_path: Path to saved model .pth file
            device: torch device ("cpu" or "cuda")
        """
        self.device = device
        self.model = self._load_model(model_path)
        self.transforms = SofaImageTransforms.get_inference_transforms()
        logger.info(f"Classifier initialized with model: {model_path}")

    def _load_model(self, model_path):
        """Load trained MobileNetV2 model."""
        model = models.mobilenet_v2(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(CLASSES)),
        )

        state_dict = torch.load(model_path, map_location=self.device)
        model.load_state_dict(state_dict)
        model = model.to(self.device)
        model.eval()
        return model

    def predict(self, image_path: Path):
        """
        Predict condition class for a single image.

        Args:
            image_path: Path to sofa image

        Returns:
            dict with prediction, confidence, and business recommendation
        """
        try:
            # Load and preprocess image
            image = ImageLoader.load_image(image_path)
            image_tensor = self.transforms(image).unsqueeze(0).to(self.device)

            # Get prediction
            with torch.no_grad():
                logits = self.model(image_tensor)
                probabilities = torch.softmax(logits, dim=1)[0]
                predicted_idx = torch.argmax(probabilities, dim=0).item()
                confidence = probabilities[predicted_idx].item()

            # Check if confidence is too low (likely not a sofa)
            if confidence < NON_SOFA_THRESHOLD:
                return {
                    "sofa_condition_assessment": {
                        "image_id": image_path.name,
                        "primary_verdict": {
                            "condition_class": "NOT_A_SOFA",
                            "confidence": confidence,
                            "recommendation": "UNABLE_TO_ASSESS",
                        },
                        "error": "Image does not appear to contain a sofa. Please upload a sofa image.",
                        "class_probabilities": {
                            IDX_TO_CLASS[i]: probabilities[i].item()
                            for i in range(len(CLASSES))
                        },
                    }
                }

            condition_class = IDX_TO_CLASS[predicted_idx]

            # Get class probabilities for all classes
            class_probs = {
                IDX_TO_CLASS[i]: probabilities[i].item()
                for i in range(len(CLASSES))
            }

            # Get return recommendation
            recommendation = ReturnPolicyEngine.get_recommendation(
                condition_class, confidence
            )

            # Infer damage types based on class (simple heuristic)
            damage_types = self._infer_damage_types(condition_class)

            # Generate full output
            output = ReturnPolicyEngine.generate_output_json(
                condition_class=condition_class,
                confidence=confidence,
                damage_types=damage_types,
                image_id=image_path.name,
            )

            # Add class probabilities
            output["sofa_condition_assessment"]["class_probabilities"] = class_probs
            output["sofa_condition_assessment"]["primary_verdict"].update(
                recommendation
            )

            return output

        except Exception as e:
            logger.error(f"Error predicting on {image_path}: {e}")
            return {
                "error": str(e),
                "image_id": image_path.name,
            }

    def predict_batch(self, image_paths):
        """Predict on multiple images."""
        results = []
        for img_path in image_paths:
            result = self.predict(img_path)
            results.append(result)
        return results

    @staticmethod
    def _infer_damage_types(condition_class: str):
        """Simple heuristic to infer which damage types to highlight."""
        if condition_class == "CLEAN":
            return []
        elif condition_class == "LIGHT_DAMAGE":
            return ["stains", "light_wear"]
        else:  # HEAVY_DAMAGE
            return ["stains", "tears", "water_damage"]


def load_latest_model(models_dir: Path = MODELS_DIR, device="cpu"):
    """Load the most recent model from models directory."""
    models_list = sorted(models_dir.glob("best_model_*.pth"))
    if not models_list:
        raise FileNotFoundError(f"No models found in {models_dir}")

    latest_model = models_list[-1]
    return SofaClassifier(latest_model, device=device)


if __name__ == "__main__":
    import json

    # Initialize logging
    logging.basicConfig(level=logging.INFO)

    # Example usage
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    try:
        classifier = load_latest_model(device=device)

        # Test on a sample image (if exists)
        test_image = Path("../../data/processed/test").glob("*.jpg")
        test_image_list = list(test_image)

        if test_image_list:
            result = classifier.predict(test_image_list[0])
            print(json.dumps(result, indent=2))
        else:
            print("No test images found. Add images to data/processed/test/")

    except FileNotFoundError as e:
        print(f"Model not found: {e}")
        print("Please train a model first using train.py")
