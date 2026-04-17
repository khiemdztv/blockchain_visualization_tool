import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const TOPIC_META = {
  hash: { icon: '#️⃣', vi: 'Hàm băm & SHA-256', en: 'Hash Functions & SHA-256' },
  mining: { icon: '⛏️', vi: 'Khai thác & PoW', en: 'Mining & Proof of Work' },
  rsa: { icon: '🔐', vi: 'Mã hoá RSA', en: 'RSA Encryption' },
  merkle: { icon: '🌳', vi: 'Cây Merkle', en: 'Merkle Trees' },
  blockchain_basics: { icon: '🔗', vi: 'Cơ bản Blockchain', en: 'Blockchain Basics' },
  crypto_fundamentals: { icon: '🧮', vi: 'Mật mã học', en: 'Cryptography Fundamentals' },
  network: { icon: '🌐', vi: 'Mạng P2P & Node', en: 'P2P Network & Nodes' },
  smart_contracts: { icon: '📜', vi: 'Smart Contract', en: 'Smart Contracts' },
  security: { icon: '🛡️', vi: 'Bảo mật', en: 'Security & Attacks' },
};

const DIFF_LABELS = { easy: { vi: 'Dễ', en: 'Easy' }, medium: { vi: 'Vừa', en: 'Medium' }, hard: { vi: 'Khó', en: 'Hard' } };

export default function QuizView({ lang }) {
  const { token } = useAuth();
  const isVi = lang === 'vi';
  const [mode, setMode] = useState('menu'); // menu | practice | exam | examResult
  const [questions, setQuestions] = useState([]);
  const [topicStats, setTopicStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [certName, setCertName] = useState('');

  // Practice state
  const [practiceFilter, setPracticeFilter] = useState({ topic: null, difficulty: null });
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceRevealed, setPracticeRevealed] = useState({});

  // Exam state
  const [examQuestions, setExamQuestions] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examIdx, setExamIdx] = useState(0);
  const [examAttemptId, setExamAttemptId] = useState(null);
  const [examTimeLeft, setExamTimeLeft] = useState(3600);
  const [examResult, setExamResult] = useState(null);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Load topics on mount
  useEffect(() => {
    fetch('/api/quiz/topics').then(r => r.json()).then(d => setTopicStats(d.topics || {}));
  }, []);

  // Load user progress
  useEffect(() => {
    if (!token) { setUserProgress(null); return; }
    fetch('/api/quiz/progress', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUserProgress(d); })
      .catch(() => {});
  }, [token, mode]);

  // Practice: load questions
  const loadPractice = useCallback((topic, difficulty) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (topic) params.set('topic', topic);
    if (difficulty) params.set('difficulty', difficulty);
    fetch(`/api/quiz/questions?${params}`).then(r => r.json()).then(d => {
      setQuestions(d.questions || []);
      setPracticeIdx(0);
      setPracticeAnswers({});
      setPracticeRevealed({});
      setPracticeFilter({ topic, difficulty });
      setMode('practice');
    }).finally(() => setLoading(false));
  }, []);

  // Exam: start
  const startExam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setExamQuestions(data.questions);
      setExamAttemptId(data.attemptId);
      setExamAnswers({});
      setExamIdx(0);
      setExamTimeLeft(data.timeLimit || 3600);
      setExamResult(null);
      setMode('exam');
    } finally { setLoading(false); }
  }, [token]);

  // Exam timer
  useEffect(() => {
    if (mode !== 'exam') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [mode]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (mode === 'exam' && examTimeLeft === 0 && !examSubmitting) {
      submitExam();
    }
  }, [examTimeLeft, mode]);

  const submitExam = async () => {
    if (examSubmitting) return;
    setExamSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ attemptId: examAttemptId, answers: examAnswers }),
      });
      const data = await res.json();
      setExamResult(data);
      setMode('examResult');
    } catch (err) {
      alert('Error submitting exam: ' + err.message);
    } finally { setExamSubmitting(false); }
  };

  // Save practice progress
  const savePracticeAnswer = useCallback((q, ansIdx) => {
    const correct = ansIdx === q.correct;
    setPracticeAnswers(prev => ({ ...prev, [q.id]: ansIdx }));
    setPracticeRevealed(prev => ({ ...prev, [q.id]: true }));
    // Save to server
    fetch('/api/quiz/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ questionId: q.id, selectedAnswer: ansIdx, correct, topic: q.topic, difficulty: q.difficulty }),
    }).catch(() => {});
  }, [token]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── MENU ────────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div className="page">
        <div className="quiz-hero">
          <div className="quiz-hero-inner">
            <span className="badge badge-cyan" style={{ marginBottom: 16, display: 'inline-block' }}>Foundation of Blockchain</span>
            <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
              {isVi ? 'Trung tâm Quiz & Chứng chỉ' : 'Quiz & Certification Center'}
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 16, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.8 }}>
              {isVi
                ? 'Ôn tập kiến thức blockchain qua 500+ câu hỏi trắc nghiệm, sau đó làm bài test để nhận chứng chỉ Foundation of Blockchain.'
                : 'Review blockchain knowledge through 500+ quiz questions, then take the test to earn your Foundation of Blockchain certificate.'}
            </p>
            <div className="quiz-tabs" style={{ marginBottom: 32 }}>
              <button className="quiz-tab active">{isVi ? 'Ôn tập' : 'Practice'}</button>
              <button className="quiz-tab" onClick={startExam} disabled={loading}>
                {isVi ? 'Làm bài Test' : 'Take Test'}
              </button>
            </div>
          </div>
        </div>

        <div className="section">
          {/* Exam Info Card */}
          <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: '28px 24px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {isVi ? 'Bài Test Chứng chỉ' : 'Certification Test'}
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>
              {isVi
                ? '40 câu hỏi ngẫu nhiên • 60 phút • Đạt ≥ 70% để nhận chứng chỉ PDF'
                : '40 random questions • 60 minutes • Pass ≥ 70% to earn PDF certificate'}
            </p>
            <button className="btn btn-primary" onClick={startExam} disabled={loading}>
              {loading ? (isVi ? 'Đang tải...' : 'Loading...') : (isVi ? 'Bắt đầu bài Test' : 'Start Test')}
            </button>
          </div>

          {/* Topic Grid */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            {isVi ? 'Ôn tập theo chủ đề' : 'Practice by Topic'}
          </h3>
          <div className="topic-grid">
            {Object.entries(TOPIC_META).map(([topicId, meta]) => {
              const stats = topicStats[topicId] || { easy: 0, medium: 0, hard: 0, total: 0 };
              const isExpanded = expandedTopic === topicId;
              // Progress calculation
              const topicProgress = userProgress?.stats?.byTopic?.[topicId];
              const answeredCount = topicProgress?.total || 0;
              const correctCount = topicProgress?.correct || 0;
              const totalQ = stats.total || 1;
              const pct = Math.min(100, Math.round((answeredCount / totalQ) * 100));
              // SVG ring params
              const R = 22, C = 2 * Math.PI * R;
              const offset = C - (pct / 100) * C;
              return (
                <div key={topicId} className={`topic-card${isExpanded ? ' topic-card-expanded' : ''}`}
                  onClick={() => setExpandedTopic(isExpanded ? null : topicId)}>
                  <div className="topic-card-header">
                    <span className="topic-card-icon">{meta.icon}</span>
                    <span className="topic-card-title">{isVi ? meta.vi : meta.en}</span>
                    <div className="topic-progress-ring" title={`${pct}%`}>
                      <svg width="52" height="52" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r={R} fill="none" stroke="var(--border)" strokeWidth="4" />
                        <circle cx="26" cy="26" r={R} fill="none"
                          stroke={pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--cyan)'}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={C} strokeDashoffset={offset}
                          transform="rotate(-90 26 26)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                      </svg>
                      <span className="topic-progress-pct">{pct}%</span>
                    </div>
                  </div>
                  <div className="topic-card-stats">
                    <span className="topic-card-stat topic-stat-easy">{stats.easy} {DIFF_LABELS.easy[lang]}</span>
                    <span className="topic-card-stat topic-stat-medium">{stats.medium} {DIFF_LABELS.medium[lang]}</span>
                    <span className="topic-card-stat topic-stat-hard">{stats.hard} {DIFF_LABELS.hard[lang]}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                    {answeredCount}/{stats.total} {isVi ? 'đã trả lời' : 'answered'}
                    {answeredCount > 0 && ` • ${correctCount}/${answeredCount} ${isVi ? 'đúng' : 'correct'}`}
                  </div>
                  {isExpanded && (
                    <div className="topic-diff-selector" onClick={e => e.stopPropagation()}>
                      <div className="topic-diff-title">
                        {isVi ? 'Chọn mức độ:' : 'Select difficulty:'}
                      </div>
                      <div className="topic-diff-buttons">
                        {['easy','medium','hard'].map(d => {
                          const cnt = stats[d] || 0;
                          const colors = { easy: 'var(--green)', medium: 'var(--amber)', hard: 'var(--red)' };
                          return (
                            <button key={d} className={`topic-diff-btn topic-diff-${d}`}
                              onClick={() => loadPractice(topicId, d)}>
                              <span className="topic-diff-btn-label">{DIFF_LABELS[d][lang]}</span>
                              <span className="topic-diff-btn-count">{cnt} {isVi ? 'câu' : 'Q'}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button className="topic-diff-all" onClick={() => loadPractice(topicId, null)}>
                        {isVi ? `Tất cả ${stats.total} câu` : `All ${stats.total} questions`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Practice All */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {isVi ? 'Ôn tập theo mức độ' : 'Practice by Difficulty'}
            </h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} className="btn btn-secondary" onClick={() => loadPractice(null, d)}>
                  {DIFF_LABELS[d][lang]}
                </button>
              ))}
              <button className="btn btn-secondary" onClick={() => loadPractice(null, null)}>
                {isVi ? 'Tất cả 500 câu' : 'All 500 Questions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRACTICE ────────────────────────────────────────────
  if (mode === 'practice') {
    const q = questions[practiceIdx];
    if (!q) return (
      <div className="page section" style={{ textAlign: 'center', paddingTop: 120 }}>
        <p>{isVi ? 'Không có câu hỏi nào.' : 'No questions found.'}</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setMode('menu')}>
          {isVi ? 'Quay lại' : 'Go Back'}
        </button>
      </div>
    );

    const answered = practiceAnswers[q.id] !== undefined;
    const revealed = practiceRevealed[q.id];
    const qText = isVi ? q.question_vi : q.question_en;
    const opts = isVi ? q.options_vi : q.options_en;
    const explanation = isVi ? q.explanation_vi : q.explanation_en;
    const letters = ['A', 'B', 'C', 'D'];

    return (
      <div className="page">
        {/* Header bar */}
        <div style={{ position: 'sticky', top: 60, zIndex: 50, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('menu')}>
            ← {isVi ? 'Quay lại' : 'Back'}
          </button>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            {practiceIdx + 1} / {questions.length}
            {practiceFilter.topic && ` • ${TOPIC_META[practiceFilter.topic]?.[lang] || practiceFilter.topic}`}
            {practiceFilter.difficulty && ` • ${DIFF_LABELS[practiceFilter.difficulty]?.[lang]}`}
          </span>
          <div className="progress-bar" style={{ width: 120 }}>
            <div className="progress-fill" style={{ width: `${((practiceIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="section" style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="practice-question-card">
            <div className="practice-q-header">
              <span className="practice-q-number">
                {isVi ? 'Câu' : 'Q'} {practiceIdx + 1}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-purple'}`}>
                  {DIFF_LABELS[q.difficulty]?.[lang]}
                </span>
                <span className="badge badge-cyan">{TOPIC_META[q.topic]?.[lang] || q.topic}</span>
              </div>
            </div>
            <div className="practice-q-text">{qText}</div>
            <div className="practice-options">
              {opts.map((opt, i) => {
                let cls = 'practice-option';
                if (revealed) {
                  if (i === q.correct) cls += ' correct';
                  else if (i === practiceAnswers[q.id] && i !== q.correct) cls += ' incorrect';
                } else if (practiceAnswers[q.id] === i) {
                  cls += ' selected';
                }
                return (
                  <div key={i} className={cls} onClick={() => !revealed && savePracticeAnswer(q, i)}>
                    <span className="practice-option-letter">{letters[i]}</span>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
            {revealed && explanation && (
              <div className="practice-explanation">
                <div className="practice-explanation-label">{isVi ? 'Giải thích:' : 'Explanation:'}</div>
                {explanation}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="btn btn-secondary" disabled={practiceIdx === 0} onClick={() => setPracticeIdx(i => i - 1)}>
              ← {isVi ? 'Trước' : 'Prev'}
            </button>
            <button className="btn btn-primary" disabled={practiceIdx >= questions.length - 1} onClick={() => setPracticeIdx(i => i + 1)}>
              {isVi ? 'Tiếp' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── EXAM ────────────────────────────────────────────────
  if (mode === 'exam') {
    const q = examQuestions[examIdx];
    if (!q) return null;
    const qText = isVi ? q.question_vi : q.question_en;
    const opts = isVi ? q.options_vi : q.options_en;
    const letters = ['A', 'B', 'C', 'D'];
    const timeClass = examTimeLeft <= 60 ? 'danger' : examTimeLeft <= 300 ? 'warning' : '';

    return (
      <div className="page">
        {/* Timer bar */}
        <div className="exam-timer">
          <div>
            <span className={`exam-timer-clock ${timeClass}`}>{formatTime(examTimeLeft)}</span>
          </div>
          <span className="exam-timer-info">
            {examIdx + 1} / {examQuestions.length} • {Object.keys(examAnswers).length} {isVi ? 'đã trả lời' : 'answered'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (confirm(isVi ? 'Bạn chắc chắn muốn nộp bài?' : 'Are you sure you want to submit?')) submitExam();
          }} disabled={examSubmitting}>
            {examSubmitting ? '...' : (isVi ? 'Nộp bài' : 'Submit')}
          </button>
        </div>

        {/* Question navigation */}
        <div className="exam-container">
          <div className="exam-nav-grid">
            {examQuestions.map((_, i) => (
              <button
                key={i}
                className={`exam-nav-dot ${examAnswers[examQuestions[i].id] !== undefined ? 'answered' : ''} ${i === examIdx ? 'current' : ''}`}
                onClick={() => setExamIdx(i)}
              >{i + 1}</button>
            ))}
          </div>

          <div className="practice-question-card">
            <div className="practice-q-header">
              <span className="practice-q-number">{isVi ? 'Câu' : 'Q'} {examIdx + 1}/{examQuestions.length}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-purple'}`}>
                  {DIFF_LABELS[q.difficulty]?.[lang]}
                </span>
              </div>
            </div>
            <div className="practice-q-text">{qText}</div>
            <div className="practice-options">
              {opts.map((opt, i) => (
                <div
                  key={i}
                  className={`practice-option ${examAnswers[q.id] === i ? 'selected' : ''}`}
                  onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: i }))}
                >
                  <span className="practice-option-letter">{letters[i]}</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="exam-actions">
            <button className="btn btn-secondary" disabled={examIdx === 0} onClick={() => setExamIdx(i => i - 1)}>
              ← {isVi ? 'Trước' : 'Prev'}
            </button>
            <button className="btn btn-primary" disabled={examIdx >= examQuestions.length - 1} onClick={() => setExamIdx(i => i + 1)}>
              {isVi ? 'Tiếp' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── EXAM RESULT ─────────────────────────────────────────
  if (mode === 'examResult' && examResult) {
    const { score, totalQuestions, passed, certificate, results } = examResult;
    return (
      <div className="page section">
        <div className="exam-result-card">
          <div className="exam-result-score">{score}/{totalQuestions}</div>
          <div className={`exam-result-label ${passed ? 'exam-result-passed' : 'exam-result-failed'}`}>
            {passed
              ? (isVi ? 'Chúc mừng! Bạn đã đạt!' : 'Congratulations! You passed!')
              : (isVi ? 'Chưa đạt. Hãy thử lại!' : 'Not passed. Try again!')}
          </div>
          <div className="exam-result-sub">
            {isVi ? `Đúng ${score} / ${totalQuestions} câu (${Math.round(score / totalQuestions * 100)}%)` : `Correct ${score} / ${totalQuestions} (${Math.round(score / totalQuestions * 100)}%)`}
          </div>

          {passed && certificate && (
            <div className="cert-banner">
              <div className="cert-banner-title">
                🎓 Foundation of Blockchain Certificate
              </div>
              <div className="cert-banner-code">
                {isVi ? 'Mã chứng chỉ:' : 'Certificate Code:'} {certificate.certCode}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                  {isVi ? 'Nhập tên hiển thị trên chứng chỉ:' : 'Enter display name for certificate:'}
                </label>
                <input
                  type="text"
                  value={certName}
                  onChange={e => setCertName(e.target.value)}
                  placeholder={isVi ? 'Họ và tên' : 'Full name'}
                  style={{
                    width: '100%', maxWidth: 320, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg-input)',
                    color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14,
                    textAlign: 'center', outline: 'none',
                  }}
                />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12 }}
                disabled={!certName.trim()}
                onClick={() => generateCertPDF({ ...certificate, displayName: certName.trim() })}>
                {isVi ? 'Tải chứng chỉ PDF' : 'Download PDF Certificate'}
              </button>
            </div>
          )}
        </div>

        {/* Detailed results */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>
          {isVi ? 'Chi tiết kết quả' : 'Detailed Results'}
        </h3>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {results?.map((r, i) => {
            const qText = isVi ? r.question_vi : r.question_en;
            const opts = isVi ? r.options_vi : r.options_en;
            const expl = isVi ? r.explanation_vi : r.explanation_en;
            return (
              <div key={i} className="practice-question-card">
                <div className="practice-q-header">
                  <span className="practice-q-number">{isVi ? 'Câu' : 'Q'} {i + 1}</span>
                  <span className={`badge ${r.correct ? 'badge-green' : 'badge-purple'}`} style={r.correct ? {} : { background: 'rgba(251,113,133,0.1)', color: 'var(--red)', borderColor: 'rgba(251,113,133,0.25)' }}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                </div>
                <div className="practice-q-text">{qText}</div>
                <div className="practice-options">
                  {opts?.map((opt, j) => {
                    let cls = 'practice-option';
                    if (j === r.correctAnswer) cls += ' correct';
                    else if (j === r.selectedAnswer && j !== r.correctAnswer) cls += ' incorrect';
                    return (
                      <div key={j} className={cls} style={{ cursor: 'default' }}>
                        <span className="practice-option-letter">{['A','B','C','D'][j]}</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                {expl && (
                  <div className="practice-explanation">
                    <div className="practice-explanation-label">{isVi ? 'Giải thích:' : 'Explanation:'}</div>
                    {expl}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn btn-secondary" onClick={() => setMode('menu')}>
            {isVi ? 'Quay lại menu' : 'Back to Menu'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Generate PDF certificate using jsPDF
async function generateCertPDF(certificate) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 210, 'F');

  // Border
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, 269, 182);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text('HUBBLOCK EDUCATION PLATFORM', 148.5, 35, { align: 'center' });

  doc.setFontSize(32);
  doc.setTextColor(192, 132, 252);
  doc.text('CERTIFICATE', 148.5, 55, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text('OF ACHIEVEMENT', 148.5, 65, { align: 'center' });

  // Line
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.5);
  doc.line(80, 72, 217, 72);

  // Foundation
  doc.setFontSize(20);
  doc.setTextColor(56, 189, 248);
  doc.text('Foundation of Blockchain', 148.5, 88, { align: 'center' });

  // Name
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text('This certifies that', 148.5, 103, { align: 'center' });

  doc.setFontSize(24);
  doc.setTextColor(241, 245, 249);
  doc.text(certificate.displayName || 'Student', 148.5, 118, { align: 'center' });

  // PASS status (no score)
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text('has successfully passed the Foundation of Blockchain examination', 148.5, 133, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(74, 222, 128);
  doc.text('PASSED', 148.5, 146, { align: 'center' });

  // Certificate code & date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Certificate Code: ${certificate.certCode}`, 148.5, 165, { align: 'center' });
  doc.text(`Issued: ${dateStr}`, 148.5, 173, { align: 'center' });
  doc.text('Verify at: hubblock.edu/verify', 148.5, 181, { align: 'center' });

  doc.save(`HubBlock_Certificate_${certificate.certCode}.pdf`);
}
