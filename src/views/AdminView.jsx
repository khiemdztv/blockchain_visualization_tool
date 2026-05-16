import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const T = {
  vi: {
    title: 'Bảng quản trị',
    tabs: { dashboard: 'Tổng quan', users: 'Người dùng', logs: 'Nhật ký' },
    stats: { totalUsers: 'Tổng người dùng', students: 'Học sinh', instructors: 'Giảng viên', admins: 'Admin', regToday: 'Đăng ký hôm nay', regWeek: 'Tuần này', regMonth: 'Tháng này', exams: 'Bài thi', passed: 'Đậu', certs: 'Chứng chỉ', quizAnswers: 'Câu quiz', correctRate: 'Tỷ lệ đúng' },
    userTable: { name: 'Tên', email: 'Email', role: 'Vai trò', created: 'Ngày tạo', actions: 'Thao tác', search: 'Tìm kiếm...', changeRole: 'Đổi vai trò', detail: 'Chi tiết' },
    logTable: { user: 'Người dùng', action: 'Hành động', details: 'Chi tiết', time: 'Thời gian', filterAction: 'Lọc hành động', all: 'Tất cả' },
    roles: { admin: 'Admin', instructor: 'Giảng viên', student: 'Học sinh' },
    prev: 'Trước', next: 'Sau', loading: 'Đang tải...', noData: 'Không có dữ liệu',
    userDetail: 'Chi tiết người dùng', quizProgress: 'Tiến độ quiz', examHistory: 'Lịch sử thi', close: 'Đóng',
  },
  en: {
    title: 'Admin Dashboard',
    tabs: { dashboard: 'Dashboard', users: 'Users', logs: 'Activity Logs' },
    stats: { totalUsers: 'Total Users', students: 'Students', instructors: 'Instructors', admins: 'Admins', regToday: 'Today', regWeek: 'This Week', regMonth: 'This Month', exams: 'Exams', passed: 'Passed', certs: 'Certificates', quizAnswers: 'Quiz Answers', correctRate: 'Correct Rate' },
    userTable: { name: 'Name', email: 'Email', role: 'Role', created: 'Created', actions: 'Actions', search: 'Search...', changeRole: 'Change Role', detail: 'Detail' },
    logTable: { user: 'User', action: 'Action', details: 'Details', time: 'Time', filterAction: 'Filter Action', all: 'All' },
    roles: { admin: 'Admin', instructor: 'Instructor', student: 'Student' },
    prev: 'Prev', next: 'Next', loading: 'Loading...', noData: 'No data',
    userDetail: 'User Detail', quizProgress: 'Quiz Progress', examHistory: 'Exam History', close: 'Close',
  },
};

function StatCard({ label, value, color = 'var(--cyan)' }) {
  return (
    <div style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border, #333)', borderRadius: 12, padding: '16px 20px', minWidth: 140, flex: '1 1 140px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted, #888)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function AdminView({ lang = 'vi' }) {
  const t = T[lang] || T.vi;
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ users: [], total: 0, page: 1, totalPages: 1 });
  const [logs, setLogs] = useState({ logs: [], total: 0, page: 1, totalPages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [logAction, setLogAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/stats', { headers });
      const d = await r.json();
      if (!d.error) setStats(d);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (userSearch) params.set('search', userSearch);
      if (roleFilter) params.set('role', roleFilter);
      const r = await fetch(`/api/admin/users?${params}`, { headers });
      const d = await r.json();
      if (!d.error) setUsers(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, userSearch, roleFilter]);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (logAction) params.set('action', logAction);
      const r = await fetch(`/api/admin/logs?${params}`, { headers });
      const d = await r.json();
      if (!d.error) setLogs(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, logAction]);

  const fetchUserDetail = useCallback(async (id) => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, { headers });
      const d = await r.json();
      if (!d.error) setDetailUser(d);
    } catch (e) { console.error(e); }
  }, [token]);

  const changeRole = async (userId, newRole) => {
    try {
      const r = await fetch(`/api/admin/users/${userId}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role: newRole }) });
      const d = await r.json();
      if (d.success) {
        fetchUsers(users.page);
        fetchStats();
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(1); }, [activeTab, fetchUsers]);
  useEffect(() => { if (activeTab === 'logs') fetchLogs(1); }, [activeTab, fetchLogs]);

  const tabBtnStyle = (id) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    background: activeTab === id ? 'var(--cyan, #00d4ff)' : 'transparent',
    color: activeTab === id ? '#000' : 'var(--text, #eee)',
  });

  return (
    <section style={{ maxWidth: 1200, margin: '100px auto 40px', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, color: 'var(--cyan, #00d4ff)' }}>{t.title}</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(t.tabs).map(([key, label]) => (
          <button key={key} style={tabBtnStyle(key)} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatCard label={t.stats.totalUsers} value={stats.users.total} />
            <StatCard label={t.stats.students} value={stats.users.students} color="#4ade80" />
            <StatCard label={t.stats.instructors} value={stats.users.instructors} color="#facc15" />
            <StatCard label={t.stats.admins} value={stats.users.admins} color="#f87171" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatCard label={t.stats.regToday} value={stats.registrations.today} color="#818cf8" />
            <StatCard label={t.stats.regWeek} value={stats.registrations.week} color="#818cf8" />
            <StatCard label={t.stats.regMonth} value={stats.registrations.month} color="#818cf8" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatCard label={t.stats.exams} value={stats.exams.total} />
            <StatCard label={t.stats.passed} value={stats.exams.passed} color="#4ade80" />
            <StatCard label={t.stats.certs} value={stats.certificates} color="#facc15" />
            <StatCard label={t.stats.quizAnswers} value={stats.quiz.totalAnswers} />
            <StatCard label={t.stats.correctRate} value={stats.quiz.totalAnswers > 0 ? Math.round(stats.quiz.correctAnswers / stats.quiz.totalAnswers * 100) + '%' : '0%'} color="#4ade80" />
          </div>
        </div>
      )}
      {activeTab === 'dashboard' && !stats && <p>{t.loading}</p>}

      {/* Users */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder={t.userTable.search}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)', flex: '1 1 200px', minWidth: 150 }}
              onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
            />
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)' }}>
              <option value="">{t.logTable.all}</option>
              <option value="student">{t.roles.student}</option>
              <option value="instructor">{t.roles.instructor}</option>
              <option value="admin">{t.roles.admin}</option>
            </select>
            <button onClick={() => fetchUsers(1)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#000', fontWeight: 600, cursor: 'pointer' }}>🔍</button>
          </div>

          {loading ? <p>{t.loading}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border, #333)' }}>
                    <th style={thStyle}>{t.userTable.name}</th>
                    <th style={thStyle}>{t.userTable.email}</th>
                    <th style={thStyle}>{t.userTable.role}</th>
                    <th style={thStyle}>{t.userTable.created}</th>
                    <th style={thStyle}>{t.userTable.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#888' }}>{t.noData}</td></tr>}
                  {users.users.map(u => (
                    <tr key={u._id || u.id} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}>{u.displayName}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: u.role === 'admin' ? '#f87171' : u.role === 'instructor' ? '#facc15' : '#4ade80', color: '#000' }}>
                          {t.roles[u.role] || u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <select
                            value={u.role}
                            onChange={e => changeRole(u._id || u.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border, #444)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)', fontSize: 12 }}
                          >
                            <option value="student">{t.roles.student}</option>
                            <option value="instructor">{t.roles.instructor}</option>
                            <option value="admin">{t.roles.admin}</option>
                          </select>
                          <button onClick={() => fetchUserDetail(u._id || u.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--cyan)', color: '#000', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{t.userTable.detail}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={users.page <= 1} onClick={() => fetchUsers(users.page - 1)} style={pgBtnStyle}>{t.prev}</button>
            <span style={{ color: 'var(--text, #eee)', lineHeight: '36px' }}>{users.page} / {users.totalPages}</span>
            <button disabled={users.page >= users.totalPages} onClick={() => fetchUsers(users.page + 1)} style={pgBtnStyle}>{t.next}</button>
          </div>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={logAction} onChange={e => setLogAction(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)' }}>
              <option value="">{t.logTable.all}</option>
              {['login', 'register', 'quiz_answer', 'exam_start', 'exam_submit', 'role_change', 'question_create', 'question_edit', 'question_delete'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {loading ? <p>{t.loading}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border, #333)' }}>
                    <th style={thStyle}>{t.logTable.user}</th>
                    <th style={thStyle}>{t.logTable.action}</th>
                    <th style={thStyle}>{t.logTable.details}</th>
                    <th style={thStyle}>{t.logTable.time}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.logs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#888' }}>{t.noData}</td></tr>}
                  {logs.logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{l.userName}</span><br /><span style={{ fontSize: 11, color: '#888' }}>{l.userEmail}</span></td>
                      <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, background: actionColor(l.action), color: '#000', fontWeight: 600 }}>{l.action}</span></td>
                      <td style={{ ...tdStyle, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#aaa' }}>{JSON.stringify(l.details)}</td>
                      <td style={tdStyle}>{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={logs.page <= 1} onClick={() => fetchLogs(logs.page - 1)} style={pgBtnStyle}>{t.prev}</button>
            <span style={{ color: 'var(--text, #eee)', lineHeight: '36px' }}>{logs.page} / {logs.totalPages}</span>
            <button disabled={logs.page >= logs.totalPages} onClick={() => fetchLogs(logs.page + 1)} style={pgBtnStyle}>{t.next}</button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setDetailUser(null)}>
          <div style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border, #333)', borderRadius: 16, padding: 24, maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--cyan)' }}>{t.userDetail}</h3>
              <button onClick={() => setDetailUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <p><strong>{t.userTable.name}:</strong> {detailUser.user.displayName}</p>
            <p><strong>{t.userTable.email}:</strong> {detailUser.user.email}</p>
            <p><strong>{t.userTable.role}:</strong> {t.roles[detailUser.user.role] || detailUser.user.role}</p>
            <p><strong>{t.userTable.created}:</strong> {new Date(detailUser.user.createdAt).toLocaleString()}</p>

            <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{t.quizProgress}</h4>
            <p>{lang === 'vi' ? 'Đã trả lời' : 'Answered'}: {detailUser.quizStats.total} — {lang === 'vi' ? 'Đúng' : 'Correct'}: {detailUser.quizStats.correct} ({detailUser.quizStats.total > 0 ? Math.round(detailUser.quizStats.correct / detailUser.quizStats.total * 100) : 0}%)</p>

            <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{t.examHistory}</h4>
            {detailUser.examAttempts.length === 0 ? <p style={{ color: '#888' }}>{t.noData}</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={thStyle}>{lang === 'vi' ? 'Điểm' : 'Score'}</th><th style={thStyle}>{lang === 'vi' ? 'Kết quả' : 'Result'}</th><th style={thStyle}>{lang === 'vi' ? 'Ngày' : 'Date'}</th></tr></thead>
                <tbody>
                  {detailUser.examAttempts.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}>{a.score}/{a.totalQuestions}</td>
                      <td style={tdStyle}><span style={{ color: a.passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>{a.passed ? '✓ PASS' : '✗ FAIL'}</span></td>
                      <td style={tdStyle}>{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detailUser.certificates.length > 0 && (
              <>
                <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{lang === 'vi' ? 'Chứng chỉ' : 'Certificates'}</h4>
                {detailUser.certificates.map((c, i) => (
                  <p key={i}>{c.certCode} — {c.score} {lang === 'vi' ? 'điểm' : 'pts'} — {new Date(c.issuedAt).toLocaleDateString()}</p>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const thStyle = { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted, #888)', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' };
const tdStyle = { padding: '8px 12px', color: 'var(--text, #eee)' };
const pgBtnStyle = { padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border, #444)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)', cursor: 'pointer', fontWeight: 600 };

function actionColor(action) {
  const map = { login: '#4ade80', register: '#818cf8', quiz_answer: '#38bdf8', exam_start: '#facc15', exam_submit: '#fb923c', role_change: '#f87171', question_create: '#a78bfa', question_edit: '#fbbf24', question_delete: '#ef4444' };
  return map[action] || '#94a3b8';
}
