import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const T = {
  vi: {
    title: 'Quản lý Giảng viên',
    tabs: { questions: 'Câu hỏi', students: 'Học sinh' },
    qTable: { topic: 'Chủ đề', difficulty: 'Độ khó', questionVi: 'Câu hỏi (VI)', questionEn: 'Câu hỏi (EN)', actions: 'Thao tác', edit: 'Sửa', delete: 'Xóa', add: 'Thêm câu hỏi' },
    sTable: { name: 'Tên', email: 'Email', quizDone: 'Quiz', quizCorrect: 'Đúng', exams: 'Bài thi', passed: 'Đậu', detail: 'Chi tiết', search: 'Tìm kiếm...' },
    form: { topic: 'Chủ đề', difficulty: 'Độ khó', questionVi: 'Câu hỏi (VI)', questionEn: 'Câu hỏi (EN)', optionsVi: 'Đáp án (VI)', optionsEn: 'Đáp án (EN)', correct: 'Đáp án đúng (0-3)', explVi: 'Giải thích (VI)', explEn: 'Giải thích (EN)', save: 'Lưu', cancel: 'Hủy', optionPlaceholder: 'Đáp án' },
    difficulties: { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' },
    prev: 'Trước', next: 'Sau', loading: 'Đang tải...', noData: 'Không có dữ liệu', all: 'Tất cả',
    confirmDelete: 'Xác nhận xóa câu hỏi này?',
    studentDetail: 'Chi tiết học sinh', quizProgress: 'Tiến độ Quiz', examHistory: 'Lịch sử thi', close: 'Đóng',
  },
  en: {
    title: 'Instructor Panel',
    tabs: { questions: 'Questions', students: 'Students' },
    qTable: { topic: 'Topic', difficulty: 'Difficulty', questionVi: 'Question (VI)', questionEn: 'Question (EN)', actions: 'Actions', edit: 'Edit', delete: 'Delete', add: 'Add Question' },
    sTable: { name: 'Name', email: 'Email', quizDone: 'Quiz', quizCorrect: 'Correct', exams: 'Exams', passed: 'Passed', detail: 'Detail', search: 'Search...' },
    form: { topic: 'Topic', difficulty: 'Difficulty', questionVi: 'Question (VI)', questionEn: 'Question (EN)', optionsVi: 'Options (VI)', optionsEn: 'Options (EN)', correct: 'Correct answer (0-3)', explVi: 'Explanation (VI)', explEn: 'Explanation (EN)', save: 'Save', cancel: 'Cancel', optionPlaceholder: 'Option' },
    difficulties: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    prev: 'Prev', next: 'Next', loading: 'Loading...', noData: 'No data', all: 'All',
    confirmDelete: 'Delete this question?',
    studentDetail: 'Student Detail', quizProgress: 'Quiz Progress', examHistory: 'Exam History', close: 'Close',
  },
};

const emptyForm = { topic: '', difficulty: 'easy', question_vi: '', question_en: '', options_vi: ['', '', '', ''], options_en: ['', '', '', ''], correct: 0, explanation_vi: '', explanation_en: '' };

export default function InstructorView({ lang = 'vi' }) {
  const t = T[lang] || T.vi;
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState({ questions: [], total: 0, page: 1, totalPages: 1 });
  const [students, setStudents] = useState({ students: [], total: 0, page: 1, totalPages: 1 });
  const [topicFilter, setTopicFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQid, setEditingQid] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [detailStudent, setDetailStudent] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (topicFilter) params.set('topic', topicFilter);
      if (diffFilter) params.set('difficulty', diffFilter);
      const r = await fetch(`/api/instructor/questions?${params}`, { headers });
      const d = await r.json();
      if (!d.error) setQuestions(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, topicFilter, diffFilter]);

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (studentSearch) params.set('search', studentSearch);
      const r = await fetch(`/api/instructor/students?${params}`, { headers });
      const d = await r.json();
      if (!d.error) setStudents(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, studentSearch]);

  const fetchStudentDetail = useCallback(async (id) => {
    try {
      const r = await fetch(`/api/instructor/students/${id}/progress`, { headers });
      const d = await r.json();
      if (!d.error) setDetailStudent(d);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { if (activeTab === 'questions') fetchQuestions(1); }, [activeTab, fetchQuestions]);
  useEffect(() => { if (activeTab === 'students') fetchStudents(1); }, [activeTab, fetchStudents]);

  const openAdd = () => { setEditingQid(null); setForm({ ...emptyForm }); setFormOpen(true); };
  const openEdit = (q) => {
    setEditingQid(q.qid);
    setForm({
      topic: q.topic, difficulty: q.difficulty,
      question_vi: q.question_vi, question_en: q.question_en,
      options_vi: [...(q.options_vi || ['', '', '', ''])],
      options_en: [...(q.options_en || ['', '', '', ''])],
      correct: q.correct, explanation_vi: q.explanation_vi || '', explanation_en: q.explanation_en || '',
    });
    setFormOpen(true);
  };

  const saveQuestion = async () => {
    const url = editingQid ? `/api/instructor/questions/${encodeURIComponent(editingQid)}` : '/api/instructor/questions';
    const method = editingQid ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setFormOpen(false); fetchQuestions(questions.page); }
      else alert(d.error || 'Error');
    } catch (e) { console.error(e); }
  };

  const deleteQuestion = async (qid) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const r = await fetch(`/api/instructor/questions/${encodeURIComponent(qid)}`, { method: 'DELETE', headers });
      const d = await r.json();
      if (d.success) fetchQuestions(questions.page);
    } catch (e) { console.error(e); }
  };

  const updateFormOption = (field, idx, val) => {
    setForm(f => {
      const arr = [...f[field]];
      arr[idx] = val;
      return { ...f, [field]: arr };
    });
  };

  const tabBtnStyle = (id) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    background: activeTab === id ? 'var(--cyan, #00d4ff)' : 'transparent',
    color: activeTab === id ? '#000' : 'var(--text, #eee)',
  });

  const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text, #eee)', width: '100%', boxSizing: 'border-box' };

  // Gather unique topics from loaded questions
  const allTopics = [...new Set(questions.questions.map(q => q.topic))];

  return (
    <section style={{ maxWidth: 1200, margin: '100px auto 40px', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, color: 'var(--cyan, #00d4ff)' }}>{t.title}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(t.tabs).map(([key, label]) => (
          <button key={key} style={tabBtnStyle(key)} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={inputStyle} >
              <option value="">{t.all} {t.qTable.topic}</option>
              {allTopics.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
            <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} style={inputStyle}>
              <option value="">{t.all}</option>
              {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{t.difficulties[d]}</option>)}
            </select>
            <button onClick={openAdd} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#000', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ {t.qTable.add}</button>
          </div>

          {loading ? <p>{t.loading}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border, #333)' }}>
                    <th style={thStyle}>{t.qTable.topic}</th>
                    <th style={thStyle}>{t.qTable.difficulty}</th>
                    <th style={thStyle}>{t.qTable.questionVi}</th>
                    <th style={thStyle}>{t.qTable.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.questions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#888' }}>{t.noData}</td></tr>}
                  {questions.questions.map(q => (
                    <tr key={q.qid} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}>{q.topic}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: q.difficulty === 'easy' ? '#4ade80' : q.difficulty === 'medium' ? '#facc15' : '#f87171', color: '#000' }}>{t.difficulties[q.difficulty]}</span></td>
                      <td style={{ ...tdStyle, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question_vi}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(q)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--cyan)', color: '#000', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{t.qTable.edit}</button>
                          <button onClick={() => deleteQuestion(q.qid)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#f87171', color: '#000', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{t.qTable.delete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={questions.page <= 1} onClick={() => fetchQuestions(questions.page - 1)} style={pgBtnStyle}>{t.prev}</button>
            <span style={{ color: 'var(--text, #eee)', lineHeight: '36px' }}>{questions.page} / {questions.totalPages}</span>
            <button disabled={questions.page >= questions.totalPages} onClick={() => fetchQuestions(questions.page + 1)} style={pgBtnStyle}>{t.next}</button>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder={t.sTable.search} style={{ ...inputStyle, flex: '1 1 200px' }} onKeyDown={e => e.key === 'Enter' && fetchStudents(1)} />
            <button onClick={() => fetchStudents(1)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#000', fontWeight: 600, cursor: 'pointer' }}>🔍</button>
          </div>

          {loading ? <p>{t.loading}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border, #333)' }}>
                    <th style={thStyle}>{t.sTable.name}</th>
                    <th style={thStyle}>{t.sTable.email}</th>
                    <th style={thStyle}>{t.sTable.quizDone}</th>
                    <th style={thStyle}>{t.sTable.quizCorrect}</th>
                    <th style={thStyle}>{t.sTable.exams}</th>
                    <th style={thStyle}>{t.sTable.passed}</th>
                    <th style={thStyle}>{t.sTable.detail}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.students.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#888' }}>{t.noData}</td></tr>}
                  {students.students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}>{s.displayName}</td>
                      <td style={tdStyle}>{s.email}</td>
                      <td style={tdStyle}>{s.quizStats.total}</td>
                      <td style={tdStyle}>{s.quizStats.correct} ({s.quizStats.total > 0 ? Math.round(s.quizStats.correct / s.quizStats.total * 100) : 0}%)</td>
                      <td style={tdStyle}>{s.examStats.total}</td>
                      <td style={tdStyle}>{s.examStats.passed}</td>
                      <td style={tdStyle}><button onClick={() => fetchStudentDetail(s.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--cyan)', color: '#000', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{t.sTable.detail}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={students.page <= 1} onClick={() => fetchStudents(students.page - 1)} style={pgBtnStyle}>{t.prev}</button>
            <span style={{ color: 'var(--text, #eee)', lineHeight: '36px' }}>{students.page} / {students.totalPages}</span>
            <button disabled={students.page >= students.totalPages} onClick={() => fetchStudents(students.page + 1)} style={pgBtnStyle}>{t.next}</button>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setFormOpen(false)}>
          <div style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border, #333)', borderRadius: 16, padding: 24, maxWidth: 650, width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--cyan)', marginTop: 0 }}>{editingQid ? t.qTable.edit : t.qTable.add}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>{t.form.topic}</label>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.form.difficulty}</label>
                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={inputStyle}>
                  {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{t.difficulties[d]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t.form.questionVi}</label>
              <textarea value={form.question_vi} onChange={e => setForm(f => ({ ...f, question_vi: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t.form.questionEn}</label>
              <textarea value={form.question_en} onChange={e => setForm(f => ({ ...f, question_en: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>{t.form.optionsVi}</label>
                {form.options_vi.map((o, i) => (
                  <input key={i} value={o} onChange={e => updateFormOption('options_vi', i, e.target.value)} placeholder={`${t.form.optionPlaceholder} ${i + 1}`} style={{ ...inputStyle, marginBottom: 4 }} />
                ))}
              </div>
              <div>
                <label style={labelStyle}>{t.form.optionsEn}</label>
                {form.options_en.map((o, i) => (
                  <input key={i} value={o} onChange={e => updateFormOption('options_en', i, e.target.value)} placeholder={`${t.form.optionPlaceholder} ${i + 1}`} style={{ ...inputStyle, marginBottom: 4 }} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t.form.correct}</label>
              <select value={form.correct} onChange={e => setForm(f => ({ ...f, correct: parseInt(e.target.value) }))} style={inputStyle}>
                {[0, 1, 2, 3].map(i => <option key={i} value={i}>{i} — {form.options_vi[i] || `Option ${i + 1}`}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{t.form.explVi}</label>
                <textarea value={form.explanation_vi} onChange={e => setForm(f => ({ ...f, explanation_vi: e.target.value }))} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>{t.form.explEn}</label>
                <textarea value={form.explanation_en} onChange={e => setForm(f => ({ ...f, explanation_en: e.target.value }))} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setFormOpen(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border, #444)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>{t.form.cancel}</button>
              <button onClick={saveQuestion} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#000', cursor: 'pointer', fontWeight: 700 }}>{t.form.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setDetailStudent(null)}>
          <div style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border, #333)', borderRadius: 16, padding: 24, maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--cyan)' }}>{t.studentDetail}</h3>
              <button onClick={() => setDetailStudent(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <p><strong>{t.sTable.name}:</strong> {detailStudent.student.displayName}</p>
            <p><strong>{t.sTable.email}:</strong> {detailStudent.student.email}</p>

            <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{t.quizProgress}</h4>
            <p>{lang === 'vi' ? 'Đã trả lời' : 'Answered'}: {detailStudent.quizStats.total} — {lang === 'vi' ? 'Đúng' : 'Correct'}: {detailStudent.quizStats.correct} ({detailStudent.quizStats.total > 0 ? Math.round(detailStudent.quizStats.correct / detailStudent.quizStats.total * 100) : 0}%)</p>

            {detailStudent.quizStats.byTopic && Object.keys(detailStudent.quizStats.byTopic).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong>{lang === 'vi' ? 'Theo chủ đề:' : 'By topic:'}</strong>
                {Object.entries(detailStudent.quizStats.byTopic).map(([tp, st]) => (
                  <div key={tp} style={{ fontSize: 13, color: '#ccc', marginLeft: 12 }}>• {tp}: {st.correct}/{st.total} ({st.total > 0 ? Math.round(st.correct / st.total * 100) : 0}%)</div>
                ))}
              </div>
            )}

            <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{t.examHistory}</h4>
            {detailStudent.examAttempts.length === 0 ? <p style={{ color: '#888' }}>{t.noData}</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={thStyle}>{lang === 'vi' ? 'Điểm' : 'Score'}</th><th style={thStyle}>{lang === 'vi' ? 'Kết quả' : 'Result'}</th><th style={thStyle}>{lang === 'vi' ? 'Ngày' : 'Date'}</th></tr></thead>
                <tbody>
                  {detailStudent.examAttempts.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={tdStyle}>{a.score}/{a.totalQuestions}</td>
                      <td style={tdStyle}><span style={{ color: a.passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>{a.passed ? '✓ PASS' : '✗ FAIL'}</span></td>
                      <td style={tdStyle}>{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detailStudent.certificates && detailStudent.certificates.length > 0 && (
              <>
                <h4 style={{ color: 'var(--cyan)', marginTop: 16 }}>{lang === 'vi' ? 'Chứng chỉ' : 'Certificates'}</h4>
                {detailStudent.certificates.map((c, i) => (
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
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted, #888)', marginBottom: 4, fontWeight: 600 };
