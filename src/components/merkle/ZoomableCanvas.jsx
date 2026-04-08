import React, { useState, useEffect, useRef } from 'react';
import { LANG } from '../../data/lang.js';

/**
 * ZoomableCanvas
 *
 * Supports Zoom via buttons (+/−/Reset) and Pinch-to-Zoom on mobile.
 * Employs native CSS overflow for 1-finger scrolling/panning.
 */

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function ZoomableCanvas({ children, hasContent, lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const [scale, setScale] = useState(1);
  const pinchRef = useRef({ startDist: 0, startScale: 1 });

  // Reset when new tree is built
  useEffect(() => {
    if (hasContent) setScale(1);
  }, [hasContent]);

  const zoomIn  = () => setScale(s => Math.min(3, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.3, s - 0.25));
  const reset   = () => setScale(1);

  // ── Pinch to Zoom Handlers ──
  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && hasContent) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.startDist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      pinchRef.current.startScale = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && hasContent) {
      // Notice: React passive event warnings may occur if preventDefault is called.
      // However, touchAction: 'pan-x pan-y' in CSS prevents native zoom nicely.
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const startD = Math.max(1, pinchRef.current.startDist || 1);
      const newScale = pinchRef.current.startScale * (dist / startD);
      if (!Number.isNaN(newScale)) {
        setScale(Math.min(Math.max(0.3, newScale), 3));
      }
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',     // scrollbars appear if content is larger than canvas
        cursor: 'default',
        userSelect: 'none',
        touchAction: 'pan-x pan-y', // allows 1-finger scroll, disables native pinch
      }}
    >
      {/* ── Transform wrapper ──────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        minWidth: '100%',
        width: 'max-content',
        minHeight: '100%',
        height: 'max-content',
        padding: '32px 64px 48px',
      }}>
        <div
          className="zoom-content"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 100ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      {hasContent && (
        <>
          {/* Scale badge */}
          <div style={badgeStyle}>
            {Math.round(scale * 100)}%
          </div>

          {/* Button cluster */}
          <div style={clusterStyle}>
            <CtrlBtn
              onClick={zoomIn}
              disabled={scale >= 3}
              title={t.zoomIn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </CtrlBtn>

            <CtrlBtn
              onClick={zoomOut}
              disabled={scale <= 0.3}
              title={t.zoomOut}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </CtrlBtn>

            <div style={{ height: 1, background: 'rgba(148,163,184,0.15)', margin: '3px 0' }} />

            <CtrlBtn onClick={reset} title={t.resetView}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </CtrlBtn>
          </div>

          {/* Step indicator */}
          <div style={stepStyle}>
            {ZOOM_PRESETS.map((preset, i) => {
              // Highlight the dot if it's the closest preset
              const isClosest = Math.abs(scale - preset) < 0.125;
              return (
                <button
                  key={i}
                  onClick={() => setScale(preset)}
                  title={`${Math.round(preset * 100)}%`}
                  style={{
                    width: isClosest ? 20 : 8,
                    height: 4, borderRadius: 99,
                    background: isClosest ? 'var(--cyan)' : 'var(--bg3)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    padding: 0, flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Control button ─────────────────────────────────────────────────────────
function CtrlBtn({ children, onClick, title, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov && !disabled ? 'rgba(192,132,252,0.1)' : 'var(--bg-card)',
        border: `1px solid ${hov && !disabled ? 'var(--cyan)' : 'var(--border)'}`,
        borderRadius: 8,
        color: disabled ? 'var(--text3)' : hov ? 'var(--cyan)' : 'var(--text2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        backdropFilter: 'blur(8px)',
        padding: 0, flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ── Static style objects ───────────────────────────────────────────────────
const badgeStyle = {
  position: 'absolute', top: 12, left: 12, zIndex: 10,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8, padding: '4px 10px',
  fontSize: 11, color: 'var(--text2)',
  fontFamily: 'monospace', letterSpacing: '0.06em',
  pointerEvents: 'none', userSelect: 'none',
  backdropFilter: 'blur(8px)',
};

const clusterStyle = {
  position: 'absolute', top: 12, right: 12, zIndex: 10,
  display: 'flex', flexDirection: 'column', gap: 4,
};

const stepStyle = {
  position: 'absolute', bottom: 14, left: '50%',
  transform: 'translateX(-50%)', zIndex: 10,
  display: 'flex', gap: 4, alignItems: 'center',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 99, padding: '6px 10px',
  backdropFilter: 'blur(6px)',
};
