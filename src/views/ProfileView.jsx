import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

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
                  import('jspdf').then(({ jsPDF }) => {
                    const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
                    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                    const safeName = strip(c.displayName || 'Student');
                    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 210, 'F');
                    doc.setDrawColor(124, 58, 237); doc.setLineWidth(2); doc.rect(10, 10, 277, 190);
                    doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.5); doc.rect(14, 14, 269, 182);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14); doc.setTextColor(148, 163, 184);
                    doc.text('HUBBLOCK EDUCATION PLATFORM', 148.5, 35, { align: 'center' });
                    doc.setFontSize(32); doc.setTextColor(192, 132, 252);
                    doc.text('CERTIFICATE', 148.5, 55, { align: 'center' });
                    doc.setFontSize(14); doc.setTextColor(148, 163, 184);
                    doc.text('OF ACHIEVEMENT', 148.5, 65, { align: 'center' });
                    doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.5); doc.line(80, 72, 217, 72);
                    doc.setFontSize(20); doc.setTextColor(56, 189, 248);
                    doc.text('Foundation of Blockchain', 148.5, 88, { align: 'center' });
                    doc.setFontSize(12); doc.setTextColor(148, 163, 184);
                    doc.text('This certifies that', 148.5, 103, { align: 'center' });
                    doc.setFontSize(24); doc.setTextColor(241, 245, 249);
                    doc.text(safeName, 148.5, 118, { align: 'center' });
                    doc.setFontSize(12); doc.setTextColor(148, 163, 184);
                    doc.text('has successfully passed the Foundation of Blockchain examination', 148.5, 133, { align: 'center' });
                    doc.setFontSize(16); doc.setTextColor(74, 222, 128);
                    doc.text('PASSED', 148.5, 146, { align: 'center' });
                    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
                    const dateStr = new Date(c.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    doc.text(`Certificate Code: ${c.certCode}`, 148.5, 165, { align: 'center' });
                    doc.text(`Issued: ${dateStr}`, 148.5, 173, { align: 'center' });
                    doc.text('Verify at: hubblock.edu/verify', 148.5, 181, { align: 'center' });
                    doc.save(`HubBlock_Certificate_${c.certCode}.pdf`);
                  }).catch(err => { console.error(err); alert('Error: ' + err.message); });
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
