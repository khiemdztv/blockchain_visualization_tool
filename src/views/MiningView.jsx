import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LANG } from '../data/lang.js';
import { API } from '../utils/crypto.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import '../styles/mining.css';

// ── Cyberpunk Block Card ─────────────────────────────────────────────────────
function BlockCard({ block, index, isGenesis, onTamper, onRestore, t }) {
  const isValid = block.blockValid;
  const isTampered = block.tampered;
  
  const statusClass = isGenesis ? 'genesis' : isValid ? 'valid' : 'invalid';

  return (
    <div className={`anim-border block-card ${statusClass}`} style={{
      '--glow-color': isGenesis ? 'var(--cyan)' : isValid ? 'var(--green)' : 'var(--red)',
    }}>
      {/* Top accent line */}
      <div className={`block-accent-line ${statusClass}`} />
      {/* Shimmer overlay */}
      <div className="block-shimmer-overlay" />

      {/* Header */}
      <div className="block-header">
        <span className={`block-badge ${statusClass}`}>
          {isGenesis ? t.genesis : `${t.blockStr} #${block.index}`}
        </span>
        <div className={`block-status-dot ${statusClass} ${isTampered ? 'tampered' : ''}`} />
      </div>

      {/* Fields */}
      {[
        { label: t.timeStr, value: new Date(block.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), color: 'var(--text2)' },
        { label: t.dataStr, value: block.data.slice(0, 22) + (block.data.length > 22 ? '...' : ''), color: 'var(--text)' },
        { label: t.nonceStr, value: block.nonce.toLocaleString(), color: 'var(--amber)' },
        { label: t.hashStr, value: block.hash.slice(0, 10) + '...', color: isValid ? 'var(--green)' : 'var(--red)' },
        { label: t.prevHashStr, value: block.previousHash.slice(0, 10) + '...', color: 'var(--text3)' },
      ].map(({ label, value, color }) => (
        <div key={label} className="block-field">
          <div className="block-field-label">{label}</div>
          <div className="block-field-value" style={{ color }}>{value}</div>
        </div>
      ))}

      {/* Action Buttons */}
      {!isGenesis && (
        <div className="block-actions">
          {!isTampered ? (
            <button onClick={() => onTamper(block.index)} className="block-btn tamper">{t.tamperBtn}</button>
          ) : (
            <button onClick={() => onRestore(block.index)} className="block-btn restore">{t.restoreBtn}</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chain Connector Arrow ────────────────────────────────────────────────────
function ChainArrow({ valid }) {
  return (
    <div className="chain-arrow-box">
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <line x1="0" y1="8" x2="24" y2="8" stroke={valid ? 'var(--green)' : 'var(--red)'} strokeWidth="2" strokeDasharray={valid ? '0' : '4 2'} />
        <polygon points="24,4 32,8 24,12" fill={valid ? 'var(--green)' : 'var(--red)'} />
      </svg>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MiningView({ lang = "vi" }) {
  const t = LANG[lang].mining;
  const isVi = lang === "vi";

  const [activeSection, setActiveSection] = useState("education");
  const [chain, setChain] = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [loading, setLoading] = useState(true);
  const [mineData, setMineData] = useState("");
  const [mining, setMining] = useState(false);
  const [mineResult, setMineResult] = useState(null);
  const [currentNonce, setCurrentNonce] = useState(0);
  const [currentHash, setCurrentHash] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [mineTarget, setMineTarget] = useState("");
  const [tamperIdx, setTamperIdx] = useState(null);
  const [tamperText, setTamperText] = useState("");
  const eventSourceRef = useRef(null);

  const loadChain = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/chain`);
      const d = await r.json();
      setChain(d);
      setDifficulty(d.difficulty);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadChain(); }, [loadChain]);
  useEffect(() => () => { if (eventSourceRef.current) eventSourceRef.current.close(); }, []);

  const startMining = async () => {
    setMining(true); setMineResult(null);
    setCurrentNonce(0); setCurrentHash(""); setElapsed(0);
    setMineTarget("0".repeat(difficulty));
    try {
      const r = await fetch(`${API}/api/block/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: mineData || `Block #${chain ? chain.length : 1}` })
      });
      const d = await r.json();
      if (!d.success) { setMining(false); return; }
      if (eventSourceRef.current) eventSourceRef.current.close();
      const es = new EventSource(`${API}/api/mine/stream?index=${d.block.index}`);
      eventSourceRef.current = es;
      es.onmessage = (e) => {
        const ev = JSON.parse(e.data);
        if (ev.error) { es.close(); setMining(false); return; }
        setCurrentNonce(ev.nonce); setCurrentHash(ev.hash); setElapsed(ev.elapsed || 0);
        if (ev.target) setMineTarget(ev.target);
        if (ev.done) {
          es.close(); eventSourceRef.current = null;
          setMining(false); setMineResult(ev);
          if (ev.chain) setChain(ev.chain);
        }
      };
      es.onerror = () => { es.close(); eventSourceRef.current = null; setMining(false); loadChain(); };
    } catch (e) { setMining(false); }
  };

  const stopMining = () => {
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
    setMining(false); loadChain();
  };

  const addBlock = async () => {
    const r = await fetch(`${API}/api/block/add`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: `Block #${chain ? chain.length : 1}` })
    });
    const d = await r.json();
    if (d.chain) setChain(d.chain);
  };

  const doTamper = async (index) => {
    const r = await fetch(`${API}/api/block/tamper`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, data: tamperText || "HACKED DATA!" })
    });
    const d = await r.json();
    if (d.chain) setChain(d.chain);
    setTamperIdx(null); setTamperText("");
  };

  const doRestore = async (index) => {
    const r = await fetch(`${API}/api/block/restore`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index })
    });
    const d = await r.json();
    if (d.chain) setChain(d.chain);
  };

  const changeDifficulty = async (newDiff) => {
    const r = await fetch(`${API}/api/difficulty`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: newDiff })
    });
    const d = await r.json();
    setDifficulty(d.difficulty);
    await loadChain();
  };

  const resetChain = async () => {
    const r = await fetch(`${API}/api/reset`, { method: "POST", headers: { "Content-Type": "application/json" } });
    const d = await r.json();
    if (d.chain) setChain(d.chain);
  };

  const renderLiveHash = (hash, target) => {
    if (!hash) return null;
    const tLen = target ? target.length : 0;
    return (
      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.5px', lineHeight: 2, wordBreak: 'break-all' }}>
        {[...hash].map((c, i) => {
          let color = 'var(--text3)';
          let glow = 'none';
          if (i < tLen) {
            color = c === '0' ? 'var(--green)' : 'var(--red)';
            glow = c === '0' ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(248,113,113,0.6)';
          }
          return (
            <span key={i} style={{ color, textShadow: glow, fontWeight: i < tLen ? 700 : 400, transition: 'color 0.1s' }}>
              {c}
            </span>
          );
        })}
      </span>
    );
  };

  const hashRate = elapsed > 0 ? Math.round(currentNonce / (elapsed / 1000)) : 0;
  const tabs = [
    { id: "education", label: t.tabs.edu },
    { id: "difficulty", label: t.tabs.diff },
    { id: "simulator", label: t.tabs.sim },
    { id: "explorer", label: t.tabs.explorer },
  ];

  return (
    <div className="page">

      {/* ─── Tab Bar ─── */}
      <div className="mining-tab-bar-container">
        <div className="tab-bar-scroll mining-tab-bar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`mining-tab-btn ${activeSection === tab.id ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 40 }}>

        {/* ═══════ SIMULATOR TAB ═══════ */}
        {activeSection === "simulator" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>

            {/* Title */}
            <div className="mining-section-header">
              <div className="mining-section-suptitle text-cyan">{t.pow}</div>
              <h2 className="mining-section-title">{t.simTitle}</h2>
              <p className="mining-section-desc">{t.simDesc}</p>
            </div>

            {/* Config Panel */}
            <Card className="config-card">
              <div className="grid-2" style={{ gap: 24, marginBottom: 20 }}>
                <div>
                  <div className="label">{t.blockData}</div>
                  <Input value={mineData} onChange={e => setMineData(e.target.value)}
                    placeholder={t.blockDataPlaceholder}
                    disabled={mining} />
                </div>
                <div>
                  <div className="label">{t.diffLabel} {difficulty}</div>
                  <div className="config-diff-display">
                    <span className="config-diff-zeros">
                      {"0".repeat(difficulty)}
                    </span>
                    <span className="config-diff-rule">
                      {t.mustStart} {difficulty} {t.zeros}
                    </span>
                  </div>
                </div>
              </div>
              <div className="config-actions">
                {!mining ? (
                  <Button onClick={startMining} style={{ boxShadow: '0 0 20px rgba(34,211,238,0.2)' }}>
                    {t.startMine}
                  </Button>
                ) : (
                  <Button onClick={stopMining} className="btn-stop-mine">
                    {t.stopMine}
                  </Button>
                )}
                <Button variant="ghost" onClick={resetChain} disabled={mining}>{t.resetChain}</Button>
              </div>
            </Card>

            {/* Live Mining Panel */}
            {(mining || mineResult) && (
              <div className={`anim-border live-mining-panel ${mining ? 'mining' : mineResult ? 'success' : 'idle'}`} style={{ '--glow-color': mineResult ? 'var(--green)' : 'var(--cyan)' }}>
                {/* Nonce Big Display */}
                <div className="nonce-display-area">
                  {mining && (
                    <div className="flow-line-container">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flow-line" style={{ left: `${25 + i * 25}%`, top: '20%', animation: `flow 1.5s ${i * 0.3}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div className="nonce-label">{t.nonceLabel}</div>
                  <div className={`nonce-big-value ${mining ? 'mining' : ''}`}>
                    {currentNonce.toLocaleString()}
                  </div>
                  {mining && (
                    <div className="mining-dots">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="mining-dot" style={{ animation: `dotPulse 1.2s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                  {mineResult && !mineResult.failed && (
                    <div className="mining-success-text">
                      {t.foundHash} {currentNonce.toLocaleString()} {t.tries}
                    </div>
                  )}
                </div>

                {/* Live Hash Display */}
                <div className="live-hash-section">
                  <div className="label">{t.currentHash}</div>
                  <div className="live-hash-box">
                    {renderLiveHash(currentHash, mineTarget)}
                  </div>
                  <div className="live-target-info">
                    {t.targetLabel}{' '}
                    <span className="text-green text-mono font-bold">{mineTarget}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="live-stats-grid">
                  {[
                    { label: t.statTime, value: `${(elapsed / 1000).toFixed(1)}s`, color: 'var(--cyan)' },
                    { label: t.statRate, value: hashRate.toLocaleString(), color: 'var(--amber)' },
                    { label: t.statTries, value: currentNonce.toLocaleString(), color: 'var(--blue)' },
                    { label: t.statDiff, value: difficulty, color: 'var(--purple)' },
                  ].map((stat, i) => (
                    <div key={i} className="live-stat-card">
                      <div className="live-stat-val" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="live-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="anim-border mining-tip-card" style={{ '--glow-color': 'var(--cyan)' }}>
              <div className="mining-tip-title">{t.howItWorks}</div>
              <p className="mining-tip-desc">{t.miningTip}</p>
            </div>
          </div>
        )}

        {/* ═══════ EXPLORER TAB ═══════ */}
        {activeSection === "explorer" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="mining-section-header">
              <div className="mining-section-suptitle text-cyan">{t.chainState}</div>
              <h2 className="mining-section-title">{t.expTitle}</h2>
              <p className="mining-section-desc">{t.expDesc}</p>
              <div className="chain-controls">
                <Button size="sm" onClick={addBlock}>{t.addBlockBtn}</Button>
                <Button variant="ghost" size="sm" onClick={resetChain}>{t.resetBtn}</Button>
                {chain && (
                  <div className={`chain-status-badge ${chain.valid ? 'valid' : 'invalid'}`}>
                    <span className={`chain-status-dot ${chain.valid ? 'valid' : 'invalid'}`} />
                    {chain.valid ? t.chainValid : t.chainInvalid}
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Chain */}
            <div className="chain-scroll-area">
              <div className="chain-track">
                {chain && chain.chain.map((block, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChainArrow valid={block.blockValid} />}
                    <BlockCard
                      block={block} index={i}
                      isGenesis={i === 0}
                      onTamper={(idx) => { setTamperIdx(idx); setTamperText(""); }}
                      onRestore={doRestore}
                      t={t}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Tamper Panel */}
            {tamperIdx !== null && (
              <div className="anim-border tamper-panel" style={{ '--glow-color': 'var(--red)' }}>
                <div className="tamper-title">{t.tamperBlock} #{tamperIdx}</div>
                <p className="tamper-desc">{t.tamperDesc}</p>
                <div className="tamper-actions">
                  <Input style={{ flex: 1 }} value={tamperText} onChange={e => setTamperText(e.target.value)} placeholder={t.fakeDataPlaceholder} />
                  <Button size="sm" onClick={() => doTamper(tamperIdx)} className="btn-tamper-submit">{t.tamperBtn}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setTamperIdx(null)}>{t.cancelBtn}</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ DIFFICULTY TAB ═══════ */}
        {activeSection === "difficulty" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="mining-section-header">
              <div className="mining-section-suptitle text-purple">{t.networkSetting}</div>
              <h2 className="mining-section-title">{t.diffTitle}</h2>
              <p className="mining-section-desc">{t.diffDesc}</p>
            </div>

            <Card className="config-card">
              <div className="label">{t.chooseDiff}</div>
              <div className="diff-btns-row">
                {[1, 2, 3, 4, 5].map(d => (
                  <button key={d} onClick={() => changeDifficulty(d)} className={`diff-btn ${d === difficulty ? 'active' : ''}`}>
                    {d}
                  </button>
                ))}
              </div>
              <p className="diff-target-summary">
                {t.currentDiff} <span className="text-cyan font-bold">{difficulty}</span>
                {' — '}
                <span className="text-green text-mono">{"0".repeat(difficulty)}</span>
                <span className="text-muted text-mono">{"x".repeat(Math.min(12, 64 - difficulty))}</span>
              </p>
            </Card>

            <div className="label" style={{ marginBottom: 14 }}>{t.compareTarget}</div>
            <div className="diff-target-list">
              {[1, 2, 3, 4, 5].map(d => (
                <div key={d} onClick={() => changeDifficulty(d)} className={`diff-target-row ${d === difficulty ? 'active' : ''}`}>
                  <div className="diff-target-icon">{d}</div>
                  <div className="diff-target-hash">
                    <span className="text-green font-bold">{"0".repeat(d)}</span>
                    <span className="text-muted">{"x".repeat(Math.min(20, 64 - d))}</span>
                    <span className="text-muted" style={{ fontSize: 11 }}>...</span>
                  </div>
                  <div className="diff-target-attempts">
                    <div className="diff-target-attempts-val">~{Math.pow(16, d).toLocaleString()}</div>
                    <div className="diff-target-attempts-label">{t.attempts}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="anim-border rule-card" style={{ '--glow-color': 'var(--purple)' }}>
              <div className="rule-title">{t.rule}</div>
              <p className="rule-desc">
                {t.rulePre1} <strong style={{ color: 'var(--amber)' }}>{t.ruleBold1}</strong>{t.rulePre2} <strong style={{ color: 'var(--red)' }}>{t.ruleBold2}</strong> {t.rulePost}
              </p>
            </div>
          </div>
        )}

        {/* ═══════ EDUCATION TAB ═══════ */}
        {activeSection === "education" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="mining-section-header">
              <div className="mining-section-suptitle text-blue">{t.kb}</div>
              <h2 className="mining-section-title">{t.theoryTitle}</h2>
            </div>
            <div className="edu-cards-grid">
              {[
                {
                  color: 'var(--cyan)', label: `${t.concept} 01`,
                  title: t.concept1Title,
                  body: (<><p>{t.concept1P1}</p><div className="edu-code-block" style={{ borderLeftColor: 'var(--cyan)' }}>SHA256(index + timestamp + data + prevHash + <span style={{ color: 'var(--amber)' }}>nonce</span>)<br /><span className="text-green">→ "000abc91f..." ✓ {t.concept1Valid}</span></div></>),
                },
                {
                  color: 'var(--amber)', label: `${t.concept} 02`,
                  title: t.concept2Title,
                  body: (<><p>{t.concept2P1}</p><p className="text-muted" style={{ marginTop: 10 }}>{t.concept2P2}</p></>),
                },
                {
                  color: 'var(--purple)', label: `${t.concept} 03`,
                  title: t.concept3Title,
                  body: (<div className="edu-diff-list">
                      {[1, 2, 3, 4, 5].map(d => (
                        <div key={d} className="edu-diff-item">
                          <span style={{ color: 'var(--purple)', minWidth: 60 }}>Diff = {d}</span>
                          <span className="text-green font-bold">{"0".repeat(d)}</span>
                          <span className="text-muted">{"x".repeat(10)}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: 12 }}>~{Math.pow(16, d).toLocaleString()} {t.attempts}</span>
                        </div>
                      ))}
                    </div>)
                },
                {
                  color: 'var(--green)', label: `${t.concept} 04`,
                  title: t.concept4Title,
                  body: (<><p>{t.concept4P1}</p><p className="text-muted" style={{ marginTop: 10 }}>{t.concept4P2}</p></>),
                },
                {
                  color: 'var(--red)', label: `${t.concept} 05`,
                  title: t.concept5Title,
                  body: (<><p>{t.concept5P1}</p><p className="text-muted" style={{ marginTop: 10 }}>{t.concept5P2}</p></>),
                },
              ].map((item, i) => (
                <Card key={i} className="edu-card" style={{ animation: `fadeInUp 0.4s ${i * 0.07}s both`, borderLeft: `3px solid ${item.color}` }}>
                  <div className="edu-card-label" style={{ color: item.color }}>{item.label}</div>
                  <h3 className="edu-card-title">{item.title}</h3>
                  <div className="edu-card-body">{item.body}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}