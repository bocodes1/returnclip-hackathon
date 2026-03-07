#!/usr/bin/env python3
"""Generate professional PDFs for ReturnClip pitch deck and Q&A bank."""

from fpdf import FPDF
import os

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _clean(text):
    """Replace Unicode chars that Helvetica can't render."""
    return (text
            .replace("\u2014", "--")
            .replace("\u2013", "-")
            .replace("\u2192", "->")
            .replace("\u2022", "-")
            .replace("\u00d7", "x")
            .replace("\u201c", '"')
            .replace("\u201d", '"')
            .replace("\u2018", "'")
            .replace("\u2019", "'")
            .encode("latin-1", "replace").decode("latin-1"))


class ReturnClipPDF(FPDF):
    def __init__(self, title):
        super().__init__()
        self._doc_title = title
        self.set_auto_page_break(auto=True, margin=25)

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(130, 130, 130)
            self.cell(0, 8, self._doc_title, align="L")
            self.cell(0, 8, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
            self.set_draw_color(200, 200, 200)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, "Team ReturnClip | Hack Canada 2026 | Reactiv ClipKit Lab", align="C")

    def section_title(self, text):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(20, 60, 120)
        self.ln(4)
        self.cell(0, 10, _clean(text), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(20, 60, 120)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sub_title(self, text):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, _clean(text), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, _clean(text))
        self.ln(2)

    def bold_body(self, text):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, _clean(text))
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.cell(8, 5.5, "-")
        self.multi_cell(0, 5.5, _clean(text))
        self.ln(1)

    def numbered(self, num, text):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(20, 60, 120)
        self.cell(8, 5.5, f"{num}.")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, _clean(text))
        self.ln(1)


def generate_pitch():
    pdf = ReturnClipPDF("ReturnClip Pitch Deck")

    # Title slide
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font("Helvetica", "B", 36)
    pdf.set_text_color(20, 60, 120)
    pdf.cell(0, 15, "ReturnClip", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, "AI-Powered Returns in 30 Seconds.", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "No App. No Friction.", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(20)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Team ReturnClip  |  Hack Canada 2026", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Built on Reactiv ClipKit Lab", align="C", new_x="LMARGIN", new_y="NEXT")

    # Slide 2: Problem
    pdf.add_page()
    pdf.section_title("The Problem")
    pdf.bold_body("$100B+ Lost to Returns Every Year")
    pdf.bullet("Ecommerce returns cost merchants $100+ billion annually in North America")
    pdf.bullet("Current process: 15-30 minutes of forms, emails, and manual verification")
    pdf.bullet("Furniture/home goods: 15-22% return rate, each return eats 20-65% of item value")
    pdf.bullet("60% of returns are abandoned due to friction \u2192 chargebacks cost even more")
    pdf.bullet("Merchants cannot verify item condition at scale before accepting returns")
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 11)
    pdf.set_text_color(100, 40, 40)
    pdf.multi_cell(0, 6, _clean('"Every abandoned return becomes a chargeback. Every chargeback costs 2.5x the refund."'))

    # Slide 3: Solution
    pdf.add_page()
    pdf.section_title("The Solution")
    pdf.bold_body("ReturnClip: Scan \u2192 Snap \u2192 Refund in 30 Seconds")
    pdf.ln(2)
    pdf.numbered(1, "Scan QR on packaging (or tap Reactiv push notification 8h post-delivery)")
    pdf.numbered(2, "Confirm order \u2014 auto-loaded, select item (2 sec)")
    pdf.numbered(3, "Pick return reason \u2014 one tap (3 sec)")
    pdf.numbered(4, "Take 3 guided photos \u2014 AI-guided angles (10 sec)")
    pdf.numbered(5, "AI verifies condition \u2014 Cloudinary Vision detects damage/wear (5 sec)")
    pdf.numbered(6, "AI applies policy \u2014 Gemini reasons refund against merchant rules (instant)")
    pdf.numbered(7, "Choose refund \u2014 card, store credit (+10% bonus), or exchange (5 sec)")
    pdf.numbered(8, "Get QR return label \u2014 drop off at Canada Post, done (5 sec)")
    pdf.ln(4)
    pdf.bold_body("No app download. No account. No waiting. Just results.")

    # Slide 4: Demo
    pdf.add_page()
    pdf.section_title("Demo")
    pdf.bold_body("Live Walkthrough \u2014 Key Moments")
    pdf.bullet("Order auto-loads from URL parameters")
    pdf.bullet("Photo capture with real-time preview and guidelines")
    pdf.bullet("AI condition score: 95/100 with category breakdown (damage, wear, cleanliness, completeness)")
    pdf.bullet("Refund options with store credit bonus incentive")
    pdf.bullet("QR return label generated with CoreImage")
    pdf.ln(4)
    pdf.sub_title("Tech Stack")
    pdf.bullet("Swift + SwiftUI (zero external dependencies)")
    pdf.bullet("Cloudinary REST API (image upload + AI Vision)")
    pdf.bullet("Google Gemini 2.0 Flash (policy reasoning, structured JSON)")
    pdf.bullet("Reactiv ClipKit Lab (App Clip simulation)")

    # Slide 5: Business Model
    pdf.add_page()
    pdf.section_title("Business Model")
    pdf.sub_title("SaaS Pricing")
    pdf.bullet("Starter: $49/mo \u2014 up to 100 returns/mo, basic AI")
    pdf.bullet("Growth: $99/mo \u2014 up to 500 returns/mo, custom policies")
    pdf.bullet("Enterprise: $199/mo \u2014 unlimited, Shopify integration, analytics")
    pdf.bullet("Plus: $0.50-$2.00 per return processing fee")
    pdf.ln(4)
    pdf.sub_title("Merchant ROI")
    pdf.bullet("33% reduction in total return losses")
    pdf.bullet("$2,350/month recovered revenue (100 returns/mo baseline)")
    pdf.bullet("67% fewer chargebacks")
    pdf.bullet("3.5x increase in store credit uptake (retained revenue)")
    pdf.ln(4)
    pdf.sub_title("Market Opportunity")
    pdf.body("26M+ Shopify merchants worldwide. Even 0.1% penetration = 26,000 merchants \u00d7 $99/mo = $30M ARR.")

    # Slide 6: The Ask
    pdf.add_page()
    pdf.section_title("The Ask")
    pdf.sub_title("What We Need")
    pdf.bullet("$50K seed funding to build production Shopify integration")
    pdf.bullet("Reactiv partnership to deploy as a native Clips feature")
    pdf.bullet("3 pilot merchants (furniture/fashion/electronics) for beta testing")
    pdf.ln(4)
    pdf.sub_title("Why Now?")
    pdf.bullet("Apple App Clips adoption is accelerating")
    pdf.bullet("Reactiv's 8-hour push window is the perfect delivery mechanism")
    pdf.bullet("AI vision/reasoning costs dropped 90% in 12 months")
    pdf.bullet("No one has built AI-powered returns in an App Clip \u2014 we're first")
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 60, 120)
    pdf.multi_cell(0, 8, _clean("ReturnClip -- Because returns should take 30 seconds, not 30 minutes."), align="C")

    path = os.path.join(OUT_DIR, "ReturnClip_Pitch_Deck.pdf")
    pdf.output(path)
    print(f"Created: {path}")


def generate_qa():
    pdf = ReturnClipPDF("ReturnClip Q&A Bank")

    pdf.add_page()
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(20, 60, 120)
    pdf.cell(0, 12, "ReturnClip", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, "Judge Q&A Bank", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "Hack Canada 2026  |  Reactiv ClipKit Lab", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    questions = [
        ("Technical Questions", [
            ("How does the AI condition assessment actually work?",
             "Two-stage pipeline. First, Cloudinary receives uploaded photos and runs AI Vision to detect physical features \u2014 damage, wear, stains \u2014 with confidence scores. Second, we send those scores plus the merchant's return policy to Google Gemini 2.0 Flash, which reasons about eligibility and calculates the exact refund. Gemini returns structured JSON with the decision, amounts, and alternatives. The whole pipeline runs in under 5 seconds."),
            ("What happens if the AI makes a wrong decision?",
             "Three safeguards. First, we show the customer the full condition breakdown \u2014 it's transparent, not a black box. Second, the merchant sets the policy rules, so the AI enforces their rules, not ours. Third, if confidence is below 70%, we flag for merchant review instead of auto-deciding. The AI augments human judgment, it doesn't replace it."),
            ("Why Cloudinary + Gemini instead of a single AI service?",
             "Separation of concerns. Cloudinary is optimized for image processing \u2014 upload, CDN, and visual AI. Gemini is optimized for reasoning \u2014 reading policy and making judgment calls. Using both gives best-in-class at each stage. Also, Cloudinary handles image storage/CDN so we don't pass raw images to Gemini, keeping API costs low."),
            ("How do you handle the 15MB App Clip size limit?",
             "Our entire codebase is pure SwiftUI with zero external dependencies. No SPM packages, no bundled ML models, no video files. All AI processing happens server-side via REST APIs. The compiled binary is well under 15MB."),
            ("What about privacy?",
             "Photos upload directly to Cloudinary (SOC 2 compliant) via unsigned preset \u2014 they never touch our servers. Gemini receives only condition scores and metadata, never raw images. No personal data stored after processing. We could add on-device preprocessing in production."),
        ]),
        ("Business Questions", [
            ("How big is the market?",
             "$100+ billion in ecommerce returns annually in North America. Shopify has 26M+ merchants. Even 0.1% penetration at $99/month = $30M ARR. Furniture/home goods alone is $20B in returns \u2014 that's our beachhead."),
            ("Why would a merchant pay for this?",
             "Immediate, measurable ROI. A merchant with 100 returns/month saves $2,350/month. Our $99/month plan pays for itself 23x over. Plus, the store credit bonus means 35% choose store credit over refund \u2014 revenue retained, not returned."),
            ("What's your competitive advantage?",
             "Three things: (1) App Clip = zero customer friction, (2) AI condition verification doesn't exist in any returns product, (3) Reactiv's 8-hour push window reaches customers at peak return intent. No competitor has all three."),
            ("Who are your competitors?",
             "Loop Returns, Narvar, Returnly handle returns management but require web portals or app downloads. None do AI condition verification. None use App Clips. We're competing on the moment of verification \u2014 the highest-value, most manual part."),
            ("How does the store credit bonus work?",
             "Merchant configures a bonus (e.g., 10%). On a $299 chair, customer gets $328.90 store credit vs $299 cash. Merchant keeps the sale, customer gets more value. Drives 3.5x higher store credit uptake, retaining ~$750/month per merchant."),
        ]),
        ("Product Questions", [
            ("Why is this better as an App Clip than a web app?",
             "Three reasons: (1) Performance \u2014 native SwiftUI renders instantly vs mobile web. (2) Camera \u2014 native camera access is faster and higher quality. (3) Push notifications \u2014 the 8-hour Reactiv window provides free re-engagement. App Clips are designed for this exact use case."),
            ("What if the customer doesn't have an iPhone?",
             "The same flow can be delivered via mobile web for Android. But 80%+ of North American mobile commerce is iPhone, so App Clip coverage is commercially sufficient."),
            ("How do you handle different product categories?",
             "Merchants configure category-specific condition requirements. Furniture checks damage/wear/completeness. Electronics checks damage and packaging. The AI adapts to whatever the merchant defines \u2014 it's policy-driven, not product-driven."),
            ("What if photos are bad quality?",
             "Cloudinary's quality metrics check sharpness, brightness, and contrast before analysis. Below threshold = prompt retake. Our capture screen includes guidelines and a demo video. Good data in, good decision out."),
            ("How would you scale to production?",
             "Three phases: Phase 1 (now): MVP with mock Shopify, real Cloudinary + Gemini. Phase 2 (3 mo): Shopify Storefront API, Canada Post labels, Reactiv push templates. Phase 3 (6 mo): Merchant dashboard, analytics, multi-store. Architecture is already modular."),
            ("Why should Reactiv care?",
             "Returns are the most underserved ecommerce touchpoint. Every Shopify merchant on Reactiv could offer ReturnClip as post-purchase. It makes Reactiv stickier \u2014 merchants use Clips for service, not just sales. New revenue category."),
            ("What's your push notification strategy?",
             "Three pushes in 8h: Hour 0 \u2014 soft check-in. Hour 4 \u2014 conversion trigger. Hour 7 \u2014 urgency. After return initiated: Hour 6 reminder about label expiry."),
        ]),
    ]

    for section_title, qas in questions:
        pdf.add_page()
        pdf.section_title(section_title)
        for q, a in qas:
            if pdf.get_y() > 240:
                pdf.add_page()
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(20, 60, 120)
            pdf.multi_cell(0, 6, _clean(f"Q: {q}"))
            pdf.ln(1)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(0, 5.5, _clean(a))
            pdf.ln(5)

    path = os.path.join(OUT_DIR, "ReturnClip_QA_Bank.pdf")
    pdf.output(path)
    print(f"Created: {path}")


if __name__ == "__main__":
    generate_pitch()
    generate_qa()
    print("Done!")
