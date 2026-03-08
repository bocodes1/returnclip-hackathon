// Structured error codes for API responses

export class ApiError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const ErrorCodes = {
    // Validation
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_FIELD: 'MISSING_FIELD',

    // Orders
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_NOT_ELIGIBLE: 'ORDER_NOT_ELIGIBLE',

    // Returns
    CASE_NOT_FOUND: 'CASE_NOT_FOUND',
    CASE_INVALID_STATUS: 'CASE_INVALID_STATUS',
    DUPLICATE_EXECUTION: 'DUPLICATE_EXECUTION',

    // External services
    CLOUDINARY_ERROR: 'CLOUDINARY_ERROR',
    GEMINI_ERROR: 'GEMINI_ERROR',
    SHOPIFY_ERROR: 'SHOPIFY_ERROR',
    DB_ERROR: 'DB_ERROR',

    // General
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_CONFIGURED: 'NOT_CONFIGURED',
} as const;

export function errorResponse(error: ApiError) {
    return Response.json(
        {
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
        },
        { status: error.statusCode }
    );
}

export function handleRouteError(err: unknown) {
    if (err instanceof ApiError) {
        return errorResponse(err);
    }
    console.error('[UNHANDLED]', err);
    return errorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, 500, 'Internal server error')
    );
}
