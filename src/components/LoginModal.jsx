import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginModal({ open, onClose, lang }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  const isVi = lang === 'vi';

  // Google Sign-In initialization
  useEffect(() => {
    if (!open) return;

    // Fetch GOOGLE_CLIENT_ID from server config
    const clientId = window.__GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      // Try to fetch from a simple config endpoint
      fetch('/api/config').then(r => r.json()).then(d => {
        if (d.googleClientId) {
          window.__GOOGLE_CLIENT_ID = d.googleClientId;
          initGoogleBtn(d.googleClientId);
        }
      }).catch(() => {});
    } else {
      initGoogleBtn(clientId);
    }
  }, [open, mode]);

  function initGoogleBtn(clientId) {
    if (!clientId || !window.google?.accounts?.id || !googleBtnRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        googleBtnRef.current,
        { theme: 'outline', size: 'large', width: 340, text: 'signin_with', locale: isVi ? 'vi' : 'en' }
      );
      setGoogleReady(true);
    } catch (e) {
      console.warn('Google Sign-In init error:', e);
    }
  }

  async function handleGoogleResponse(response) {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(response.credential);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>&times;</button>
        <h2 className="login-modal-title">
          {mode === 'login'
            ? (isVi ? 'Đăng nhập' : 'Sign In')
            : (isVi ? 'Đăng ký' : 'Sign Up')
          }
        </h2>

        {error && <div className="login-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-modal-form">
          {mode === 'register' && (
            <div className="login-field">
              <label>{isVi ? 'Tên hiển thị' : 'Display Name'}</label>
              <input
                type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder={isVi ? 'Nhập tên của bạn...' : 'Your name...'}
                required
              />
            </div>
          )}
          <div className="login-field">
            <label>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="login-field">
            <label>{isVi ? 'Mật khẩu' : 'Password'}</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isVi ? 'Tối thiểu 6 ký tự' : 'Min 6 characters'}
              required minLength={6}
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading
              ? (isVi ? 'Đang xử lý...' : 'Processing...')
              : mode === 'login'
                ? (isVi ? 'Đăng nhập' : 'Sign In')
                : (isVi ? 'Đăng ký' : 'Sign Up')
            }
          </button>
        </form>

        <div className="login-divider">
          <span>{isVi ? 'hoặc' : 'or'}</span>
        </div>

        <div ref={googleBtnRef} className="google-btn-wrapper"></div>
        {!googleReady && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
            {isVi ? 'Google Sign-In chưa được cấu hình' : 'Google Sign-In not configured'}
          </p>
        )}

        <p className="login-switch">
          {mode === 'login' ? (
            <>
              {isVi ? 'Chưa có tài khoản?' : "Don't have an account?"}{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }}>
                {isVi ? 'Đăng ký' : 'Sign Up'}
              </button>
            </>
          ) : (
            <>
              {isVi ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }}>
                {isVi ? 'Đăng nhập' : 'Sign In'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
