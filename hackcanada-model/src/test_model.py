"""
Test the sofa classifier against real test images.
"""

import json
import logging
from pathlib import Path
from collections import defaultdict
import torch

from inference import load_latest_model
from config import MODELS_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_on_real_data():
    """Test model on ONLY the held-out test set (avoiding data leakage)."""
    from sklearn.model_selection import train_test_split
    import pandas as pd
    from config import CLASS_TO_IDX

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    try:
        classifier = load_latest_model(MODELS_DIR, device=device)
    except FileNotFoundError:
        print("❌ Model not found. Train a model first with: python train.py")
        return

    # Load CSV and perform SAME split as training
    csv_path = Path(__file__).parent.parent / "data" / "sofa_returns_dataset.csv"
    df = pd.read_csv(csv_path)

    raw_dir = csv_path.parent / "raw"
    image_paths = []
    labels = []
    filenames = []

    for _, row in df.iterrows():
        cls = row["condition_class"]
        img_filename = row["image_filename"]
        img_path = raw_dir / cls / img_filename
        if img_path.exists():
            image_paths.append(img_path)
            labels.append(CLASS_TO_IDX[cls])
            filenames.append(img_filename)

    # Perform stratified splits (SAME as train.py)
    X_train, X_temp, y_train, y_temp, f_train, f_temp = train_test_split(
        image_paths, labels, filenames, test_size=0.30, random_state=42, stratify=labels
    )
    X_val, X_test, y_val, y_test, f_val, f_test = train_test_split(
        X_temp, y_temp, f_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    logger.info(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    logger.info(f"\n🧪 Testing on HELD-OUT TEST SET ({len(X_test)} images, never seen during training)\n")

    results_by_class = defaultdict(list)
    summary = defaultdict(lambda: {"correct": 0, "total": 0})

    # Test only on test set
    for img_path, true_label, filename in zip(X_test, y_test, f_test):
        class_name = next(k for k, v in CLASS_TO_IDX.items() if v == true_label)

        result = classifier.predict(img_path)

        # Check prediction
        predicted = result.get("sofa_condition_assessment", {}).get("primary_verdict", {}).get("condition_class")
        confidence = result.get("sofa_condition_assessment", {}).get("primary_verdict", {}).get("confidence", 0)

        is_correct = (predicted == class_name)
        summary[class_name]["total"] += 1
        if is_correct:
            summary[class_name]["correct"] += 1

        status = "✓" if is_correct else "✗"
        results_by_class[class_name].append({
            "image": filename,
            "predicted": predicted,
            "confidence": confidence,
            "correct": is_correct
        })

        print(f"{status} {filename}: {predicted} ({confidence:.2f})")

    # Summary
    print("\n" + "="*60)
    print("TEST SET ACCURACY (No Data Leakage)")
    print("="*60)

    total_correct = 0
    total_tested = 0

    for class_name in ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]:
        if class_name in summary:
            correct = summary[class_name]["correct"]
            total = summary[class_name]["total"]
            accuracy = (correct / total * 100) if total > 0 else 0
            total_correct += correct
            total_tested += total
            print(f"{class_name:15} {correct:2}/{total:2} ({accuracy:5.1f}%)")

    if total_tested > 0:
        overall = (total_correct / total_tested * 100)
        print(f"\n{'OVERALL':15} {total_correct:2}/{total_tested:2} ({overall:5.1f}%)")

    print("\n✓ This is REAL test accuracy - images never used in training!")
    print("✓ This is what matters for evaluating model performance.")

    # Save results
    output_file = Path(__file__).parent.parent / "test_results.json"
    with open(output_file, "w") as f:
        json.dump(results_by_class, f, indent=2)

    print(f"\n✓ Results saved to {output_file}")


if __name__ == "__main__":
    test_on_real_data()
