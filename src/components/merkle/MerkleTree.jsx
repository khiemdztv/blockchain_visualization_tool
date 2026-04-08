import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LANG } from '../../data/lang.js';
import MerkleNode from './MerkleNode';

/**
 * MerkleTree
 *
 * Renders a level-by-level Merkle tree with SVG Bezier connectors.
 * Hover/click highlights the ancestor path from leaf → root.
 * Connector colors adapt to Light/Dark via CSS variables.
 */
export default function MerkleTree({ levels, lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const nodeRefs    = useRef({});
  const containerRef= useRef(null);
  const [connectors,     setConnectors]     = useState([]);
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

  // ── SVG connector measurement ───────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const paths = [];

      for (let li = 0; li < numLevels - 1; li++) {
        const parentLevel = levels[li];
        const childLevel  = levels[li + 1];

        parentLevel.forEach((_, pi) => {
          const pKey = `${li}-${pi}`;
          const parentEl = nodeRefs.current[pKey];
          if (!parentEl) return;
          const pRect = parentEl.getBoundingClientRect();
          const pX = pRect.left + pRect.width / 2 - cRect.left;
          const pY = pRect.bottom - cRect.top + 3;

          [2 * pi, 2 * pi + 1].forEach((ci) => {
            if (ci >= childLevel.length) return;
            const cKey = `${li + 1}-${ci}`;
            const childEl = nodeRefs.current[cKey];
            if (!childEl) return;
            const cRect2 = childEl.getBoundingClientRect();
            const cX = cRect2.left + cRect2.width / 2 - cRect.left;
            const cY = cRect2.top - cRect.top - 3;
            const midY = (pY + cY) / 2;
            const d = `M ${pX} ${pY} C ${pX} ${midY + 14}, ${cX} ${midY - 14}, ${cX} ${cY}`;
            paths.push({ d, parentKey: pKey, childKey: cKey });
          });
        });
      }
      setConnectors(paths);
    };

    const timer = setTimeout(measure, 80);
    return () => clearTimeout(timer);
  }, [levels, numLevels]);

  const isPathHighlighted = (parentKey, childKey) => {
    if (!hoveredId && !activePanelId) return false;
    return highlightedIds.has(parentKey) && highlightedIds.has(childKey);
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
                animation: merkleDashFlow 4s linear infinite;
              }
              .merkle-line-active {
                stroke: url(#lineGradient);
                stroke-width: 2.5;
                filter: url(#lineGlow);
                stroke-dasharray: 8 8;
                animation: pathPulse 1.8s ease-in-out infinite, merkleDashFlow 1.5s linear infinite;
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
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>
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

        {/* 2. Idle flowing energy (slow dash along all non-highlighted lines) */}
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
            <path
              key={`hi-${i}`}
              d={c.d}
              className="merkle-line-active"
              fill="none"
              strokeLinecap="round"
            />
          ))
        }
      </svg>

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
