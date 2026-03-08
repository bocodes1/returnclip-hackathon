import React, { useEffect, useRef, useState } from 'react';
import { CLOUD_NAME, UPLOAD_PRESET } from '../cloudinaryConfig.js';

const styles = {
  container: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, color: '#1d1d1f' },
  badge: { fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: 20 },
  uploadArea: {
    border: '2px dashed #d1d5db', borderRadius: 12, padding: 32,
    textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s'
  },
  uploadAreaHover: { borderColor: '#4f46e5', background: '#f8f8ff' },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 },
  uploadSubtitle: { fontSize: 13, color: '#9ca3af' },
  uploadBtn: {
    marginTop: 16, padding: '12px 28px', borderRadius: 12, border: 'none',
    background: '#4f46e5', color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'opacity 0.15s'
  },
  uploadedSection: { marginTop: 20 },
  uploadedTitle: { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 },
  uploadedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 },
  uploadedCard: { borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' },
  uploadedImg: { width: '100%', height: 100, objectFit: 'cover', display: 'block' },
  uploadedMeta: { padding: '6px 8px', fontSize: 11, color: '#6b7280', background: '#f9fafb' },
  info: { marginTop: 14, padding: 12, background: '#f0f0ff', borderRadius: 10, fontSize: 12, color: '#4338ca', lineHeight: 1.6 }
};

export default function UploadWidget() {
  const widgetRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Cloudinary Upload Widget script
  useEffect(() => {
    if (window.cloudinary) return;
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function openWidget() {
    if (!window.cloudinary) {
      alert('Cloudinary widget loading... please try again in a moment.');
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          sources: ['local', 'camera', 'url'],
          multiple: true,
          maxFiles: 5,
          maxFileSize: 50000000, // 50MB
          resourceType: 'auto', // accepts images + videos
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
              sourceBg: '#F9FAFB'
            }
          }
        },
        (error, result) => {
          if (error) { console.error('[upload]', error); return; }
          if (result.event === 'success') {
            const info = result.info;
            setUploads(prev => [...prev, {
              publicId: info.public_id,
              secureUrl: info.secure_url,
              format: info.format,
              resourceType: info.resource_type,
              bytes: info.bytes,
              width: info.width,
              height: info.height
            }]);
          }
        }
      );
    }

    widgetRef.current.open();
  }

  function formatBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Upload Media</div>
        <div style={styles.badge}>Cloudinary Upload Widget</div>
      </div>

      <div
        style={{ ...styles.uploadArea, ...(hover ? styles.uploadAreaHover : {}) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={openWidget}
      >
        <div style={styles.uploadIcon}>📤</div>
        <div style={styles.uploadTitle}>Upload return photos or demo video</div>
        <div style={styles.uploadSubtitle}>Supports images (JPG, PNG, WEBP) and video (MP4, MOV, AVI)</div>
        <button style={styles.uploadBtn} onClick={e => { e.stopPropagation(); openWidget(); }}>
          Open Upload Widget
        </button>
      </div>

      <div style={styles.info}>
        Uploaded files go to Cloudinary with tag <code>returnclip</code>.
        Images are auto-optimized (q_auto, f_auto).
        Videos get adaptive streaming transforms for the in-app player.
      </div>

      {uploads.length > 0 && (
        <div style={styles.uploadedSection}>
          <div style={styles.uploadedTitle}>Uploaded ({uploads.length})</div>
          <div style={styles.uploadedGrid}>
            {uploads.map((u, i) => (
              <div key={i} style={styles.uploadedCard}>
                {u.resourceType === 'image' ? (
                  <img src={u.secureUrl} alt={u.publicId} style={styles.uploadedImg} />
                ) : (
                  <div style={{ ...styles.uploadedImg, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    🎥
                  </div>
                )}
                <div style={styles.uploadedMeta}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{u.format?.toUpperCase()}</div>
                  <div>{formatBytes(u.bytes)}</div>
                  {u.width && <div>{u.width}×{u.height}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
