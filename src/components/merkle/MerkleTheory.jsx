import React from 'react';
import { LANG } from '../../data/lang.js';

/**
 * MerkleTheory — fully theme-aware via CSS variables.
 * All hardcoded dark colors removed and replaced with var(--*) tokens.
 */
export default function MerkleTheory({ lang = 'vi' }) {
  const t = LANG[lang].merkle;

  const nodeItems = [
    { icon: '🍃', color: '#06b6d4', label: t.leafNode,   text: t.leafNodeDesc },
    { icon: '🔗', color: '#3b82f6', label: t.parentNode, text: t.parentNodeDesc },
    { icon: '👑', color: '#a855f7', label: t.merkleRoot, text: t.merkleRootDesc },
  ];

  const legendItems = [
    { color: '#a855f7', label: t.legendRoot },
    { color: '#3b82f6', label: t.legendInternal },
    { color: '#06b6d4', label: t.legendLeaf },
  ];

  return (
    <div style={{
      width: '100%',
      background: 'var(--bg1)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '28px 32px',
      boxShadow: 'var(--shadow)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative ambient blobs */}
      <div style={{
        position: 'absolute', top: -60, left: -60,
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, right: -40,
        width: 150, height: 150,
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, position: 'relative' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
        }}>🌳</div>
        <div>
          <h3 style={{
            margin: 0, fontSize: 17, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.3px',
          }}>
            {t.theoryTitle}
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {t.theorySubtitle}
          </p>
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>

        {/* Left: Description + item list */}
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.8 }}>
            {(() => {
              const desc      = t.theoryDescPlain;
              const highlight = lang === 'vi' ? 'Cây Merkle' : 'Merkle Tree';
              const parts     = desc.split(highlight);
              return parts.map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <span style={{ color: '#a855f7', fontWeight: 600 }}>{highlight}</span>
                  )}
                </React.Fragment>
              ));
            })()}
          </p>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nodeItems.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'var(--bg2)',
                borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${item.color}33`,
                transition: 'background 0.2s',
              }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: item.color,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {item.label}
                  </span>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Mini tree diagram */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          padding: '18px 22px',
          background: 'var(--bg2)',
          borderRadius: 16,
          border: '1px solid var(--border)',
        }}>
          {/* Root */}
          <MiniNode label={t.merkleRoot} color="#a855f7" />
          <MiniLines count={2} />

          {/* Intermediate level */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MiniNode label="Hash(A+B)" color="#3b82f6" small />
              <MiniLines count={2} />
              <div style={{ display: 'flex', gap: 8 }}>
                <MiniNode label="Tx A" color="#06b6d4" tiny />
                <MiniNode label="Tx B" color="#06b6d4" tiny />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MiniNode label="Hash(C+D)" color="#3b82f6" small />
              <MiniLines count={2} />
              <div style={{ display: 'flex', gap: 8 }}>
                <MiniNode label="Tx C" color="#06b6d4" tiny />
                <MiniNode label="Tx D" color="#06b6d4" tiny />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {legendItems.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}88`, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini tree helpers ──────────────────────────────────────────────────────
function MiniNode({ label, color, small, tiny }) {
  const size = tiny
    ? { px: '5px 10px', fs: 9, br: 6 }
    : small
      ? { px: '6px 12px', fs: 10, br: 7 }
      : { px: '8px 16px', fs: 11, br: 9 };
  return (
    <div style={{
      padding: size.px,
      borderRadius: size.br,
      border: `1px solid ${color}55`,
      background: `${color}18`,
      color: color,
      fontSize: size.fs,
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      fontWeight: 700,
      letterSpacing: '0.04em',
      boxShadow: `0 0 10px ${color}20`,
    }}>
      {label}
    </div>
  );
}

function MiniLines({ count = 1 }) {
  return (
    <div style={{ display: 'flex', gap: count === 2 ? 32 : 0, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 1.5, height: 18,
          background: 'linear-gradient(to bottom, var(--border), transparent)',
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}
