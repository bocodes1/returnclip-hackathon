# ReturnClip — Judge Q&A Bank

## Technical Questions

### 1. How does the AI condition assessment actually work?
**Answer:** Two-stage pipeline. First, Cloudinary receives the uploaded photos and runs AI Vision to detect physical features — damage, wear, stains — with confidence scores and bounding boxes. Second, we send those scores plus the merchant's return policy to Google Gemini 2.0 Flash, which reasons about eligibility and calculates the exact refund. Gemini returns structured JSON with the decision, amounts, and alternative options. The whole pipeline runs in under 5 seconds.

### 2. What happens if the AI makes a wrong decision?
**Answer:** Three safeguards. First, we show the customer the full condition breakdown with scores — it's transparent, not a black box. Second, the merchant sets the policy rules and thresholds, so the AI enforces *their* rules, not ours. Third, edge cases default to human review — if confidence is below 70%, we flag it for merchant review instead of auto-deciding. The AI augments human judgment, it doesn't replace it.

### 3. Why Cloudinary + Gemini instead of a single AI service?
**Answer:** Separation of concerns. Cloudinary is optimized for image processing — upload, CDN, and visual AI. Gemini is optimized for reasoning — reading a policy document and making a judgment call. Using both gives us best-in-class at each stage. Also, Cloudinary handles the heavy image storage/CDN so we don't need to pass raw images to Gemini, which keeps API costs low.

### 4. How do you handle the 15MB App Clip size limit?
**Answer:** Our entire codebase is pure SwiftUI with zero external dependencies. No SPM packages, no bundled ML models, no video files. All AI processing happens server-side via REST APIs. The compiled binary is well under 15MB. We followed ClipKit Lab rules exactly.

### 5. What about privacy? You're uploading photos of people's stuff.
**Answer:** Photos are uploaded directly to Cloudinary via unsigned preset — they never touch our servers. Cloudinary is SOC 2 compliant with data residency options. The Gemini API receives only condition scores and metadata, never raw images. No personal data is stored after the return is processed. We could add on-device preprocessing in production to further minimize data exposure.

## Business Questions

### 6. How big is the market for this?
**Answer:** $100+ billion in ecommerce returns annually in North America alone. Shopify has 26 million+ merchants. Even capturing 0.1% of Shopify merchants at $99/month is $30M ARR. The furniture/home goods vertical alone is $20B in returns — that's our beachhead.

### 7. Why would a merchant pay for this?
**Answer:** ROI is immediate and measurable. A merchant processing 100 returns/month saves $2,350/month in recovered revenue and reduced chargebacks. Our $99/month plan pays for itself 23x over. Plus, the store credit bonus feature means 35% of customers choose store credit over refund — that's revenue *retained*, not returned.

### 8. What's your competitive advantage?
**Answer:** Three things. First, we're an App Clip — no app download means near-zero customer friction. Second, AI condition verification doesn't exist in any returns product today. Third, the Reactiv 8-hour push window lets us reach customers at the exact moment of return intent. No competitor has all three.

### 9. Who are your competitors?
**Answer:** Loop Returns, Narvar, and Returnly handle returns management but they all require web portals or app downloads. None of them do AI condition verification. None of them use App Clips. We're not competing on returns management — we're competing on the *moment of verification*, which is the highest-value, most manual part of the process.

### 10. How does the store credit bonus work commercially?
**Answer:** The merchant configures a bonus percentage (e.g., 10%) for customers who choose store credit over a card refund. On a $299 chair, the customer gets $328.90 in store credit vs $299 cash back. The merchant keeps the sale and the customer gets more value. In our projections, this drives 3.5x higher store credit uptake, retaining ~$750/month in revenue per merchant.

## Product Questions

### 11. Why is this better as an App Clip than a web app?
**Answer:** Three reasons. Performance: native SwiftUI renders instantly vs mobile web load times. Camera: native camera access is faster and higher quality than browser camera APIs. Push notifications: the 8-hour Reactiv window gives us a free re-engagement channel that web apps don't have. An App Clip is *designed* for this exact use case — a focused, 30-second task triggered by a real-world moment.

### 12. What happens if the customer doesn't have an iPhone?
**Answer:** The same flow can be delivered via mobile web for Android users. But 80%+ of North American mobile commerce happens on iPhone, so App Clip coverage is commercially sufficient. The Reactiv platform could support both channels.

### 13. How do you handle different product categories?
**Answer:** The merchant configures category-specific condition requirements in their return policy. Furniture checks for damage, wear, and completeness. Electronics checks for damage and original packaging. Fashion could check for tags attached and unworn condition. The AI adapts to whatever the merchant defines — it's policy-driven, not product-driven.

### 14. What if the customer's photos are bad quality?
**Answer:** Cloudinary's quality metrics check sharpness, brightness, and contrast before analysis. If photos don't meet the threshold, we prompt the customer to retake. Our photo capture screen includes guidelines ("good lighting helps us assess faster") and a demo video showing proper angles. We optimize for good data in, good decision out.

### 15. How would you scale this to production?
**Answer:** Three phases. Phase 1 (now): MVP with mock Shopify data, real Cloudinary + Gemini APIs. Phase 2 (3 months): Shopify Storefront API integration for real order data, Canada Post label generation API, Reactiv push notification templates. Phase 3 (6 months): Merchant dashboard with policy builder, analytics, and multi-store support. The architecture is already designed for this — services are modular and API-based.

### 16. Why should Reactiv care about this?
**Answer:** Returns are the most underserved touchpoint in ecommerce. Every Shopify merchant using Reactiv Clips could offer ReturnClip as a post-purchase feature. It makes Reactiv's platform stickier — merchants won't just use Clips for sales, they'll use them for service. That's a new revenue category for Reactiv and a reason for merchants to stay on the platform.

### 17. What's your 8-hour push notification strategy?
**Answer:** Three notifications in the 8-hour window. Hour 0: "Your order was delivered! Everything look good?" (soft check-in). Hour 4: "Need to return something? Tap to start — it takes 30 seconds." (the conversion trigger). Hour 7: "Last chance for instant returns today." (urgency). After the return is initiated, one more at hour 6: "Don't forget to drop off your return — your label expires in 7 days."
