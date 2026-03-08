import { Cloudinary } from '@cloudinary/url-gen';

// Replace with your actual Cloudinary cloud name
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

export const cld = new Cloudinary({
  cloud: { cloudName: CLOUD_NAME }
});

// Helper: build an optimized image URL with transformations
export function buildReturnPhotoUrl(publicId, { width = 800, enhance = true, bgRemoval = false } = {}) {
  let url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

  const transforms = [`w_${width}`, 'q_auto', 'f_auto'];
  if (enhance) transforms.push('e_improve', 'e_sharpen');
  if (bgRemoval) transforms.push('e_background_removal');

  url += transforms.join(',') + `/${publicId}`;
  return url;
}

// Helper: build optimized thumbnail
export function buildThumbnailUrl(publicId, size = 300) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${size},h_${size},g_auto,q_auto,f_auto/${publicId}`;
}

// Helper: build video URL with adaptive streaming transforms
export function buildVideoUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_auto,f_auto/${publicId}`;
}

// The Cloudinary upload widget preset (unsigned)
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'returnclip_demo';
export { CLOUD_NAME };
