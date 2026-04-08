import React from 'react';
import { LANG } from '../../data/lang.js';
import MerkleTree from './MerkleTree';
import ZoomableCanvas from './ZoomableCanvas';

// ── Error Boundary ─────────────────────────────────────────────────────────
class MerkleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error, info) {
    console.error('Merkle visualization crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: 24,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>⚠️</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {this.props.lang === 'vi' ? 'Lỗi kết xuất' : 'Render Error'}
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', maxWidth: 280 }}>
              {this.state.message}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 18px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
          >
            {this.props.lang === 'vi' ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MerkleVisualization({ treeData, loading, lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const hasContent = !loading && !!treeData?.levels;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg1)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: 12,
        background: 'var(--bg2)',
      }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 15, fontWeight: 700,
            background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {t.title}
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {t.subtitle}
          </p>
        </div>

        {/* Synced badge */}
        {hasContent && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: 'var(--cyan)',
            background: 'var(--bg3)',
            padding: '4px 10px', borderRadius: 99,
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--cyan)', display: 'inline-block',
              animation: 'pulse 2s infinite',
              flexShrink: 0,
            }} />
            {t.synced}
          </div>
        )}
      </div>

      {/* ── Canvas area ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
        // Subtle dot grid — uses CSS var so it lightens in light mode
        backgroundImage: [
          'radial-gradient(circle, var(--bg3) 1px, transparent 1px)',
        ].join(','),
        backgroundSize: '28px 28px',
        backgroundPosition: '14px 14px',
      }}>
        {loading ? (
          // Loading spinner
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 18,
          }}>
            <div style={{ position: 'relative', width: 52, height: 52 }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--border)',
                borderTopColor: '#a855f7',
                animation: 'spin 1s linear infinite',
              }} />
              {/* Inner ring */}
              <div style={{
                position: 'absolute', inset: 8,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#3b82f6',
                animation: 'spin 0.7s linear infinite reverse',
              }} />
            </div>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.18em', color: 'var(--text3)', margin: 0,
            }}>
              {t.computing}
            </p>
          </div>
        ) : hasContent ? (
          <MerkleErrorBoundary key={treeData?.root} lang={lang}>
            <ZoomableCanvas hasContent lang={lang}>
              <MerkleTree levels={treeData.levels} lang={lang} />
            </ZoomableCanvas>
          </MerkleErrorBoundary>
        ) : (
          // Empty state
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <svg width="60" height="60" viewBox="0 0 56 56" fill="none" style={{ opacity: 0.4 }}>
              <rect x="20" y="2"  width="16" height="10" rx="4" stroke="#a855f7" strokeWidth="1.5"/>
              <rect x="4"  y="22" width="16" height="10" rx="4" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="36" y="22" width="16" height="10" rx="4" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="2"  y="42" width="12" height="10" rx="3" stroke="#06b6d4" strokeWidth="1.5"/>
              <rect x="16" y="42" width="12" height="10" rx="3" stroke="#06b6d4" strokeWidth="1.5"/>
              <rect x="30" y="42" width="12" height="10" rx="3" stroke="#06b6d4" strokeWidth="1.5"/>
              <rect x="44" y="42" width="12" height="10" rx="3" stroke="#06b6d4" strokeWidth="1.5"/>
              <line x1="28" y1="12" x2="12" y2="22" stroke="var(--border)" strokeWidth="1.2"/>
              <line x1="28" y1="12" x2="44" y2="22" stroke="var(--border)" strokeWidth="1.2"/>
              <line x1="12" y1="32" x2="8"  y2="42" stroke="var(--border)" strokeWidth="1.2"/>
              <line x1="12" y1="32" x2="22" y2="42" stroke="var(--border)" strokeWidth="1.2"/>
              <line x1="44" y1="32" x2="36" y2="42" stroke="var(--border)" strokeWidth="1.2"/>
              <line x1="44" y1="32" x2="50" y2="42" stroke="var(--border)" strokeWidth="1.2"/>
            </svg>
            <p style={{
              fontSize: 12, color: 'var(--text3)',
              margin: 0, textAlign: 'center',
              maxWidth: 220, lineHeight: 1.7,
            }}>
              {t.emptyState}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
