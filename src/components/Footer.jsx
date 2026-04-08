import React from 'react';
import { LANG } from '../data/lang.js';

/* ─── Main Footer — single line ───────────────────────────────────── */
export default function Footer({ lang = 'vi' }) {
  const t = LANG[lang];
  return (
    <footer style={{
      borderTop: '1px solid rgba(56,189,248,0.12)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '14px 24px',
      textAlign: 'center',
      fontSize: 12,
      letterSpacing: '0.02em',
      background: 'linear-gradient(160deg, #05071a 0%, #080d24 45%, #060918 100%)',
    }}>
      <span style={{ color: '#64748b' }}>{t.footerDesc}</span>
      <span style={{ color: '#475569' }}>{t.footerDescMid}</span>
      <span style={{
        background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        fontWeight: 700,
      }}>HubBlock Team</span>
      <span style={{ color: '#334155' }}> · {t.footerUni}</span>
    </footer>
  );
}
