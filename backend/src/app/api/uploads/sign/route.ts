// POST /api/uploads/sign — Generate signed Cloudinary upload params

import { z } from 'zod';
import { generateSignedUploadParams } from '@/lib/cloudinary';
import { handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const schema = z.object({
    caseId: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return Response.json({ error: 'Invalid request' }, { status: 400 });
        }

        logger.info('Generating signed upload params', { caseId: parsed.data.caseId });

        const params = generateSignedUploadParams();
        return Response.json(params);
    } catch (err) {
        return handleRouteError(err);
    }
}
