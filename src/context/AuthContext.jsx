import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hb_token'));
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    if (tokenVal) localStorage.setItem('hb_token', tokenVal);
    else localStorage.removeItem('hb_token');
  }, []);

  const logout = useCallback(() => {
    saveAuth(null, null);
  }, [saveAuth]);

  // Fetch user info on mount if token exists
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const register = async (email, password, displayName) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    saveAuth(data.token, data.user);
    return data;
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    saveAuth(data.token, data.user);
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    saveAuth(data.token, data.user);
    return data;
  };

  const value = { user, token, loading, login, register, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
