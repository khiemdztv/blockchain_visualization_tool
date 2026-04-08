import React, { useState, useCallback } from 'react';
import { LANG } from '../../../data/lang.js';
import {
  generateRSAKeyPair, encryptRSA, decryptRSA,
  exportPublicKeyPEM, exportPrivateKeyPEM, truncatePEM
} from '../utils/rsaCrypto.js';

// ─── Key display component ─────────────────────────────────────────────────
function KeyDisplay({ label, icon, pem, color, accentColor, t }) {
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rsa-key-box" style={{ borderColor: `${accentColor}44`, background: `linear-gradient(145deg, ${accentColor}08, var(--bg1))` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <strong style={{ color, fontSize: 14 }}>{label}</strong>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFull(v => !v)}>
            {showFull ? `📄 ${t.showShort}` : `🔍 ${t.showFull}`}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
            {copied ? `✓ ${t.copied}` : `⎘ ${t.copy}`}
          </button>
        </div>
      </div>
      <pre className="rsa-pem-display">
        {showFull ? pem : truncatePEM(pem)}
      </pre>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
        <span>RSA-2048</span>
        <span>·</span>
        <span>256 bytes = 2048 bits</span>
        <span>·</span>
        <span style={{ color: accentColor }}>PKCS#8 / SPKI</span>
      </div>
    </div>
  );
}

// ─── Main RSACryptoSection ────────────────────────────────────────────────────
export default function RSACryptoSection({ lang = 'vi' }) {
  const t = LANG[lang]?.rsa || LANG.vi.rsa;
  const [keyPair, setKeyPair] = useState(null);
  const [pubPEM, setPubPEM] = useState('');
  const [privPEM, setPrivPEM] = useState('');
  const [generating, setGenerating] = useState(false);

  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptOutput, setDecryptOutput] = useState('');

  const [encLoading, setEncLoading] = useState(false);
  const [decLoading, setDecLoading] = useState(false);
  const [encError, setEncError] = useState('');
  const [decError, setDecError] = useState('');

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setKeyPair(null);
    setCiphertext('');
    setDecryptOutput('');
    setEncError('');
    setDecError('');
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Trình duyệt chặn WebCrypto API (Cần môi trường HTTPS hoặc Localhost).");
      }
      const kp = await generateRSAKeyPair();
      const pub = await exportPublicKeyPEM(kp.publicKey);
      const priv = await exportPrivateKeyPEM(kp.privateKey);
      setKeyPair(kp);
      setPubPEM(pub);
      setPrivPEM(priv);
    } catch (e) {
      setEncError('Lỗi tạo key: ' + (e.message || "Trình duyệt không hỗ trợ WebCrypto."));
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleEncrypt = useCallback(async () => {
    if (!keyPair || !plaintext.trim()) return;
    setEncLoading(true);
    setEncError('');
    try {
      const enc = await encryptRSA(keyPair.publicKey, plaintext);
      setCiphertext(enc);
      setDecryptInput(enc);
    } catch (e) {
      setEncError('Lỗi mã hóa: ' + (e.message || 'Dữ liệu quá lớn (RSA-OAEP max ~245 bytes)'));
    } finally {
      setEncLoading(false);
    }
  }, [keyPair, plaintext]);

  const handleDecrypt = useCallback(async () => {
    if (!keyPair || !decryptInput.trim()) return;
    setDecLoading(true);
    setDecError('');
    try {
      const dec = await decryptRSA(keyPair.privateKey, decryptInput);
      setDecryptOutput(dec);
    } catch (e) {
      setDecError('Lỗi giải mã: Dữ liệu không hợp lệ hoặc key không khớp');
    } finally {
      setDecLoading(false);
    }
  }, [keyPair, decryptInput]);

  return (
    <div className="rsa-section-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, margin: '0 0 12px' }}>
          RSA-2048 Trong Trình Duyệt
        </h2>
        <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          Dùng <strong style={{ color: 'var(--cyan)' }}>Web Crypto API</strong> để tạo cặp key RSA 2048-bit thực sự, mã hóa và giải mã ngay trong trình duyệt — không gửi gì lên server.
        </p>
      </div>

      {/* Generate Key Pair */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{keyPair ? '🔑' : '⚙️'}</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>
          {keyPair ? `✅ ${t.genKeyDone}` : t.genKeyWait}
        </h3>
        <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: 14 }}>
          {keyPair
            ? t.genKeyP1
            : t.genKeyP2}
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}
          style={{ fontSize: 15, padding: '13px 32px' }}>
          {generating && <span className="rsa-spinner" />}
          <span>{generating ? t.btnGen : keyPair ? `🔄 ${t.btnGenNew}` : `🚀 ${t.genKeyWait}`}</span>
        </button>

        {keyPair && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-green">✅ {t.genSuccess}</span>
            <span className="badge badge-cyan">RSA-OAEP</span>
            <span className="badge badge-cyan">SHA-256</span>
            <span className="badge badge-purple">2048-bit</span>
          </div>
        )}
      </div>

      {/* Key Display */}
      {keyPair && (
        <div className="grid-2" style={{ marginBottom: 24, gap: 16, animation: 'fadeInUp 0.4s ease' }}>
          <KeyDisplay label="Public Key" icon="🔑" pem={pubPEM} color="var(--amber)" accentColor="#fbbf24" t={t} />
          <KeyDisplay label="Private Key" icon="🗝️" pem={privPEM} color="var(--purple)" accentColor="#a78bfa" t={t} />
        </div>
      )}

      {/* Encrypt */}
      {keyPair && (
        <div className="card" style={{ marginBottom: 20, animation: 'fadeInUp 0.4s ease' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            🔒 {t.encTop}
          </h3>
          <label className="label">{t.encLabel}</label>
          <textarea className="inp" rows={3}
            value={plaintext}
            onChange={e => setPlaintext(e.target.value)}
            placeholder={t.encPlaceholder}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={handleEncrypt}
              disabled={encLoading || !plaintext.trim()}>
              {encLoading && <span className="rsa-spinner" />}
              <span>{encLoading ? t.encing : `🔒 ${t.btnEnc}`}</span>
            </button>
            {plaintext && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{plaintext.length} {t.chars}</span>}
          </div>
          {encError && <div className="rsa-error-box" style={{ marginTop: 10 }}>{encError}</div>}
          {ciphertext && (
            <div style={{ marginTop: 16, animation: 'fadeInUp 0.3s ease' }}>
              <label className="label">{t.decLabel}</label>
              <div className="rsa-pem-display" style={{ color: 'var(--amber)', fontSize: 11 }}>
                {ciphertext.substring(0, 120)}...
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                {ciphertext.length} {t.chars} base64 = 256 bytes RSA-2048
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decrypt */}
      {keyPair && (
        <div className="card" style={{ animation: 'fadeInUp 0.4s ease' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            🔓 {t.decTop}
          </h3>
          <label className="label">{t.decLabel}</label>
          <textarea className="inp" rows={3}
            value={decryptInput}
            onChange={e => setDecryptInput(e.target.value)}
            placeholder={t.decPlaceholder}
          />
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDecrypt}
              disabled={decLoading || !decryptInput.trim()}>
              {decLoading && <span className="rsa-spinner" />}
              <span>{decLoading ? t.decing : `🔓 ${t.btnDec}`}</span>
            </button>
          </div>
          {decError && <div className="rsa-error-box" style={{ marginTop: 10 }}>{decError}</div>}
          {decryptOutput && (
            <div style={{ marginTop: 16, animation: 'fadeInUp 0.3s ease' }}>
              <label className="label">{t.decResult}</label>
              <div className="rsa-result-box rsa-result-success">
                <span style={{ fontSize: 16, marginRight: 8 }}>✅</span>
                <strong>{decryptOutput}</strong>
              </div>
              {decryptOutput === plaintext && (
                <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 8 }}>
                  🎯 {t.decMatch}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="card card-sm" style={{ marginTop: 20, background: 'rgba(192,132,252,0.05)', borderColor: 'rgba(192,132,252,0.2)', fontSize: 13, color: 'var(--text2)' }}>
        💡 <strong>{t.cryptoTip}</strong>
      </div>
    </div>
  );
}
