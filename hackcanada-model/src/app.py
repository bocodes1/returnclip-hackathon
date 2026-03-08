"""
Flask web application for ReturnClip sofa condition assessment demo.
"""

import json
import logging
from pathlib import Path
from werkzeug.utils import secure_filename
import torch
from flask import Flask, render_template, request, jsonify
import os

# Add src to path
import sys
sys.path.insert(0, str(Path(__file__).parent / "src"))

from inference import load_latest_model, SofaClassifier
from config import MODELS_DIR

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max file size
app.config["UPLOAD_FOLDER"] = Path(app.instance_path) / "uploads"
app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model (global)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

try:
    classifier = load_latest_model(MODELS_DIR, device=device)
    MODEL_LOADED = True
    logger.info("Model loaded successfully")
except FileNotFoundError as e:
    MODEL_LOADED = False
    logger.warning(f"Model not found: {e}")
    classifier = None


# Fixed test cases for demo (pre-loaded results)
DEMO_RESULTS = {
    "clean_sofa": {
        "sofa_condition_assessment": {
            "image_id": "demo_clean.jpg",
            "primary_verdict": {
                "condition_class": "CLEAN",
                "confidence": 0.96,
                "recommendation": "FULL_REFUND",
            },
            "damage_analysis": {
                "damage_types_detected": [],
                "damage_descriptions": [],
            },
            "return_eligibility": {
                "returnable": True,
                "refund_recommendation": "FULL_REFUND",
                "estimated_refund_percent": 100,
                "reason": "Item meets return standards. Full refund approved.",
            },
            "confidence_and_flags": {
                "overall_confidence": 0.96,
                "requires_human_review": False,
                "review_reason": "",
            },
        }
    },
    "light_damage_sofa": {
        "sofa_condition_assessment": {
            "image_id": "demo_light_damage.jpg",
            "primary_verdict": {
                "condition_class": "LIGHT_DAMAGE",
                "confidence": 0.87,
                "recommendation": "PARTIAL_REFUND",
            },
            "damage_analysis": {
                "damage_types_detected": ["stains", "light_wear"],
                "damage_descriptions": [
                    {
                        "type": "stains",
                        "severity": "MODERATE",
                        "affected_region": "front_cushion",
                    },
                    {
                        "type": "light_wear",
                        "severity": "LIGHT",
                        "affected_region": "armrest",
                    },
                ],
            },
            "return_eligibility": {
                "returnable": True,
                "refund_recommendation": "PARTIAL_REFUND",
                "estimated_refund_percent": 65,
                "reason": "Item has minor damage. Partial refund offered.",
            },
            "confidence_and_flags": {
                "overall_confidence": 0.87,
                "requires_human_review": False,
                "review_reason": "",
            },
        }
    },
    "heavy_damage_sofa": {
        "sofa_condition_assessment": {
            "image_id": "demo_heavy_damage.jpg",
            "primary_verdict": {
                "condition_class": "HEAVY_DAMAGE",
                "confidence": 0.94,
                "recommendation": "REJECT_RETURN",
            },
            "damage_analysis": {
                "damage_types_detected": ["stains", "tears", "water_damage"],
                "damage_descriptions": [
                    {
                        "type": "tears",
                        "severity": "SEVERE",
                        "affected_region": "back_cushion",
                    },
                    {
                        "type": "stains",
                        "severity": "SEVERE",
                        "affected_region": "multiple",
                    },
                    {
                        "type": "water_damage",
                        "severity": "MODERATE",
                        "affected_region": "base",
                    },
                ],
            },
            "return_eligibility": {
                "returnable": False,
                "refund_recommendation": "REJECT_RETURN",
                "estimated_refund_percent": 0,
                "reason": "Item damage exceeds return policy. Return rejected.",
            },
            "confidence_and_flags": {
                "overall_confidence": 0.94,
                "requires_human_review": False,
                "review_reason": "",
            },
        }
    },
    "not_a_sofa": {
        "sofa_condition_assessment": {
            "image_id": "demo_not_sofa.jpg",
            "primary_verdict": {
                "condition_class": "NOT_A_SOFA",
                "confidence": 0.38,
                "recommendation": "UNABLE_TO_ASSESS",
            },
            "error": "Image does not appear to contain a sofa. Please upload a sofa image.",
            "class_probabilities": {
                "CLEAN": 0.25,
                "LIGHT_DAMAGE": 0.22,
                "HEAVY_DAMAGE": 0.38,
            },
        }
    },
}


@app.route("/")
def index():
    """Main demo page."""
    return render_template(
        "index.html",
        model_loaded=MODEL_LOADED,
        device=str(device),
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "ok",
            "model_loaded": MODEL_LOADED,
            "device": str(device),
        }
    )


@app.route("/api/classify", methods=["POST"])
def classify():
    """Classify uploaded sofa image."""
    if not request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not MODEL_LOADED:
        return (
            jsonify(
                {
                    "error": "Model not loaded. Use demo mode or train a model first."
                }
            ),
            500,
        )

    try:
        # Save temporary file
        filename = secure_filename(file.filename)
        filepath = app.config["UPLOAD_FOLDER"] / filename
        file.save(filepath)

        # Classify
        result = classifier.predict(filepath)

        # Clean up
        filepath.unlink()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Classification error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/demo/<case>", methods=["GET"])
def demo(case):
    """Get pre-loaded demo result."""
    if case not in DEMO_RESULTS:
        return jsonify({"error": "Unknown demo case"}), 404

    return jsonify(DEMO_RESULTS[case])


@app.route("/api/demo-cases", methods=["GET"])
def demo_cases():
    """List available demo cases."""
    return jsonify(
        {
            "cases": list(DEMO_RESULTS.keys()),
            "descriptions": {
                "clean_sofa": "Perfect condition sofa (expect full refund)",
                "light_damage_sofa": "Minor stains and wear (expect partial refund)",
                "heavy_damage_sofa": "Severe damage (expect return rejection)",
                "not_a_sofa": "Non-sofa image (rejected - not a sofa)",
            },
        }
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
