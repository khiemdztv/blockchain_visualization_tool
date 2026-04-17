import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LANG } from '../../data/lang.js';
import MerkleNode from './MerkleNode';

/**
 * MerkleTree
 *
 * Renders a level-by-level Merkle tree with SVG Bezier connectors.
 * Hover/click highlights the ancestor path from leaf → root.
 * Shows animated merge indicators (⊕) at midpoints to clearly
 * visualize how two child hashes combine into a parent.
 */
export default function MerkleTree({ levels, lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const nodeRefs    = useRef({});
  const containerRef= useRef(null);
  const [connectors,     setConnectors]     = useState([]);
  const [mergePoints,    setMergePoints]    = useState([]);
  const [hoveredId,      setHoveredId]      = useState(null);
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const [activePanelId,  setActivePanelId]  = useState(null);

  // ── Build ancestor set ──────────────────────────────────────────────────
  const getAncestorIds = useCallback((key) => {
    const ids = new Set([key]);
    let [li, ni] = key.split('-').map(Number);
    while (li > 0) {
      const parentNi = Math.floor(ni / 2);
      li -= 1;
      ni = parentNi;
      ids.add(`${li}-${ni}`);
    }
    return ids;
  }, []);

  const handleHover = useCallback((nodeId) => setHoveredId(nodeId), []);

  // Recompute highlighted set on hover/panel change
  useEffect(() => {
    const activeId = hoveredId || activePanelId;
    setHighlightedIds(activeId ? getAncestorIds(activeId) : new Set());
  }, [hoveredId, activePanelId, getAncestorIds]);

  if (!levels || !Array.isArray(levels) || levels.length === 0) return null;

  const numLevels = levels.length;

  const getLevelLabel = (li) => {
    if (li === 0) return t.levelRoot;
    if (li === numLevels - 1) return t.levelLeaf;
    return t.levelN.replace('{{n}}', numLevels - 1 - li);
  };

  const getNodeType = (li) => {
    if (li === 0) return 'root';
    if (li === numLevels - 1) return 'leaf';
    return 'intermediate';
  };

  // ── SVG connector + merge point measurement ──────────────────────────────
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const paths = [];
      const merges = [];

      for (let li = 0; li < numLevels - 1; li++) {
        const parentLevel = levels[li];
        const childLevel  = levels[li + 1];

        parentLevel.forEach((parentHash, pi) => {
          const pKey = `${li}-${pi}`;
          const parentEl = nodeRefs.current[pKey];
          if (!parentEl) return;
          const pRect = parentEl.getBoundingClientRect();
          const pX = pRect.left + pRect.width / 2 - cRect.left;
          const pY = pRect.bottom - cRect.top + 3;

          const leftIdx  = 2 * pi;
          const rightIdx = 2 * pi + 1;
          const leftChild  = childLevel[leftIdx];
          const rightChild = childLevel[rightIdx];
          const childPairs = [];

          [leftIdx, rightIdx].forEach((ci) => {
            if (ci >= childLevel.length) return;
            const cKey = `${li + 1}-${ci}`;
            const childEl = nodeRefs.current[cKey];
            if (!childEl) return;
            const cRect2 = childEl.getBoundingClientRect();
            const cX = cRect2.left + cRect2.width / 2 - cRect.left;
            const cY = cRect2.top - cRect.top - 3;
            const midY = (pY + cY) / 2;
            const d = `M ${pX} ${pY} C ${pX} ${midY + 14}, ${cX} ${midY - 14}, ${cX} ${cY}`;
            paths.push({ d, parentKey: pKey, childKey: cKey, pX, pY, cX, cY });
            childPairs.push({ cX, cY, cKey, hash: childLevel[ci] });
          });

          // Compute merge point — midway between parent and children
          if (childPairs.length >= 1) {
            const avgChildX = childPairs.reduce((s, c) => s + c.cX, 0) / childPairs.length;
            const avgChildY = childPairs.reduce((s, c) => s + c.cY, 0) / childPairs.length;
            const mergeX = (pX + avgChildX) / 2;
            const mergeY = (pY + avgChildY) / 2;
            
            merges.push({
              x: mergeX,
              y: mergeY,
              parentKey: pKey,
              parentHash: parentHash,
              leftHash: leftChild || null,
              rightHash: rightChild || leftChild || null,
              isDuplicate: !rightChild && !!leftChild,
              childKeys: childPairs.map(c => c.cKey),
            });
          }
        });
      }
      setConnectors(paths);
      setMergePoints(merges);
    };

    const timer = setTimeout(measure, 80);
    return () => clearTimeout(timer);
  }, [levels, numLevels]);

  const isPathHighlighted = (parentKey, childKey) => {
    if (!hoveredId && !activePanelId) return false;
    return highlightedIds.has(parentKey) && highlightedIds.has(childKey);
  };

  const isMergeHighlighted = (merge) => {
    if (!hoveredId && !activePanelId) return false;
    return highlightedIds.has(merge.parentKey) && merge.childKeys.some(k => highlightedIds.has(k));
  };

  return (
    <div
      ref={containerRef}
      onClick={() => setActivePanelId(null)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 68,
        width: '100%',
        paddingBlock: 44,
        userSelect: 'none',
      }}
    >
      {/* ── SVG connector overlay ── */}
      <svg
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: 1,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <defs>
          <style>
            {`
              @keyframes merkleDashFlow {
                to { stroke-dashoffset: -100; }
              }
              @keyframes merkleDashFlowUp {
                to { stroke-dashoffset: 100; }
              }
              @keyframes merkleParticlePulse {
                0%, 100% { r: 2.5; opacity: 0.6; }
                50% { r: 4; opacity: 1; }
              }
              @keyframes merkleMergeGlow {
                0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 4px rgba(168,85,247,0.4)); }
                50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(168,85,247,0.8)); }
              }
              @keyframes flowParticle {
                0% { offset-distance: 100%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { offset-distance: 0%; opacity: 0; }
              }
              .merkle-line-base {
                stroke: var(--border);
                opacity: 0.4;
                transition: opacity 0.3s;
              }
              .merkle-line-idle-flow {
                stroke: url(#lineGradient);
                stroke-width: 1.5;
                opacity: 0.35;
                stroke-dasharray: 6 12;
                animation: merkleDashFlowUp 4s linear infinite;
              }
              .merkle-line-active {
                stroke: url(#lineGradientActive);
                stroke-width: 2.5;
                filter: url(#lineGlow);
                stroke-dasharray: 8 8;
                animation: pathPulse 1.8s ease-in-out infinite, merkleDashFlowUp 1.5s linear infinite;
              }
            `}
          </style>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="mergeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="lineGradientActive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="mergeGrad">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="mergeGradActive">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* 1. Base dim lines (solid, faint foundation) */}
        {connectors.map((c, i) => (
          <path
            key={`base-${i}`}
            d={c.d}
            className="merkle-line-base"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* 2. Idle flowing energy (slow dash going UP from children to parent) */}
        {connectors.map((c, i) => {
          if (isPathHighlighted(c.parentKey, c.childKey)) return null;
          return (
            <path
              key={`idle-flow-${i}`}
              d={c.d}
              className="merkle-line-idle-flow"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {/* 3. Highlighted active paths (thick, fast flowing dash + glow) */}
        {(hoveredId || activePanelId) && connectors
          .filter(c => isPathHighlighted(c.parentKey, c.childKey))
          .map((c, i) => (
            <g key={`hi-group-${i}`}>
              <path
                d={c.d}
                className="merkle-line-active"
                fill="none"
                strokeLinecap="round"
              />
              {/* Animated flow particles going UP along the path */}
              {[0, 1, 2].map(j => (
                <circle
                  key={`particle-${i}-${j}`}
                  r="3"
                  fill="#c084fc"
                  style={{
                    offsetPath: `path("${c.d}")`,
                    offsetDistance: '100%',
                    animation: `flowParticle 2s ${j * 0.6}s ease-in-out infinite`,
                    filter: 'drop-shadow(0 0 4px #c084fc)',
                  }}
                />
              ))}
            </g>
          ))
        }

        {/* 4. Merge point indicators (⊕ symbol at midpoints) */}
        {mergePoints.map((m, i) => {
          const active = isMergeHighlighted(m);
          const r = active ? 14 : 11;
          return (
            <g
              key={`merge-${i}`}
              style={{
                animation: active ? 'merkleMergeGlow 2s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Outer glow ring */}
              {active && (
                <circle
                  cx={m.x} cy={m.y} r={r + 6}
                  fill="none"
                  stroke="url(#mergeGradActive)"
                  strokeWidth="1"
                  opacity="0.3"
                  style={{ animation: 'pulse 2s ease-in-out infinite' }}
                />
              )}
              {/* Background circle */}
              <circle
                cx={m.x} cy={m.y} r={r}
                fill={active ? 'url(#mergeGradActive)' : 'url(#mergeGrad)'}
                opacity={active ? 0.95 : 0.55}
                filter={active ? 'url(#mergeGlow)' : 'none'}
              />
              {/* ⊕ symbol — plus inside circle */}
              <line x1={m.x - (r * 0.45)} y1={m.y} x2={m.x + (r * 0.45)} y2={m.y}
                stroke="#fff" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" opacity={active ? 1 : 0.8}
              />
              <line x1={m.x} y1={m.y - (r * 0.45)} x2={m.x} y2={m.y + (r * 0.45)}
                stroke="#fff" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" opacity={active ? 1 : 0.8}
              />
            </g>
          );
        })}
      </svg>

      {/* ── Merge point HTML tooltip overlays ── */}
      {mergePoints.map((m, i) => {
        const active = isMergeHighlighted(m);
        if (!active) return null;
        const shortL = m.leftHash ? m.leftHash.slice(0, 8) + '…' : '?';
        const shortR = m.rightHash ? m.rightHash.slice(0, 8) + '…' : shortL;
        return (
          <div
            key={`merge-tooltip-${i}`}
            style={{
              position: 'absolute',
              left: m.x,
              top: m.y + 20,
              transform: 'translateX(-50%)',
              zIndex: 200,
              pointerEvents: 'none',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{
              background: 'var(--bg1)',
              border: '1px solid rgba(168,85,247,0.5)',
              borderRadius: 10,
              padding: '8px 12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(168,85,247,0.2)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              whiteSpace: 'nowrap',
              minWidth: 180,
            }}>
              {/* SHA-256 formula */}
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#a855f7',
                marginBottom: 6,
                textAlign: 'center',
              }}>
                {t.mergeFormula || 'SHA-256'}
              </div>
              {/* Visual formula: Hash(L + R) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                justifyContent: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 10,
              }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93c5fd',
                }}>{shortL}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#c084fc',
                  textShadow: '0 0 8px rgba(192,132,252,0.5)',
                }}>+</span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(6,182,212,0.15)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  color: '#67e8f9',
                }}>{shortR}</span>
              </div>
              {/* Arrow down */}
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#a855f7',
                margin: '3px 0',
                lineHeight: 1,
              }}>↓</div>
              {/* Result */}
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 9.5,
                textAlign: 'center',
                color: '#d8b4fe',
                padding: '3px 6px',
                borderRadius: 5,
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}>
                {m.parentHash.slice(0, 16)}…
              </div>
              {m.isDuplicate && (
                <div style={{
                  marginTop: 4,
                  fontSize: 9,
                  textAlign: 'center',
                  color: '#06b6d4',
                  fontStyle: 'italic',
                }}>
                  {t.mergeDuplicate || '⚠ Duplicated (L = R)'}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Level rows ── */}
      {levels.map((levelArray, li) => (
        <div
          key={li}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            zIndex: 100 - li,
            width: '100%',
          }}
        >
          {/* Level label */}
          <span style={{
            fontSize: 9,
            letterSpacing: '0.24em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            fontFamily: 'var(--mono)',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}>
            {getLevelLabel(li)}
          </span>

          {/* Node row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'nowrap',
          }}>
            {levelArray.map((hash, ni) => {
              const nodeKey    = `${li}-${ni}`;
              const leftChild  = levels[li + 1]?.[2 * ni]     ?? null;
              const rightChild = levels[li + 1]?.[2 * ni + 1] ?? null;
              return (
                <div
                  key={ni}
                  ref={el => { nodeRefs.current[nodeKey] = el; }}
                  style={{ flexShrink: 0 }}
                >
                  <MerkleNode
                    hash={hash}
                    type={getNodeType(li)}
                    isRoot={li === 0}
                    leftChild={leftChild}
                    rightChild={rightChild}
                    nodeId={nodeKey}
                    isHighlighted={highlightedIds.has(nodeKey)}
                    onHover={handleHover}
                    lang={lang}
                    panelOpen={activePanelId === nodeKey}
                    onTogglePanel={(forceState) => {
                      if (forceState === false) setActivePanelId(null);
                      else setActivePanelId(prev => prev === nodeKey ? null : nodeKey);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
