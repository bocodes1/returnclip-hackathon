## Team Name: Team ReturnClip
## Clip Name: ReturnClip
## Invocation URL Pattern: returnclip.app/return/:orderId

---

## What Great Looks Like

Your submission is strong when it is:
- **Specific**: one clear fan moment, one clear problem, one clear outcome
- **Clip-shaped**: value in under 30 seconds, no heavy onboarding
- **Business-aware**: connects to revenue (venue, online, or both)
- **Testable**: prototype actually runs in the simulator with your URL pattern

---

### 1. Problem Framing

Which user moment or touchpoint are you targeting?

- [ ] Discovery / first awareness
- [ ] Intent / consideration
- [ ] Purchase / conversion
- [ ] In-person / on-site interaction
- [x] Post-purchase / re-engagement
- [ ] Other: ___

**What friction or missed opportunity are you solving for?**

Ecommerce returns cost merchants **$100+ billion annually** in North America. The current process takes 15–30 minutes of form-filling, email exchanges, and manual condition verification. Customers abandon returns due to friction, leading to chargebacks that cost merchants even more. Furniture and home goods brands face 15–22% return rates with each return consuming 20–65% of item value in reverse logistics. There is no scalable way for merchants to verify item condition before accepting a return — until now.

---

### 2. Proposed Solution

**How is the Clip invoked?** (check all that apply)
- [x] QR Code (printed on physical surface)
- [ ] NFC Tag (embedded in object — wristband, poster, etc.)
- [x] iMessage / SMS Link
- [ ] Safari Smart App Banner
- [ ] Apple Maps (location-based)
- [ ] Siri Suggestion
- [x] Other: Push notification (8-hour post-delivery window via Reactiv Clips)

**End-to-end user experience** (step by step):
1. Customer receives delivery → 8 hours later, Reactiv push notification: "Need to return? Tap to start." (or scans QR code on packaging)
2. App Clip opens → Order auto-confirmed → Customer selects item and return reason (5 seconds)
3. Customer takes 3 guided photos of item condition (10 seconds)
4. Cloudinary uploads + AI Vision analyzes condition → Gemini reasons against merchant return policy → Instant refund decision (5 seconds)
5. Customer chooses refund option (full refund, store credit with 10% bonus, or exchange) → Gets QR return label (10 seconds)
6. Done. Total: ~30 seconds. Customer drops off package at Canada Post with QR label.

**How does the 8-hour notification window factor into your strategy?**

The 8-hour window is *the* key insight. Returns intent peaks within hours of delivery — that's when customers decide to keep or return. By using Reactiv's push notification at the 8-hour mark, we catch customers at peak decision-making time with zero friction. The Clip delivers the entire return flow in 30 seconds. Follow-up notifications can remind about return label expiry. This transforms the 8-hour window from a marketing tool into a post-purchase service channel.

---

### 3. Platform Extensions (if applicable)

For full production deployment, ReturnClip would benefit from:

1. **Cloudinary Webhook Integration** — Real-time condition analysis callback to Reactiv for automated merchant notifications
2. **Shopify Return Initiation API** — Native integration to create return records and generate shipping labels within the Clip
3. **Push Notification Templates** — Customizable merchant-branded notification templates for the 8-hour post-delivery window
4. **Policy Builder UI** — Merchant dashboard within Reactiv to configure return rules, condition thresholds, and restocking fees

---

### 4. Prototype Description

**What does your working prototype demonstrate?**

A complete 6-screen return flow built in SwiftUI:

| Screen | What It Does |
|--------|-------------|
| **Order Confirmation** | Displays order details, item selection with images, return window countdown |
| **Return Reason** | Interactive reason picker with icons, optional notes field |
| **Photo Capture** | Guided 3-photo capture with demo video, PhotosPicker integration, live preview grid |
| **Condition Assessment** | AI condition score (0-100) with category breakdown, detected issues, policy check result |
| **Refund Options** | Full refund / store credit with bonus / exchange cards with amounts |
| **Confirmation** | QR return label (CoreImage generated), drop-off instructions, timeline, Apple Wallet integration |

**Services implemented:**
- `CloudinaryService` — Direct REST API upload with multipart form data, unsigned preset, AI condition analysis
- `GeminiService` — Policy reasoning via Gemini 2.0 Flash with structured JSON output, temperature-controlled responses

**Key technical decisions:**
- Zero external dependencies (no SPM/CocoaPods) per ClipKit Lab rules
- All API calls use direct `URLSession` REST
- Graceful fallback to mock data when APIs are unavailable (demo-safe)
- `Decimal` type for all monetary values (no floating point errors)

---

### 5. Impact Hypothesis

**Which channel benefits?** Both online and in-person (packaging QR).

**Conversion/engagement improvement estimate:**

| Metric | Before ReturnClip | After ReturnClip | Delta |
|--------|-------------------|------------------|-------|
| Returns processed | 60% | 95% | +58% |
| Processing time | 15-30 min | 30 seconds | -98% |
| Chargebacks/month | 15 | 5 | -67% |
| Revenue recovered | $0 | $2,350/month | New |
| Store credit uptake | 10% | 35% | +250% |

**Why this touchpoint?** Post-purchase returns are the #1 unsolved pain point in ecommerce. The 8-hour post-delivery window is when customers are most likely to act on return intent. By meeting them there with an instant, AI-powered experience, we convert friction into loyalty. Store credit with bonus incentivizes retained revenue. The AI condition check reduces fraud and builds merchant trust.

**Revenue model:** SaaS fee per merchant ($49-199/month) + per-return processing fee ($0.50-2.00). At scale, ReturnClip saves merchants $2,350+/month in recovered revenue and reduced chargebacks.

---

### Demo Video

Link: [To be recorded — 30-second screen recording of full flow]

### Screenshot(s)

[To be captured from Xcode simulator]
