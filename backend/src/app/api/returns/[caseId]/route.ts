// GET /api/returns/[caseId] — Get return case status
// POST /api/returns/[caseId]/evidence — Submit evidence
// These are handled via Next.js dynamic routes

import { getCase } from '@/lib/db';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const { caseId } = await params;
        const returnCase = getCase(caseId);

        if (!returnCase) {
            throw new ApiError(ErrorCodes.CASE_NOT_FOUND, 404, 'Return case not found');
        }

        return Response.json(returnCase);
    } catch (err) {
        return handleRouteError(err);
    }
}
