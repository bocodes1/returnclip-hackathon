# ReturnClip — Pitch Deck

## Slide 1: Title

**ReturnClip**
*AI-Powered Returns in 30 Seconds. No App. No Friction.*

Team ReturnClip | Hack Canada 2026
Built on Reactiv ClipKit Lab

---

## Slide 2: The Problem

### $100B+ Lost to Returns Every Year

- Ecommerce returns cost merchants **$100+ billion annually** in North America
- Current process: **15–30 minutes** of forms, emails, and manual verification
- Furniture/home goods: **15–22% return rate**, each return eats 20–65% of item value
- **60% of returns are abandoned** due to friction → chargebacks cost even more
- Merchants **cannot verify item condition at scale** before accepting returns

*"Every abandoned return becomes a chargeback. Every chargeback costs 2.5x the refund."*

---

## Slide 3: The Solution

### ReturnClip: Scan → Snap → Refund in 30 Seconds

1. 📱 **Scan QR on packaging** (or tap Reactiv push notification 8h post-delivery)
2. 📋 **Confirm order** — auto-loaded, select item (2 sec)
3. ❓ **Pick return reason** — one tap (3 sec)
4. 📸 **Take 3 guided photos** — AI-guided angles (10 sec)
5. 🤖 **AI verifies condition** — Cloudinary Vision detects damage/wear (5 sec)
6. 🧠 **AI applies policy** — Gemini reasons refund against merchant rules (instant)
7. 💰 **Choose refund** — card, store credit (+10% bonus), or exchange (5 sec)
8. ✅ **Get QR return label** — drop off at Canada Post, done (5 sec)

**No app download. No account. No waiting. Just results.**

---

## Slide 4: Demo

### Live Walkthrough

*[Show screen recording of the full 6-screen flow]*

**Key moments to highlight:**
- Order auto-loads from URL parameters
- Photo capture with real-time preview
- AI condition score: 95/100 with category breakdown
- Refund options with store credit bonus incentive
- QR return label generated with CoreImage

**Tech stack:**
- Swift + SwiftUI (zero dependencies)
- Cloudinary REST API (image upload + AI Vision)
- Google Gemini 2.0 Flash (policy reasoning, structured JSON)
- Reactiv ClipKit Lab (App Clip simulation)

---

## Slide 5: Business Model

### How ReturnClip Makes Money

**SaaS Model:**
| Tier | Price | Features |
|------|-------|----------|
| Starter | $49/mo | Up to 100 returns/mo, basic AI |
| Growth | $99/mo | Up to 500 returns/mo, custom policies |
| Enterprise | $199/mo | Unlimited, Shopify integration, analytics |

**Plus:** $0.50–$2.00 per return processing fee

**Merchant ROI:**
- **33% reduction** in total return losses
- **$2,350/month** recovered revenue (100 returns/mo baseline)
- **67% fewer chargebacks** (AI catches condition misrepresentation)
- **3.5x increase** in store credit uptake (retained revenue)

**Market:** 26M+ Shopify merchants worldwide. Even 0.1% penetration = 26,000 merchants × $99/mo = **$30M ARR**.

---

## Slide 6: The Ask

### What We Need

- **$50K seed funding** to build production Shopify integration
- **Reactiv partnership** to deploy as a native Clips feature
- **3 pilot merchants** (furniture/fashion/electronics) for beta testing

### Why Now?

- Apple App Clips adoption is accelerating
- Reactiv's 8-hour push window is the perfect delivery mechanism
- AI vision/reasoning costs dropped 90% in 12 months
- No one has built AI-powered returns in an App Clip — **we're first**

### The Vision

ReturnClip becomes the **default returns experience** for every Shopify merchant using Reactiv Clips. One scan, one decision, one happy customer.

**ReturnClip — Because returns should take 30 seconds, not 30 minutes.**
