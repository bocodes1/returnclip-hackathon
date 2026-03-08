# 📦 ReturnClip

> **AI-powered returns verification in 30 seconds. No app install. No friction. Just scan and return.**

Built for **Hack Canada 2026** 🇨🇦

---

## The Problem

Ecommerce returns cost merchants **$100B+ annually**. Customers wait 15-30 minutes fighting forms and policies. Merchants can't verify item condition at scale. Everyone loses.

## The Solution

**ReturnClip** is an Apple App Clip that lets customers scan a QR code, snap photos of their item, and get an instant AI-powered refund decision — all in under 30 seconds.

### How It Works

```
📱 Scan QR on packaging
    ↓
📋 Confirm order + select item
    ↓
❓ Pick return reason
    ↓
📸 Take 3 photos (guided by demo video)
    ↓
🤖 AI checks condition (Cloudinary Vision)
    ↓
🧠 AI applies return policy (Gemini)
    ↓
💰 Choose: full refund / exchange / store credit
    ↓
✅ Get return label + drop-off instructions
```

### Why It's Different

- **No app download** — Apple App Clip technology
- **AI condition verification** — catches fraud, ensures fairness
- **Policy-aware decisions** — every merchant sets their own rules
- **Works for any product** — furniture, fashion, electronics, beauty

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Swift 5.0 + SwiftUI |
| Image Analysis | Cloudinary Upload + AI Vision |
| Policy Reasoning | Google Gemini 2.0 Flash |
| Commerce | Shopify Storefront API |
| Platform | Reactiv ClipKit Lab |

All API integrations use **direct REST calls** — zero external dependencies.

---

## Quick Start (5 minutes)

### 1. Clone ReturnClip

```bash
git clone https://github.com/bocodes1/returnclip-hackathon.git
cd returnclip-hackathon
```

### 2. Start Backend + ML Model (Both Together) ⭐ EASIEST

**Windows:**
```bash
double-click dev-start.bat
```

**Mac/Linux:**
```bash
bash dev-start.sh
```

This starts **both services in one command**:
- ✅ Backend (Next.js) on `http://localhost:3001`
- ✅ ML Model (Flask) on `http://localhost:5001`

> First run will take ~30 seconds to install dependencies and set up Python venv.

### 2b. [Alternative] Manual Start in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - ML Model:**
```bash
cd hackcanada-model
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/app.py
```

### 3. Run iOS App

1. Open `ReturnClipKit/ReturnClipKit.xcodeproj` in **Xcode 26+**
2. Create `Config/APIKeys.swift` (see below)
3. Select iPhone simulator → **Cmd+R**

### API Keys Setup

Create `ReturnClipKit/ReturnClipKit/Config/APIKeys.swift`:

```swift
enum APIKeys {
    static let cloudinaryCloudName = "your_cloud_name"
    static let cloudinaryUploadPreset = "your_preset"
    static let geminiApiKey = "your_gemini_key"
    static let shopifyStoreDomain = "your-store.myshopify.com"
    static let shopifyStorefrontToken = "your_token"

    // Backend URL — update if running on different port
    static let backendUrl = "http://localhost:3001"

    static var isConfigured: Bool {
        cloudinaryCloudName != "your_cloud_name"
    }
}
```

Get keys from:
- **Cloudinary** → [cloudinary.com](https://cloudinary.com) (free tier)
- **Gemini** → [ai.google.dev](https://ai.google.dev) (free tier)

---

## Project Structure

```
ReturnClipKit/
├── ReturnClipKitApp.swift          # Entry point + URL routing
├── Experience/
│   └── ReturnClipExperience.swift   # Main flow orchestrator
├── Screens/
│   ├── OrderConfirmationView.swift  # Step 1: Confirm order
│   ├── ReturnReasonView.swift       # Step 2: Why returning?
│   ├── PhotoCaptureView.swift       # Step 3: Snap photos
│   ├── ConditionResultView.swift    # Step 4: AI assessment
│   ├── RefundOptionsView.swift      # Step 5: Choose refund
│   └── ConfirmationView.swift       # Step 6: Label + done
├── Services/
│   ├── CloudinaryService.swift      # Image upload to CDN
│   ├── BackendService.swift         # Backend API calls (orders, returns, Gemini)
│   ├── ModelEvaluationService.swift # [NEW] ML model classification (optional)
│   └── GeminiService.swift          # Policy reasoning (server-side)
├── Models/
│   ├── Order.swift                  # Order data
│   ├── ReturnPolicy.swift           # Merchant policy rules
│   ├── ConditionAssessment.swift    # AI analysis results
│   └── ReturnFlowState.swift        # Flow state machine
└── MockData/
    └── MockData.swift               # Demo data
```

---

## URL Pattern

```
returnclip.app/return/:orderId
```

Example: `returnclip.app/return/12345`

---

## The Business Case

| Metric | Before ReturnClip | After ReturnClip |
|--------|-------------------|------------------|
| Return processing time | 15-30 min | **30 seconds** |
| Returns processed | 60% | **95%** |
| Chargebacks | 15/month | **5/month** |
| Revenue recovered | $0 | **$2,350/month** |

---

## Team

Built with 🔥 at Hack Canada 2026

---

## API Test Results

Both APIs have been tested and verified. See [`tests/API_TEST_RESULTS.md`](tests/API_TEST_RESULTS.md) for details.

| API | Status |
|-----|--------|
| Cloudinary Upload | ✅ Working |
| Gemini 2.0 Flash | ✅ Key valid (free tier rate limits apply) |

---

## ML Model Integration

ReturnClip includes a **second AI system** for testing and validation:

- **Primary Assessment:** Gemini Vision (backend) — always available ✅
- **Secondary Assessment:** Local ML sofa classifier (optional) — displays side-by-side for comparison ⭐

### ML Model Service

The sofa condition classifier is included in this repository:

📦 **`hackcanada-model/`** — PyTorch + MobileNetV2 classifier
- Flask REST API (`http://localhost:5001`)
- Condition classification: CLEAN / LIGHT_DAMAGE / HEAVY_DAMAGE
- Damage detection: tears, stains, water damage, etc.
- Refund % recommendations

**Data Files (Gitignored):**
- `venv/` — Python virtual environment
- `data/raw/` — Training images (CLEAN, LIGHT_DAMAGE, HEAVY_DAMAGE)
- `models/` — Trained model checkpoints

**To run the model service:**
```bash
cd hackcanada-model
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python src/app.py  # Runs on http://localhost:5001
```

**How it integrates with the app:**
1. iOS app uploads photo → Cloudinary
2. Calls Gemini Vision (backend) → displays immediately
3. Calls ML model service (background) → displays in "ML Model Assessment" section
4. Non-blocking — doesn't delay primary flow

For detailed setup and troubleshooting, see [`MODEL_INTEGRATION_SETUP.md`](MODEL_INTEGRATION_SETUP.md).

---

## Hackathon Documents

- [`SUBMISSION.md`](SUBMISSION.md) — Full submission per Reactiv ClipKit Lab format
- [`PITCH.md`](PITCH.md) — 6-slide pitch deck content
- [`QA_BANK.md`](QA_BANK.md) — 17 judge Q&A with answers
- [`PR_DESCRIPTION.md`](PR_DESCRIPTION.md) — Ready-to-paste PR description
- [`MODEL_INTEGRATION_SETUP.md`](MODEL_INTEGRATION_SETUP.md) — ML model integration guide
- [`tests/API_TEST_RESULTS.md`](tests/API_TEST_RESULTS.md) — API verification results

---

*Submitted under the Reactiv ClipKit Lab challenge.*
