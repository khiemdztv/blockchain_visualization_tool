import React, { useState, useEffect } from 'react';
import { LANG } from '../../data/lang.js';
import MerkleInputPanel from './MerkleInputPanel';
import MerkleVisualization from './MerkleVisualization';
import MerkleTheory from './MerkleTheory';
import { sha256browser } from '../../utils/crypto.js';

export default function MerkleTab({ lang = 'vi' }) {
  const t = LANG[lang].merkle;
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState(null);
  const [isGenerated, setIsGenerated] = useState(false);

  // Build default transactions from translation keys so they're always localized
  const getDefaultTransactions = (langVal) => [
    LANG[langVal].merkle.defaultTxA,
    LANG[langVal].merkle.defaultTxB,
    LANG[langVal].merkle.defaultTxC,
    LANG[langVal].merkle.defaultTxD,
  ];

  const [transactions, setTransactions] = useState(() => getDefaultTransactions(lang));

  // Re-sync defaults when language changes (only if user hasn't edited them)
  useEffect(() => {
    setTransactions(prev => {
      const prevDefaults = getDefaultTransactions(lang === 'vi' ? 'en' : 'vi');
      const currDefaults = getDefaultTransactions(lang);
      return prev.map((tx, i) =>
        prevDefaults[i] === tx ? (currDefaults[i] ?? tx) : tx
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const buildLocalMerkleTree = async (txs) => {
    if (!txs || txs.length === 0) return null;
    const leafHashes = [];
    for (const tx of txs) {
      leafHashes.push(await sha256browser(tx || ''));
    }
    let working = [...leafHashes];
    const levels = [[...leafHashes]];
    while (working.length > 1) {
      const next = [];
      if (working.length % 2 === 1) {
        working.push(working[working.length - 1]);
      }
      for (let i = 0; i < working.length; i += 2) {
        const combined = working[i] + working[i+1];
        const h = await sha256browser(combined);
        next.push(h);
      }
      levels.unshift(next);
      working = next;
    }
    return {
      root: working[0],
      levels,
      transactions: txs.map((d, i) => ({ data: d, hash: leafHashes[i] }))
    };
  };

  // Auto-update Merkle tree in real-time when inputs change (only if generated once)
  useEffect(() => {
    if (!isGenerated) return;
    
    // Check if there are empty transactions - if so, don't update to avoid half-empty UI state
    if (transactions.some(tx => !tx.trim())) return;

    let isCurrent = true;
    const updateTree = async () => {
      try {
        const tree = await buildLocalMerkleTree(transactions);
        if (isCurrent) {
          setTreeData(tree);
        }
      } catch (err) {
        console.error('Failed to auto-update Merkle Tree:', err);
      }
    };
    updateTree();
    return () => { isCurrent = false; };
  }, [transactions, isGenerated]);

  const fetchMerkleTree = async (txs) => {
    setLoading(true);
    setErrorMSG(null);
    try {
      // Small visual delay to show a premium loading state
      await new Promise(r => setTimeout(r, 300));
      const tree = await buildLocalMerkleTree(txs);
      setTreeData(tree);
      setIsGenerated(true);
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
          <MerkleInputPanel 
            transactions={transactions} 
            setTransactions={setTransactions} 
            onGenerate={fetchMerkleTree} 
            loading={loading} 
            lang={lang} 
          />
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
