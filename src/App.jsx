import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { LANG } from './data/lang.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import HomeView from './views/HomeView.jsx';
import HashDemoView from './views/HashDemoView.jsx';
import MiningView from './views/MiningView.jsx';
import AboutProjectView from './views/AboutProjectView.jsx';
import AboutTeamView from './views/AboutTeamView.jsx';
import RSADemoView from './views/rsa/RSADemoView.jsx';
import QuizView from './views/QuizView.jsx';
import ProfileView from './views/ProfileView.jsx';
import ParticleBackground from './components/ParticleBackground.jsx';
import Chatbot from './components/Chatbot.jsx';
import LoginModal from './components/LoginModal.jsx';
import Footer from './components/Footer.jsx';
import Button from './components/ui/Button.jsx';

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="6" x2="20" y2="6"/>
      <line x1="2" y1="11" x2="20" y2="11"/>
      <line x1="2" y1="16" x2="20" y2="16"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="4" x2="18" y2="18"/>
      <line x1="18" y1="4" x2="4" y2="18"/>
    </svg>
  );
}

function AppInner() {
  const [tab, setTab] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("vi");
  const [theme, setTheme] = useState("dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

  const t = LANG[lang];
  const TABS = [
    { id: "home",   label: t.nav.home },
    { id: "demo",   label: t.nav.demo },
    { id: "mining", label: t.nav.mining },
    { id: "rsa",    label: t.nav.rsa },
    { id: "quiz",   label: t.nav.quiz || 'Quiz' },
    { id: "about",  label: t.nav.about },
    { id: "team",   label: t.nav.team },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const switchTab = (id) => {
    if (id === 'quiz' && !user) {
      setLoginOpen(true);
      return;
    }
    if (id === 'profile' && !user) {
      setLoginOpen(true);
      return;
    }
    setTab(id);
    setMobileOpen(false);
    setDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLang = () => setLang(l => l === 'vi' ? 'en' : 'vi');
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <>
      <ParticleBackground />
      {/* Top Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <a className="nav-logo" onClick={() => switchTab("home")} style={{ cursor: "pointer" }}>
            <img src="/images/logo_hubblock.png" alt="HubBlock" style={{ height: 32, width: 32, borderRadius: 8, objectFit: 'contain' }} />
            <div>
              <span className="nav-logo-text">HubBlock</span>
            </div>
          </a>

          <ul className="nav-links">
            {TABS.map(tb => (
              <li key={tb.id}>
                <button className={`nav-link ${tab === tb.id ? "active" : ""}`} onClick={() => switchTab(tb.id)}>
                  {tb.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Lang & Theme toggles */}
          <div className="nav-toggles-container">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="nav-toggle-btn" title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}>
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="nav-toggle-btn" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          </div>

          {/* Auth */}
          {user ? (
            <div style={{ position: 'relative', marginLeft: 4 }}>
              <button className="nav-user-btn" onClick={() => setDropdownOpen(o => !o)}>
                <div className="nav-user-avatar">
                  {user.avatar ? <img src={user.avatar} alt="" /> : user.displayName?.[0]?.toUpperCase()}
                </div>
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</span>
              </button>
              {dropdownOpen && (
                <div className="nav-user-dropdown">
                  <button onClick={() => switchTab('profile')}>{lang === 'vi' ? 'Hồ sơ' : 'Profile'}</button>
                  <button onClick={() => { logout(); setDropdownOpen(false); setTab('home'); }}>{lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}</button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)} className="nav-toggle-btn" style={{ marginLeft: 4 }}>
              {lang === 'vi' ? 'Đăng nhập' : 'Sign In'}
            </Button>
          )}

          <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        <div className={`nav-mobile ${mobileOpen ? "open" : ""}`}>
          {TABS.map(tb => (
            <button key={tb.id} className={`nav-mobile-link ${tab === tb.id ? "active" : ""}`} onClick={() => switchTab(tb.id)}>
              {tb.label}
            </button>
          ))}
          <div className="nav-mobile-toggles">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="nav-mobile-toggle-btn">{lang === 'vi' ? '🇬🇧 English' : '🇻🇳 Tiếng Việt'}</Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="nav-mobile-toggle-btn">{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</Button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {tab === "home"    && <HomeView setTab={switchTab} lang={lang} />}
      {tab === "demo"    && <HashDemoView lang={lang} />}
      {tab === "mining"  && <MiningView lang={lang} />}
      {tab === "rsa"     && <RSADemoView lang={lang} />}
      {tab === "quiz"    && user && <QuizView lang={lang} />}
      {tab === "about"   && <AboutProjectView lang={lang} />}
      {tab === "team"    && <AboutTeamView lang={lang} />}
      {tab === "profile" && user && <ProfileView lang={lang} />}

      {/* Footer */}
      <Footer lang={lang} />

      {/* AI Chatbot — fixed overlay, hidden on quiz page */}
      {tab !== "quiz" && <Chatbot lang={lang} currentPage={tab} />}

      {/* Login Modal */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} lang={lang} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}