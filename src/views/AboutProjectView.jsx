import React from 'react';
import { LANG } from '../data/lang.js';

export default function AboutProjectView({ lang = "vi" }) {
  const t = LANG[lang].about;
  const isVi = lang === "vi";

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Hero Section */}
      <div className="section" style={{ paddingTop: 60, paddingBottom: 40, borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", animation: "fadeInUp 0.6s ease" }}>
          <div style={{ display: "inline-block", fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--cyan)", marginBottom: 16 }}>
            {t.badge}
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 24, color: "var(--text)", lineHeight: 1.1 }}>
            {t.title}
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text2)", lineHeight: 1.8, maxWidth: 760, margin: "0 auto" }}>
            {t.desc}
          </p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 60 }}>
        {/* Features / Content Grid */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 24, background: "var(--cyan)", borderRadius: 2 }}></div>
            {t.visContent}
          </h2>
          <div className="grid-3" style={{ gap: 24 }}>
            {t.visItems.map((f, i) => {
              const colors = ["var(--cyan)", "var(--purple)", "var(--blue)", "var(--amber)", "var(--green)"];
              const color = colors[i % colors.length];
              return (
              <div key={i} className="card anim-border" style={{ '--glow-color': color, padding: 28, animation: `fadeInUp 0.5s ${i * 0.1}s both`, borderTop: `3px solid ${color}`, background: "var(--bg2)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            );})}
          </div>
        </div>



      </div>
    </div>
  );
}