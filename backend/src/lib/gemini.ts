// AI Vision via OpenRouter → Gemini 2.0 Flash

import { logger } from './logger';
import type { ConditionAssessment, RefundDecision, Order, LineItem, ReturnPolicy } from '@/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

function getApiKey(): string {
    return process.env.OPENROUTER_API_KEY || '';
}

export function isGeminiConfigured(): boolean {
    return Boolean(getApiKey());
}

// ── Condition analysis ─────────────────────────────────────────────────────────

function buildVisionPrompt(productName: string): string {
    return `You are a product return condition inspector for an e-commerce platform.

PRODUCT BEING RETURNED: "${productName}"

STEP 1 — PRODUCT VERIFICATION:
First, determine whether the photos actually show this product. If the photos show a completely different type of item (e.g., a t-shirt when a couch is being returned), set product_match to false and condition_class to "unknown".

STEP 2 — CONDITION ASSESSMENT (only if product_match is true):
Classify the item into exactly one condition class:
- "mint": No visible damage, stains, or wear. Looks new or like-new.
- "shipment_damage": Damage clearly from shipping/transit — crushed corners, dents, punctures, tears from handling.
- "heavy_damage": Significant damage from use or abuse. Broken parts, major stains, deep scratches, structural damage.
- "unknown": Image quality too poor, wrong product, or condition cannot be determined.

Score each category 0-100 based on ONLY what you actually see:
- damage_score: 100=no damage, 0=destroyed
- wear_score: 100=brand new, 0=heavily used
- cleanliness_score: 100=spotless, 0=heavily soiled
- completeness_score: 100=all parts present, 0=major parts missing

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "product_match": true|false,
  "product_found": "<what you actually see in the photos>",
  "condition_class": "mint"|"shipment_damage"|"heavy_damage"|"unknown",
  "returnable": true|false,
  "confidence": <0.0-1.0>,
  "overall_quality_score": <0-100>,
  "damage_score": <0-100>,
  "wear_score": <0-100>,
  "cleanliness_score": <0-100>,
  "completeness_score": <0-100>,
  "issues_detected": ["<specific issue you see>"],
  "reason_summary": "<1-2 sentences describing what you actually observed in the photos>",
  "recommended_action": "full_refund"|"partial_refund"|"exchange"|"denied"|"manual_review"
}`;
}

export async function analyzeCondition(imageUrls: string[], productName = 'the returned item'): Promise<ConditionAssessment> {
    const apiKey = getApiKey();
    if (!apiKey) {
        logger.warn('OpenRouter not configured, returning fallback');
        return fallbackAssessment('OPENROUTER_API_KEY not set');
    }
    if (imageUrls.length === 0) {
        return fallbackAssessment('No evidence images provided');
    }

    try {
        // Build content array: text prompt + image URLs (OpenRouter passes URLs directly to Gemini)
        const content: unknown[] = [{ type: 'text', text: buildVisionPrompt(productName) }];
        for (const url of imageUrls.slice(0, 5)) {
            content.push({ type: 'image_url', image_url: { url } });
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://returnclip.app',
                'X-Title': 'ReturnClip',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content }],
                temperature: 0.1,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error('OpenRouter API error', { status: response.status, body: errText });
            return fallbackAssessment(`OpenRouter error ${response.status}`);
        }

        const data = await response.json();
        const text: string = data?.choices?.[0]?.message?.content ?? '';
        if (!text) return fallbackAssessment('Empty response from AI');

        const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // If the photos show the wrong product, score 0 — not applicable
        if (parsed.product_match === false) {
            logger.warn('Product mismatch detected', { productName, productFound: parsed.product_found });
            return wrongProductAssessment(productName, parsed.product_found ?? 'unknown');
        }

        const conditionClass: string = parsed.condition_class ?? 'unknown';
        const confidence: number = parsed.confidence ?? 0;
        const overallQualityScore: number = parsed.overall_quality_score ?? 50;

        const categoryScores: ConditionAssessment['categoryScores'] = [
            { category: 'damage', score: parsed.damage_score ?? 50 },
            { category: 'wear', score: parsed.wear_score ?? 50 },
            { category: 'cleanliness', score: parsed.cleanliness_score ?? 50 },
            { category: 'completeness', score: parsed.completeness_score ?? 50 },
        ];

        const issues = (parsed.issues_detected ?? []).map((desc: string, i: number) => ({
            id: `issue_${i + 1}`,
            category: 'damage' as const,
            severity: conditionClass === 'heavy_damage' ? 'major' as const : 'minor' as const,
            description: desc,
        }));

        logger.info('Gemini Vision assessment complete', { conditionClass, confidence, overallQualityScore, productMatch: parsed.product_match });

        return {
            overallQualityScore,
            categoryScores,
            issues,
            confidence,
            analysisTimestamp: new Date().toISOString(),
            conditionClass,
            returnable: parsed.returnable ?? conditionClass !== 'heavy_damage',
            reasonSummary: parsed.reason_summary ?? '',
            recommendedAction: parsed.recommended_action ?? 'manual_review',
            aiMode: 'gemini',
        };
    } catch (err) {
        logger.error('Gemini Vision analysis failed', { error: String(err) });
        return fallbackAssessment(String(err));
    }
}

// ── Refund decision ────────────────────────────────────────────────────────────

export async function getRefundDecision(
    order: Order,
    item: LineItem,
    reason: string,
    policy: ReturnPolicy,
    assessment: ConditionAssessment
): Promise<RefundDecision> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return mockDecision(item.price);
    }

    try {
        const daysSincePurchase = Math.floor(
            (Date.now() - new Date(order.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        const prompt = `You are a return policy enforcement AI. Analyze this return request.

ORDER: ${order.orderNumber}, Item: ${item.title} ($${item.price}), ${daysSincePurchase} days ago
REASON: ${reason}
POLICY: ${policy.merchantName}, ${policy.returnWindowDays}-day window, restocking fee ${policy.restockingFeePercent}% if quality < ${policy.restockingFeeThreshold}
CONDITION: Overall ${assessment.overallQualityScore}/100, confidence: ${assessment.confidence}, class: ${assessment.conditionClass ?? 'unknown'}
AI SUMMARY: ${assessment.reasonSummary ?? 'N/A'}

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "decision": "full_refund"|"partial_refund"|"exchange_only"|"store_credit_only"|"denied",
  "refundAmount": <number>,
  "originalAmount": ${item.price},
  "restockingFee": <number or null>,
  "explanation": "<clear explanation for the customer>",
  "policyViolations": [],
  "alternativeOptions": [
    {"id": "<id>", "type": "refund_to_original"|"store_credit"|"exchange"|"partial_refund", "amount": <number>, "bonusAmount": <number or null>, "description": "<desc>"}
  ]
}`;

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://returnclip.app',
                'X-Title': 'ReturnClip',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            logger.error('OpenRouter decision error', { status: response.status });
            return mockDecision(item.price);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) return mockDecision(item.price);

        const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        logger.error('Gemini decision failed', { error: String(err) });
        return mockDecision(item.price);
    }
}

// ── Fallback ───────────────────────────────────────────────────────────────────

function wrongProductAssessment(expected: string, found: string): ConditionAssessment {
    return {
        overallQualityScore: 0,
        categoryScores: [
            { category: 'damage', score: 0, notes: 'Not applicable' },
            { category: 'wear', score: 0, notes: 'Not applicable' },
            { category: 'cleanliness', score: 0, notes: 'Not applicable' },
            { category: 'completeness', score: 0, notes: 'Not applicable' },
        ],
        issues: [],
        confidence: 1,
        analysisTimestamp: new Date().toISOString(),
        conditionClass: 'wrong_product',
        returnable: false,
        reasonSummary: `Wrong item submitted. Expected "${expected}" but photos show "${found}". Return cannot be processed.`,
        recommendedAction: 'denied',
        aiMode: 'gemini',
        fallbackReason: `Wrong product: expected "${expected}", found "${found}"`,
    };
}

function fallbackAssessment(reason: string): ConditionAssessment {
    return {
        overallQualityScore: 50,
        categoryScores: [
            { category: 'damage', score: 50, notes: 'Could not assess' },
            { category: 'wear', score: 50, notes: 'Could not assess' },
            { category: 'cleanliness', score: 50, notes: 'Could not assess' },
            { category: 'completeness', score: 50, notes: 'Could not assess' },
        ],
        issues: [],
        confidence: 0,
        analysisTimestamp: new Date().toISOString(),
        conditionClass: 'unknown',
        returnable: true,
        reasonSummary: 'AI analysis unavailable — manual review required.',
        recommendedAction: 'manual_review',
        aiMode: 'fallback',
        fallbackReason: reason,
    };
}

function mockDecision(price: number): RefundDecision {
    return {
        decision: 'full_refund',
        refundAmount: price,
        originalAmount: price,
        explanation: 'Item is in excellent condition within the return window. Full refund approved.',
        policyViolations: [],
        alternativeOptions: [
            { id: 'opt_1', type: 'refund_to_original', amount: price, description: 'Full refund to original payment method' },
            { id: 'opt_2', type: 'store_credit', amount: price, bonusAmount: price * 0.1, description: `Store credit with 10% bonus ($${(price * 1.1).toFixed(2)} total)` },
            { id: 'opt_3', type: 'exchange', amount: price, description: 'Exchange for different color/size' },
        ],
    };
}
