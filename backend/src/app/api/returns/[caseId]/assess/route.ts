// POST /api/returns/[caseId]/assess — Run AI condition assessment

import { z } from 'zod';
import { getCase, getEvidence, saveAssessment } from '@/lib/db';
import { analyzeCondition } from '@/lib/gemini';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const schema = z.object({
    imageUrls: z.array(z.string()).optional(),
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
        const imageUrls = parsed.data?.imageUrls || getEvidence(caseId);

        logger.info('Running AI assessment', { caseId, imageCount: imageUrls.length });

        const assessment = await analyzeCondition(imageUrls);
        saveAssessment(caseId, assessment);

        return Response.json({ assessment });
    } catch (err) {
        return handleRouteError(err);
    }
}
