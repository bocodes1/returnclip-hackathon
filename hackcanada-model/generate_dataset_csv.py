"""Generate dataset CSV from image folder structure."""
from pathlib import Path
import pandas as pd

# Define paths
RAW_DATA_DIR = Path("data/raw")
CSV_PATH = Path("data/sofa_returns_dataset.csv")

# Class mapping
CLASSES = ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]

# Collect all images
rows = []
for class_name in CLASSES:
    class_dir = RAW_DATA_DIR / class_name
    if class_dir.exists():
        for img_file in class_dir.glob("*"):
            if img_file.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
                rows.append({
                    "image_filename": img_file.name,  # Just the filename
                    "condition_class": class_name,
                    "damage_types": "",
                    "severity": "unknown",
                    "affected_region": "",
                    "confidence_of_label": 100
                })

# Create DataFrame
df = pd.DataFrame(rows)
print(f"Found {len(df)} images")
print(f"CLEAN: {len(df[df['condition_class'] == 'CLEAN'])}")
print(f"LIGHT_DAMAGE: {len(df[df['condition_class'] == 'LIGHT_DAMAGE'])}")
print(f"HEAVY_DAMAGE: {len(df[df['condition_class'] == 'HEAVY_DAMAGE'])}")

# Save CSV
df.to_csv(CSV_PATH, index=False)
print(f"\n✅ CSV saved to {CSV_PATH}")

