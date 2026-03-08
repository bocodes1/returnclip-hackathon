# ML Model Integration Setup

This guide walks through integrating the hackcanada-model sofa classifier with the ReturnClipKit iOS App Clip.

## Overview

The app now evaluates photos using **two AI systems**:

1. **Primary (Gemini Vision)** - Backend Gemini Vision + policy reasoning
2. **Secondary (ML Model)** - Local hackcanada-model sofa classifier for testing/comparison

Results from both are displayed side-by-side in the Condition Assessment screen.

---

## Quick Start (5 minutes)

### 1. Start the ML Model Service

```bash
cd hackcanada-model
python -m venv venv

# Activate venv (Windows)
venv\Scripts\activate

# Or (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask app
python src/app.py
```

The service will start on **http://localhost:5001**

### 2. Verify Service is Running

```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status": "ok", "model_loaded": true, "device": "cuda"}
```

**Note:** If the trained model isn't found, the app will fall back to demo results automatically (no errors).

### 3. Run the iOS App

Open `ReturnClipKit/ReturnClipKit.xcodeproj` in Xcode and run in the simulator.

The app will:
- ✅ Use Gemini Vision for the primary assessment
- ✅ Call the ML model service in the background
- ✅ Display both results for comparison

---

## Architecture

### Data Flow

```
PhotoCaptureView (3 photos)
    ↓
ReturnClipExperience.analyzePhotos()
    ├─→ CloudinaryService (upload to CDN)
    ├─→ BackendService.createCase() (create return record)
    ├─→ BackendService.submitEvidence() (register photos)
    ├─→ BackendService.assessCondition() (Gemini Vision)
    ├─→ BackendService.getRefundDecision() (policy reasoning)
    │
    └─→ [NEW] evaluateWithMLModel() (runs in parallel)
        └─→ ModelEvaluationService.classifyImage()
            └─→ /api/classify endpoint (hackcanada-model)
                └─→ Stores result in flowState.modelAssessment

ConditionResultView
    ├─ Displays Gemini assessment
    ├─ Displays ML model assessment (if available)
    └─ Shows side-by-side comparison
```

### New Files Added

**Swift Services:**
- [`ReturnClipKit/Services/ModelEvaluationService.swift`](ReturnClipKit/ReturnClipKit/Services/ModelEvaluationService.swift)
  - Calls `/api/classify`, `/api/demo/{case}`, `/api/demo-cases`, `/api/health`
  - Decodes model response and converts to Swift models
  - Non-blocking — runs in background task

**Swift Models:**
- Updated `ReturnFlowState.swift`:
  - Added `modelAssessment: SofaConditionAssessment?`
  - Added `modelEvaluationError: String?`
  - Updated `reset()` to clear model fields

**Updated Views:**
- `ConditionResultView.swift`:
  - Added `modelComparisonSection()` to display model results
  - Added `modelErrorSection` for when model is unavailable
  - Shows condition class, refund %, and detected damages from model

---

## Configuration

### Change Model Service URL

If running the model service on a different host/port:

```swift
// In ReturnClipExperience.swift or anywhere before calling:
ModelEvaluationService.shared.baseUrl = "http://your-host:port"
```

Or edit the default in `ModelEvaluationService.swift`:

```swift
var baseUrl: String = "http://localhost:5001"  // Change this
```

### Demo Mode (No Model Required)

If the trained model isn't available, the service falls back to pre-loaded demo results:

```swift
let assessment = try await ModelEvaluationService.shared.getDemoCase("light_damage_sofa")
// Returns pre-computed assessment without requiring a trained model
```

Available demo cases:
- `clean_sofa` - 96% confidence, full refund
- `light_damage_sofa` - 87% confidence, 65% refund
- `heavy_damage_sofa` - 94% confidence, return rejected
- `not_a_sofa` - 38% confidence, invalid image

---

## Troubleshooting

### "ML Model" section shows "Unavailable"

**Cause:** Model service is not running or unreachable.

**Solution:**
1. Ensure Flask app is running: `python src/app.py`
2. Check it's on `http://localhost:5001`: `curl http://localhost:5001/api/health`
3. If using a different host, update `ModelEvaluationService.shared.baseUrl`

### "Model not loaded" error in Flask logs

**Cause:** Trained model file not found.

**Solution:**
1. Train the model: `cd hackcanada-model/src && python train.py`
2. Or use demo mode (demo cases work without a trained model)

### Timeout or connection refused

**Cause:** Port conflict or firewall issue.

**Solution:**
1. Check what's on port 5000: `lsof -i :5001` (Mac/Linux) or `netstat -ano | findstr :5001` (Windows)
2. Kill conflicting process or change Flask port in `app.py`
3. Update `ModelEvaluationService` to match new port

### "CORS error" or "network error"

**Cause:** Simulator can't reach localhost.

**Solution:**
- On iOS Simulator, `localhost` doesn't resolve to the host machine.
- Change `ModelEvaluationService.shared.baseUrl = "http://127.0.0.1:5001"`
- Or if running on real device: use your machine's actual IP: `http://192.168.x.x:5001`

---

## API Endpoints

The model service exposes these endpoints:

### `/api/health` (GET)
Check if model is ready.

```bash
curl http://localhost:5001/api/health
```

Response:
```json
{
  "status": "ok",
  "model_loaded": true,
  "device": "cuda"
}
```

### `/api/classify` (POST)
Classify a sofa image.

```bash
curl -X POST \
  -F "image=@sofa.jpg" \
  http://localhost:5001/api/classify
```

Response:
```json
{
  "sofa_condition_assessment": {
    "image_id": "...",
    "primary_verdict": {
      "condition_class": "LIGHT_DAMAGE",
      "confidence": 0.87,
      "recommendation": "PARTIAL_REFUND"
    },
    "damage_analysis": {
      "damage_types_detected": ["stains", "wear"],
      "damage_descriptions": [...]
    },
    "return_eligibility": {
      "returnable": true,
      "refund_recommendation": "PARTIAL_REFUND",
      "estimated_refund_percent": 65,
      "reason": "Minor damage detected..."
    },
    "confidence_and_flags": {
      "overall_confidence": 0.87,
      "requires_human_review": false,
      "review_reason": ""
    }
  }
}
```

### `/api/demo/{case}` (GET)
Get pre-loaded demo result.

```bash
curl http://localhost:5001/api/demo/light_damage_sofa
```

### `/api/demo-cases` (GET)
List available demo cases.

```bash
curl http://localhost:5001/api/demo-cases
```

---

## Testing Workflow

### Test 1: Demo Mode (No Model Training)

1. Start Flask: `python src/app.py`
2. Run iOS app
3. Upload 3 test photos
4. See Gemini assessment (primary) + demo model result (secondary)

### Test 2: With Trained Model

1. Train model: `cd src && python train.py` (5-10 min on GPU)
2. Start Flask: `python src/app.py`
3. Run iOS app
4. Upload real sofa photos
5. Compare Gemini vs ML model predictions

### Test 3: Real Image Classification

Use the `/api/classify` endpoint directly:

```bash
curl -X POST \
  -F "image=@your_sofa.jpg" \
  http://localhost:5001/api/classify | jq
```

---

## Performance Notes

- **Model Service:** Startup: 3-5 sec, inference: 100-500ms per image
- **App Flow:** Non-blocking — ML model runs in background task
- **UI Impact:** Minimal — primary assessment completes immediately, model results appear later if available

---

## Next Steps

1. **Improve Model:** Collect more training data, retrain with hackcanada-model
2. **Comparison Metrics:** Add side-by-side accuracy comparison in ConditionResultView
3. **Production Deployment:** Run model service on cloud (AWS Lambda, Google Cloud Run)
4. **A/B Testing:** Switch between Gemini and ML model refund decisions based on configuration

---

## References

- [Model Service README](hackcanada-model/README.md)
- [24-Hour ML Plan](hackcanada-model/24HOUR_PLAN.md)
- [Annotation Guide](hackcanada-model/ANNOTATION_GUIDE.md)

---

**Ready to test? Start the Flask app and run the iOS simulator! 🚀**
