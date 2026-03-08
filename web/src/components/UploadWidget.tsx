import { useEffect, useRef, useState } from 'react';
import { CLOUD_NAME, UPLOAD_PRESET } from '../cloudinaryConfig.ts';
import type { UploadedFile, CloudinaryWidgetOptions } from '../types/index.ts';

/**
 * Typed Cloudinary Upload Widget component — matches the pattern from create-cloudinary-react.
 *
 * Uses the Cloudinary global upload widget script (loaded dynamically).
 * Accepts images and videos and displays uploaded files in a grid.
 * All type declarations for the Cloudinary global are in src/types/index.ts.
 */

const WIDGET_OPTIONS: CloudinaryWidgetOptions = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  sources: ['local', 'camera', 'url'],
  multiple: true,
  maxFiles: 5,
  maxFileSize: 50_000_000, // 50 MB
  resourceType: 'auto',
  folder: 'returnclip/demo',
  tags: ['returnclip', 'merchant-upload'],
  showAdvancedOptions: false,
  cropping: false,
  styles: {
    palette: {
      window: '#FFFFFF',
      windowBorder: '#90A0B3',
      tabIcon: '#4f46e5',
      menuIcons: '#4f46e5',
      textDark: '#1d1d1f',
      textLight: '#FFFFFF',
      link: '#4f46e5',
      action: '#4f46e5',
      inactiveTabIcon: '#9CA3AF',
      error: '#EF4444',
      inProgress: '#4f46e5',
      complete: '#22C55E',
      sourceBg: '#F9FAFB',
    },
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadWidget() {
  const widgetRef = useRef<ReturnType<typeof window.cloudinary.createUploadWidget> | null>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [hover, setHover] = useState<boolean>(false);
  const [widgetReady, setWidgetReady] = useState<boolean>(false);

  // Load the Cloudinary Upload Widget script once
  useEffect(() => {
    if (window.cloudinary) {
      setWidgetReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    script.onload = () => setWidgetReady(true);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  function openWidget(): void {
    if (!widgetReady || !window.cloudinary) {
      alert('Cloudinary widget is loading, please try again.');
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        WIDGET_OPTIONS,
        (error, result) => {
          if (error) {
            console.error('[UploadWidget]', error);
            return;
          }
          if (result.event === 'success') {
            const info = result.info;
            const file: UploadedFile = {
              publicId: info.public_id,
              secureUrl: info.secure_url,
              format: info.format,
              resourceType: info.resource_type,
              bytes: info.bytes,
              width: info.width,
              height: info.height,
            };
            setUploads((prev) => [...prev, file]);
          }
        }
      );
    }

    widgetRef.current.open();
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>Upload Media</div>
        <div style={{ fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: 20 }}>
          Cloudinary Upload Widget
        </div>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={openWidget}
        onKeyDown={(e) => e.key === 'Enter' && openWidget()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: `2px dashed ${hover ? '#4f46e5' : '#d1d5db'}`,
          borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer',
          background: hover ? '#f8f8ff' : 'transparent', transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Upload return photos or demo video
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          Supports images (JPG, PNG, WEBP) and video (MP4, MOV, AVI) · max 50 MB
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); openWidget(); }}
          disabled={!widgetReady}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: widgetReady ? '#4f46e5' : '#a5b4fc',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: widgetReady ? 'pointer' : 'not-allowed',
          }}
        >
          {widgetReady ? 'Open Upload Widget' : 'Loading…'}
        </button>
      </div>

      <div style={{ marginTop: 14, padding: 12, background: '#f0f0ff', borderRadius: 10, fontSize: 12, color: '#4338ca', lineHeight: 1.6 }}>
        Uploaded files are tagged <code>returnclip</code> in your Cloudinary Media Library.
        Images auto-optimized (<code>q_auto, f_auto</code>). Videos get adaptive streaming transforms.
      </div>

      {/* Uploaded files grid */}
      {uploads.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Uploaded ({uploads.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {uploads.map((u, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {u.resourceType === 'image' ? (
                  <img
                    src={u.secureUrl}
                    alt={u.publicId}
                    style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: 100, background: '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  }}>
                    🎥
                  </div>
                )}
                <div style={{ padding: '6px 8px', fontSize: 11, color: '#6b7280', background: '#f9fafb' }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{u.format.toUpperCase()}</div>
                  <div>{formatBytes(u.bytes)}</div>
                  {u.width != null && <div>{u.width}×{u.height}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
