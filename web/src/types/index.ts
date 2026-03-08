// Shared TypeScript interfaces for ReturnClip merchant dashboard

export type ReturnStatus = 'approved' | 'partial' | 'denied' | 'pending';

export interface ReturnSubmission {
  id: string;
  orderId: string;
  item: string;
  status: ReturnStatus;
  score: number;
  /** Cloudinary public_ids — used with AdvancedImage for SDK-based rendering */
  publicIds: string[];
}

export interface UploadedFile {
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
  bytes: number;
  width?: number;
  height?: number;
}

export interface VideoTransform {
  icon: string;
  name: string;
  code: string;
  desc: string;
}

export interface Stat {
  value: string;
  label: string;
  change: string;
  positive: boolean;
}

export type TabId = 'overview' | 'video' | 'upload';

// Cloudinary Upload Widget — global type declaration
declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: CloudinaryWidgetOptions,
        callback: (error: CloudinaryWidgetError | null, result: CloudinaryWidgetResult) => void
      ) => CloudinaryWidget;
    };
  }
}

export interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  sources?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  resourceType?: string;
  folder?: string;
  tags?: string[];
  showAdvancedOptions?: boolean;
  cropping?: boolean;
  styles?: {
    palette?: Record<string, string>;
  };
}

export interface CloudinaryWidgetError {
  message: string;
  status: number;
}

export interface CloudinaryWidgetResult {
  event: string;
  info: CloudinaryUploadInfo;
}

export interface CloudinaryUploadInfo {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  bytes: number;
  width?: number;
  height?: number;
}

export interface CloudinaryWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
}
