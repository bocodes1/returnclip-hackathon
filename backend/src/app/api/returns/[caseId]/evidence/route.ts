// POST /api/returns/[caseId]/evidence — Submit evidence (image URLs)

import { z } from 'zod';
import { getCase, addEvidence } from '@/lib/db';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const schema = z.object({
    imageUrls: z.array(z.string().url()).min(1),
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

        addEvidence(caseId, parsed.data.imageUrls);
        logger.info('Evidence submitted', { caseId, count: parsed.data.imageUrls.length });

        return Response.json({ success: true, count: parsed.data.imageUrls.length });
    } catch (err) {
        return handleRouteError(err);
    }
}
