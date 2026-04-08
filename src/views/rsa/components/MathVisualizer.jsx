import React, { useState, useCallback } from 'react';
import { LANG } from '../../../data/lang.js';
import { isPrime, generateRSASteps, modExp, PRIME_SUGGESTIONS, getValidEList } from '../utils/rsaMath.js';

// ─── Sub: Extended Euclid Steps Table ────────────────────────────────────────
function EuclidTable({ steps, e, phi, t }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
        {t.findD} <code style={{ color: 'var(--cyan)' }}>d</code>{' '}
        <strong style={{ color: 'var(--amber)' }}>{e} × d ≡ 1 (mod {phi})</strong>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="rsa-compare-table rsa-euclid-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>r</th>
              <th>q</th>
              <th>s</th>
              <th>t</th>
              <th>new_r</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((st, i) => (
              <tr key={i} style={{ animation: `fadeInUp 0.3s ease ${i * 0.06}s both` }}>
                <td>{i + 1}</td>
                <td><code>{st.r}</code></td>
                <td><code>{st.q}</code></td>
                <td><code style={{ color: 'var(--cyan)' }}>{st.s}</code></td>
                <td><code style={{ color: 'var(--purple)' }}>{st.t}</code></td>
                <td><code>{st.new_r}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub: Mod Exp visualizer ──────────────────────────────────────────────────
function ModExpVisual({ base, exp, mod, label, color }) {
  const result = modExp(base, exp, mod);
  return (
    <div className="rsa-modexp-box" style={{ borderColor: `${color}44` }}>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <code style={{ color: 'var(--text2)' }}>{base}</code>
        <sup style={{ color, fontSize: 16, fontWeight: 700 }}>{exp}</sup>
        <span style={{ color: 'var(--text3)' }}>mod</span>
        <code style={{ color: 'var(--text2)' }}>{mod}</code>
        <span style={{ color: 'var(--text3)' }}>=</span>
        <span style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'var(--mono)', textShadow: `0 0 20px ${color}66` }}>{result}</span>
      </div>
    </div>
  );
}

// ─── Main MathVisualizer ──────────────────────────────────────────────────────
export default function MathVisualizer({ lang = 'vi' }) {
  const t = LANG[lang]?.rsa || LANG.vi.rsa;
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [eInput, setEInput] = useState('');
  const [M, setM] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showEuclid, setShowEuclid] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleCompute = useCallback(() => {
    setError('');
    setResult(null);
    setActiveStep(0);

    const pn = parseInt(p, 10);
    const qn = parseInt(q, 10);
    const en = eInput ? parseInt(eInput, 10) : null;

    if (!p || !q) { setError('${t.errorPrime}'); return; }

    const res = generateRSASteps(pn, qn, en);
    if (res.error) { setError(res.error); return; }
    setResult(res);

    // Reveal steps one by one with delay
    let step = 0;
    const maxSteps = 5;
    const tick = setInterval(() => {
      step++;
      setActiveStep(step);
      if (step >= maxSteps) clearInterval(tick);
    }, 350);
  }, [p, q, eInput]);

  const useSuggestion = (sug) => {
    setP(String(sug.p));
    setQ(String(sug.q));
    setEInput('');
    setResult(null);
    setError('');
    setActiveStep(0);
  };

  const validEList = result ? getValidEList(result.phi) : [];

  // Check M range
  const Mn = parseInt(M, 10);
  const MValid = result && !isNaN(Mn) && Mn >= 0 && Mn < result.n;

  return (
    <div className="rsa-section-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, margin: '0 0 12px' }}>
          {t.mathTitle}
        </h2>
        <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          {t.mathDesc}
        </p>
      </div>

      {/* Gợi ý nhanh */}
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>{t.quickHint}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRIME_SUGGESTIONS.map((s, i) => (
            <button key={i} className="btn btn-ghost btn-sm" onClick={() => useSuggestion(s)}>
              p={s.p}, q={s.q} <span style={{ color: 'var(--text3)', marginLeft: 4 }}>({s.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* BƯỚC 1: Nhập p, q */}
      <div className={`rsa-step-card ${activeStep >= 0 ? 'active' : ''}`}>
        <div className="rsa-step-number">1</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            {t.step1}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">p</label>
              <input className="inp" type="number" value={p} onChange={e => { setP(e.target.value); setResult(null); }}
                placeholder="VD: 17" min="2" />
              {p && (
                <div style={{ fontSize: 12, marginTop: 4, color: isPrime(parseInt(p)) ? 'var(--green)' : 'var(--red)' }}>
                  {isPrime(parseInt(p)) ? '✅ {t.isPrime}' : '❌ {t.notPrime}'}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">q</label>
              <input className="inp" type="number" value={q} onChange={e => { setQ(e.target.value); setResult(null); }}
                placeholder="VD: 11" min="2" />
              {q && (
                <div style={{ fontSize: 12, marginTop: 4, color: isPrime(parseInt(q)) ? 'var(--green)' : 'var(--red)' }}>
                  {isPrime(parseInt(q)) ? '✅ {t.isPrime}' : '❌ {t.notPrime}'}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rsa-error-box" style={{ marginTop: 12 }}>⚠️ {error}</div>
          )}

          <button className="btn btn-primary" style={{ marginTop: 14 }}
            onClick={handleCompute}
            disabled={!p || !q || !isPrime(parseInt(p)) || !isPrime(parseInt(q))}>
            ⚡ {t.computeRsa}
          </button>
        </div>
      </div>

      {/* BƯỚC 2: n và φ(n) */}
      {result && activeStep >= 1 && (
        <div className="rsa-step-card active" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">2</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {t.step2}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="rsa-math-result-box" style={{ borderColor: 'var(--cyan)' }}>
                <div className="rsa-math-label">n = p × q</div>
                <div className="rsa-math-value" style={{ color: 'var(--cyan)' }}>
                  {result.p} × {result.q} = <strong>{result.n}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Modulus (public)</div>
              </div>
              <div className="rsa-math-result-box" style={{ borderColor: 'var(--green)' }}>
                <div className="rsa-math-label">φ(n) = (p−1)(q−1)</div>
                <div className="rsa-math-value" style={{ color: 'var(--green)' }}>
                  ({result.p - 1}) × ({result.q - 1}) = <strong>{result.phi}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Euler totient function</div>
              </div>
            </div>
            <div className="card card-sm" style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)', background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.2)' }}>
              💡 <strong>φ(n)</strong> {t.step2Tip}
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 3: Chọn e */}
      {result && activeStep >= 2 && (
        <div className="rsa-step-card active" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">3</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {t.step3Cond}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
              {t.step3Cond} <code>1 &lt; e &lt; φ(n) = {result.phi}</code> và <code>gcd(e, φ(n)) = 1</code>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {validEList.slice(0, 10).map(ve => (
                <button key={ve}
                  className={`btn btn-sm ${result.e === ve ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setEInput(String(ve)); const r2 = generateRSASteps(result.p, result.q, ve); if (!r2.error) setResult(r2); }}>
                  e = {ve}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input className="inp" type="number" value={eInput}
                onChange={ev => setEInput(ev.target.value)}
                placeholder="Nhập e tùy chỉnh..."
                style={{ maxWidth: 200 }} />
              <button className="btn btn-secondary btn-sm"
                onClick={() => { const r2 = generateRSASteps(result.p, result.q, parseInt(eInput)); if (r2.error) setError(r2.error); else { setResult(r2); setError(''); } }}>
                Áp dụng
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="rsa-key-param">
                <span className="rsa-param-label" style={{ color: 'var(--amber)' }}>e (public exponent)</span>
                <span className="rsa-param-value" style={{ color: 'var(--amber)' }}>{result.e}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
                ✅ gcd({result.e}, {result.phi}) = 1 — {t.validGcd}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 4: Tính d qua Extended Euclid */}
      {result && activeStep >= 3 && (
        <div className="rsa-step-card active" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">4</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {t.step4}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
              {t.findD} <code style={{ color: 'var(--purple)' }}>{result.e} × d ≡ 1 (mod {result.phi})</code>
            </div>
            <div className="rsa-math-result-box" style={{ borderColor: 'var(--purple)', marginBottom: 12 }}>
              <div className="rsa-math-label">d (private exponent)</div>
              <div className="rsa-math-value" style={{ color: 'var(--purple)', fontSize: 28 }}>
                d = <strong>{result.d}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                {t.check} {result.e} × {result.d} = {result.e * result.d} ≡ {(result.e * result.d) % result.phi} (mod {result.phi}) ✅
              </div>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={() => setShowEuclid(v => !v)}>
              {showEuclid ? `▲ ${t.hideEuclid}` : `▼ ${t.showEuclid}`}
            </button>

            {showEuclid && result.euclidSteps && (
              <div style={{ marginTop: 12, animation: 'fadeInUp 0.3s ease' }}>
                <EuclidTable steps={result.euclidSteps} e={result.e} phi={result.phi} t={t} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* BƯỚC 5: Key Summary */}
      {result && activeStep >= 4 && (
        <div className="rsa-step-card active" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">5</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📋 {t.step5}</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="rsa-key-box rsa-key-box-public">
                <div style={{ fontSize: 20, marginBottom: 8 }}>🔑 Public Key</div>
                <div className="rsa-key-param"><span className="rsa-param-label" style={{ color: 'var(--amber)' }}>e</span><span className="rsa-param-value" style={{ color: 'var(--amber)' }}>{result.e}</span></div>
                <div className="rsa-key-param"><span className="rsa-param-label" style={{ color: 'var(--cyan)' }}>n</span><span className="rsa-param-value" style={{ color: 'var(--cyan)' }}>{result.n}</span></div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{t.pubShare} → (e, n)</div>
              </div>
              <div className="rsa-key-box rsa-key-box-private">
                <div style={{ fontSize: 20, marginBottom: 8 }}>🗝️ Private Key</div>
                <div className="rsa-key-param"><span className="rsa-param-label" style={{ color: 'var(--purple)' }}>d</span><span className="rsa-param-value" style={{ color: 'var(--purple)' }}>{result.d}</span></div>
                <div className="rsa-key-param"><span className="rsa-param-label" style={{ color: 'var(--cyan)' }}>n</span><span className="rsa-param-value" style={{ color: 'var(--cyan)' }}>{result.n}</span></div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{t.privKeep} → (d, n)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 6: Mã hóa & giải mã */}
      {result && activeStep >= 5 && (
        <div className="rsa-step-card active" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="rsa-step-number">6</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔄 {t.step6}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
              {t.inputM} <code>M</code> (0 ≤ M &lt; n = {result.n})
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <input className="inp" type="number" value={M} onChange={e => setM(e.target.value)}
                placeholder={`Nhập M (0 – ${result.n - 1})`} min="0" max={result.n - 1}
                style={{ maxWidth: 220 }} />
              {M && !MValid && (
                <span style={{ color: 'var(--red)', fontSize: 13 }}>⚠️ {t.invalidM} [0, {result.n - 1}]</span>
              )}
              {M && MValid && (
                <span style={{ color: 'var(--green)', fontSize: 13 }}>✅ {t.validM}</span>
              )}
            </div>

            {MValid && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ModExpVisual
                  base={Mn} exp={result.e} mod={result.n}
                  label={`C = M^e mod n  (${t.encM})`}
                  color="var(--amber)" />
                <ModExpVisual
                  base={modExp(Mn, result.e, result.n)} exp={result.d} mod={result.n}
                  label={`M' = C^d mod n  (${t.decM})`}
                  color="var(--purple)" />
                {modExp(modExp(Mn, result.e, result.n), result.d, result.n) === Mn && (
                  <div style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 14, animation: 'fadeInUp 0.3s ease' }}>
                    ✅ M' = M = {Mn} — {t.decSuccess}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
