// Server-side Cloudinary client (secrets stay on server)

import crypto from 'crypto';
import { logger } from './logger';
import type { SignedUploadParams } from '@/types';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'returnclip';

export function isCloudinaryConfigured(): boolean {
    return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Generate signed upload params for client-side upload.
 * Client uploads directly to Cloudinary using these params.
 */
export function generateSignedUploadParams(): SignedUploadParams {
    const timestamp = Math.floor(Date.now() / 1000);

    if (!isCloudinaryConfigured()) {
        logger.warn('Cloudinary not configured, returning demo params');
        return {
            cloudName: 'demo',
            uploadPreset: UPLOAD_PRESET,
            timestamp,
        };
    }

    // Generate signature
    const paramsToSign = `timestamp=${timestamp}&upload_preset=${UPLOAD_PRESET}`;
    const signature = crypto
        .createHash('sha256')
        .update(paramsToSign + API_SECRET)
        .digest('hex');

    return {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        signature,
        timestamp,
        apiKey: API_KEY,
    };
}
