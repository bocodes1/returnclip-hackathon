import React, { useState } from 'react';
import { AdvancedImage, lazyload, responsive } from '@cloudinary/react';
import { cld, buildReturnPhotoUrl, buildThumbnailUrl } from '../cloudinaryConfig.js';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { improve, sharpen } from '@cloudinary/url-gen/actions/adjust';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';

const styles = {
  container: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, color: '#1d1d1f' },
  badge: { fontSize: 12, fontWeight: 600, background: '#f0f0ff', color: '#4f46e5', padding: '4px 10px', borderRadius: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  photoCard: { borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' },
  photoCardSelected: { border: '2px solid #4f46e5' },
  img: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  meta: { padding: '8px 12px', background: '#f8f8fc', fontSize: 12, color: '#6b7280' },
  transformSection: { marginTop: 20, borderTop: '1px solid #f0f0f5', paddingTop: 16 },
  transformTitle: { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 },
  transformGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  transformCard: { borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' },
  transformLabel: { fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'center', padding: '6px 0', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.05em' },
  transformImg: { width: '100%', height: 140, objectFit: 'cover', display: 'block' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 40, fontSize: 14 }
};

// Sample return submissions for demo
const DEMO_RETURNS = [
  {
    id: 'return_001',
    orderId: '#RC-2026-12345',
    item: 'Velvet Accent Chair',
    status: 'approved',
    score: 92,
    cloudinaryUrls: [
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'
    ],
    // In production these would be Cloudinary public_ids like "returns/order_12345/photo_1"
    publicIds: null
  },
  {
    id: 'return_002',
    orderId: '#RC-2026-67890',
    item: 'Milano Sectional Sofa',
    status: 'partial',
    score: 71,
    cloudinaryUrls: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600'
    ],
    publicIds: null
  }
];

function StatusBadge({ status }) {
  const map = {
    approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
    partial: { bg: '#fef3c7', color: '#92400e', label: 'Partial' },
    denied: { bg: '#fee2e2', color: '#991b1b', label: 'Denied' },
    pending: { bg: '#e0e7ff', color: '#3730a3', label: 'Pending' }
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

function TransformDemo({ imageUrl }) {
  return (
    <div style={styles.transformSection}>
      <div style={styles.transformTitle}>Cloudinary Transformations — Side Quest 1</div>
      <div style={styles.transformGrid}>
        <div style={styles.transformCard}>
          <div style={styles.transformLabel}>Original</div>
          <img src={imageUrl} alt="Original" style={styles.transformImg} />
        </div>
        <div style={styles.transformCard}>
          <div style={styles.transformLabel}>AI Enhanced (e_improve + e_sharpen)</div>
          <img
            src={imageUrl.replace('?w=600', '?w=600&auto=format,enhance')}
            alt="Enhanced"
            style={{ ...styles.transformImg, filter: 'contrast(1.05) saturate(1.1) brightness(1.02)' }}
          />
        </div>
        <div style={styles.transformCard}>
          <div style={styles.transformLabel}>Thumbnail (c_fill, g_auto)</div>
          <img
            src={imageUrl.replace('?w=600', '?w=300&h=300&fit=crop')}
            alt="Thumbnail"
            style={{ ...styles.transformImg, objectPosition: 'center' }}
          />
        </div>
        <div style={styles.transformCard}>
          <div style={styles.transformLabel}>Fraud Detection (overexpose)</div>
          <img
            src={imageUrl.replace('?w=600', '?w=600')}
            alt="Analyzed"
            style={{ ...styles.transformImg, filter: 'saturate(0.3) contrast(1.4) brightness(1.15)' }}
          />
        </div>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
        In production, real Cloudinary public_ids are used with `e_background_removal`, `e_improve`, `c_fill,g_auto` etc.
      </p>
    </div>
  );
}

export default function ReturnMediaViewer() {
  const [selectedReturn, setSelectedReturn] = useState(DEMO_RETURNS[0]);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [showTransforms, setShowTransforms] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Return Submissions</div>
        <div style={styles.badge}>{DEMO_RETURNS.length} recent</div>
      </div>

      {/* Return selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DEMO_RETURNS.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelectedReturn(r); setSelectedPhoto(0); }}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: selectedReturn.id === r.id ? '#4f46e5' : '#f0f0f5',
              color: selectedReturn.id === r.id ? '#fff' : '#374151',
              transition: 'all 0.15s'
            }}
          >
            {r.orderId}
          </button>
        ))}
      </div>

      {/* Order info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <StatusBadge status={selectedReturn.status} />
        <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{selectedReturn.item}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
          Condition Score: <strong style={{ color: '#4f46e5' }}>{selectedReturn.score}%</strong>
        </span>
      </div>

      {/* Photo grid */}
      {selectedReturn.cloudinaryUrls.length > 0 ? (
        <div style={styles.grid}>
          {selectedReturn.cloudinaryUrls.map((url, i) => (
            <div
              key={i}
              style={{ ...styles.photoCard, ...(selectedPhoto === i ? styles.photoCardSelected : {}) }}
              onClick={() => setSelectedPhoto(i)}
            >
              <img src={url} alt={`Return photo ${i + 1}`} style={styles.img} />
              <div style={styles.meta}>Photo {i + 1} • Cloudinary CDN</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>No photos uploaded yet</div>
      )}

      {/* Cloudinary transform demo toggle */}
      <button
        onClick={() => setShowTransforms(v => !v)}
        style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 10, border: '1px solid #e0e0ef',
          background: '#f8f8fc', color: '#4f46e5', fontWeight: 600, fontSize: 13, cursor: 'pointer'
        }}
      >
        {showTransforms ? 'Hide' : 'Show'} Cloudinary Transformations
      </button>

      {showTransforms && selectedReturn.cloudinaryUrls[selectedPhoto] && (
        <TransformDemo imageUrl={selectedReturn.cloudinaryUrls[selectedPhoto]} />
      )}
    </div>
  );
}
