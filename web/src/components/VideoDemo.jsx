import React, { useState } from 'react';
import { CLOUD_NAME } from '../cloudinaryConfig.js';

// Side Quest 2: Innovative use of Cloudinary for video
// This component hosts the merchant's "how to photograph for return" demo video
// served via Cloudinary's CDN with adaptive streaming transformations

const DEMO_VIDEO_PUBLIC_ID = 'docs/cld-sample-video'; // Cloudinary public demo video

// Build a Cloudinary video URL with streaming transformations
function buildCloudinaryVideoUrl(publicId, { quality = 'auto', format = 'auto', width = 720 } = {}) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_${quality},f_${format},w_${width}/${publicId}.mp4`;
}

// Build Cloudinary video thumbnail
function buildVideoThumbnailUrl(publicId, second = 2) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_${second},q_auto,f_auto,w_720/${publicId}.jpg`;
}

const styles = {
  container: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, color: '#1d1d1f' },
  badge: { fontSize: 12, fontWeight: 600, background: '#fff0e6', color: '#c05621', padding: '4px 10px', borderRadius: 20 },
  videoWrapper: { position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0a0a0a', aspectRatio: '16/9' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  overlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16
  },
  playBtn: {
    width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 28, transition: 'transform 0.2s, background 0.2s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 },
  transforms: { marginTop: 16, padding: 16, background: '#f8f8fc', borderRadius: 12 },
  transformTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 },
  transformList: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  transformItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' },
  transformIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  transformText: { fontSize: 12, color: '#374151' },
  transformCode: { fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }
};

const VIDEO_TRANSFORMS = [
  { icon: '🎥', name: 'Adaptive Quality', code: 'q_auto', desc: 'Auto quality per network speed' },
  { icon: '📐', name: 'Responsive Width', code: 'w_720,f_auto', desc: 'Auto format (mp4/webm/av1)' },
  { icon: '🖼️', name: 'Smart Thumbnail', code: 'so_2,f_auto', desc: 'Auto poster at 2 sec mark' },
  { icon: '✂️', name: 'Trim + Loop', code: 'so_0,eo_15,loop', desc: '15-sec guide loop ready' }
];

export default function VideoDemo() {
  const [playing, setPlaying] = useState(false);

  const videoUrl = buildCloudinaryVideoUrl(DEMO_VIDEO_PUBLIC_ID);
  const thumbUrl = buildVideoThumbnailUrl(DEMO_VIDEO_PUBLIC_ID);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>How-to Return Video</div>
        <div style={styles.badge}>Side Quest 2: Video</div>
      </div>

      <div style={styles.videoWrapper}>
        {playing ? (
          <video
            src={videoUrl}
            poster={thumbUrl}
            controls
            autoPlay
            style={styles.video}
          />
        ) : (
          <>
            <img src={thumbUrl} alt="Video thumbnail" style={{ ...styles.video, objectFit: 'cover' }} />
            <div style={styles.overlay}>
              <button
                style={styles.playBtn}
                onClick={() => setPlaying(true)}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.08)'; e.target.style.background = '#fff'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.background = 'rgba(255,255,255,0.9)'; }}
              >
                ▶
              </button>
              <div style={styles.label}>Cloudinary-served demo video</div>
            </div>
          </>
        )}
      </div>

      <div style={styles.transforms}>
        <div style={styles.transformTitle}>Applied Cloudinary Video Transforms</div>
        <div style={styles.transformList}>
          {VIDEO_TRANSFORMS.map(t => (
            <div key={t.code} style={styles.transformItem}>
              <div style={styles.transformIcon}>{t.icon}</div>
              <div>
                <div style={styles.transformText}>{t.name}</div>
                <div style={styles.transformCode}>{t.code}</div>
                <div style={{ ...styles.transformCode, marginTop: 2, color: '#9ca3af' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
        In production, merchants upload their own how-to video via the Upload Widget below.
        Cloudinary serves it globally via CDN with adaptive bitrate streaming.
      </p>
    </div>
  );
}
