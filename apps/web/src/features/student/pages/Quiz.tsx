import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQuiz, submitQuiz, type QuizData, type QuizAnswer } from '@/data/student';

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { classId?: string; assignmentId?: string } | null;
  const { data: quiz, isLoading } = useQuery<QuizData>({
    queryKey: ['quiz', state?.assignmentId],
    queryFn: () => getQuiz(state?.assignmentId ?? ''),
    enabled: !!state?.assignmentId,
  });
  const questions = quiz?.questions ?? [];

  if (isLoading) {
    return (
      <div className="page-container" style={{ paddingTop: 40, color: '#6B7280' }}>
        Đang tải đề...
      </div>
    );
  }

  const q = questions[current];
  const totalAnswered = Object.keys(answers).length;
  const pct = Math.round((current / questions.length) * 100);

  const setAnswer = (val: string | string[]) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

  const toggleMultiple = (optId: string) => {
    const cur = (answers[q.id] as string[] | undefined) || [];
    const next = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
    setAnswer(next);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error('No quiz');
      const payload: QuizAnswer[] = quiz.questions.map((q: import('@/data/student').QuizQuestion) => {
        const ans = answers[q.id];
        if (q.type === 'fill') {
          return { questionId: q.id, textAnswer: (ans as string) || '' };
        }
        return { questionId: q.id, selectedOptionIds: Array.isArray(ans) ? ans : ans ? [ans] : [] };
      });
      return submitQuiz(quiz.targetId, payload);
    },
    onSuccess: () => {
      setShowConfirm(false);
      setSubmitted(true);
    },
  });

  const onBack = () => {
    if (state?.classId) {
      navigate(`/student/classes/${state.classId}`);
    } else {
      navigate('/student/classes');
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
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 28 }}>
            Bạn đã trả lời {totalAnswered}/{questions.length} câu hỏi. Giáo viên sẽ chấm điểm trong thời gian sớm nhất.
          </p>
          <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} onClick={onBack}>
            Quay lại lớp học
          </button>
        </div>
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
            style={{ padding: '6px 12px', fontSize: 13, flexShrink: 0 }}
            onClick={onBack}
          >
            ← Thoát bài làm
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#6B7280',
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 600 }}>{quiz?.title ?? 'Bài kiểm tra'}</span>
              <span>
                {current + 1}/{questions.length} câu · {totalAnswered} đã trả lời
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              fontSize: 13,
              color: '#EF4444',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            45:00
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 260px',
          gap: 28,
        }}
      >
        {/* Question area */}
        <div>
          <div className="card" style={{ padding: 32 }}>
            {/* Question number + type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  background: '#2563EB',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {current + 1}
              </div>
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
            <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', lineHeight: 1.6, marginBottom: 28 }}>
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
                        padding: '14px 18px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: `2px solid ${selected ? '#2563EB' : '#F3F4F6'}`,
                        background: selected ? '#EFF6FF' : 'white',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        fontSize: 15,
                        color: selected ? '#1d4ed8' : '#374151',
                        fontWeight: selected ? 600 : 400,
                      }}
                      onMouseEnter={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = '#F9FAFB')}
                      onMouseLeave={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = 'white')}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          flexShrink: 0,
                          border: `2px solid ${selected ? '#2563EB' : '#D1D5DB'}`,
                          background: selected ? '#2563EB' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{ flex: 1 }}>
                        <span style={{ color: '#9CA3AF', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multiple choice */}
            {q.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                        padding: '14px 18px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: `2px solid ${selected ? '#2563EB' : '#F3F4F6'}`,
                        background: selected ? '#EFF6FF' : 'white',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        fontSize: 15,
                        color: selected ? '#1d4ed8' : '#374151',
                      }}
                      onMouseEnter={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = '#F9FAFB')}
                      onMouseLeave={(e) => !selected && ((e.currentTarget as HTMLElement).style.background = 'white')}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          flexShrink: 0,
                          border: `2px solid ${selected ? '#2563EB' : '#D1D5DB'}`,
                          background: selected ? '#2563EB' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span>
                        <span style={{ color: '#9CA3AF', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt.text}
                      </span>
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

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
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
                <button
                  className="btn-primary"
                  style={{ background: '#22C55E' }}
                  onClick={() => setShowConfirm(true)}
                >
                  Nộp bài
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div>
          <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 14 }}>
              Danh sách câu hỏi
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = current === i;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      border: `2px solid ${isCurrent ? '#2563EB' : answered ? '#22C55E' : '#E5E7EB'}`,
                      borderRadius: 8,
                      background: isCurrent ? '#2563EB' : answered ? '#F0FDF4' : 'white',
                      color: isCurrent ? 'white' : answered ? '#16a34a' : '#6B7280',
                      fontSize: 13,
                      fontWeight: isCurrent || answered ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
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
              style={{ width: '100%', background: '#22C55E', padding: '10px' }}
              onClick={() => setShowConfirm(true)}
            >
              Nộp bài ngay
            </button>
          </div>
        </div>
      </div>

      {/* Submit confirm modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="modal-box"
            style={{ width: 420, padding: 32, textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FFFBEB',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#111827',
                margin: '0 0 8px',
              }}
            >
              Xác nhận nộp bài?
            </h3>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
              Bạn đã trả lời <strong>{totalAnswered}</strong> trong <strong>{questions.length}</strong> câu hỏi.
            </p>
            {totalAnswered < questions.length && (
              <p
                style={{
                  color: '#EF4444',
                  fontSize: 13,
                  marginBottom: 16,
                  background: '#FEF2F2',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                ⚠️ Còn {questions.length - totalAnswered} câu chưa được trả lời!
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>
                Kiểm tra lại
              </button>
              <button
                className="btn-primary"
                style={{ background: '#22C55E' }}
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
