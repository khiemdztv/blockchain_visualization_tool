import React, { useState } from 'react';

const STEPS = [
  {
    id: 'B1',
    color: '#60a5fa',        // blue-400
    borderColor: 'rgba(96,165,250,0.35)',
    bgColor: 'rgba(96,165,250,0.07)',
    icon: '🔐',
    title: 'Người B tạo cặp khóa',
    description: 'Hệ thống tạo ra một cặp khóa gồm Public Key và Private Key.',
    details: [
      { label: 'Public Key', note: 'Có thể chia sẻ thoải mái — ai cũng có thể thấy', color: '#fbbf24' },
      { label: 'Private Key', note: 'Phải giữ bí mật tuyệt đối — không bao giờ chia sẻ', color: '#a78bfa' },
    ],
  },
  {
    id: 'B2',
    color: '#34d399',        // green-400
    borderColor: 'rgba(52,211,153,0.35)',
    bgColor: 'rgba(52,211,153,0.07)',
    icon: '📤',
    title: 'Gửi Public Key cho A',
    description: 'Người B gửi Public Key cho Người A qua kênh bình thường.',
    details: [
      { label: 'Không cần kênh bảo mật', note: 'Public Key có thể gửi qua email, web, bất kỳ đâu', color: '#34d399' },
      { label: 'Private Key KHÔNG gửi đi', note: 'Private Key luôn ở lại với Người B', color: '#a78bfa' },
    ],
  },
  {
    id: 'B3',
    color: '#fbbf24',        // amber-400
    borderColor: 'rgba(251,191,36,0.35)',
    bgColor: 'rgba(251,191,36,0.07)',
    icon: '✍️',
    title: 'A mã hóa thông điệp',
    description: 'Người A dùng Public Key của B để mã hóa plaintext → Ciphertext.',
    details: [
      { label: 'Plaintext', note: 'Nội dung gốc — đọc được bình thường', color: '#34d399' },
      { label: '+ Public Key → Ciphertext', note: 'Sau khi mã hóa, không ai đọc được nếu không có Private Key', color: '#fbbf24' },
    ],
  },
  {
    id: 'B4',
    color: '#fb923c',        // orange-400
    borderColor: 'rgba(251,146,60,0.35)',
    bgColor: 'rgba(251,146,60,0.07)',
    icon: '🌐',
    title: 'Gửi Ciphertext qua Internet',
    description: 'Ciphertext được gửi qua mạng. Kẻ tấn công có thể bắt được nhưng không đọc được.',
    details: [
      { label: 'An toàn trước nghe lén', note: 'Không có Private Key → không thể giải mã', color: '#fb923c' },
      { label: 'Chỉ duy nhất Người B đọc được', note: 'Vì chỉ B có Private Key', color: '#a78bfa' },
    ],
  },
  {
    id: 'B5',
    color: '#f87171',        // red-400
    borderColor: 'rgba(248,113,113,0.35)',
    bgColor: 'rgba(248,113,113,0.07)',
    icon: '🗝️',
    title: 'B giải mã — thu lại plaintext',
    description: 'Người B dùng Private Key để giải mã Ciphertext, thu lại thông điệp gốc.',
    details: [
      { label: 'Private Key + Ciphertext', note: 'Chỉ B mới có thể thực hiện bước này', color: '#a78bfa' },
      { label: '→ Plaintext gốc', note: 'Thông điệp khôi phục hoàn toàn chính xác', color: '#34d399' },
    ],
  },
];

export default function StepByStepFlow() {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div style={{ width: '100%' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text1)' }}>
          🔄 Quy trình mã hóa RSA — từng bước
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
          Nhấn vào từng bước để xem chi tiết
        </p>
      </div>

      {/* Steps vertical list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(isActive ? null : idx)}
              style={{
                border: `1.5px solid ${isActive ? step.color : step.borderColor}`,
                borderRadius: 12,
                background: isActive ? step.bgColor : 'var(--bg1)',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: isActive ? `0 0 16px ${step.color}22` : 'none',
              }}
            >
              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Step badge */}
                <div style={{
                  minWidth: 40, height: 40,
                  borderRadius: 10,
                  background: `${step.color}20`,
                  border: `1.5px solid ${step.color}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: step.color, lineHeight: 1 }}>{step.id}</span>
                  <span style={{ fontSize: 16 }}>{step.icon}</span>
                </div>

                {/* Title & description */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: step.color, marginBottom: 2 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                    {step.description}
                  </div>
                </div>

                {/* Expand chevron */}
                <div style={{
                  fontSize: 12, color: 'var(--text3)',
                  transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}>
                  ▼
                </div>
              </div>

              {/* Expandable details */}
              {isActive && (
                <div style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${step.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  animation: 'fadeInUp 0.2s ease',
                }}>
                  {step.details.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: d.color,
                        marginTop: 5, flexShrink: 0,
                      }} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: d.color }}>{d.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>— {d.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom summary mini-flow */}
      <div style={{
        marginTop: 20,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        fontSize: 12,
        color: 'var(--text3)',
      }}>
        <span style={{ color: '#60a5fa' }}>🔐 Tạo Key</span>
        <span>→</span>
        <span style={{ color: '#34d399' }}>📤 Gửi PublicKey</span>
        <span>→</span>
        <span style={{ color: '#fbbf24' }}>✍️ Mã hóa</span>
        <span>→</span>
        <span style={{ color: '#fb923c' }}>🌐 Truyền tải</span>
        <span>→</span>
        <span style={{ color: '#f87171' }}>🗝️ Giải mã</span>
      </div>
    </div>
  );
}
