import React, { useState, useEffect, useRef } from 'react';
import { LANG } from '../data/lang.js';
import { API, apiHash, sha256browser } from '../utils/crypto.js';
import BlockchainCanvas from '../components/BlockchainCanvas.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';

function DigitalClock({ t }) {
  const [uptime, setUptime] = useState("00:00:00");
  const [genesisTime, setGenesisTime] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/chain`)
      .then(r => r.json())
      .then(d => {
        if (d && d.chain && d.chain.length > 0) {
          setGenesisTime(d.chain[0].timestamp);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!genesisTime) return;
    const updateClock = () => {
      const diff = Math.max(0, Math.floor((Date.now() - genesisTime) / 1000));
      const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [genesisTime]);

  if (error || !genesisTime) return null;

  return (
    <div className="digital-clock">
      <span className="digital-clock-label">{t.uptime}</span>
      <span className="digital-clock-dot" />
      {uptime}
    </div>
  );
}

const FEATURES = [
  { icon: "🔐", title: "Fixed-Length Output", desc: "SHA-256 luôn tạo ra đúng 256 bits (64 ký tự hex), bất kể kích thước đầu vào — từ 1 byte đến 1 terabyte.", color: "var(--cyan)" },
  { icon: "⛔", title: "One-Way Function", desc: "Không thể tái tạo dữ liệu gốc từ hash output. Đây là nền tảng của bảo mật số hiện đại.", color: "var(--blue)" },
  { icon: "🌊", title: "Avalanche Effect", desc: "Thay đổi 1 ký tự khiến ~50% output bits thay đổi hoàn toàn ngẫu nhiên — không thể đoán trước.", color: "var(--purple)" },
  { icon: "🧬", title: "Collision Resistant", desc: "Xác suất tìm hai đầu vào khác nhau có cùng hash output gần bằng 0 — an toàn tuyệt đối.", color: "var(--green)" }
];

export default function HomeView({ setTab, lang = "vi" }) {
  const t = LANG[lang].home;
  const features = LANG[lang].features;
  const [demoInput, setDemoInput] = useState("Hello, SVNCKH!");
  const [demoHash, setDemoHash] = useState("");
  const [computing, setComputing] = useState(false);
  const [typedHash, setTypedHash] = useState("");
  const typedRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    setComputing(true);
    const run = async () => {
      const h = await apiHash(demoInput) || await sha256browser(demoInput);
      if (!cancelled) { setDemoHash(h); setComputing(false); }
    };
    const t = setTimeout(run, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [demoInput]);

  // Typewriter effect for hash display on Home
  useEffect(() => {
    if (!demoHash) return;
    typedRef.current = "";
    setTypedHash("");
    let i = 0;
    const tick = setInterval(() => {
      typedRef.current = demoHash.slice(0, i + 1);
      setTypedHash(typedRef.current);
      i++;
      if (i >= demoHash.length) clearInterval(tick);
    }, 18);
    return () => clearInterval(tick);
  }, [demoHash]);

  return (
    <div className="page">
      {/* ── Animated Hero ── */}
      <section className="hero-section">
        {/* Blockchain canvas layer */}
        <BlockchainCanvas />

        {/* Radial glow overlays */}
        <div className="hero-radial-glow" />
        <div className="hero-bottom-glow" />

        <div className="section hero-content">
          <div className="hero-animate-fade">
            <div className="hero-badge-row">
              <Badge variant="cyan" className="hero-badge">{t.badge}</Badge>
              <DigitalClock t={t} />
            </div>

            <h1 className="hero-title">
              <span className="hero-title-text">{t.title1}</span>
              <br />
              <span className="hero-title-sub">{t.title2}</span>
            </h1>

            <p className="hero-desc">
              {t.desc}
            </p>

            {/* Animated hash pill */}
            <div className="hero-hash-container">
              <div className="anim-border hero-hash-pill" style={{ '--glow-color': 'var(--cyan)' }}>
                <span className="hero-hash-prefix">SHA256(input) →</span>
                {typedHash}
                <span className="hero-hash-cursor">|</span>
              </div>
            </div>

            <div className="hero-actions">
              <Button onClick={() => setTab("demo")} className="hero-btn-primary">
                {t.tryDemo}
              </Button>
              <Button variant="secondary" onClick={() => setTab("about")} className="hero-btn-secondary">
                {t.aboutProject}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="stats-bar-wrapper">
        <div className="stats-bar-grid">
          {[
            { val: "256", unit: "bits", label: t.stats.fixed },
            { val: "64", unit: "hex chars", label: t.stats.each },
            { val: "2²⁵⁶", unit: "combinations", label: t.stats.irreversible },
            { val: "~50%", unit: "bits changed", label: t.stats.avalanche },
          ].map((s, i) => (
            <div key={i} className={`stats-item ${i < 3 ? 'stats-item-bordered' : ''}`}>
              <div className="stats-val">
                {s.val} <span className="stats-unit">{s.unit}</span>
              </div>
              <div className="stats-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live mini demo ── */}
      <div className="section section-sm pb-0">
        <Card glow glowColor="var(--cyan)" className="hero-demo-card">
          <div className="hero-demo-header">
            <div className="hero-demo-dot" />
            <span className="hero-demo-label">{t.liveLabel}</span>
          </div>
          <div className="live-demo-grid">
            <div>
              <div className="label">{t.inputLabel}</div>
              <Input value={demoInput} onChange={e => setDemoInput(e.target.value)} placeholder={t.inputPlaceholder} />
            </div>
            <div className="live-demo-arrow">→</div>
            <div>
              <div className="label">{t.outputLabel} <span className="hero-demo-lowcase-label">({t.alwaysChars})</span></div>
              <div className="hero-demo-output-box">
                {computing ? (
                  <span className="hero-demo-computing">{t.computingStr}</span>
                ) : (
                  <span className="hash-display hero-demo-hash">
                    {demoHash.slice(0, 32)}<br />{demoHash.slice(32)}
                  </span>
                )}
              </div>
              <div className="hero-demo-meta">
                {t.lenLabel} <span className="hero-demo-meta-val text-green">{demoHash.length}</span> {t.hexChars} = <span className="hero-demo-meta-val text-cyan">256 bits</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 4 Properties ── */}
      <div className="section">
        <div className="properties-header">
          <h2 className="properties-title">{t.propTitle}</h2>
          <p className="properties-desc">{t.propDesc}</p>
        </div>
        <div className="grid-2 properties-grid">
          {features.map((f, i) => (
            <Card key={i} glow hoverEffect glowColor={f.color} className="property-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="property-card-header">
                <div className="property-icon-box">{f.icon}</div>
                <div className="property-title">{f.title}</div>
              </div>
              <p className="property-desc">{f.desc}</p>
            </Card>
          ))}  
        </div>
        <div className="properties-footer">
          <Button onClick={() => setTab("demo")} className="properties-btn">
            {t.openDemo}
          </Button>
        </div>
      </div>
    </div>
  );
}