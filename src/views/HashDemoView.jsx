import React, { useState, useEffect } from 'react';
import { LANG } from '../data/lang.js';
import { apiHash, sha256browser } from '../utils/crypto.js';
import MerkleTab from '../components/merkle/MerkleTab.jsx';

export default function HashDemoView({ lang = "vi" }) {
  const t = LANG[lang].demo;
  const [activeSection, setActiveSection] = useState("interactive");

  // Interactive hash
  const [input, setInput] = useState("Hello, World!");
  const [hash, setHash] = useState("");
  const [computing, setComputing] = useState(false);
  const [justComputed, setJustComputed] = useState(false);

  // Fixed length
  const fixedExamples = [
    { label: t.exShort, input: "A" },
    { label: t.exMed, input: "Hello" },
    { label: t.exSent, input: "Hello, World!" },
    { label: t.exLong, input: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs." },
  ];
  const [fixedHashes, setFixedHashes] = useState({});

  // Avalanche
  const [av1, setAv1] = useState("hello");
  const [av2, setAv2] = useState("hellp");
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");

  useEffect(() => {
    let cancelled = false;
    setComputing(true);
    const handleCompute = async () => {
      const h = await apiHash(input) || await sha256browser(input);
      if (!cancelled) {
        setHash(h);
        setComputing(false);
        setJustComputed(true);
        setTimeout(() => setJustComputed(false), 600);
      }
    };
    const t = setTimeout(handleCompute, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [input]);

  useEffect(() => {
    const run = async () => {
      const results = {};
      for (const ex of fixedExamples) {
        results[ex.input] = await apiHash(ex.input) || await sha256browser(ex.input);
      }
      setFixedHashes(results);
    };
    run();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const r1 = await apiHash(av1) || await sha256browser(av1);
      const r2 = await apiHash(av2) || await sha256browser(av2);
      if (!cancelled) { setH1(r1); setH2(r2); }
    };
    const t = setTimeout(run, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [av1, av2]);

  const diffCount = h1 && h2 ? [...h1].filter((c, i) => c !== h2[i]).length : 0;
  const diffPct = h1 ? Math.round((diffCount / 64) * 100) : 0;

  const sections = [
    { id: "interactive", label: t.tabs.interactive },
    { id: "fixed", label: t.tabs.fixed },
    { id: "avalanche", label: t.tabs.avalanche },
    { id: "explain", label: t.tabs.explain },
    { id: "merkle", label: LANG[lang].nav.merkleTab },
  ];


  return (
    <div className="page">
      <div className="section" style={{ paddingBottom: 0, paddingTop: 40 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>
          {t.title}
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 28 }}>
          {t.desc}
        </p>

        {/* Section tabs */}
        <div className="tab-bar-scroll" style={{ marginBottom: 32, padding: "4px", background: "var(--bg1)", borderRadius: 14, border: "1px solid var(--border)", width: "100%", maxWidth: "fit-content" }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ background: activeSection === s.id ? "rgba(34,211,238,0.15)" : "none", border: "none", borderRadius: 10, padding: "8px 16px", color: activeSection === s.id ? "var(--cyan)" : "var(--text2)", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", outline: activeSection === s.id ? "1px solid rgba(34,211,238,0.3)" : "none" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>

        {/* ── INTERACTIVE ── */}
        {activeSection === "interactive" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.genTitle}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>{t.genDesc}</p>

              <div className="label">{t.inputText}</div>
              <textarea className="inp" style={{ marginBottom: 16 }} value={input} onChange={e => setInput(e.target.value)} placeholder={t.genPlaceholder} />

              <div className="label">{t.hashOutput}
                <span style={{ marginLeft: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--cyan)", textTransform: "none", fontWeight: 400 }}>
                  {hash.length}/64 {t.hexChars}
                </span>
              </div>
              <div className={justComputed ? "anim-border" : ""} style={{
                '--glow-color': 'var(--cyan)',
                background: "var(--bg-card)", border: `1px solid ${justComputed ? "rgba(192,132,252,0.6)" : "var(--border)"}`,
                borderRadius: 14, padding: "18px 20px", minHeight: 80, transition: "border-color 0.4s",
                boxShadow: justComputed ? "var(--glow-cyan)" : "none",
              }}>
                {computing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text3)", fontSize: 13 }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> {t.computing}
                  </div>
                ) : hash ? (
                  <div>
                    <div className="hash-display">
                      {[...Array(4)].map((_, gi) => (
                        <span key={gi} className="h-group" style={{ display: "block", marginBottom: 2 }}>
                          {hash.slice(gi*16, gi*16+16).split("").map((c, ci) => (
                            <span key={ci} style={{ fontFamily: "var(--mono)", marginRight: ci % 4 === 3 ? "8px" : "1px" }}>{c}</span>
                          ))}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>{t.algoLabel} <span style={{ color: "var(--cyan)" }}>SHA-256</span></span>
                      <span>{t.sizeLabel} <span style={{ color: "var(--cyan)" }}>256 bits</span></span>
                      <span>{t.hexLabel} <span style={{ color: "var(--green)" }}>{hash.length}</span></span>
                      <span>{t.inputBytesLabel} <span style={{ color: "var(--amber)" }}>{new TextEncoder().encode(input).length}</span></span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.04), rgba(59,130,246,0.04))", border: "1px solid rgba(34,211,238,0.15)" }}>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8 }}>
                💡 {t.tryDesc}
              </p>
            </div>
          </div>
        )}

        {/* ── FIXED LENGTH ── */}
        {activeSection === "fixed" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.fixedTitle}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
                {t.fixedDesc}
              </p>

              <div style={{ display: "grid", gap: 14 }}>
                {fixedExamples.map((ex, i) => {
                  const h = fixedHashes[ex.input] || "";
                  return (
                    <div key={i} style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="badge badge-cyan" style={{ fontSize: 10 }}>{ex.label}</span>
                          <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)", background: "rgba(34,211,238,0.08)", padding: "3px 10px", borderRadius: 6 }}>
                            "{ex.input.slice(0, 40)}{ex.input.length > 40 ? "..." : ""}"
                          </code>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{t.inputLen} <span style={{ color: "var(--amber)", fontFamily: "var(--mono)" }}>{ex.input.length} {t.chars}</span></span>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{t.outputLen} <span style={{ color: "var(--green)", fontFamily: "var(--mono)" }}>{h.length || "..."} {t.chars} ✓</span></span>
                        </div>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {h ? (
                          <span className="hash-display" style={{ fontSize: 12 }}>{h.slice(0,32)}<br/>{h.slice(32)}</span>
                        ) : (
                          <span style={{ color: "var(--text3)", fontSize: 12 }}>{t.computingSimple}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, fontSize: 13, color: "var(--text2)" }}>
                {t.fixedResult}
              </div>
            </div>
          </div>
        )}

        {/* ── AVALANCHE ── */}
        {activeSection === "avalanche" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.avTitle}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
                {t.avDesc}
              </p>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <div className="label">{t.inputA}</div>
                  <input className="inp" value={av1} onChange={e => setAv1(e.target.value)} />
                </div>
                <div>
                  <div className="label">{t.inputB} <span style={{ color: "var(--amber)", textTransform: "none", fontSize: 10, fontWeight: 400 }}>{t.tryChanging}</span></div>
                  <input className="inp" value={av2} onChange={e => setAv2(e.target.value)} />
                </div>
              </div>

              {/* Difference counter */}
              <div style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: "clamp(42px,8vw,72px)", fontWeight: 900, lineHeight: 1, color: diffPct >= 40 ? "var(--green)" : "var(--amber)", textShadow: diffPct >= 40 ? "0 0 40px rgba(52,211,153,0.4)" : "0 0 40px rgba(251,191,36,0.4)" }}>
                  {diffPct}%
                </div>
                <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 8 }}>
                  {t.pctChanged} &nbsp;
                  <span style={{ color: diffPct >= 40 ? "var(--green)" : "var(--amber)", fontWeight: 600 }}>({diffCount}/64 {t.hexDiff})</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="progress-bar" style={{ maxWidth: 300, margin: "0 auto" }}>
                    <div className="progress-fill" style={{ width: `${diffPct}%`, background: diffPct >= 40 ? "linear-gradient(90deg,var(--green),var(--cyan))" : "linear-gradient(90deg,var(--amber),var(--red))" }} />
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>
                  {diffPct >= 40 ? t.avGood : t.avLow}
                </div>
              </div>

              {/* Hash grids */}
              {h1 && h2 && (
                <div className="grid-2">
                  {[{ label: `${t.hashA} ("${av1.slice(0,20)}${av1.length>20?"...":""}") `, h: h1, other: h2 }, { label: `${t.hashB} ("${av2.slice(0,20)}${av2.length>20?"...":""}") `, h: h2, other: h1 }].map(({ label, h, other }) => (
                    <div key={label} style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontFamily: "var(--mono)" }}>{label}</div>
                      <div className="hex-grid">
                        {[...h].map((c, i) => (
                          <div key={i} className={`hex-cell ${c !== other[i] ? "diff" : "same"}`}>{c}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXPLANATION ── */}
        {activeSection === "explain" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                {
                  icon: "🔐", title: t.expl1Title, color: "var(--cyan)",
                  body: (<>
                    <p style={{ marginBottom: 12 }}>{t.expl1P1}</p>
                    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 12, borderLeft: "3px solid var(--cyan)" }}>
                      SHA256("Hello") → <span style={{ color: "var(--cyan)" }}>185f8db32921bd46d35c4f64...</span><br />
                      SHA256("1 TB file") → <span style={{ color: "var(--cyan)" }}>{t.expl1P2}</span>
                    </div>
                  </>)
                },
                {
                  icon: "📏", title: t.expl2Title, color: "var(--blue)",
                  body: (<>
                    <p>{t.expl2P1}</p>
                    <p style={{ marginTop: 8, color: "var(--text2)" }}>{t.expl2P2}</p>
                  </>)
                },
                {
                  icon: "⛔", title: t.expl3Title, color: "var(--purple)",
                  body: (<>
                    <p dangerouslySetInnerHTML={{ __html: t.expl3P1 }}></p>
                    <p style={{ marginTop: 8, color: "var(--text2)" }}>{t.expl3P2}</p>
                  </>)
                },
                {
                  icon: "🌊", title: t.expl4Title, color: "var(--red)",
                  body: (<>
                    <p>{t.expl4P1}</p>
                    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 12, borderLeft: "3px solid var(--red)", marginTop: 10 }}>
                      SHA256("<span style={{ color: "var(--text)" }}>hell</span><span style={{ color: "var(--green)" }}>o</span>") = <span style={{ color: "var(--cyan)" }}>2cf24dba...</span><br />
                      SHA256("<span style={{ color: "var(--text)" }}>hell</span><span style={{ color: "var(--red)" }}>p</span>") = <span style={{ color: "var(--amber)" }}>a7f891c4...</span> {t.expl4P2}
                    </div>
                  </>)
                },
              ].map((item, i) => (
                <div key={i} className="card" style={{ animation: `fadeInUp 0.4s ${i*0.08}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: item.color }}>{item.title}</h3>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MERKLE TREE ── */}
        {activeSection === "merkle" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <MerkleTab lang={lang} />

          </div>
        )}
      </div>
    </div>
  );
}