import React, { useState, useCallback, useRef } from 'react';
import { LANG } from '../../../data/lang.js';
import {
  generateRSASigningKeyPair, signRSA, verifyRSA, sha256Hex
} from '../utils/rsaCrypto.js';

// ─── Animated Sign Flow ───────────────────────────────────────────────────────
function SignFlow({ steps }) {
  return (
    <div className="rsa-flow-container" style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className={`rsa-flow-node ${step.active ? step.nodeClass + ' rsa-node-glow' : 'rsa-node-dim'}`}
              style={{ transition: `all 0.4s ease ${i * 0.1}s`, minWidth: 90 }}>
              <span className="rsa-node-icon">{step.icon}</span>
              <span style={{ fontSize: 12, textAlign: 'center' }}>{step.label}</span>
              {step.sub && <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textAlign: 'center' }}>{step.sub}</span>}
            </div>
            {i < steps.length - 1 && (
              <div className="rsa-flow-arrow">
                <svg width="36" height="20" viewBox="0 0 36 20">
                  <defs>
                    <marker id={`farr${i}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                      <path d="M0,0 L0,5 L5,2.5 z" fill={steps[i].active ? 'var(--cyan)' : 'var(--text3)'} />
                    </marker>
                  </defs>
                  <line x1="2" y1="10" x2="30" y2="10"
                    stroke={steps[i].active ? 'var(--cyan)' : 'var(--text3)'}
                    strokeWidth="1.5"
                    strokeDasharray={steps[i].active ? '5 3' : '3 3'}
                    markerEnd={`url(#farr${i})`}
                    style={steps[i].active ? { animation: 'rsa-dash 1s linear infinite' } : {}} />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Main SignatureDemo ───────────────────────────────────────────────────────
export default function SignatureDemo({ lang = 'vi' }) {
  const t = LANG[lang]?.rsa || LANG.vi.rsa;
  const [keyPair, setKeyPair] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [cryptoError, setCryptoError] = useState(null);

  const [message, setMessage] = useState('Hello, Blockchain!');
  const [signature, setSignature] = useState('');
  const [messageHash, setMessageHash] = useState('');
  const [signing, setSigning] = useState(false);

  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // null | true | false
  const [verifying, setVerifying] = useState(false);

  const [flowStep, setFlowStep] = useState(0); // 0=idle, 1=hash, 2=sign, 3=done

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setSignature('');
    setMessageHash('');
    setVerifyResult(null);
    setFlowStep(0);
    setCryptoError(null);
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Trình duyệt chặn WebCrypto API (Cần môi trường HTTPS hoặc Localhost).");
      }
      const kp = await generateRSASigningKeyPair();
      setKeyPair(kp);
      setVerifyMsg(message);
    } catch (e) {
      console.error(e);
      setCryptoError(e.message || "Lỗi tạo khóa. Trình duyệt không hỗ trợ WebCrypto.");
    } finally {
      setGenerating(false);
    }
  }, [message]);

  const handleSign = useCallback(async () => {
    if (!keyPair || !message.trim()) return;
    setSigning(true);
    setSignature('');
    setMessageHash('');
    setVerifyResult(null);
    setFlowStep(0);

    try {
      // Step 1: Hash
      setFlowStep(1);
      await new Promise(r => setTimeout(r, 400));
      const hash = await sha256Hex(message);
      setMessageHash(hash);

      // Step 2: Sign
      setFlowStep(2);
      await new Promise(r => setTimeout(r, 400));
      const sig = await signRSA(keyPair.privateKey, message);
      setSignature(sig);
      setVerifyMsg(message);

      // Step 3: Done
      setFlowStep(3);
    } catch (e) {
      console.error(e);
      setCryptoError(e.message || "Lỗi ký số");
    } finally {
      setSigning(false);
    }
  }, [keyPair, message]);

  const handleVerify = useCallback(async (msgToVerify) => {
    if (!keyPair || !signature) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      await new Promise(r => setTimeout(r, 300));
      const ok = await verifyRSA(keyPair.publicKey, signature, msgToVerify);
      setVerifyResult(ok);
    } catch {
      setVerifyResult(false);
    } finally {
      setVerifying(false);
    }
  }, [keyPair, signature]);

  const signFlowSteps = [
    { icon: '📝', label: 'Message', sub: message.substring(0, 12) + (message.length > 12 ? '…' : ''), nodeClass: 'rsa-node-plain', active: flowStep >= 1 },
    { icon: '#', label: 'SHA-256 Hash', sub: messageHash ? messageHash.substring(0, 8) + '…' : '', nodeClass: 'rsa-node-encrypt', active: flowStep >= 1 },
    { icon: '🗝️', label: 'Sign', sub: 'Private Key', nodeClass: 'rsa-node-decrypt', active: flowStep >= 2 },
    { icon: '✍️', label: 'Signature', sub: signature ? signature.substring(0, 8) + '…' : '', nodeClass: 'rsa-node-cipher', active: flowStep >= 3 },
  ];

  return (
    <div className="rsa-section-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* ── ECDSA / RSA Info Box ── */}
      <div style={{
        marginBottom: 28,
        padding: '14px 18px',
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(96,165,250,0.06))',
        border: '1.5px solid rgba(251,191,36,0.3)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fbbf24', marginBottom: 6 }}>
            Demo này dùng RSA — thực tế Blockchain dùng ECDSA
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            Trong thực tế, <strong style={{ color: '#60a5fa' }}>Bitcoin sử dụng ECDSA</strong>{' '}
            (Elliptic Curve Digital Signature Algorithm).<br />
            Demo này sử dụng <strong style={{ color: '#fbbf24' }}>RSA-2048</strong> để minh họa nguyên lý vì dễ hiểu hơn.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.35)',
            }}>🔬 RSA (Demo)</span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
              border: '1px solid rgba(96,165,250,0.35)',
            }}>⛓️ ECDSA (Blockchain thực tế)</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, margin: '0 0 12px' }}>
          {t.signTitle}
        </h2>
        <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          {t.signDesc}
        </p>
      </div>

      {/* Blockchain connection diagram */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(145deg, rgba(192,132,252,0.06), var(--bg1))' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>⛓️ {t.howBlockchainUses}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { icon: '📦', label: t.tx, color: 'var(--text2)' },
            { label: '→' },
            { icon: '🌿', label: 'Merkle Tree', color: 'var(--green)' },
            { label: '→' },
            { icon: '#', label: 'Root Hash', color: 'var(--cyan)' },
            { label: '→' },
            { icon: '✍️', label: 'Digital Signature (ECDSA - thực tế)', color: 'var(--amber)' },
            { label: '→' },
            { icon: '📜', label: 'Signature', color: 'var(--purple)' },
          ].map((item, i) => item.label ? (
            <span key={i} style={{ color: 'var(--text3)', fontSize: 18 }}>{item.label}</span>
          ) : (
            <div key={i} className="rsa-flow-node" style={{ minWidth: 80, borderColor: `${item.color}44`, animation: `pulse 2s ease ${i * 0.3}s infinite` }}>
              <span className="rsa-node-icon">{item.icon}</span>
              <span style={{ fontSize: 11, color: item.color }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
          {t.whyHash}
        </div>
      </div>

      {/* Step 1: Generate key */}
      <div className="rsa-step-card active" style={{ marginBottom: 16 }}>
        <div className="rsa-step-number">1</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>1. {t.st1Title}</div>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
            {generating && <span className="rsa-spinner" />}
            <span>{generating ? t.btnGen : keyPair ? `🔄 ${t.btnGenNew}` : `🔑 ${t.btnSignGen}`}</span>
          </button>
          {keyPair && <span className="badge badge-green" style={{ marginLeft: 12 }}>✅ RSASSA-PKCS1-v1_5 · SHA-256</span>}
          {cryptoError && (
            <div className="rsa-error-box" style={{ marginTop: 12 }}>
              ⚠ <b>Lỗi:</b> {cryptoError}.<br/>
              Bạn đang truy cập qua IP nội bộ mạng LAN? Tính năng mã hóa bảo mật của trình duyệt yêu cầu chạy trên "localhost" hoặc mạng có "HTTPS"!
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Sign message */}
      {keyPair && (
        <div className="rsa-step-card active" style={{ marginBottom: 16, animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">2</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>2. {t.st2Title}</div>
            <label className="label">{t.msgToSign}</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="inp" value={message} onChange={e => { setMessage(e.target.value); setSignature(''); setVerifyResult(null); setFlowStep(0); }}
                placeholder={t.msgPlaceholder} style={{ flex: 1, minWidth: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={handleSign} disabled={signing || !message.trim()}>
                {signing && <span className="rsa-spinner" />}
                <span>{signing ? t.signing : `✍️ ${t.btnSign}`}</span>
              </button>
            </div>

            {/* Flow animation */}
            {flowStep > 0 && (
              <div style={{ marginTop: 16 }}>
                <SignFlow steps={signFlowSteps} />
              </div>
            )}

            {/* Hash display */}
            {messageHash && (
              <div style={{ marginTop: 12, animation: 'fadeInUp 0.3s ease' }}>
                <label className="label">{t.hashOfMsg}</label>
                <div className="hash-display" style={{ fontSize: 12, lineHeight: 1.8, wordBreak: 'break-all' }}>
                  {messageHash}
                </div>
              </div>
            )}

            {/* Signature display */}
            {signature && (
              <div style={{ marginTop: 12, animation: 'fadeInUp 0.3s ease' }}>
                <label className="label">{t.sigBase64}</label>
                <div className="rsa-pem-display" style={{ color: 'var(--purple)', fontSize: 11 }}>
                  {signature.substring(0, 100)}...
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  256 bytes = 2048-bit RSA signature
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Verify */}
      {signature && (
        <div className="rsa-step-card active" style={{ marginBottom: 16, animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">3</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>3. {t.st3Title}</div>
            <label className="label">{t.msgToVerify}</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <input className="inp" value={verifyMsg} onChange={e => { setVerifyMsg(e.target.value); setVerifyResult(null); }}
                style={{ flex: 1, minWidth: 200 }}
                placeholder={t.verifyPlaceholder} />
              <button className="btn btn-secondary btn-sm" onClick={() => handleVerify(verifyMsg)} disabled={verifying}>
                {verifying && <span className="rsa-spinner" />}
                <span>{verifying ? t.verifying : `🔍 ${t.btnVerify}`}</span>
              </button>
            </div>

            {/* Quick tamper buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setVerifyMsg(message); setVerifyResult(null); }}>
                ✅ {t.qOriginal}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setVerifyMsg(message + '!!!'); setVerifyResult(null); }}>
                🔧 {t.qAdd}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setVerifyMsg(message.toUpperCase()); setVerifyResult(null); }}>
                🔧 {t.qUpper}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setVerifyMsg(''); setVerifyResult(null); }}>
                🔧 {t.qClear}
              </button>
            </div>

            {/* Verify result */}
            {verifyResult === true && (
              <div className="rsa-result-box rsa-result-success" style={{ animation: 'fadeInUp 0.3s ease' }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{t.valValid}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{t.valValidDesc}</div>
                </div>
              </div>
            )}
            {verifyResult === false && (
              <div className="rsa-result-box rsa-result-invalid" style={{ animation: 'fadeInUp 0.3s ease' }}>
                <span style={{ fontSize: 28 }}>❌</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{t.valInvalid}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {verifyMsg !== message
                      ? t.valInvalidDesc1
                      : t.valInvalidDesc2}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison when different */}
            {verifyResult === false && verifyMsg !== message && (
              <div className="grid-2" style={{ gap: 12, marginTop: 12, animation: 'fadeInUp 0.3s ease' }}>
                <div className="card card-sm">
                  <div className="label" style={{ color: 'var(--green)' }}>{t.origMsg}</div>
                  <code style={{ color: 'var(--text2)', fontSize: 13 }}>"{message}"</code>
                </div>
                <div className="card card-sm" style={{ borderColor: 'rgba(251,113,133,0.3)' }}>
                  <div className="label" style={{ color: 'var(--red)' }}>{t.verifyMsgBox}</div>
                  <code style={{ color: 'var(--red)', fontSize: 13 }}>"{verifyMsg}"</code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="card card-sm" style={{ marginTop: 8, background: 'rgba(192,132,252,0.05)', borderColor: 'rgba(192,132,252,0.2)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
        💡 <strong>{t.signTip}</strong>
      </div>
    </div>
  );
}
