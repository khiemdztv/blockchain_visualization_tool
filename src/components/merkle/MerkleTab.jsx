import React, { useState } from 'react';
import { LANG } from '../../data/lang.js';
import MerkleInputPanel from './MerkleInputPanel';
import MerkleVisualization from './MerkleVisualization';
import MerkleTheory from './MerkleTheory';

export default function MerkleTab({ lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState(null);

  const fetchMerkleTree = async (transactions) => {
    setLoading(true);
    setErrorMSG(null);
    try {
      await new Promise(r => setTimeout(r, 500));

      const response = await fetch('/api/merkle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const data = await response.json();
      setTreeData(data);
    } catch (err) {
      console.error('Failed to generate Merkle Tree:', err);
      setErrorMSG(t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: 16 }}>

      {/* ── SECTION 1: Theory ── */}
      <MerkleTheory lang={lang} />

      {/* ── SECTION 2: Visualization ── */}
      <div className="merkle-dashboard">
        
        {/* LEFT: Inputs */}
        <div className="merkle-sidebar">
          <MerkleInputPanel onGenerate={fetchMerkleTree} loading={loading} lang={lang} />
        </div>

        {/* RIGHT: Canvas */}
        <div className="merkle-canvas-area">
          <MerkleVisualization treeData={treeData} loading={loading} lang={lang} />

          {/* Error overlay */}
          {errorMSG && (
            <div style={{
              position: 'absolute', top: 16, left: '50%',
              transform: 'translateX(-50%)',
              width: '90%', maxWidth: 460,
              background: 'rgba(127,29,29,0.95)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, zIndex: 50,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              animation: 'fadeInUp 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 12, color: '#fecaca', fontWeight: 500, lineHeight: 1.5 }}>
                  {errorMSG}
                </p>
              </div>
              <button
                onClick={() => setErrorMSG(null)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(252,165,165,0.7)', cursor: 'pointer',
                  fontSize: 16, padding: 4, flexShrink: 0, lineHeight: 1,
                  borderRadius: 6, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(252,165,165,0.7)'}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
