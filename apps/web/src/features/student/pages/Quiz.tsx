import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQuiz, submitQuiz, type QuizData } from '@/data/student';
import { buildQuizAnswers, toggleOption, isAnswered, answeredCount, type QuizAnswers } from './quizLogic';
import StartQuizConfirm from '../components/StartQuizConfirm';

function fmtClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: assignmentId } = useParams();
  const state = location.state as { classId?: string; startNow?: boolean } | null;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Đã xác nhận từ trang chi tiết → vào thẳng bài làm, bỏ qua intro
  const [phase, setPhase] = useState<'intro' | 'doing'>(state?.startNow ? 'doing' : 'intro');
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { data: quiz, isLoading } = useQuery<QuizData>({
    queryKey: ['quiz', assignmentId],
    queryFn: () => getQuiz(assignmentId ?? ''),
    enabled: !!assignmentId,
  });
  const questions = quiz?.questions ?? [];

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error('No quiz');
      return submitQuiz(quiz.targetId, buildQuizAnswers(quiz.questions, answers));
    },
    onSuccess: () => {
      setShowConfirm(false);
      setSubmitted(true);
    },
  });

  // Đồng hồ đếm thời gian làm bài — chỉ chạy khi đã bắt đầu, dừng khi nộp
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== 'doing' || !quiz || submitted) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, quiz, submitted]);

  // Cảnh báo khi đóng/tải lại tab giữa bài làm
  useEffect(() => {
    if (phase !== 'doing' || submitted) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [phase, submitted]);

  if (isLoading) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Đang tải đề...
      </div>
    );
  }

  const q = questions[current];
  const totalAnswered = answeredCount(questions, answers);
  const pct = questions.length ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const setAnswer = (val: string | string[]) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

  const toggleMultiple = (optId: string) => {
    setAnswer(toggleOption(answers[q.id] as string[] | undefined, optId));
  };

  // Thoát → về trang chi tiết bài tập (cha của /quiz trong cây URL)
  const onBack = () => {
    if (assignmentId) {
      navigate(`/student/assignments/${assignmentId}`);
    } else {
      navigate('/student/assignments');
    }
  };

  // Thoát giữa bài làm → xác nhận trước khi quay lại trang cũ
  const requestExit = () => {
    if (phase === 'doing' && !submitted) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#F0FDF4',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: '#111827',
              margin: '0 0 8px',
            }}
          >
            Bài tập đã được nộp!
          </h2>
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 18 }}>
            Bạn đã trả lời {totalAnswered}/{questions.length} câu hỏi. Giáo viên sẽ chấm điểm trong thời gian sớm nhất.
          </p>
          <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} onClick={onBack}>
            Quay lại bài tập
          </button>
        </div>
      </div>
    );
  }

  // ── Màn hình giới thiệu: phải bấm "Bắt đầu làm bài" + xác nhận ──
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
            }}
          >
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={onBack}>
              ← Quay lại
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
          <div className="card" style={{ padding: 36, textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#EFF6FF',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: '#111827',
                margin: '0 0 6px',
              }}
            >
              {quiz?.title ?? 'Bài kiểm tra'}
            </h2>
            <div style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 24 }}>
              {quiz?.className && <span>{quiz.className} · </span>}
              {questions.length} câu hỏi · Thang điểm 10
            </div>

            <div
              style={{
                textAlign: 'left',
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 26,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {[
                'Đồng hồ chỉ bắt đầu đếm sau khi bạn xác nhận làm bài',
                'Có thể chuyển qua lại tự do giữa các câu hỏi',
                'Tiến độ sẽ không được lưu nếu thoát giữa chừng',
              ].map((t) => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#374151' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.4"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px 20px', fontSize: 15 }}
              onClick={() => setShowStartConfirm(true)}
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>

        {/* Popup xác nhận bắt đầu — dùng component chung */}
        {showStartConfirm && (
          <StartQuizConfirm
            title={quiz?.title ?? 'Bài kiểm tra'}
            questions={questions.length}
            onCancel={() => setShowStartConfirm(false)}
            onConfirm={() => {
              setElapsed(0);
              setPhase('doing');
              setShowStartConfirm(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Quiz header bar */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #F3F4F6',
          padding: '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            height: 64,
            gap: 20,
          }}
        >
          <button
            className="btn-ghost"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              flexShrink: 0,
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              background: 'white',
              fontWeight: 600,
            }}
            onClick={requestExit}
          >
            ← Thoát bài làm
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {quiz?.title ?? 'Bài kiểm tra'}
              </span>
              <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                Câu {current + 1}/{questions.length} · {totalAnswered}/{questions.length} đã trả lời ({pct}%)
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div
            title="Thời gian làm bài"
            style={{
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 700,
              color: '#2563EB',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderRadius: 99,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {fmtClock(elapsed)}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '28px 24px 56px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        {/* Question area */}
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <div className="card" style={{ padding: 28 }}>
            {/* Question number + type badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#6B7280' }}>
                CÂU HỎI {current + 1}/{questions.length}
              </span>
              <span
                className={
                  q.type === 'single' ? 'badge-info' : q.type === 'multiple' ? 'badge-warning' : 'badge-gray'
                }
                style={{ fontSize: 11 }}
              >
                {q.type === 'single' ? 'Một đáp án' : q.type === 'multiple' ? 'Nhiều đáp án' : 'Điền vào chỗ trống'}
              </span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', lineHeight: 1.6, marginBottom: 20 }}>
              {q.text}
            </p>

            {/* Single choice */}
            {q.type === 'single' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setAnswer(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '13px 16px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#2563EB' : '#E5E7EB'}`,
                        background: selected ? '#EFF6FF' : 'white',
                        textAlign: 'left',
                        transition: 'border-color 0.12s, background 0.12s',
                        fontSize: 15,
                        color: selected ? '#1d4ed8' : '#374151',
                        fontWeight: selected ? 600 : 400,
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = '#F9FAFB')}
                      onMouseLeave={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = 'white')}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          flexShrink: 0,
                          border: `1.5px solid ${selected ? '#2563EB' : '#D1D5DB'}`,
                          background: selected ? '#2563EB' : 'white',
                          color: selected ? 'white' : '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                      {selected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multiple choice */}
            {q.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 2 }}>Chọn tất cả đáp án đúng</div>
                {q.options.map((opt, i) => {
                  const selected = ((answers[q.id] as string[] | undefined) || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleMultiple(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '13px 16px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#2563EB' : '#E5E7EB'}`,
                        background: selected ? '#EFF6FF' : 'white',
                        textAlign: 'left',
                        transition: 'border-color 0.12s, background 0.12s',
                        fontSize: 15,
                        color: selected ? '#1d4ed8' : '#374151',
                        fontWeight: selected ? 600 : 400,
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = '#F9FAFB')}
                      onMouseLeave={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = 'white')}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          flexShrink: 0,
                          border: `1.5px solid ${selected ? '#2563EB' : '#D1D5DB'}`,
                          background: selected ? '#2563EB' : 'white',
                          color: selected ? 'white' : '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                      {selected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill in blank */}
            {q.type === 'fill' && (
              <div>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 10 }}>
                  Điền đáp án của bạn vào ô bên dưới:
                </div>
                <input
                  className="input-field"
                  placeholder="Nhập đáp án..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={{ fontSize: 16, padding: '14px 18px', maxWidth: 360 }}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Navigation — khối card riêng biệt dễ nhận biết */}
          <div
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
              padding: '14px 20px',
            }}
          >
            <button
              className="btn-secondary"
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              style={{ opacity: current === 0 ? 0.4 : 1 }}
            >
              ← Câu trước
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {current < questions.length - 1 ? (
                <button className="btn-primary" onClick={() => setCurrent(current + 1)}>
                  Câu tiếp theo →
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setShowConfirm(true)}>
                  Nộp bài
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ flex: '0 0 300px', minWidth: 'min(100%, 300px)' }}>
          <div className="card" style={{ padding: 20, position: 'sticky', top: 88 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                Điều hướng
              </h4>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                {totalAnswered}/{questions.length}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
                gap: 6,
                marginBottom: 16,
              }}
            >
              {questions.map((q, i) => {
                const answered = isAnswered(answers[q.id]);
                const isCurrent = current === i;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    aria-current={isCurrent}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      border: `1.5px solid ${isCurrent ? '#2563EB' : answered ? '#22C55E' : '#E5E7EB'}`,
                      borderRadius: 8,
                      background: isCurrent ? '#2563EB' : answered ? '#F0FDF4' : 'white',
                      color: isCurrent ? 'white' : answered ? '#16a34a' : '#6B7280',
                      fontSize: 12.5,
                      fontWeight: isCurrent || answered ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '12px 0',
                borderTop: '1px solid #F3F4F6',
                borderBottom: '1px solid #F3F4F6',
                marginBottom: 16,
              }}
            >
              {[
                { label: 'Đã trả lời', count: totalAnswered, color: '#22C55E', bg: '#F0FDF4' },
                { label: 'Chưa trả lời', count: questions.length - totalAnswered, color: '#9CA3AF', bg: '#F3F4F6' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: s.bg,
                        border: `1px solid ${s.color}`,
                      }}
                    />
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => setShowConfirm(true)}
            >
              Nộp bài ngay
            </button>
          </div>
        </div>
      </div>

      {/* Popup xác nhận thoát giữa bài làm — layout chuẩn hệ thống */}
      {showExitConfirm && (
        <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div
            className="modal-box"
            style={{ width: 440, padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: '#111827',
                    margin: 0,
                  }}
                >
                  Thoát bài làm?
                </h3>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  Đã trả lời {totalAnswered}/{questions.length} câu
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowExitConfirm(false)}
                aria-label="Đóng"
                style={{ padding: 6, borderRadius: 8, flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 20px' }}>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 10px' }}>
                Bạn đã trả lời <strong>{totalAnswered}/{questions.length}</strong> câu ·{' '}
                {fmtClock(elapsed)} đã trôi qua.
              </p>
              <div
                style={{
                  color: '#EF4444',
                  fontSize: 13,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                Tiến độ chưa nộp sẽ không được lưu!
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                padding: '12px 20px',
                borderTop: '1px solid #F3F4F6',
              }}
            >
              <button className="btn-secondary" onClick={() => setShowExitConfirm(false)}>
                Tiếp tục làm bài
              </button>
              <button
                className="btn-primary"
                style={{ background: '#EF4444' }}
                onClick={() => {
                  setShowExitConfirm(false);
                  onBack();
                }}
              >
                Thoát bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirm modal — layout chuẩn hệ thống */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="modal-box"
            style={{ width: 440, padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#FFFBEB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: '#111827',
                    margin: 0,
                  }}
                >
                  Xác nhận nộp bài?
                </h3>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {totalAnswered}/{questions.length} câu đã trả lời
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowConfirm(false)}
                aria-label="Đóng"
                style={{ padding: 6, borderRadius: 8, flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 20px' }}>
              <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
                Bạn đã trả lời <strong>{totalAnswered}</strong> trong <strong>{questions.length}</strong>{' '}
                câu hỏi.
              </p>
              {totalAnswered < questions.length && (
                <div
                  style={{
                    marginTop: 10,
                    color: '#EF4444',
                    fontSize: 13,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '8px 12px',
                    borderRadius: 8,
                  }}
                >
                  Còn {questions.length - totalAnswered} câu chưa được trả lời!
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                padding: '12px 20px',
                borderTop: '1px solid #F3F4F6',
              }}
            >
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>
                Kiểm tra lại
              </button>
              <button
                className="btn-primary"
                disabled={submitting || submitMutation.isPending}
                onClick={() => {
                  setSubmitting(true);
                  submitMutation.mutate();
                }}
              >
                {submitMutation.isPending ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
