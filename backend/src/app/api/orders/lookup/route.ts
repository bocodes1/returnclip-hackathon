// POST /api/orders/lookup — Lookup order by merchant ID, order number, email

import { z } from 'zod';
import { lookupOrder } from '@/lib/shopify';
import { ApiError, ErrorCodes, handleRouteError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const schema = z.object({
    merchantId: z.string().min(1),
    orderNumber: z.string().min(1),
    email: z.string().default(''),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            throw new ApiError(ErrorCodes.INVALID_REQUEST, 400, 'Invalid request', {
                issues: parsed.error.issues,
            });
        }

        const { orderNumber, email } = parsed.data;
        logger.info('Order lookup', { orderNumber, email: email ? '***' : 'none' });

        const result = await lookupOrder(orderNumber, email);

        if (!result) {
            throw new ApiError(ErrorCodes.ORDER_NOT_FOUND, 404, 'Order not found');
        }

        return Response.json(result);
    } catch (err) {
        return handleRouteError(err);
    }
}
