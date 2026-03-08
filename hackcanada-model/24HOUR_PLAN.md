ÿ# ReturnClip: 24-Hour Execution Plan

## Overview
Build a complete AI-powered sofa return assessment demo from scratch in one hackathon day.

**Goal:** 150 labeled images → 72-78% accuracy model → Working web demo with 3 test cases

**Setup:** GPU-optimized with NVIDIA GPU (5-8 min training time)

**ROI:** 50% less data collection, 85% of the accuracy

---

## Step-by-Step Guide

### Phase 1: Environment Setup & Data Preparation

**Setup Environment:**
- [ ] Clone/download project
- [ ] Create Python virtual environment: `python -m venv venv`
- [ ] Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Test import: `python -c "import torch; print(torch.__version__)"`
- [ ] Verify GPU: Run `nvidia-smi` to confirm GPU detection
- [ ] Download Label Studio: `pip install label-studio`

**Prepare Data Folders:**
- [ ] Create folders in `data/raw/`:
  - `CLEAN/` (target: 50 images)
  - `LIGHT_DAMAGE/` (target: 50 images)
  - `HEAVY_DAMAGE/` (target: 50 images)

---

### Phase 2: Data Collection (150 Images Total)

**Collect CLEAN sofas (50 images):**
- [ ] Shopify furniture store galleries (bulk download)
- [ ] wayfair.com product photos
- [ ] IKEA product gallery
- [ ] article.com images
- [ ] CB2, West Elm catalogs
- [ ] Organize in `data/raw/CLEAN/`

**Collect LIGHT_DAMAGE sofas (50 images):**
- [ ] Craigslist "used sofa" + "couch" listings
- [ ] Facebook Marketplace used furniture section
- [ ] OfferUp / Letgo listings
- [ ] Local "buy nothing" groups
- [ ] Organize in `data/raw/LIGHT_DAMAGE/`

**Collect HEAVY_DAMAGE sofas (50 images):**
- [ ] Real images:
  - Craigslist "free" section (search "free couch", "free furniture")
  - Junk removal company photos
  - Water damage salvage listings
  - Estate sale damaged sections
- [ ] Synthetic images (if needed):
  - Photoshop/GIMP: Add damage overlays to CLEAN images
  - OR use Stable Diffusion: "heavily damaged sofa with large rips"
- [ ] Organize in `data/raw/HEAVY_DAMAGE/`

**Prepare Images:**
- [ ] Rename all images following pattern: `[CLASS]_[SOURCE]_[DATE]_[DAMAGE]_[NUM].jpg`
- [ ] Example: `LIGHT_DAMAGE_craigslist_20250307_stains_001.jpg`

---

### Phase 3: Image Annotation

**Setup Annotation:**
- [ ] Test Label Studio locally: `label-studio start`
- [ ] Familiarize with interface
- [ ] Import 150 images from `data/raw/`

**Create Annotation Task:**
- [ ] Label: `condition_class` (CLEAN / LIGHT_DAMAGE / HEAVY_DAMAGE)
- [ ] Checkboxes: `damage_types` (tears, stains, scratches, water damage, etc.)
- [ ] Dropdown: `severity` (minor / moderate / severe)
- [ ] Text: `affected_region` (cushion, legs, frame, etc.)
- [ ] Slider: `confidence_of_label` (0-100)

**Annotate All Images:**
- [ ] Label all 150 images with metadata
- [ ] Spot-check every 20 images for consistency
- [ ] Flag any ambiguous cases
- [ ] Export to CSV format

**Finalize Dataset:**
- [ ] Spot-check 20% of images (30 random) for quality
- [ ] Verify consistency (no CLEAN with damage markings)
- [ ] Fix any errors
- [ ] Save final CSV to `data/sofa_returns_dataset.csv`

---

### Phase 4: Model Training

**Train Model:**
```bash
cd src
python train.py
```

What the script does:
- Loads 150 images from `data/raw/`
- Creates 70/15/15 train/val/test split (105 train / 22 val / 23 test)
- Fine-tunes MobileNetV2 (30 epochs with early stopping)
- Saves best model to `models/best_model_*.pth`
- Shows accuracy/loss at each epoch

Expected Results:
- Training time: 5-8 minutes on NVIDIA GPU
- Validation accuracy: 72-78%
- Model checkpoint saved automatically

---

### Phase 5: Web App Integration (Optional)

**Verify App Files:**
- [ ] Confirm `src/app.py` exists
- [ ] Confirm `templates/index.html` exists

**Run Web App:**
```bash
cd src
python app.py
```

This will:
- Load latest model from `models/`
- Start Flask server on http://localhost:5000
- Pre-load 3 demo test cases

**Test the App:**
- [ ] Open http://localhost:5000 in browser
- [ ] Click demo cases to verify predictions
- [ ] Verify results show:
  - Condition class (CLEAN / LIGHT_DAMAGE / HEAVY_DAMAGE)
  - Confidence score
  - Damage types (if any)
  - Refund % recommendation
- [ ] Try uploading test images from `data/processed/test/`
- [ ] Check JSON output format is valid

**Troubleshooting:**
- If model not loading: Check file path in config
- If template not found: Verify `templates/` folder exists
- If imports fail: Run `pip install -r requirements.txt`
- If GPU not detected: Check `nvidia-smi` and verify PyTorch GPU support

---

### Phase 6: Testing & Polish

**Test Edge Cases:**
- [ ] Upload very small image (should resize)
- [ ] Upload oversized image (should handle)
- [ ] Upload blurry/dark image (should still predict)
- [ ] Try unknown image (non-sofa) - note behavior
- [ ] Test rapid uploads (performance)

**Polish UI:**
- [ ] Verify mobile responsiveness
- [ ] Test button hover effects
- [ ] Confirm confidence bars readable
- [ ] Check colors are vibrant for demo projection
- [ ] Add loading spinner if missing

**Verify Model Quality:**
- [ ] Check predictions make logical sense
- [ ] Review test set accuracy
- [ ] Ensure model saved with correct checkpoint

---

### Phase 7: Final Preparation

**Code Review & Documentation:**
- [ ] Clean up print statements
- [ ] Add error handling comments
- [ ] Verify all files organized
- [ ] Double-check model at `models/best_model_*.pth`

**Create Model Card:**
```
Model: ReturnClip V1 (MobileNetV2 + GPU)
Training images: 150 (50 per class)
Classes: CLEAN (100%), LIGHT_DAMAGE (65%), HEAVY_DAMAGE (0%)
Training time: 5-8 minutes on NVIDIA GPU
Validation accuracy: 72-78%
ROI: 50% less data collection
```

**Prepare Demo Pitch:**
- [ ] Write 30-second demo pitch
- [ ] Prepare talking points:
  1. ROI-focused dataset: Only 150 images for 70%+ accuracy
  2. GPU optimization: Training takes 5-8 minutes, not hours
  3. Business logic: Maps damage → clear return decisions
- [ ] Practice pitch
- [ ] Anticipate FAQs:
  - "Why only 150?" → Better ROI, GPU is fast, 72% accurate is demo-ready
  - "Will it scale?" → Yes; this is proof-of-concept
  - "False positives?" → Escalate uncertain cases (< 65% confidence) to human

---

## Success Criteria

Before demo, verify:

- [ ] 150 images collected & organized (50 per class)
- [ ] All images annotated with condition + damage types
- [ ] Model trained on GPU
- [ ] Validation accuracy: 72-78% (good for demo)
- [ ] Web demo fully functional
- [ ] Image upload works
- [ ] 3 demo cases pre-loaded
- [ ] Results show condition + damage + refund %
- [ ] Confidence scores displayed
- [ ] Can explain in 30 seconds
- [ ] Judges can immediately try it

**ROI Comparisons:**
- Data collection: 4-5 hours (vs 7-8 for 300 images)
- Annotation: 1.25 hours (vs 6 hours for 300 images)
- Training: 5-8 minutes on GPU (vs 1.5-3 hours for CPU)
- **Accuracy: 72-78% (minimal loss vs full 300-image pipeline)**

---

## Best Practices

### ✅ Do:
- **GPU first**: Verify GPU detected: `nvidia-smi`
- **ROI-focused collection**: 50 CLEAN (easiest), 50 LIGHT (medium), 50 HEAVY (hardest)
- **Bulk downloads**: Screenshot multiple listings at once
- **Batch labeling**: Annotate similar images in groups (all CLEAN together, etc.)
- **Use shortcuts**: Label Studio keyboard shortcuts for speed
- **Parallelization**: One person collects while other sets up environment
- **Synthetic backup**: If short on HEAVY damage, use Stable Diffusion
- **GPU training**: Use GPU for optimal performance

### ❌ Don't:
- Don't over-curate images
- Don't collect more than necessary (ROI diminishing returns)
- Don't use CPU-only training
- Don't overthink ambiguous labels
- Don't build fancy UI (focus on model)
- Don't retrain multiple times (first pass is acceptable)

---

## Troubleshooting Guide

**If images are hard to find:**
- Use stock photo sites (pexels, unsplash, freepik)
- Search "couch" or "sofa" with filters
- Use synthetic images (Stable Diffusion: "sofa" + "damaged")
- Proceed with 120 images minimum (still trains fine)

**If annotation is slow:**
- Annotate CLEAN quickly (cosmetic check only)
- Skip ambiguous images, auto-approve obvious ones
- Use Label Studio keyboard shortcuts
- Group similar images and batch-annotate

**If GPU training fails:**
- Verify GPU: `nvidia-smi`
- Check GPU memory available (need ~2-4 GB)
- Reduce batch size: `BATCH_SIZE = 16` in config
- Verify model checkpoint was created

**If web app crashes:**
- Check error logs in terminal
- Verify model file exists: `ls models/best_model_*.pth`
- Verify Flask is serving static files
- Restart Python and Flask
- Last resort: Use demo mode only (pre-loaded results)

**If accuracy seems low:**
- 72-78% is acceptable for 150-image dataset
- Focus on demo execution and ROI narrative
- Escalate low-confidence to human (built-in mitigation)
- Can add 20-30 more images and retrain if needed

---

## Demo Script

```
"This is ReturnClip, an AI system for automating sofa return assessments.

Here's how it works:
1. Customer uploads a photo of their sofa
2. Our model analyzes for damage types (tears, stains, water damage, etc.)
3. System returns a condition assessment and refund recommendation

We built this using:
- 150 strategically-collected sofa images (50 per condition class)
- GPU-trained MobileNetV2 model
- Smart ROI-focused data collection

Let me show you a demo:
[Upload a LIGHT_DAMAGE test image]

The model is 76% confident this sofa has light damage - staining on the cushion.
Our policy recommends a 65% refund.

Here's a heavily damaged sofa for comparison:
[Show HEAVY_DAMAGE demo]

Our system rejected this return - too much damage.

The accuracy is 72-78%, which is excellent for a proof-of-concept.
Uncertain cases (< 65% confidence) automatically escalate to human review.

In production, we'd integrate this into the Shopify return flow for automatic approvals."

[Let judges try: upload a photo or click demo cases]
```

---

## Deliverables Checklist

When complete, you should have:

- [ ] `data/sofa_returns_dataset.csv` (150 rows)
- [ ] `data/raw/CLEAN/*.jpg` (50 images)
- [ ] `data/raw/LIGHT_DAMAGE/*.jpg` (50 images)
- [ ] `data/raw/HEAVY_DAMAGE/*.jpg` (50 images, mix of real + synthetic)
- [ ] `models/best_model_*.pth` (trained model)
- [ ] `src/app.py` running on localhost:5000
- [ ] Web UI functional (upload + 3 demo cases)
- [ ] 30-second pitch prepared
- [ ] Model card documenting 72-78% accuracy
- [ ] All code committed to git

**ROI Summary:**
- Dataset size: 150 images (vs 300 for full pipeline)
- Training time: 5-8 minutes on GPU (vs 1.5-3 hours on CPU)
- Expected accuracy: 72-78% (acceptable for demo)
- Data collection: 4-5 hours (vs 7-8 hours for 300 images)

---

## Next Steps

**After Demo:**
- [ ] Add 50 more images and retrain for improved accuracy
- [ ] Test multi-angle support (require 3+ photos)
- [ ] Fine-tune refund percentages based on damage severity
- [ ] Add human feedback loop (user rates verdict quality)

**For Production:**
- Expand to other furniture types
- Integrate with Shopify API for automated returns
- Deploy to cloud (AWS Lambda, Google Cloud, or Azure)
- Collect user data and retrain monthly
- Add customer photo capture guidelines
- Implement A/B testing for refund policies

---

**You're GPU-powered. You've got this! 🚀**
