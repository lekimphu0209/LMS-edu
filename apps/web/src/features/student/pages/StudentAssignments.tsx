import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getEnrolledClasses,
  getStudentAssignments,
  type StudentAssignment,
  type EnrolledClass,
} from '@/data/student';

type Tab = 'pending' | 'done';

function scoreColor(s: number) {
  return s >= 8 ? '#22C55E' : s >= 6.5 ? '#F59E0B' : '#EF4444';
}

function dueLabel(a: StudentAssignment) {
  if (a.overdue) {
    const d = Math.abs(a.daysLeft);
    return { text: d === 0 ? 'Quá hạn hôm nay' : `Quá hạn ${d} ngày`, color: '#EF4444' };
  }
  if (a.daysLeft <= 0) return { text: 'Hết hạn hôm nay', color: '#EF4444' };
  if (a.daysLeft <= 2) return { text: `Còn ${a.daysLeft} ngày`, color: '#F59E0B' };
  return { text: `Còn ${a.daysLeft} ngày`, color: '#2563EB' };
}

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [filterClass, setFilterClass] = useState('');
  const [tab, setTab] = useState<Tab>('pending');

  const { data: classes = [], isLoading: loadingClasses } = useQuery<EnrolledClass[]>({
    queryKey: ['myClasses'],
    queryFn: getEnrolledClasses,
  });
  const { data: all = [], isLoading: loadingAssignments } = useQuery<StudentAssignment[]>({
    queryKey: ['myAssignments'],
    queryFn: () => getStudentAssignments(),
  });

  if (loadingClasses || loadingAssignments) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Đang tải...
      </div>
    );
  }

  // already sorted by due date, earliest first
  const assignments = filterClass ? all.filter((a) => a.className === filterClass) : all;
  const pending = assignments.filter((a) => !a.done);
  const completed = assignments.filter((a) => a.done);

  const scored = all.filter((a) => a.done && a.score !== null);
  const avgScore = scored.length
    ? (scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length).toFixed(1)
    : '—';

  const onStartQuiz = (a: StudentAssignment) => {
    const cls = classes.find((c) => c.name === a.className);
    navigate('/student/quiz', { state: { classId: cls?.id, assignmentId: a.id } });
  };

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            Bài tập của tôi
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {all.length} bài tập · {all.filter((a) => !a.done).length} chờ nộp
          </p>
        </div>
        <select
          className="input-field"
          style={{ width: 160 }}
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {[
          { label: 'Chờ nộp', value: all.filter((a) => !a.done).length, color: '#EF4444', bg: '#FEF2F2' },
          { label: 'Đã hoàn thành', value: all.filter((a) => a.done).length, color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Điểm trung bình', value: avgScore, color: '#2563EB', bg: '#EFF6FF' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex' }}>
          {(
            [
              { key: 'pending', label: 'Chưa làm', count: pending.length, dot: '#EF4444' },
              { key: 'done', label: 'Đã làm', count: completed.length, dot: '#22C55E' },
            ] as { key: Tab; label: string; count: number; dot: string }[]
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '11px 18px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? '#2563EB' : '#6B7280',
                  borderBottom: `2px solid ${active ? '#2563EB' : 'transparent'}`,
                  marginBottom: -1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot, display: 'inline-block' }}
                />
                {t.label}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: 20,
                    background: active ? '#EFF6FF' : '#F3F4F6',
                    color: active ? '#2563EB' : '#6B7280',
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          Sắp xếp theo hạn nộp · sớm nhất trước
        </div>
      </div>

      {/* Pending tab */}
      {tab === 'pending' &&
        (pending.length === 0 ? (
          <EmptyState text="Không có bài tập nào chờ làm" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((a) => {
              const due = dueLabel(a);
              const accent = a.overdue ? '#EF4444' : a.daysLeft <= 2 ? '#F59E0B' : '#2563EB';
              return (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    padding: '18px 22px',
                    borderLeft: `4px solid ${accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    opacity: a.overdue ? 0.92 : 1,
                  }}
                >
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{a.title}</span>
                      {a.overdue && <span className="badge-danger">Quá hạn</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge-info">{a.className}</span>
                      <span className="badge-gray">{a.type}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{a.questions} câu hỏi</span>
                    </div>
                  </div>

                  {/* Due */}
                  <div style={{ width: 170, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Hạn nộp</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {a.due} · {a.dueTime}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: due.color, marginTop: 2 }}>
                      ⏰ {due.text}
                    </div>
                  </div>

                  {/* Action */}
                  {a.overdue ? (
                    <button
                      disabled
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: '#F3F4F6',
                        color: '#9CA3AF',
                        cursor: 'not-allowed',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Đã hết hạn
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap' }}
                      onClick={() => onStartQuiz(a)}
                    >
                      Bắt đầu làm bài
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {/* Done tab */}
      {tab === 'done' &&
        (completed.length === 0 ? (
          <EmptyState text="Chưa có bài tập nào hoàn thành" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {completed.map((a) => (
              <div
                key={a.id}
                className="card"
                style={{
                  padding: '18px 22px',
                  borderLeft: '4px solid #22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>
                    {a.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge-info">{a.className}</span>
                    <span className="badge-gray">{a.type}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Nộp lúc: {a.submittedDate}</span>
                  </div>
                </div>

                {/* Due */}
                <div style={{ width: 170, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Hạn nộp</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {a.due} · {a.dueTime}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', marginTop: 2 }}>
                    ✓ Đã hoàn thành
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 64 }}>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: scoreColor(a.score ?? 0),
                      lineHeight: 1,
                    }}
                  >
                    {a.score ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>/{a.maxScore} điểm</div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
      {text}
    </div>
  );
}
