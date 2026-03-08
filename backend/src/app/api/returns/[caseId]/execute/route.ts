// POST /api/returns/[caseId]/execute — Execute the refund

import { z } from 'zod';
import { getCase, getDecision, executeCase } from '@/lib/db';
import { executeRefund } from '@/lib/shopify';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const schema = z.object({
    selectedOptionId: z.string().min(1),
    idempotencyKey: z.string().min(1),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const { caseId } = await params;
        const returnCase = getCase(caseId);

        if (!returnCase) {
            throw new ApiError(ErrorCodes.CASE_NOT_FOUND, 404, 'Return case not found');
        }

        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return Response.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
        }

        const { selectedOptionId, idempotencyKey } = parsed.data;

        // Execute with idempotency check
        const result = executeCase(caseId, selectedOptionId, idempotencyKey);

        if (result.isDuplicate) {
            logger.warn('Duplicate execution attempt', { caseId, idempotencyKey });
            return Response.json({
                executionId: result.executionId,
                status: result.status,
                message: 'Already executed (idempotent)',
            });
        }

        // Try Shopify refund if configured
        const decision = getDecision(caseId);
        if (decision) {
            const selectedOption = decision.alternativeOptions.find((o) => o.id === selectedOptionId);
            if (selectedOption && returnCase.orderId) {
                const shopifyResult = await executeRefund(
                    returnCase.orderId,
                    selectedOption.amount
                );
                logger.info('Refund execution result', { caseId, ...shopifyResult });
            }
        }

        logger.info('Return executed', { caseId, executionId: result.executionId });

        return Response.json({
            executionId: result.executionId,
            status: result.status,
            refundAmount: decision?.refundAmount,
        });
    } catch (err) {
        return handleRouteError(err);
    }
}
