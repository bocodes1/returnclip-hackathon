// Server-side Gemini client (API key stays on server)

import { logger } from './logger';
import type { ConditionAssessment, RefundDecision, Order, LineItem, ReturnPolicy } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export function isGeminiConfigured(): boolean {
    return Boolean(API_KEY);
}

/**
 * Analyze item condition from image URLs using Gemini
 */
export async function analyzeCondition(imageUrls: string[]): Promise<ConditionAssessment> {
    if (!isGeminiConfigured()) {
        logger.warn('Gemini not configured, returning mock assessment');
        return mockAssessment();
    }

    try {
        const prompt = `You are an AI return condition assessor. Analyze these product return images and rate the item condition.

Images provided: ${imageUrls.length}
Image URLs: ${imageUrls.join(', ')}

Rate each category from 0-100 (100 = perfect condition):
- damage: Physical damage (scratches, dents, tears)
- wear: Signs of use
- cleanliness: Stains, odors
- completeness: All parts included

Respond with JSON:
{
  "overallQualityScore": <0-100>,
  "categoryScores": [{"category": "<category>", "score": <0-100>, "notes": "<notes>"}],
  "issues": [],
  "confidence": <0-1>
}`;

        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
        });

        if (!response.ok) {
            logger.error('Gemini API error', { status: response.status });
            return mockAssessment();
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return mockAssessment();

        const parsed = JSON.parse(text);
        return {
            ...parsed,
            analysisTimestamp: new Date().toISOString(),
        };
    } catch (err) {
        logger.error('Gemini analysis failed', { error: String(err) });
        return mockAssessment();
    }
}

/**
 * Get refund decision based on assessment + policy using Gemini
 */
export async function getRefundDecision(
    order: Order,
    item: LineItem,
    reason: string,
    policy: ReturnPolicy,
    assessment: ConditionAssessment
): Promise<RefundDecision> {
    if (!isGeminiConfigured()) {
        logger.warn('Gemini not configured, returning mock decision');
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
CONDITION: Overall ${assessment.overallQualityScore}/100, confidence: ${assessment.confidence}

Respond with JSON:
{
  "decision": "full_refund"|"partial_refund"|"exchange_only"|"store_credit_only"|"denied",
  "refundAmount": <number>,
  "originalAmount": ${item.price},
  "restockingFee": <number|null>,
  "explanation": "<clear explanation>",
  "policyViolations": [],
  "alternativeOptions": [
    {"id": "<id>", "type": "refund_to_original"|"store_credit"|"exchange"|"partial_refund", "amount": <number>, "bonusAmount": <number|null>, "description": "<desc>"}
  ]
}`;

        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
        });

        if (!response.ok) {
            logger.error('Gemini decision error', { status: response.status });
            return mockDecision(item.price);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return mockDecision(item.price);

        return JSON.parse(text);
    } catch (err) {
        logger.error('Gemini decision failed', { error: String(err) });
        return mockDecision(item.price);
    }
}

// -- Mock data for when Gemini is not configured --

function mockAssessment(): ConditionAssessment {
    return {
        overallQualityScore: 95,
        categoryScores: [
            { category: 'damage', score: 98, notes: 'No visible damage' },
            { category: 'wear', score: 95, notes: 'Appears unused' },
            { category: 'cleanliness', score: 97, notes: 'Clean condition' },
            { category: 'completeness', score: 100, notes: 'All items present' },
        ],
        issues: [],
        confidence: 0.94,
        analysisTimestamp: new Date().toISOString(),
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
