"""
Quick setup script to initialize the project environment
"""

import os
import sys
from pathlib import Path

def setup_project():
    """Initialize project structure and check dependencies."""
    
    project_root = Path(__file__).parent
    
    print("🚀 ReturnClip Project Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        sys.exit(1)
    
    print(f"✓ Python {sys.version.split()[0]}")
    
    # Create necessary directories
    dirs_to_create = [
        project_root / "data" / "raw" / "CLEAN",
        project_root / "data" / "raw" / "LIGHT_DAMAGE",
        project_root / "data" / "raw" / "HEAVY_DAMAGE",
        project_root / "data" / "processed" / "train",
        project_root / "data" / "processed" / "val",
        project_root / "data" / "processed" / "test",
        project_root / "models",
        project_root / "logs",
    ]
    
    for dir_path in dirs_to_create:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    print(f"✓ Created directory structure")
    
    # Check for key files
    required_files = [
        project_root / "src" / "config.py",
        project_root / "src" / "utils.py",
        project_root / "src" / "train.py",
        project_root / "src" / "inference.py",
        project_root / "src" / "app.py",
        project_root / "templates" / "index.html",
        project_root / "requirements.txt",
    ]
    
    missing_files = [f for f in required_files if not f.exists()]
    
    if missing_files:
        print("⚠️  Missing files:")
        for f in missing_files:
            print(f"   - {f.relative_to(project_root)}")
    else:
        print("✓ All core files present")
    
    # Check for dataset
    dataset_csv = project_root / "data" / "sofa_returns_dataset.csv"
    if dataset_csv.exists():
        print("✓ Dataset CSV template found")
    else:
        print("⚠️  No dataset CSV - create after annotation")
    
    print("\n" + "=" * 50)
    print("📋 Next Steps:")
    print("=" * 50)
    print("""
1. Install dependencies:
   pip install -r requirements.txt

2. Prepare dataset (300 images):
   - Place clean sofas in: data/raw/CLEAN/
   - Place light damage in: data/raw/LIGHT_DAMAGE/
   - Place heavy damage in: data/raw/HEAVY_DAMAGE/
   - Fill: data/sofa_returns_dataset.csv

3. Train model:
   cd src
   python train.py

4. Run demo:
   python app.py
   Visit: http://localhost:5001

📚 Read:
   - README.md (full docs)
   - ANNOTATION_GUIDE.md (labeling instructions)
   - 24HOUR_PLAN.md (quick execution guide)
""")

if __name__ == "__main__":
    setup_project()
