import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, AlertTriangle, CheckCircle2, Star } from 'lucide-react';
import {
  getEnrolledClasses,
  getStudentAssignments,
  fmtDateTime,
  type StudentAssignment,
  type EnrolledClass,
} from '@/data/student';
import StartQuizConfirm from '../components/StartQuizConfirm';

type Tab = 'upcoming' | 'overdue' | 'done';

function scoreColor(s: number) {
  return s >= 8 ? '#22C55E' : s >= 6.5 ? '#F59E0B' : '#EF4444';
}

function dueLabel(a: StudentAssignment) {
  if (a.overdue) {
    const d = Math.abs(a.daysLeft);
    return { text: d === 0 ? 'Đã quá hạn hôm nay' : `Đã quá hạn ${d} ngày`, color: '#EF4444' };
  }
  if (a.daysLeft <= 0) return { text: 'Hết hạn hôm nay', color: '#EF4444' };
  if (a.daysLeft <= 2) return { text: `Còn ${a.daysLeft} ngày`, color: '#F59E0B' };
  return { text: `Còn ${a.daysLeft} ngày`, color: '#2563EB' };
}

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [filterClass, setFilterClass] = useState('');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [confirmA, setConfirmA] = useState<StudentAssignment | null>(null);

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
  const upcoming = assignments.filter((a) => !a.done && !a.overdue);
  const overdueList = assignments.filter((a) => !a.done && a.overdue);
  const completed = assignments.filter((a) => a.done);

  const scored = all.filter((a) => a.done && a.score !== null);
  const avgScore = scored.length
    ? (scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length).toFixed(1)
    : '—';

  // Bấm Bắt đầu → mở popup xác nhận tại chỗ (giống trang chi tiết), không chuyển trang ngay
  const onStartQuiz = (a: StudentAssignment) => setConfirmA(a);

  const confirmStart = (a: StudentAssignment) => {
    setConfirmA(null);
    navigate(`/student/assignments/${a.id}/quiz`, { state: { startNow: true } });
  };

  const renderPendingCard = (a: StudentAssignment) => {
    const due = dueLabel(a);
    const accent = a.overdue ? '#EF4444' : a.daysLeft <= 2 ? '#F59E0B' : '#2563EB';
    return (
      <div
        key={a.id}
        className="card"
        onClick={() => navigate(`/student/assignments/${a.id}`)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.10)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
        style={{
          padding: '18px 22px',
          borderLeft: `4px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          opacity: a.overdue ? 0.92 : 1,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s',
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
            {a.overdue && <span className="badge-danger">Đã quá hạn</span>}
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
            Đã quá hạn
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap' }}
            onClick={(e) => {
              e.stopPropagation();
              onStartQuiz(a);
            }}
          >
            Bắt đầu làm bài
          </button>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    );
  };

  const renderDoneCard = (a: StudentAssignment) => (
    <div
      key={a.id}
      className="card"
      onClick={() => navigate(`/student/assignments/${a.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.10)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
      style={{
        padding: '18px 22px',
        borderLeft: '4px solid #22C55E',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
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
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            Nộp lúc: {a.submittedDate ? fmtDateTime(a.submittedDate) : '—'}
          </span>
        </div>
      </div>

      {/* Due */}
      <div style={{ width: 170, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Hạn nộp</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
          {a.due} · {a.dueTime}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', marginTop: 2 }}>
          ✓ Hoàn thành
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );

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
            {all.length} bài tập · {upcoming.length} chưa làm · {overdueList.length} đã quá hạn
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {[
          { label: 'Chưa làm', value: upcoming.length, color: '#2563EB', bg: '#EFF6FF', icon: ClipboardList },
          { label: 'Đã quá hạn', value: overdueList.length, color: '#EF4444', bg: '#FEF2F2', icon: AlertTriangle },
          { label: 'Hoàn thành', value: completed.length, color: '#22C55E', bg: '#F0FDF4', icon: CheckCircle2 },
          { label: 'Điểm trung bình', value: avgScore, color: '#F59E0B', bg: '#FFFBEB', icon: Star },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: s.bg,
                width: 44,
                height: 44,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: s.color,
                  lineHeight: 1.1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
            </div>
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
              { key: 'upcoming', label: 'Chưa làm', count: upcoming.length, dot: '#2563EB' },
              { key: 'overdue', label: 'Đã quá hạn', count: overdueList.length, dot: '#EF4444' },
              { key: 'done', label: 'Hoàn thành', count: completed.length, dot: '#22C55E' },
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

      {/* List theo trạng thái */}
      {tab !== 'done' ? (
        (() => {
          const list = tab === 'upcoming' ? upcoming : overdueList;
          return list.length === 0 ? (
            <EmptyState
              title={
                tab === 'upcoming'
                  ? 'Không có bài tập nào chưa làm'
                  : 'Không có bài tập nào đã quá hạn'
              }
              sub="Bạn đang theo kịp tiến độ học tập"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {list.map(renderPendingCard)}
            </div>
          );
        })()
      ) : completed.length === 0 ? (
        <EmptyState
          title="Chưa có bài tập nào đã hoàn thành"
          sub="Các bài đã nộp sẽ xuất hiện ở đây"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {completed.map(renderDoneCard)}
        </div>
      )}

      {/* Popup xác nhận bắt đầu — hủy thì ở lại trang */}
      {confirmA && (
        <StartQuizConfirm
          title={confirmA.title}
          questions={confirmA.questions}
          onCancel={() => setConfirmA(null)}
          onConfirm={() => confirmStart(confirmA)}
        />
      )}
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '52px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#F0FDF4',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: '#9CA3AF' }}>{sub}</div>}
    </div>
  );
}
