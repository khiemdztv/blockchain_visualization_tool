import React, { useState, useEffect } from 'react';
import { LANG } from '../../data/lang.js';

export default function MerkleInputPanel({ onGenerate, loading, lang = 'vi' }) {
  const t = LANG[lang].merkle;

  // Build default transactions from translation keys so they're always localized
  const getDefaultTransactions = (tObj) => [
    tObj.defaultTxA,
    tObj.defaultTxB,
    tObj.defaultTxC,
    tObj.defaultTxD,
  ];

  const [transactions, setTransactions] = useState(() => getDefaultTransactions(LANG[lang].merkle));
  const [error, setError] = useState(null);

  // Re-sync defaults when language changes (only if user hasn't edited them)
  useEffect(() => {
    setTransactions(prev => {
      const prevDefaults = getDefaultTransactions(LANG[lang === 'vi' ? 'en' : 'vi'].merkle);
      const currDefaults = getDefaultTransactions(LANG[lang].merkle);
      // Only auto-replace entries that match the old defaults (user-typed entries are preserved)
      return prev.map((tx, i) =>
        prevDefaults[i] === tx ? (currDefaults[i] ?? tx) : tx
      );
    });
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleChange = (i, val) => {
    const next = [...transactions];
    next[i] = val;
    setTransactions(next);
    setError(null);
  };

  const addTx = () => {
    if (transactions.length >= 16) {
      setError(t.errorMaxReached);
      return;
    }
    const label = String.fromCharCode(65 + transactions.length);
    const newTxLabel = t.transactionLabel.replace('{{label}}', label);
    setTransactions([...transactions, newTxLabel]);
  };

  const removeTx = (i) => {
    if (transactions.length <= 1) {
      setError(t.errorMinRequired);
      return;
    }
    setTransactions(transactions.filter((_, idx) => idx !== i));
    setError(null);
  };

  const handleGenerate = () => {
    const empties = transactions.filter(tx => !tx.trim());
    if (empties.length > 0) {
      setError(t.errorEmptyTransaction);
      return;
    }
    setError(null);
    onGenerate(transactions);
  };

  const txCount = transactions.length;
  const txCountLabel = txCount === 1
    ? t.transactionCount_one.replace('{{count}}', txCount)
    : t.transactionCount_other.replace('{{count}}', txCount);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-glass)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      padding: 20,
      backdropFilter: 'blur(16px)',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
          {t.blockDataTitle}
        </h3>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
          {t.blockDataDesc}
        </p>
      </div>

      {/* Transaction list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 12,
        paddingRight: 2,
      }}>
        {transactions.map((tx, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Index badge */}
            <div style={{
              width: 22, height: 22, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: 'var(--text3)',
              fontFamily: 'var(--mono)',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg2)',
              userSelect: 'none',
            }}>
              {i + 1}
            </div>

            {/* Input */}
            <input
              type="text"
              value={tx}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={t.transactionPlaceholder}
              style={{
                flex: 1,
                height: 40,
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 12,
                padding: '0 12px',
                fontFamily: 'var(--mono)',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--cyan)';
                e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.12)';
                e.target.style.background = 'var(--bg-input-focus)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'var(--bg-input)';
              }}
            />

            {/* Remove */}
            <button
              onClick={() => removeTx(i)}
              title={t.removeTitle}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 14, cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={addTx}
          style={{
            marginTop: 4,
            height: 36,
            background: 'var(--bg2)',
            border: '1px dashed var(--border2)',
            borderRadius: 10,
            color: 'var(--purple)',
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s',
            fontFamily: 'var(--mono)',
            fontWeight: 600,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg3)';
            e.currentTarget.style.borderColor = 'var(--cyan)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg2)';
            e.currentTarget.style.borderColor = 'var(--border2)';
          }}
        >
          {t.addTransaction}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 10,
          fontSize: 11,
          color: '#f87171',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Tx count info */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, fontSize: 10, color: 'var(--text3)',
      }}>
        <span>{txCountLabel}</span>
        <span style={{ color: txCount >= 16 ? 'var(--red)' : 'var(--text3)' }}>
          {t.maxTransactions}
        </span>
      </div>

      {/* Generate button */}
      <button
        disabled={loading}
        onClick={handleGenerate}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 12,
          border: 'none',
          background: loading
            ? 'rgba(30,41,59,0.6)'
            : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
          opacity: loading ? 0.6 : 1,
          letterSpacing: '0.02em',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.5)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(124,58,237,0.35)';
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 16, height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            {t.buildingTree}
          </>
        ) : (
          <>{t.buildTree}</>
        )}
      </button>
    </div>
  );
}
