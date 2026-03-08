import React, { useState, useEffect } from 'react';
import ReturnMediaViewer from './components/ReturnMediaViewer.jsx';
import VideoDemo from './components/VideoDemo.jsx';
import UploadWidget from './components/UploadWidget.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const styles = {
  app: { minHeight: '100vh', background: '#f5f5f7' },
  nav: {
    background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px',
    display: 'flex', alignItems: 'center', height: 64, position: 'sticky', top: 0, zIndex: 10,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
  },
  logo: { fontSize: 20, fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.5px' },
  logoSub: { fontSize: 13, color: '#9ca3af', marginLeft: 8, fontWeight: 500 },
  navRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 },
  healthBadge: (ok) => ({
    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
    background: ok ? '#d1fae5' : '#fee2e2', color: ok ? '#065f46' : '#991b1b'
  }),
  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  statValue: { fontSize: 32, fontWeight: 800, color: '#4f46e5', lineHeight: 1 },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  statChange: (positive) => ({ fontSize: 12, color: positive ? '#16a34a' : '#dc2626', marginTop: 4, fontWeight: 500 }),
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 },
  techBadges: {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, marginBottom: 24
  },
  techBadge: { fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#f0f0ff', color: '#4f46e5', border: '1px solid #e0e0ff' }
};

const STATS = [
  { value: '127', label: 'Total Returns', change: '+23 this week', positive: true },
  { value: '94%', label: 'AI Accuracy', change: '+2% vs last month', positive: true },
  { value: '28s', label: 'Avg Processing', change: '-5s vs last month', positive: true },
  { value: '$12.4K', label: 'Revenue Saved', change: '+$1.2K this week', positive: true }
];

export default function App() {
  const [backendOk, setBackendOk] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBackendOk(!!d?.status))
      .catch(() => setBackendOk(false));
  }, []);

  return (
    <div style={styles.app}>
      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.logo}>ReturnClip</span>
        <span style={styles.logoSub}>Merchant Dashboard</span>
        <div style={styles.navRight}>
          <div style={styles.techBadges}>
            {['Cloudinary', 'Gemini AI', 'Shopify', 'SwiftUI'].map(t => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f0f0ff', color: '#4f46e5' }}>{t}</span>
            ))}
          </div>
          {backendOk !== null && (
            <span style={styles.healthBadge(backendOk)}>
              {backendOk ? 'Backend Online' : 'Backend Offline'}
            </span>
          )}
        </div>
      </nav>

      <main style={styles.main}>
        {/* Stats */}
        <div style={styles.statsRow}>
          {STATS.map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statChange(s.positive)}>{s.positive ? '↑' : '↓'} {s.change}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f0f0f5', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'overview', label: 'Return Photos' },
            { id: 'video', label: 'Demo Video' },
            { id: 'upload', label: 'Upload Media' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#4f46e5' : '#6b7280',
                boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div style={styles.section}>
            <ReturnMediaViewer />
          </div>
        )}

        {activeTab === 'video' && (
          <div style={{ maxWidth: 680 }}>
            <VideoDemo />
          </div>
        )}

        {activeTab === 'upload' && (
          <div style={{ maxWidth: 600 }}>
            <UploadWidget />
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: 32, padding: 20, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', marginBottom: 10 }}>Architecture</div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
            <strong>App Clip (iOS):</strong> Customer scans QR → Swift app uploads photos to Cloudinary → backend analyzes with Gemini Vision → refund decision shown in seconds<br />
            <strong>Cloudinary role:</strong> CDN for all return photos, AI-enhanced display transforms, demo video with adaptive streaming, merchant upload widget<br />
            <strong>Backend ({BACKEND_URL}):</strong> Signs Cloudinary requests, calls Gemini Vision with images, calls Shopify Admin API for refunds<br />
            <strong>Shopify:</strong> Order verification, storefront product catalog for exchange, Admin API for issuing refunds
          </div>
        </div>
      </main>
    </div>
  );
}
