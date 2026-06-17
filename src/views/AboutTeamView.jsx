import React from 'react';
import { LANG } from '../data/lang.js';
import { TEAM_DATA, SUPERVISOR_DATA } from '../data/team.js';
import Card from '../components/ui/Card.jsx';

export default function AboutTeamView({ lang = "vi" }) {
  const t = LANG[lang].team;
  const isVi = lang === "vi";

  // Combine all members to show them on the same level
  // Mapping SUPERVISOR_DATA to match TEAM_DATA model
  const combinedMembers = [
    {
      name: SUPERVISOR_DATA.name,
      roleVi: SUPERVISOR_DATA.titleVi,
      roleEn: SUPERVISOR_DATA.titleEn,
      avatar: SUPERVISOR_DATA.avatar,
      descVi: SUPERVISOR_DATA.descVi,
      descEn: SUPERVISOR_DATA.descEn,
      color: "var(--purple)"
    },
    ...TEAM_DATA
  ];

  return (
    <div className="page">
      <div className="section team-section">
        <div className="team-header-animate">
          <div className="team-logo-row">
            {/* HUB Logo */}
            <div className="team-logo-box hub-logo-box">
              <img src="/images/logo_hub.png?v=2" alt="HUB" className="team-logo-img" />
              <div>
                <div className="team-logo-title text-cyan">{t.uni}</div>
                <div className="team-logo-desc">Ho Chi Minh University of Banking (HUB) · Est. 1976</div>
              </div>
            </div>

            {/* Faculty Logo */}
            <div className="team-logo-box faculty-logo-box">
              <div className="team-logo-icon-box">
                <img src="/images/logo_khoa.png?v=2" alt="Faculty Logo" className="team-logo-img-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'block') }} />
                {/* Fallback text if image not found */}
                <div className="team-logo-fallback">Logo<br />Khoa</div>
              </div>
              <div>
                <div className="team-logo-title text-purple">{t.faculty}</div>
                <div className="team-logo-desc">{t.uniShort}</div>
              </div>
            </div>
          </div>
          <h1 className="team-main-title">{t.title}</h1>
          <p className="team-main-desc">{t.desc}</p>
        </div>

        {/* Team members Carousel */}
        <div className="carousel-container animate-fade-up-delay-2">
          <div className="carousel-track">
            {[...combinedMembers, ...combinedMembers].map((m, i) => (
              <Card key={i} glow hoverEffect glowColor={m.color} className="carousel-card">
                <div className="team-member-header">
                  <img src={m.avatar} alt={m.name} className="team-member-avatar" style={{ borderColor: `${m.color}66` }} />
                  <div>
                    <div className="team-member-name">{m.name}</div>
                    <div className="team-member-role" style={{ color: m.color }}>{isVi ? m.roleVi : m.roleEn}</div>
                  </div>
                </div>
                <p className="team-member-desc">{isVi ? m.descVi : m.descEn}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Competition Context */}
        <div className="team-competition-wrapper">
          <div className="team-competition-box">
            <h3 className="team-competition-title">{t.competition}</h3>
            <p className="team-competition-desc">{t.compDesc}</p>
          </div>
        </div>

        {/* ── Thông tin liên lạc ── */}
        <div className="team-contact-section">
          <div className="team-contact-divider-row">
            <div className="team-contact-line team-contact-line-left" />
            <span className="team-contact-label">
              {LANG[lang].footerContactTitle}
            </span>
            <div className="team-contact-line team-contact-line-right" />
          </div>
          
          <a href="mailto:vtkteam2005@gmail.com" className="team-contact-email-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            vtkteam2005@gmail.com
          </a>
          
          <div className="team-contact-grid">
            {[
              { name: 'TS. Nguyễn Hoài Đức', role: LANG[lang].footerSupervisorRole, email: 'ducnh@hub.edu.vn', phone: '000 111 2224' },
              { name: 'Lâm Tuấn Vũ', role: LANG[lang].footerTeamLeadRole, email: 'vtkteam2005@gmail.com', phone: '0867900730' },
            ].map(c => (
              <div key={c.name} className="team-contact-card">
                <div className="team-contact-info-left">
                  <div className="team-contact-name">{c.name}</div>
                  <div className="team-contact-role">{c.role}</div>
                </div>
                <div className="team-contact-vertical-line" />
                <div className="team-contact-info-right">
                  <a href={`mailto:${c.email}`} className="team-contact-link text-cyan">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    {c.email}
                  </a>
                  <div className="team-contact-link text-muted">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.27 6.27l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2z" /></svg>
                    {c.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}