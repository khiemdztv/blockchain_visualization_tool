import React, { useState } from 'react';

// ─── Demo data ─────────────────────────────────────────────────────────────────
const demo = {
  publicKey:  '(n=3233, e=17)',
  privateKey: '(d=2753)',
  plaintext:  'HELLO',
  ciphertext: '855 · 220 · 123 · 855 · 372',
};

// ─── Translations ──────────────────────────────────────────────────────────────
const T = {
  vi: {
    sectionTitle: 'Alice & Bob — Quy trình mã hóa RSA',
    sectionSub:   'Nhấn từng bước để theo dõi dữ liệu di chuyển qua toàn bộ quy trình',
    prev:         '← Trước',
    next:         'Tiếp →',
    done:         '🏁 Hoàn thành!',
    completedTitle: 'Bạn đã hiểu quy trình RSA!',
    completedSub:   'Vòng tròn dữ liệu hoàn chỉnh',
    publicLabel:  'Công khai',
    privateLabel: 'Bí mật',
    hoverHint:    'Hover để xem • Không bao giờ chia sẻ!',
    steps: [
      {
        label: 'B1',
        title: 'Bob tạo cặp khóa',
        subtitle: 'Sinh ra Public Key và Private Key từ cùng một phép toán',
        p1: 'Bob chạy thuật toán RSA để tạo ra',
        p1pub: 'Public Key',
        p1and: 'và',
        p1priv: 'Private Key',
        p1end: '. Hai khóa này có quan hệ toán học — một khóa mã hóa, khóa kia giải mã.',
        pubHint: '📢 Chia sẻ công khai — ai cũng có thể biết',
        privHint: '🔒 Hover để xem • Không bao giờ chia sẻ!',
        mathNote: 'Toán học đằng sau: n = p × q = 61 × 53 = 3233. Chỉ người biết p và q (Bob) mới có thể tính ra d = 2753.',
      },
      {
        label: 'B2',
        title: 'Bob gửi Public Key cho Alice',
        subtitle: 'Public Key có thể truyền đi thoải mái, không cần bảo mật',
        arrow: '→ gửi qua email / web / bất kỳ đâu →',
        received: 'Alice nhận được Public Key',
        receivedEnd: 'từ Bob. Cô ấy có thể dùng nó để mã hóa tin nhắn chỉ Bob đọc được.',
        safeTitle: 'Không cần kênh bảo mật.',
        safeDesc: 'Dù hacker có chặn được Public Key cũng không làm gì được — họ không có Private Key để giải mã.',
      },
      {
        label: 'B3',
        title: 'Alice mã hóa thông điệp',
        subtitle: 'Dùng Public Key của Bob để biến plaintext → ciphertext',
        p1: 'Alice muốn gửi bí mật cho Bob. Cô ấy dùng Public Key',
        p1end: 'để mã hóa từ',
        plaintextLabel: 'Plaintext (Alice viết)',
        ciphertextLabel: 'Ciphertext (gửi đi)',
        encryptLabel: '🔒 Encrypt(m, e=17, n=3233)',
        mathNote: 'Cách tính: Mỗi chữ cái được ánh xạ thành số (H=72, E=69…), sau đó tính m^e mod n. Ví dụ: H = 72^17 mod 3233 = 855.',
      },
      {
        label: 'B4',
        title: 'Gửi Ciphertext qua Internet',
        subtitle: 'Kẻ tấn công có thể thấy nhưng không thể đọc',
        internetLabel: '🌐 Internet',
        hackerTitle: 'Hacker chặn được ciphertext:',
        hackerFail: '❌ Không có Private Key → Không thể giải mã!',
        p1: 'Ciphertext',
        p1end: 'trông như một dãy số vô nghĩa. Ngay cả siêu máy tính cũng không thể brute-force RSA-2048 trong thời gian hợp lý.',
      },
      {
        label: 'B5',
        title: 'Bob giải mã — thu lại plaintext',
        subtitle: 'Chỉ Private Key của Bob mới mở được tin nhắn này',
        p1: 'Bob nhận ciphertext và dùng',
        p1priv: 'Private Key',
        p1end: 'để giải mã.',
        receivedLabel: 'Bob nhận được',
        decryptLabel: '🔓 Decrypt(c, d=2753, n=3233)',
        restoredLabel: 'Plaintext khôi phục',
        matchLabel: '✅ Khớp hoàn toàn!',
        recapTitle: 'Toàn bộ luồng dữ liệu:',
      },
    ],
  },
  en: {
    sectionTitle: 'Alice & Bob — RSA Encryption Process',
    sectionSub:   'Click each step to follow the data through the entire process',
    prev:         '← Prev',
    next:         'Next →',
    done:         '🏁 Done!',
    completedTitle: 'You understand RSA now!',
    completedSub:   'Complete data cycle',
    publicLabel:  'Public',
    privateLabel: 'Secret',
    hoverHint:    'Hover to reveal • Never share!',
    steps: [
      {
        label: 'S1',
        title: 'Bob creates a key pair',
        subtitle: 'Generate Public Key and Private Key from the same math operation',
        p1: 'Bob runs the RSA algorithm to create a',
        p1pub: 'Public Key',
        p1and: 'and a',
        p1priv: 'Private Key',
        p1end: '. These keys are mathematically linked — one encrypts, the other decrypts.',
        pubHint: '📢 Share freely — anyone can know it',
        privHint: '🔒 Hover to reveal • Never share!',
        mathNote: 'Math behind it: n = p × q = 61 × 53 = 3233. Only knowing p and q (Bob) allows computing d = 2753.',
      },
      {
        label: 'S2',
        title: 'Bob sends Public Key to Alice',
        subtitle: 'Public Key can be sent over any channel — no security needed',
        arrow: '→ send via email / web / anywhere →',
        received: 'Alice receives Public Key',
        receivedEnd: 'from Bob. She can use it to encrypt a message only Bob can read.',
        safeTitle: 'No secure channel needed.',
        safeDesc: 'Even if a hacker intercepts the Public Key, they can\'t do anything — they don\'t have the Private Key to decrypt.',
      },
      {
        label: 'S3',
        title: 'Alice encrypts the message',
        subtitle: 'Use Bob\'s Public Key to turn plaintext → ciphertext',
        p1: 'Alice wants to send a secret to Bob. She uses Public Key',
        p1end: 'to encrypt the word',
        plaintextLabel: 'Plaintext (Alice writes)',
        ciphertextLabel: 'Ciphertext (sent out)',
        encryptLabel: '🔒 Encrypt(m, e=17, n=3233)',
        mathNote: 'How it works: Each letter maps to a number (H=72, E=69…), then compute m^e mod n. Example: H = 72^17 mod 3233 = 855.',
      },
      {
        label: 'S4',
        title: 'Send Ciphertext over Internet',
        subtitle: 'An attacker can see it but cannot read it',
        internetLabel: '🌐 Internet',
        hackerTitle: 'Hacker intercepts ciphertext:',
        hackerFail: '❌ No Private Key → Cannot decrypt!',
        p1: 'The ciphertext',
        p1end: 'looks like meaningless numbers. Even supercomputers cannot brute-force RSA-2048 in any reasonable time.',
      },
      {
        label: 'S5',
        title: 'Bob decrypts — recovers plaintext',
        subtitle: 'Only Bob\'s Private Key can unlock this message',
        p1: 'Bob receives the ciphertext and uses his',
        p1priv: 'Private Key',
        p1end: 'to decrypt it.',
        receivedLabel: 'Bob receives',
        decryptLabel: '🔓 Decrypt(c, d=2753, n=3233)',
        restoredLabel: 'Plaintext restored',
        matchLabel: '✅ Exact match!',
        recapTitle: 'Full data flow:',
      },
    ],
  },
};

// ─── Step colours ──────────────────────────────────────────────────────────────
const COLORS = [
  { color: '#60a5fa', bg: 'rgba(96,165,250,0.09)',  border: 'rgba(96,165,250,0.38)'  },
  { color: '#34d399', bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.38)'  },
  { color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.38)'  },
  { color: '#fb923c', bg: 'rgba(251,146,60,0.09)',  border: 'rgba(251,146,60,0.38)'  },
  { color: '#a78bfa', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.38)' },
];

// ─── Step content renderers ────────────────────────────────────────────────────
function Step1Content({ s, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
        {s.p1} <strong style={{ color: '#fbbf24' }}>{s.p1pub}</strong> {s.p1and}{' '}
        <strong style={{ color: '#a78bfa' }}>{s.p1priv}</strong>{s.p1end}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* Public Key */}
        <div style={{ flex: 1, minWidth: 160, borderRadius: 12, padding: '12px 14px',
          background: 'rgba(251,191,36,0.08)', border: '1.5px solid rgba(251,191,36,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🔑</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fbbf24' }}>Public Key</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Công khai</span>
          </div>
          <code style={{ display: 'block', fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: '#fbbf24' }}>
            {demo.publicKey}
          </code>
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: '8px 0 0' }}>{s.pubHint}</p>
        </div>

        {/* Private Key */}
        <div style={{ flex: 1, minWidth: 160, borderRadius: 12, padding: '12px 14px',
          background: 'rgba(167,139,250,0.08)', border: '1.5px solid rgba(167,139,250,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🗝️</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>Private Key</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Bí mật</span>
          </div>
          <code style={{ display: 'block', fontSize: 15, fontWeight: 800, fontFamily: 'monospace',
            color: '#a78bfa', filter: 'blur(4px)', transition: 'filter 0.3s', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.filter = 'blur(0)'}
            onMouseLeave={e => e.target.style.filter = 'blur(4px)'}>
            {demo.privateKey}
          </code>
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: '8px 0 0' }}>{s.privHint}</p>
        </div>
      </div>

      <div style={{ borderRadius: 8, padding: '10px 12px', fontSize: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        color: 'var(--text3)', lineHeight: 1.7 }}>
        💡 <strong style={{ color: 'var(--text2)' }}>{s.mathNote}</strong>
      </div>
    </div>
  );
}

function Step2Content({ s, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Arrow visual */}
      <div style={{ borderRadius: 14, padding: 16,
        background: 'rgba(52,211,153,0.06)', border: '1.5px solid rgba(52,211,153,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <ActorPill name="Bob" emoji="👨" color={color} />
          <div style={{ flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <code style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color, textAlign: 'center' }}>
              🔑 {demo.publicKey}
            </code>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
              <span style={{ fontSize: 16, color }}>→</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, ${color})` }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.arrow}</span>
          </div>
          <ActorPill name="Alice" emoji="👩" color={color} />
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
        {s.received}{' '}
        <code style={{ padding: '1px 6px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
          background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{demo.publicKey}</code>{' '}
        {s.receivedEnd}
      </p>

      <div style={{ borderRadius: 8, padding: '10px 12px', fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
        background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)',
        color: 'var(--text2)', lineHeight: 1.7 }}>
        <span style={{ flexShrink: 0 }}>✅</span>
        <span><strong style={{ color: '#34d399' }}>{s.safeTitle}</strong> {s.safeDesc}</span>
      </div>
    </div>
  );
}

function Step3Content({ s, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
        {s.p1}{' '}
        <code style={{ padding: '1px 6px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
          background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{demo.publicKey}</code>{' '}
        {s.p1end} "<strong style={{ color: '#34d399' }}>{demo.plaintext}</strong>".
      </p>

      {/* Pipeline card */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(251,191,36,0.3)' }}>
        {/* Plaintext row */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(52,211,153,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 2 }}>{s.plaintextLabel}</div>
            <code style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4, color: '#34d399' }}>
              {demo.plaintext}
            </code>
          </div>
        </div>

        {/* Encrypt function row */}
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(251,191,36,0.04)' }}>
          <div style={{ flex: 1, borderTop: '1px dashed rgba(251,191,36,0.4)' }} />
          <code style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap',
            background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{s.encryptLabel}</code>
          <div style={{ flex: 1, borderTop: '1px dashed rgba(251,191,36,0.4)' }} />
          <span style={{ fontSize: 14 }}>▼</span>
        </div>

        {/* Ciphertext row */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(251,191,36,0.08)' }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 2 }}>{s.ciphertextLabel}</div>
            <code style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace', color: '#fbbf24' }}>
              {demo.ciphertext}
            </code>
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 8, padding: '10px 12px', fontSize: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        color: 'var(--text3)', lineHeight: 1.7 }}>
        🧮 {s.mathNote}
      </div>
    </div>
  );
}

function Step4Content({ s, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Transit visual */}
      <div style={{ borderRadius: 14, padding: 14,
        background: 'rgba(251,146,60,0.06)', border: '1.5px solid rgba(251,146,60,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
          <ActorPill name="Alice" emoji="👩" color={color} />
          <div style={{ flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <code style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color, textAlign: 'center' }}>
              {demo.ciphertext}
            </code>
            <div style={{ width: '100%', height: 1, background: `rgba(251,146,60,0.5)` }} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.internetLabel}</span>
          </div>
          <ActorPill name="Bob" emoji="👨" color={color} />
        </div>

        {/* Hacker */}
        <div style={{ borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🕵️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#f87171' }}>{s.hackerTitle}</div>
            <code style={{ fontSize: 13, fontFamily: 'monospace', color }}>{ demo.ciphertext }</code>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 16 }}>🤔</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{s.hackerFail}</span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
        {s.p1}{' '}
        <code style={{ padding: '1px 6px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
          background: 'rgba(251,146,60,0.15)', color }}>{demo.ciphertext}</code>{' '}
        {s.p1end}
      </p>
    </div>
  );
}

function Step5Content({ s, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
        {s.p1} <strong style={{ color: '#a78bfa' }}>{s.p1priv}</strong>{' '}
        <code style={{ padding: '1px 6px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
          background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{demo.privateKey}</code>{' '}
        {s.p1end}
      </p>

      {/* Pipeline card */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(167,139,250,0.3)' }}>
        {/* Ciphertext input */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(251,146,60,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 2 }}>{s.receivedLabel}</div>
            <code style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: '#fb923c' }}>
              {demo.ciphertext}
            </code>
          </div>
        </div>

        {/* Decrypt function row */}
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(167,139,250,0.04)' }}>
          <div style={{ flex: 1, borderTop: '1px dashed rgba(167,139,250,0.4)' }} />
          <code style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap',
            background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{s.decryptLabel}</code>
          <div style={{ flex: 1, borderTop: '1px dashed rgba(167,139,250,0.4)' }} />
          <span style={{ fontSize: 14 }}>▼</span>
        </div>

        {/* Plaintext output */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(52,211,153,0.08)' }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 2 }}>{s.restoredLabel}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <code style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4, color: '#34d399' }}>
                {demo.plaintext}
              </code>
              <span style={{ fontSize: 14, color: '#34d399' }}>{s.matchLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full recap */}
      <div style={{ borderRadius: 10, padding: '12px 14px',
        background: 'rgba(52,211,153,0.06)', border: '1.5px solid rgba(52,211,153,0.22)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>
          🔄 {s.recapTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: 'monospace', fontWeight: 800 }}>
          <span style={{ fontSize: 14, color: '#34d399' }}>"{demo.plaintext}"</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>→ encrypt →</span>
          <span style={{ fontSize: 13, color: '#fb923c' }}>"{demo.ciphertext}"</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>→ decrypt →</span>
          <span style={{ fontSize: 14, color: '#34d399' }}>"{demo.plaintext}"</span>
          <span style={{ fontSize: 14 }}>✅</span>
        </div>
      </div>
    </div>
  );
}

// ─── Actor pill ────────────────────────────────────────────────────────────────
function ActorPill({ name, emoji, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, border: `2px solid ${color}50` }}>
        {emoji}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{name}</span>
    </div>
  );
}

const CONTENT_RENDERERS = [Step1Content, Step2Content, Step3Content, Step4Content, Step5Content];

// ─── Main component ────────────────────────────────────────────────────────────
export default function StepByStepRSA({ lang = 'vi' }) {
  const [current, setCurrent] = useState(0);
  const t   = T[lang] || T['vi'];
  const col = COLORS[current];
  const s   = t.steps[current];
  const ContentRenderer = CONTENT_RENDERERS[current];

  const isFirst = current === 0;
  const isLast  = current === STEPS_COUNT - 1;

  return (
    <div style={{ width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--text1)' }}>
          🎭 {t.sectionTitle}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>{t.sectionSub}</p>
      </div>

      {/* ── Main layout: sidebar + content ── */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 16, overflow: 'hidden',
        border: `2px solid ${col.border}`,
        boxShadow: `0 0 28px ${col.color}14`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        minHeight: 340,
      }}>
        {/* Left sidebar — step nav (always all 5 visible) */}
        <div style={{ width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          {COLORS.map((c, i) => {
            const ts    = t.steps[i];
            const isAct  = i === current;
            const isDone = i < current;
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 14px',
                  background: isAct ? c.bg : 'transparent',
                  borderLeft: isAct ? `3px solid ${c.color}` : '3px solid transparent',
                  borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  textAlign: 'left',
                }}
              >
                {/* Step badge */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: isAct ? c.color : isDone ? `${c.color}30` : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900,
                  color: isAct ? '#000' : isDone ? c.color : 'var(--text3)',
                  transition: 'all 0.22s ease',
                }}>
                  {isDone ? '✓' : ts.label}
                </div>
                {/* Step title */}
                <span style={{
                  fontSize: 12, fontWeight: isAct ? 700 : 500, lineHeight: 1.3,
                  color: isAct ? c.color : isDone ? 'var(--text2)' : 'var(--text3)',
                  transition: 'color 0.22s ease',
                }}>
                  {ts.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right content panel */}
        <div style={{ flex: 1, padding: '20px 18px', overflow: 'hidden',
          background: `linear-gradient(135deg, ${col.bg}, rgba(0,0,0,0))` }}>
          {/* Content header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: `${col.color}20`, border: `2px solid ${col.color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: col.color,
            }}>
              {s.label}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: col.color }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.subtitle}</div>
            </div>
          </div>

          {/* Animated content */}
          <div key={current} style={{ animation: 'fadeInUp 0.22s ease' }}>
            <ContentRenderer s={s} color={col.color} />
          </div>
        </div>
      </div>

      {/* ── Navigation bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        {/* Prev */}
        <button
          onClick={() => !isFirst && setCurrent(c => c - 1)}
          disabled={isFirst}
          style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: isFirst ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
            color: isFirst ? 'var(--text3)' : 'var(--text1)', opacity: isFirst ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
        >
          {t.prev}
        </button>

        {/* Progress indicators */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                border: 'none', cursor: 'pointer', padding: 0,
                background: i < current ? c.color : i === current ? c.color : 'rgba(255,255,255,0.15)',
                opacity: i < current ? 0.6 : 1,
                boxShadow: i === current ? `0 0 8px ${c.color}80` : 'none',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => !isLast && setCurrent(c => c + 1)}
          disabled={isLast}
          style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: isLast ? 'not-allowed' : 'pointer',
            background: isLast ? 'rgba(255,255,255,0.05)' : `${col.color}22`,
            border: `1.5px solid ${isLast ? 'rgba(255,255,255,0.1)' : col.color + '80'}`,
            color: isLast ? 'var(--text3)' : col.color, opacity: isLast ? 0.4 : 1,
            boxShadow: isLast ? 'none' : `0 0 10px ${col.color}25`,
            transition: 'all 0.2s',
          }}
        >
          {isLast ? t.done : t.next}
        </button>
      </div>

      {/* ── Completion banner ── */}
      {isLast && (
        <div style={{
          marginTop: 12, borderRadius: 12, padding: '14px 18px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.1))',
          border: '1.5px solid rgba(52,211,153,0.3)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{ fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
            🎉 {t.completedTitle}
          </div>
          <code style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text2)' }}>
            <span style={{ color: '#34d399' }}>"{demo.plaintext}"</span>
            {' → encrypt → '}
            <span style={{ color: '#fb923c' }}>"{demo.ciphertext}"</span>
            {' → decrypt → '}
            <span style={{ color: '#34d399' }}>"{demo.plaintext}"</span>
            {' ✅'}
          </code>
        </div>
      )}
    </div>
  );
}

// Number of steps (derived from COLORS length)
const STEPS_COUNT = COLORS.length;
