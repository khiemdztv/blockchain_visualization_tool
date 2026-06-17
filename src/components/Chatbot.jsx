/**
 * Chatbot.jsx — AI Chatbot Component for HubBlock
 * 
 * Features:
 * - Floating button (fixed bottom-right) with pulse animation
 * - Slide-up chatbox (380px × 520px)
 * - User/Bot bubbles with typing indicator
 * - Quick suggestion chips
 * - LocalStorage history (max 50 messages)
 * - Smart context: sends current page + lang to backend
 * - Multilingual UI (VI / EN)
 * - Clear chat button
 * - Debounced input, Enter to send
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// ─── i18n strings ──────────────────────────────────────────────
const CHAT_I18N = {
  vi: {
    title: 'AI Assistant',
    subtitle: 'Trợ lý học Blockchain',
    placeholder: 'Hỏi gì đó về Blockchain...',
    send: 'Gửi',
    typing: 'Đang trả lời',
    clear: 'Xoá chat',
    error: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
    errorKey: 'Chưa cấu hình OpenAI API key. Vui lòng thêm OPENAI_API_KEY vào file .env.',
    welcome: 'Xin chào! 👋 Tôi là AI Assistant của HubBlock.\nTôi được học từ 14 tài liệu nghiên cứu về Blockchain!\nBạn có thể hỏi tôi về:\n• Bitcoin, Blockchain, Hash, Merkle Tree\n• Mật mã học, RSA, SHA-256\n• Timestamping, Proof of Work\n• Bất cứ điều gì bạn thắc mắc!',
    suggestions: [
      '⛓ Blockchain là gì?',
      '🔒 Hash SHA-256 hoạt động ra sao?',
      '⛏ Mining là gì?',
      '🌳 Merkle Tree dùng để làm gì?',
    ],
    poweredBy: 'RAG · GPT-4o-mini · 14 tài liệu nghiên cứu',
    sources: 'Nguồn tham khảo',
    page: 'tr.',
  },
  en: {
    title: 'AI Assistant',
    subtitle: 'Blockchain Learning Helper',
    placeholder: 'Ask anything about Blockchain...',
    send: 'Send',
    typing: 'Typing',
    clear: 'Clear chat',
    error: 'Sorry, something went wrong. Please try again.',
    errorKey: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
    welcome: 'Hello! 👋 I am HubBlock\'s AI Assistant.\nI have studied 14 research documents on Blockchain!\nFeel free to ask me about:\n• Bitcoin, Blockchain, Hash, Merkle Tree\n• Cryptography, RSA, SHA-256\n• Timestamping, Proof of Work\n• Anything you\'re curious about!',
    suggestions: [
      '⛓ What is Blockchain?',
      '🔒 How does SHA-256 work?',
      '⛏ What is Mining?',
      '🌳 What is a Merkle Tree?',
    ],
    poweredBy: 'RAG · GPT-4o-mini · 14 Research Papers',
    sources: 'References',
    page: 'p.',
  },
};

// ─── Helpers ───────────────────────────────────────────────────
const STORAGE_KEY = 'hubblock_chat_history';
const MAX_HISTORY = 50;

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveHistory(messages) {
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded — silently ignore */ }
}

// ─── SendIcon SVG ──────────────────────────────────────────────
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function BotIcon() {
  return (
    <img 
      src="/images/logo_hubblock.png" 
      alt="Bot Avatar" 
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
    />
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────
function TypingIndicator({ label }) {
  return (
    <div className="cb-msg cb-msg-bot">
      <div className="cb-avatar"><BotIcon /></div>
      <div className="cb-bubble cb-bubble-bot cb-typing-bubble">
        <span className="cb-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="cb-typing-dot" style={{ animationDelay: '160ms' }} />
        <span className="cb-typing-dot" style={{ animationDelay: '320ms' }} />
        <span className="cb-typing-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg, lang }) {
  const isUser = msg.role === 'user';
  
  const processText = (text) => {
    // Xóa các ký tự LaTeX toán học gây lỗi hiển thị
    let cleanText = text.replace(/\\\\?\(/g, '').replace(/\\\\?\)/g, '');
    cleanText = cleanText.replace(/\\\\?\[/g, '\n').replace(/\\\\?\]/g, '\n');
    
    const lines = cleanText.split('\n');
    return lines.map((line, i) => {
      // Xử lý Markdown Header (### Heading)
      let isHeader = false;
      let parsedLine = line;
      if (/^#{1,6}\s+(.*)/.test(line)) {
        isHeader = true;
        parsedLine = line.replace(/^#{1,6}\s+/, '');
      }

      // Xử lý in đậm (**text**)
      const boldParts = parsedLine.split(/(\*\*.*?\*\*)/g);
      const lineContent = boldParts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={i}>
          {isHeader ? <strong style={{fontSize: '110%', color: 'var(--cyan)', display: 'block', marginTop: '8px'}}>{lineContent}</strong> : lineContent}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`cb-msg ${isUser ? 'cb-msg-user' : 'cb-msg-bot'}`}>
      {!isUser && <div className="cb-avatar"><BotIcon /></div>}
      <div className="cb-bubble-wrapper">
        <div className={`cb-bubble ${isUser ? 'cb-bubble-user' : 'cb-bubble-bot'}`}>
          {processText(msg.content || '')}
        </div>
      </div>
    </div>
  );
}

// ─── Main Chatbot Component ────────────────────────────────────
export default function Chatbot({ lang = 'vi', currentPage = 'home' }) {
  const t = CHAT_I18N[lang] || CHAT_I18N.vi;
  const { token, isAdmin } = useAuth();

  const makeWelcomeMsg = (strings) => ({
    id: 'welcome',
    role: 'bot',
    content: strings.welcome,
    ts: Date.now(),
  });

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = loadHistory();
    return saved && saved.length > 0 ? saved : [makeWelcomeMsg(CHAT_I18N[lang] || CHAT_I18N.vi)];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    const toSave = messages.filter(m => m.id !== 'welcome');
    if (toSave.length > 0) saveHistory(messages);
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const fetchHeaders = { 'Content-Type': 'application/json' };
      if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          message: trimmed,
          context: {
            current_page: currentPage,
            lang,
            history: messages
              .filter(m => m.id !== 'welcome')
              .slice(-6)
              .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: data.reply || t.error,
        sources: data.sources || [],
        ts: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const isKeyError = err.message?.toLowerCase().includes('key') ||
                         err.message?.toLowerCase().includes('auth') ||
                         err.message?.toLowerCase().includes('401');
      const errMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: isKeyError ? t.errorKey : t.error,
        ts: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, currentPage, lang, t]);

  const handleSend = () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendMessage(input), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    const t2 = CHAT_I18N[lang] || CHAT_I18N.vi;
    setMessages([makeWelcomeMsg(t2)]);
    setShowSuggestions(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  const pageLabels = {
    vi: { home: 'Trang Chủ', demo: 'Demo Hash', mining: 'Mining', about: 'Về Dự Án', team: 'Nhóm' },
    en: { home: 'Home', demo: 'Hash Demo', mining: 'Mining', about: 'About', team: 'Team' },
  };
  const pageLang = pageLabels[lang] || pageLabels.vi;

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        className={`cb-fab ${open ? 'cb-fab-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle AI Chatbot"
        title="AI Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <img 
            src="/images/logo_hubblock.png" 
            alt="Chatbot" 
            style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' }} 
          />
        )}
        {!open && messages.filter(m => m.role === 'bot' && m.id !== 'welcome').length === 0 && (
          <span className="cb-fab-badge">AI</span>
        )}
      </button>

      {/* ── Chatbox ── */}
      <div className={`cb-box ${open ? 'cb-box-open' : ''}`} role="dialog" aria-label="AI Chatbot">
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-avatar">
            <BotIcon />
          </div>
          <div className="cb-header-info">
            <div className="cb-header-title">{t.title}</div>
            <div className="cb-header-sub">
              <span className="cb-online-dot" />
              {t.subtitle}
            </div>
          </div>
          <div className="cb-header-actions">
            <span className="cb-page-badge" title={`Current page: ${currentPage}`}>
              {pageLang[currentPage] || currentPage}
            </span>
            <button className="cb-icon-btn" onClick={handleClear} title={t.clear} aria-label={t.clear}>
              <TrashIcon />
            </button>
            <button className="cb-icon-btn" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="cb-messages" id="cb-messages-container">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} lang={lang} />
          ))}
          {loading && <TypingIndicator label={t.typing} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && !loading && (
          <div className="cb-suggestions">
            {t.suggestions.map((s, i) => (
              <button key={i} className="cb-chip" onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
            {isAdmin && (
              <>
                <button className="cb-chip" onClick={() => handleSuggestion(lang === 'vi' ? 'Hiện có bao nhiêu người đăng ký?' : 'How many users are registered?')}>
                  {lang === 'vi' ? '👥 Thống kê người dùng' : '👥 User stats'}
                </button>
                <button className="cb-chip" onClick={() => handleSuggestion(lang === 'vi' ? 'Tiến độ học sinh như thế nào?' : 'How is student progress?')}>
                  {lang === 'vi' ? '📊 Tiến độ học sinh' : '📊 Student progress'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Input row */}
        <div className="cb-input-row">
          <textarea
            ref={inputRef}
            className="cb-input"
            placeholder={t.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
            aria-label="Chat input"
          />
          <button
            className="cb-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label={t.send}
            title={t.send}
          >
            <SendIcon />
          </button>
        </div>

        {/* Footer */}
        <div className="cb-footer">
          <span className="cb-footer-text">{t.poweredBy}</span>
        </div>
      </div>
    </>
  );
}
