# ReturnClip: AI-Powered Sofa Return Condition Assessment

A hackathon-ready demo system for classifying sofa condition from customer images to automate return eligibility decisions.

## 🎯 Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Or (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Dataset

**Directory structure:**
```
data/
├── raw/
│   ├── CLEAN/           # ~100 images of pristine sofas
│   ├── LIGHT_DAMAGE/    # ~100 images of lightly damaged sofas
│   └── HEAVY_DAMAGE/    # ~100 images of heavily damaged sofas
└── sofa_returns_dataset.csv
```

**CSV format** (`data/sofa_returns_dataset.csv`):
```csv
image_filename,condition_class,damage_types,severity_of_primary_damage,affected_region,confidence_of_label,source,date_labeled,ambiguous_flag,notes
CLEAN_shopify_20250307_none_001.jpg,CLEAN,,NONE,N/A,0.98,shopify,20250307,FALSE,Professional product photo
LIGHT_DAMAGE_craigslist_20250306_stains_042.jpg,RETURNABLE_WITH_ISSUE,stains;wear,MODERATE,front_left_cushion,0.85,marketplace,20250306,FALSE,Small wine stain
HEAVY_DAMAGE_synthetic_20250307_tears_012.jpg,NOT_RETURNABLE,tears;stains;cushion_damage,SEVERE,multiple,0.91,synthetic,20250307,FALSE,Synthetic overlay
```

**Naming convention:**
```
[CONDITION]_[SOURCE]_[DATE]_[DAMAGE_TYPE]_[INDEX].jpg

Examples:
CLEAN_shopify_20250307_none_001.jpg
LIGHT_DAMAGE_craigslist_20250306_stains_042.jpg
HEAVY_DAMAGE_synthetic_20250307_tears_012.jpg
```

### 3. Train Model

```bash
cd src
python train.py
```

This will:
- Load images from `data/raw/`
- Create train/val/test splits (70/15/15)
- Fine-tune MobileNetV2
- Save best model to `models/best_model_*.pth`
- Show training progress and metrics

**Training time:**
- CPU: ~45-90 minutes
- GPU: ~10-15 minutes

### 4. Run Demo

```bash
cd src
python app.py
```

Then visit: **http://localhost:5001**

The demo includes:
- Image upload interface
- Pre-loaded test cases (Clean, Light Damage, Heavy Damage)
- Real-time condition classification
- Return recommendation with refund %
- Damage breakdown

## 📁 Project Structure

```
hackcanada-model/
├── data/
│   ├── raw/
│   │   ├── CLEAN/              # Clean sofa images
│   │   ├── LIGHT_DAMAGE/       # Lightly damaged images
│   │   └── HEAVY_DAMAGE/       # Heavily damaged images
│   ├── processed/
│   │   ├── train/              # Training split
│   │   ├── val/                # Validation split
│   │   └── test/               # Test split
│   └── sofa_returns_dataset.csv # Master annotation file
├── src/
│   ├── config.py               # Configuration & hyperparameters
│   ├── utils.py                # Image loading, preprocessing, policy logic
│   ├── train.py                # Training script with MobileNetV2
│   ├── inference.py            # Model inference wrapper
│   └── app.py                  # Flask web app for demo
├── models/
│   └── best_model_*.pth        # Saved trained models
├── templates/
│   └── index.html              # Web UI
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_train_model.ipynb
│   └── 03_evaluate.ipynb
├── tests/
│   └── test_inference.py
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🏷️ Label System

### Business Labels (for return decisions)
- **CLEAN**: No visible damage → Full refund (100%)
- **RETURNABLE_WITH_ISSUE**: Light/moderate damage → Partial refund (60-75%)
- **NOT_RETURNABLE**: Severe damage → Reject return (0%)

### Damage Types (for explainability)
- `tears` - Rips or holes in fabric
- `stains` - Discoloration or marks
- `scratches` - Surface marks on frame/legs
- `sagging` - Cushion deformation
- `frame` - Structural damage to frame/legs
- `missing` - Missing parts (pillows, legs, etc.)
- `seams` - Loose or splitting seams
- `pet` - Pet damage (claws, bites)
- `water` - Water damage or mold
- `wear` - General wear or pilling

### Severity Levels
- **LIGHT**: Single minor issues, easily repairable
- **MODERATE**: Localized damage affecting functionality
- **SEVERE**: Multiple or major issues affecting usability

## 🔧 Configuration

Edit `src/config.py` to customize:

```python
# Model training
BATCH_SIZE = 32
NUM_EPOCHS = 30
LEARNING_RATE = 1e-3

# Augmentation
AUGMENTATION_CONFIG = {
    "brightness": 0.2,
    "contrast": 0.15,
    "rotation": 8,
    "hflip": 0.5,
}

# Return policy
RETURN_POLICY = {
    "CLEAN": {"recommendation": "FULL_REFUND", "refund_percent": 100},
    "LIGHT_DAMAGE": {"recommendation": "PARTIAL_REFUND", "refund_percent": 65},
    "HEAVY_DAMAGE": {"recommendation": "REJECT_RETURN", "refund_percent": 0},
}

# Review thresholds
REQUIRES_HUMAN_REVIEW_THRESHOLD = 0.65  # Flag if confidence < 65%
```

## 📊 Model Output Schema

```json
{
  "sofa_condition_assessment": {
    "image_id": "user_photo_123.jpg",
    "primary_verdict": {
      "condition_class": "LIGHT_DAMAGE",
      "confidence": 0.87,
      "recommendation": "PARTIAL_REFUND"
    },
    "damage_analysis": {
      "damage_types_detected": ["stains", "wear"],
      "damage_descriptions": [
        {
          "type": "stains",
          "severity": "MODERATE",
          "affected_region": "front_cushion"
        }
      ]
    },
    "return_eligibility": {
      "returnable": true,
      "refund_recommendation": "PARTIAL_REFUND",
      "estimated_refund_percent": 65,
      "reason": "Minor staining and wear; does not affect structure"
    },
    "confidence_and_flags": {
      "overall_confidence": 0.87,
      "requires_human_review": false,
      "review_reason": ""
    }
  }
}
```

## 🎓 Training Details

### Model Architecture
- **Base**: MobileNetV2 (pre-trained on ImageNet)
- **Frozen layers**: First 12 feature blocks (transfer learning)
- **New classifier**:
  - Dropout (0.5)
  - Dense (512 units, ReLU)
  - Dropout (0.3)
  - Dense (3 units, softmax)

### Data Augmentation (training only)
- Horizontal flip (50%)
- Rotation (±8°)
- Brightness (±20%)
- Contrast (±15%)
- Saturation (±15%)
- Random crop/zoom (0.85–1.0x)

### Optimizer
- AdamW with weight decay
- Learning rate scheduler (ReduceLROnPlateau)
- Early stopping (5 epochs patience)

## 📈 Expected Performance

On a 300-image dataset (100 per class):

| Metric | Expected | Notes |
|--------|----------|-------|
| Training accuracy | 85-95% | High due to small dataset |
| Validation accuracy | 75-85% | More realistic |
| Test accuracy | 70-80% | Unseen data |
| Training time (CPU) | 45-90 min | Depends on hardware |
| Inference time | 100-500ms | Per image |

## 🚀 Demo Features

### Web Interface
- Upload sofa image (drag-drop or click)
- Pre-loaded demo test cases (3 scenarios)
- Real-time condition assessment
- Visual damage breakdown
- Return recommendation with explanation
- Confidence score
- Human review flag

### Demo Cases
1. **Clean Sofa** → 96% confidence, Full refund
2. **Light Damage** → 87% confidence, 65% refund
3. **Heavy Damage** → 94% confidence, Return rejected

## ⚠️ Edge Cases & Limitations

The model works best when:
- ✅ Sofa is well-lit
- ✅ Multiple angles visible
- ✅ Background is not cluttered
- ✅ Image resolution ≥ 500x500px

Known failure modes:
- ❌ Very dark photos (lighting needed)
- ❌ Extreme close-ups (context lost)
- ❌ Fabric pattern mistaken for damage
- ❌ Hidden damage not visible in camera
- ❌ Intentional misrepresentation (angle chosen to hide damage)

**Mitigation:**
- Add brightness/quality checks
- Flag low-confidence cases (<65%) for human review
- Request multiple angles if unsure
- Show "Ambiguous" message with expert review option

## 🎬 Quick Demo Plan (24 hours)

### Hour 0-4: Data Collection
- Download 100 clean sofas from Shopify/Wayfair/IKEA
- Download 100 light-damage from Craigslist/Marketplace
- Download 60 heavy-damage; synthesize if needed

### Hour 4-10: Annotation
- Label all 300 images with condition + damage types
- QA spot-check (20% of images)

### Hour 10-16: Training
- Install dependencies
- Run training script (45-90 min)
- Evaluate on test set

### Hour 16-20: Web Demo
- Set up Flask app
- Test upload endpoint
- Polish UI

### Hour 20-24: Polish
- Add demo test cases
- Practice pitch
- Debug edge cases

## 🔄 Iteration Path (3 days)

**Day 1:** Baseline (300 images, 75% accuracy)
**Day 2:** Expand data (400-500 images) + multi-angle support
**Day 3:** Add explainability + active learning feedback loop

## 📝 API Endpoints

### Classification
```
POST /api/classify
Content-Type: multipart/form-data

Body: image (file)
Returns: JSON assessment result
```

### Health Check
```
GET /api/health
Returns: {"status": "ok", "model_loaded": true, "device": "cuda"}
```

### Demo Cases
```
GET /api/demo/<case_id>
Cache_id: "clean_sofa", "light_damage_sofa", "heavy_damage_sofa"
Returns: Pre-computed assessment result
```

### List Demo Cases
```
GET /api/demo-cases
Returns: List of available demo scenarios
```

## 🛟 Troubleshooting

**Model not found error**
- Solution: Train model first with `python src/train.py`

**CUDA out of memory**
- Solution: Reduce BATCH_SIZE in config.py (try 16)

**Images not loading**
- Solution: Check image paths match naming convention
- Ensure images are in `data/raw/CLEAN/`, etc.

**Very low accuracy**
- Solution: Check for label consistency
- Ensure diverse lighting/angles in dataset
- Increase training epochs (EARLY_STOPPING_PATIENCE)

**Slow inference**
- Solution: Use GPU if available
- Reduce image resolution in config
- Batch multiple images

## 📚 References

- MobileNetV2: https://arxiv.org/abs/1801.04381
- PyTorch Transfer Learning: https://pytorch.org/tutorials/
- Fast.ai Best Practices: https://course.fast.ai/

## 💡 Next Steps

After hackathon:

1. **Multi-class expansion** → Add clothing, electronics, furniture types
2. **Active learning** → Collect user feedback to improve
3. **Explainability** → Highlight damage regions with attention maps
4. **Real-time scoring** → Add confidence trending over time
5. **A/B testing** → Compare ML vs human adjudicators
6. **Policy optimization** → Learn optimal refund %s from outcomes

## 📄 License

Built for HackCanada 2025 | Sofa Return Classification Demo

---

**Good luck with your demo! 🚀**
