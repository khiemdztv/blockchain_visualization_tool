import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { LANG } from '../../data/lang.js';

/**
 * MerkleNode — theme-aware node with portal-based Detail Panel.
 *
 * Uses CSS variables exclusively for colors so Light/Dark mode
 * is automatic. Node accent colors (purple/blue/cyan) are explicit
 * brand colors that work on both backgrounds.
 */

// ── Per-type accent palette (works on any background) ─────────────────────
const TYPE_TOKENS = {
  root: {
    accent:     '#a855f7',
    accentSoft: 'rgba(168,85,247,0.15)',
    accentBorder:'rgba(168,85,247,0.5)',
    glow:       '0 0 0 1px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.3)',
    glowActive: '0 0 0 2px rgba(168,85,247,0.7), 0 0 32px rgba(168,85,247,0.5)',
    text:       '#d8b4fe',
  },
  intermediate: {
    accent:     '#3b82f6',
    accentSoft: 'rgba(59,130,246,0.12)',
    accentBorder:'rgba(59,130,246,0.4)',
    glow:       '0 0 0 1px rgba(59,130,246,0.3), 0 0 16px rgba(59,130,246,0.25)',
    glowActive: '0 0 0 2px rgba(59,130,246,0.6), 0 0 28px rgba(59,130,246,0.45)',
    text:       '#93c5fd',
  },
  leaf: {
    accent:     '#06b6d4',
    accentSoft: 'rgba(6,182,212,0.1)',
    accentBorder:'rgba(6,182,212,0.35)',
    glow:       '0 0 0 1px rgba(6,182,212,0.25), 0 0 14px rgba(6,182,212,0.2)',
    glowActive: '0 0 0 2px rgba(6,182,212,0.55), 0 0 24px rgba(6,182,212,0.4)',
    text:       '#67e8f9',
  },
};

// ── Portal-based floating panel ────────────────────────────────────────────
function DetailPanel({ anchorRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  // Position panel below anchor
  useEffect(() => {
    const place = () => {
      if (!anchorRef.current || !panelRef.current) return;
      const anchor = anchorRef.current.getBoundingClientRect();
      const panel  = panelRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top  = anchor.bottom + window.scrollY + 10;
      let left = anchor.left + anchor.width / 2 - panel.width / 2 + window.scrollX;

      // Clamp horizontally
      if (left < 8) left = 8;
      if (left + panel.width > vw - 8) left = vw - panel.width - 8;

      // Flip above if not enough space below
      if (anchor.bottom + panel.height + 20 > vh) {
        top = anchor.top + window.scrollY - panel.height - 10;
      }

      setPos({ top, left });
    };

    // Mount first (invisible), then position
    setMounted(true);
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', place); };
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the same click that opened
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose, anchorRef]);

  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        width: 300,
        zIndex: 9999,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        pointerEvents: mounted ? 'auto' : 'none',
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MerkleNode({
  hash = '',
  type = 'leaf',
  isRoot = false,
  label,
  leftChild,
  rightChild,
  isHighlighted = false,
  onHover,
  nodeId,
  lang = 'vi',
  panelOpen: propPanelOpen,
  onTogglePanel,
}) {
  const t = LANG[lang].merkle;
  const [copied, setCopied]     = useState(false);
  const [hovered, setHovered]   = useState(false);
  const nodeRef                 = useRef(null);

  const isPanelOpen = propPanelOpen !== undefined ? propPanelOpen : false;

  const handleToggle = (e) => {
    e?.stopPropagation();
    if (onTogglePanel) onTogglePanel();
  };

  const handleClose = () => {
    if (onTogglePanel) onTogglePanel(false);
  };

  const shortHash = hash.length > 16
    ? `${hash.slice(0, 6)}…${hash.slice(-6)}`
    : hash;

  const copy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text || hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const s = TYPE_TOKENS[type] || TYPE_TOKENS.leaf;
  const isActive = hovered || isHighlighted;

  const getNodeTypeLabel = () => {
    if (isRoot) return t.nodeTypeRoot;
    if (type === 'intermediate') return t.nodeTypeInternal;
    return t.nodeTypeLeaf;
  };

  const getExplanation = () => {
    if (isRoot) return t.explRoot;
    if (type === 'intermediate') return t.explIntermediate;
    const displayLabel = label || hash.slice(0, 12) + '…';
    return t.explLeaf.replace('{{label}}', displayLabel);
  };

  // ── Panel Content ──────────────────────────────────────────────────────
  const PanelContent = (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--bg1)',
        border: `1px solid ${s.accentBorder}`,
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: `0 16px 48px rgba(0,0,0,0.25), ${s.glow}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text3)',
          cursor: 'pointer', fontSize: 12, lineHeight: 1,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg3)';
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.borderColor = 'var(--text2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text3)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        ✕
      </button>

      {/* Type badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 99,
        background: s.accentSoft,
        border: `1px solid ${s.accentBorder}`,
        marginBottom: 14,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: s.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {getNodeTypeLabel()}
        </span>
      </div>

      {/* Label */}
      {label && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.panelTransaction}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
        </div>
      )}

      {/* Full hash */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.panelShaHash}
          </span>
          <button
            onClick={e => copy(e, hash)}
            style={{
              fontSize: 10,
              color: copied ? s.accent : 'var(--text3)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
              transition: 'color 0.2s',
              borderRadius: 4,
            }}
          >
            {copied ? t.panelCopied : t.panelCopy}
          </button>
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, color: s.text,
          wordBreak: 'break-all', lineHeight: 1.7,
          background: 'var(--bg3)', borderRadius: 8,
          padding: '8px 10px',
          border: `1px solid ${s.accentBorder}`,
        }}>
          {hash}
        </div>
      </div>

      {/* Children hashes */}
      {(leftChild || rightChild) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
            {t.panelChildHashes}
          </div>
          {leftChild && (
            <div style={{ marginBottom: 5, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--blue)', fontWeight: 600, flexShrink: 0 }}>{t.panelLeft}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>{leftChild.slice(0, 20)}…</span>
            </div>
          )}
          {rightChild ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#06b6d4', fontWeight: 600, flexShrink: 0 }}>{t.panelRight}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>{rightChild.slice(0, 20)}…</span>
            </div>
          ) : leftChild ? (
            <div style={{
              marginTop: 6,
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.25)',
              padding: '8px 10px', borderRadius: 8,
            }}>
              <span style={{ fontSize: 10, color: '#06b6d4', fontWeight: 700, display: 'block', marginBottom: 3 }}>
                {lang === 'vi' ? '⚠️ Nhánh mồ côi (Nhân đôi)' : '⚠️ Orphan Branch (Duplicated)'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
                {lang === 'vi' ? 'Node này được tính bằng Hash(Trái + Trái)' : 'This node is computed as Hash(Left + Left)'}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Explanation */}
      <div style={{
        background: 'var(--bg3)', borderRadius: 10,
        padding: '10px 12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 10, color: s.accent, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t.panelHowComputed}
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text)', lineHeight: 1.65 }}>
          {getExplanation()}
        </p>
      </div>
    </div>
  );

  // ── Node Box ───────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        ref={nodeRef}
        onClick={handleToggle}
        onMouseEnter={() => { setHovered(true); onHover && onHover(nodeId); }}
        onMouseLeave={() => { setHovered(false); onHover && onHover(null); }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: isRoot ? 164 : 124,
          minHeight: 52,
          padding: '9px 14px',
          borderRadius: 14,
          border: `1.5px solid ${isActive ? s.accent : s.accentBorder}`,
          background: isActive
            ? s.accentSoft
            : 'var(--bg2)',
          boxShadow: isActive ? s.glowActive : s.glow,
          transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: hovered ? 'scale(1.07) translateY(-3px)' : isPanelOpen ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          userSelect: 'none',
          outline: isPanelOpen ? `2px solid ${s.accent}` : 'none',
          outlineOffset: 2,
        }}
      >
        {/* Root crown label */}
        {isRoot && (
          <span style={{
            fontSize: 7,
            letterSpacing: '0.2em',
            color: s.accent,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            marginBottom: 2,
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {t.merkleRootLabel}
          </span>
        )}

        {/* Hash text */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: isActive ? s.text : 'var(--text2)',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          transition: 'color 0.2s',
        }}>
          {shortHash}
        </span>

        {/* Pulse dot when hovered + no panel */}
        {hovered && !isPanelOpen && (
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%)',
            width: 5, height: 5, borderRadius: '50%',
            background: s.accent,
            boxShadow: `0 0 8px ${s.accent}`,
            animation: 'dotPulse 1s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Portal panel */}
      {isPanelOpen && (
        <DetailPanel anchorRef={nodeRef} onClose={handleClose}>
          {PanelContent}
        </DetailPanel>
      )}
    </div>
  );
}
