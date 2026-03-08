// POST /api/returns/[caseId]/decide — Get refund decision from AI

import { getCase, getAssessment as getStoredAssessment, saveDecision, getMockOrder, getMockPolicy } from '@/lib/db';
import { getRefundDecision } from '@/lib/gemini';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const { caseId } = await params;
        const returnCase = getCase(caseId);

        if (!returnCase) {
            throw new ApiError(ErrorCodes.CASE_NOT_FOUND, 404, 'Return case not found');
        }

        const assessment = getStoredAssessment(caseId);
        if (!assessment) {
            throw new ApiError(ErrorCodes.CASE_INVALID_STATUS, 400, 'Assessment not found. Run /assess first.');
        }

        // Get order and policy data
        const order = getMockOrder(returnCase.orderId);
        const policy = getMockPolicy();

        if (!order) {
            throw new ApiError(ErrorCodes.ORDER_NOT_FOUND, 404, 'Order not found');
        }

        const item = order.lineItems.find((li) => li.id === returnCase.itemId) || order.lineItems[0];

        logger.info('Getting refund decision', { caseId, qualityScore: assessment.overallQualityScore });

        const decision = await getRefundDecision(order, item, returnCase.reason, policy, assessment);
        saveDecision(caseId, decision);

        return Response.json({ decision });
    } catch (err) {
        return handleRouteError(err);
    }
}
