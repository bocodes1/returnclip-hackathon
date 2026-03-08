"""
Quick test: run trained model against all raw sofa images and report accuracy.
"""

import sys
import json
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import torch
from inference import load_latest_model

def test_all_images():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    classifier = load_latest_model(device=device)

    raw_dir = Path(__file__).parent / "data" / "raw"
    classes = ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]

    results = {c: {"correct": 0, "total": 0, "wrong_as": {}} for c in classes}

    for true_class in classes:
        folder = raw_dir / true_class
        images = (
            list(folder.glob("*.jpg")) +
            list(folder.glob("*.jpeg")) +
            list(folder.glob("*.webp")) +
            list(folder.glob("*.png")) +
            list(folder.glob("*.jpg.webp"))
        )
        # Deduplicate by name
        seen = set()
        unique_images = []
        for img in images:
            if img.name not in seen:
                seen.add(img.name)
                unique_images.append(img)

        print(f"\n--- {true_class} ({len(unique_images)} images) ---")
        for img_path in sorted(unique_images):
            result = classifier.predict(img_path)
            if "error" in result:
                print(f"  ERROR {img_path.name}: {result['error']}")
                continue

            assessment = result["sofa_condition_assessment"]
            predicted = assessment["primary_verdict"]["condition_class"]
            confidence = assessment["primary_verdict"]["confidence"]

            results[true_class]["total"] += 1
            if predicted == true_class:
                results[true_class]["correct"] += 1
            else:
                results[true_class]["wrong_as"][predicted] = results[true_class]["wrong_as"].get(predicted, 0) + 1

            status = "OK   " if predicted == true_class else "WRONG"
            print(f"  [{status}] {img_path.name[:55]:<55} pred={predicted} ({confidence:.1%})")

    print("\n" + "="*65)
    print("SUMMARY")
    print("="*65)
    total_correct = 0
    total_images = 0
    for cls in classes:
        r = results[cls]
        acc = r["correct"] / r["total"] if r["total"] else 0
        wrong_str = f"  misclassified as: {r['wrong_as']}" if r["wrong_as"] else ""
        print(f"  {cls:<15}: {r['correct']}/{r['total']} ({acc:.1%}){wrong_str}")
        total_correct += r["correct"]
        total_images += r["total"]

    overall = total_correct / total_images if total_images else 0
    print(f"\n  OVERALL: {total_correct}/{total_images} = {overall:.1%}")


if __name__ == "__main__":
    test_all_images()
