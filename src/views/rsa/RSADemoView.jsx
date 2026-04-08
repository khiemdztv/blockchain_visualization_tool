import React, { useState } from 'react';
import TheorySection from './components/TheorySection.jsx';
import MathVisualizer from './components/MathVisualizer.jsx';
import RSACryptoSection from './components/RSACryptoSection.jsx';
import SignatureDemo from './components/SignatureDemo.jsx';
import RSAErrorBoundary from './components/RSAErrorBoundary.jsx';

const SECTIONS = [
  { id: 'theory', icon: '', label: 'Lý thuyết', labelEn: 'Theory' },
  { id: 'math', icon: '', label: 'Toán học RSA', labelEn: 'RSA Math' },
  { id: 'crypto', icon: '', label: 'RSA thực tế', labelEn: 'Real RSA' },
  { id: 'signature', icon: '', label: 'Chữ ký số', labelEn: 'Digital Signature' },
];

export default function RSADemoView({ lang = 'vi' }) {
  const [activeSection, setActiveSection] = useState('theory');

  const activeIdx = SECTIONS.findIndex(s => s.id === activeSection);

  const goNext = () => {
    const next = SECTIONS[activeIdx + 1];
    if (next) setActiveSection(next.id);
  };
  const goPrev = () => {
    const prev = SECTIONS[activeIdx - 1];
    if (prev) setActiveSection(prev.id);
  };

  return (
    <div className="page">
      {/* Hero header */}
      <div className="rsa-hero">
        <div className="rsa-hero-inner">
          <h1 style={{
            fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '0 0 12px',
            background: 'linear-gradient(135deg, var(--cyan), var(--blue), var(--purple))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Mã Hóa Bất Đối Xứng RSA
          </h1>
          <p style={{ color: 'var(--text2)', maxWidth: 560, margin: '0 auto', fontSize: 16, lineHeight: 1.7 }}>
            Hiểu trực quan toán học RSA, public/private key, chữ ký số và cách Blockchain sử dụng mật mã.
          </p>
        </div>
      </div>

      {/* Section navigation tabs */}
      <div className="rsa-section-nav-wrapper">
        <nav className="rsa-section-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`rsa-section-tab ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="rsa-tab-step">{i + 1}</span>
              <span className="rsa-tab-icon">{s.icon}</span>
              <span className="rsa-tab-label">{lang === 'vi' ? s.label : s.labelEn}</span>
            </button>
          ))}
        </nav>

        {/* Progress bar */}
        <div className="progress-bar" style={{ maxWidth: 400, margin: '0 auto', marginTop: 0 }}>
          <div className="progress-fill" style={{ width: `${((activeIdx + 1) / SECTIONS.length) * 100}%` }} />
        </div>
      </div>

      {/* Section content */}
      <div className="section">
        <RSAErrorBoundary>
          {activeSection === 'theory' && <TheorySection lang={lang} />}
          {activeSection === 'math' && <MathVisualizer lang={lang} />}
          {activeSection === 'crypto' && <RSACryptoSection lang={lang} />}
          {activeSection === 'signature' && <SignatureDemo lang={lang} />}
        </RSAErrorBoundary>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={goPrev} disabled={activeIdx === 0}
            style={{ opacity: activeIdx === 0 ? 0.4 : 1 }}>
            ← {lang === 'vi' ? 'Trước' : 'Previous'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {SECTIONS.map((s, i) => (
              <button key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === activeIdx ? 'var(--cyan)' : 'var(--bg3)',
                  transition: 'all 0.2s',
                  boxShadow: i === activeIdx ? 'var(--glow-cyan)' : 'none',
                }}
              />
            ))}
          </div>

          <button className="btn btn-primary" onClick={goNext} disabled={activeIdx === SECTIONS.length - 1}
            style={{ opacity: activeIdx === SECTIONS.length - 1 ? 0.4 : 1 }}>
            {lang === 'vi' ? 'Tiếp theo' : 'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
}
