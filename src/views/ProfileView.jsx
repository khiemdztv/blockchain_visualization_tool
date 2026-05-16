import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { generateCertPDF } from '../utils/certificatePdf.js';

export default function ProfileView({ lang }) {
  const { user, token } = useAuth();
  const isVi = lang === 'vi';
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch('/api/quiz/progress', { headers }).then(r => r.json()),
      fetch('/api/exam/history', { headers }).then(r => r.json()),
      fetch('/api/cert/my', { headers }).then(r => r.json()),
    ]).then(([prog, hist, cert]) => {
      setProgress(prog);
      setHistory(hist.attempts || []);
      setCerts(cert.certificates || []);
    }).catch(() => {});
  }, [token]);

  if (!user) return null;

  const stats = progress?.stats;

  return (
    <div className="page">
      <div className="section profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar ? <img src={user.avatar} alt="" /> : user.displayName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{user.displayName}</div>
            <div className="profile-email">{user.email}</div>
            <span className="badge badge-cyan" style={{ marginTop: 6 }}>{user.authProvider === 'google' ? 'Google' : 'Email'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats?.total || 0}</div>
            <div className="profile-stat-label">{isVi ? 'Câu đã ôn' : 'Questions Practiced'}</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats?.correct || 0}</div>
            <div className="profile-stat-label">{isVi ? 'Trả lời đúng' : 'Correct Answers'}</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats?.total ? Math.round(stats.correct / stats.total * 100) : 0}%</div>
            <div className="profile-stat-label">{isVi ? 'Tỷ lệ đúng' : 'Accuracy'}</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{certs.length}</div>
            <div className="profile-stat-label">{isVi ? 'Chứng chỉ' : 'Certificates'}</div>
          </div>
        </div>

        {/* Certificates */}
        {certs.length > 0 && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              🎓 {isVi ? 'Chứng chỉ đã nhận' : 'Earned Certificates'}
            </h3>
            {certs.map(c => (
              <div key={c._id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Foundation of Blockchain</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {isVi ? 'Mã:' : 'Code:'} <span style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>{c.certCode}</span>
                    {' • '}{new Date(c.issuedAt).toLocaleDateString()}
                    {' • '}{c.score}/{c.totalQuestions}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  generateCertPDF(c).catch(err => {
                    console.error(err);
                    alert('Không tải được certificate template để xuất PDF.\n\n' + (err?.message || err));
                  });
                }}>
                  {isVi ? 'Tải PDF' : 'Download PDF'}
                </button>
              </div>
            ))}
          </>
        )}

        {/* Exam History */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16 }}>
          📋 {isVi ? 'Lịch sử thi' : 'Test History'}
        </h3>
        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
            {isVi ? 'Chưa có lần thi nào.' : 'No test attempts yet.'}
          </div>
        ) : (
          history.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: a.passed ? 'var(--green)' : 'var(--red)' }}>
                  {a.score}/{a.totalQuestions}
                </span>
                <span className={`badge ${a.passed ? 'badge-green' : 'badge-purple'}`} style={a.passed ? {} : { background: 'rgba(251,113,133,0.1)', color: 'var(--red)', borderColor: 'rgba(251,113,133,0.25)' }}>
                  {a.passed ? (isVi ? 'Đạt' : 'Passed') : (isVi ? 'Chưa đạt' : 'Failed')}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {a.startedAt ? new Date(a.startedAt).toLocaleString() : ''}
              </span>
            </div>
          ))
        )}

        {/* Practice Progress by Topic */}
        {stats?.byTopic && Object.keys(stats.byTopic).length > 0 && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16 }}>
              📊 {isVi ? 'Tiến trình ôn tập' : 'Practice Progress'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {Object.entries(stats.byTopic).map(([topic, s]) => (
                <div key={topic} className="card card-sm">
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{topic}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {s.correct}/{s.total} {isVi ? 'đúng' : 'correct'} ({s.total ? Math.round(s.correct / s.total * 100) : 0}%)
                  </div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: `${s.total ? (s.correct / s.total * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
