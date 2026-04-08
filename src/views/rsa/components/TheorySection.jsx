import React from 'react';
import StepByStepRSA from './StepByStepRSA';

// ─── Real-world analogies ─────────────────────────────────────────────────────
const ANALOGIES = [
  {
    icon: '📬',
    title: 'Hộp thư có khóa',
    desc: 'Public Key là địa chỉ hộp thư — ai cũng biết và gửi thư vào được. Private Key là chìa khóa — chỉ bạn mở ra đọc.',
  },
  {
    icon: '🔏',
    title: 'Niêm phong phong bì',
    desc: 'Bất kỳ ai cũng có thể niêm phong (mã hóa bằng public key), nhưng chỉ người có con dấu gốc (private key) mới mở được.',
  },
  {
    icon: '✍️',
    title: 'Chữ ký tay',
    desc: 'Bạn ký bằng private key → bất kỳ ai có public key đều xác minh được chữ ký đó là của bạn, nhưng không ai giả mạo được.',
  },
];



// ─── Main TheorySection component ────────────────────────────────────────────
export default function TheorySection({ lang = 'vi' }) {
  // Use lazy loading or passed prop? Better yet, import it directly.
  return <TheorySectionContent lang={lang} />;
}

import { LANG } from '../../../data/lang.js';

function TheorySectionContent({ lang }) {
  const t = LANG[lang]?.rsa || LANG['vi'].rsa;

  return (
    <div className="rsa-section-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, margin: '0 0 12px' }}>
          {t.theoryTitle}
        </h2>
        <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          {t.theoryDesc}
        </p>
      </div>

      {/* Key pair explanation */}
      <div className="grid-2" style={{ marginBottom: 32, gap: 16 }}>
        <div className="card" style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'linear-gradient(145deg, rgba(251,191,36,0.05), var(--bg1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🔑</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--amber)' }}>{t.pubKey}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.pubKeySub}</div>
            </div>
          </div>
          <ul style={{ color: 'var(--text2)', lineHeight: 2, fontSize: 14, paddingLeft: 20, margin: 0 }}>
            <li>{t.pubKey1}</li>
            <li>{t.pubKey2}</li>
            <li>{t.pubKey3}</li>
            <li>{t.pubKey4}</li>
          </ul>
        </div>

        <div className="card" style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'linear-gradient(145deg, rgba(167,139,250,0.05), var(--bg1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🗝️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--purple)' }}>{t.privKey}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.privKeySub}</div>
            </div>
          </div>
          <ul style={{ color: 'var(--text2)', lineHeight: 2, fontSize: 14, paddingLeft: 20, margin: 0 }}>
            <li>{t.privKey1}</li>
            <li>{t.privKey2}</li>
            <li>{t.privKey3}</li>
            <li>{t.privKey4}</li>
          </ul>
        </div>
      </div>

      {/* Encryption Flow — Interactive Step Player */}
      <div className="card" style={{ marginBottom: 32 }}>
        <StepByStepRSA lang={lang} />
      </div>

      {/* Real-world analogies */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>
          💡 {t.analogiesTitle}
        </h3>
        <div className="grid-3" style={{ gap: 16 }}>
          {t.analogies.map((a, i) => (
            <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{['📬','🔏','✍️'][i]}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--cyan)' }}>{a.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
