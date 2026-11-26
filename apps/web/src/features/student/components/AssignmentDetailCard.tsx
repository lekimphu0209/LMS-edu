import { fmtDateTime, type StudentAssignment } from '@/data/student';

/**
 * AssignmentDetailCard — khung thẻ chi tiết bài tập dùng CHUNG cho mọi trạng thái.
 * Cùng một layout, chỉ đổi màu/nội dung theo token trạng thái; không có khối trống.
 */
export type AssignmentDetailStatus = 'todo' | 'done' | 'late' | 'pending';

// Design token theo trạng thái — thêm trạng thái mới chỉ cần thêm 1 dòng
const STATUS_TOKEN: Record<
  AssignmentDetailStatus,
  { label: string; color: string; bg: string; actionBg: string; actionBorder: string; actionText: string }
> = {
  todo: { label: 'Chưa làm', color: '#2563EB', bg: '#EFF6FF', actionBg: '#F8FAFF', actionBorder: '#EFF6FF', actionText: '#6B7280' },
  done: { label: 'Hoàn thành', color: '#16A34A', bg: '#F0FDF4', actionBg: '#F0FDF4', actionBorder: '#BBF7D0', actionText: '#15803D' },
  late: { label: 'Đã quá hạn', color: '#DC2626', bg: '#FEF2F2', actionBg: '#FEFBFB', actionBorder: '#FECACA', actionText: '#DC2626' },
  pending: { label: 'Chờ chấm điểm', color: '#B45309', bg: '#FFFBEB', actionBg: '#FFFBEB', actionBorder: '#FDE68A', actionText: '#B45309' },
};

function scoreColor(s: number) {
  return s >= 8 ? '#16A34A' : s >= 6.5 ? '#F59E0B' : '#DC2626';
}

export default function AssignmentDetailCard({
  a,
  status,
  onStartQuiz,
}: {
  a: StudentAssignment;
  status: AssignmentDetailStatus;
  onStartQuiz?: () => void;
}) {
  const t = STATUS_TOKEN[status];
  const dueText = `${a.due}${a.dueTime ? ` · ${a.dueTime}` : ''}`;

  return (
    <div
      className="card"
      style={{
        width: '100%',
        padding: 24,
        marginBottom: 16,
        borderLeft: `4px solid ${t.color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Hàng đầu: trái (badge+title+chips) | phải (hạn nộp / điểm) — luôn có nội dung */}
      <div className="adc-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 20,
              background: t.bg,
              color: t.color,
              border: `1px solid ${t.color}33`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            {t.label}
          </span>
          <h1 className="page-title" style={{ margin: '12px 0 8px' }}>
            {a.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge-info">{a.className}</span>
            <span className="badge-gray">{a.type}</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {a.questions} câu hỏi · {a.maxScore} điểm
            </span>
          </div>
        </div>

        {/* Cột phải cố định ~180px — số ngày còn lại (Chưa làm/Quá hạn) | điểm lớn (Đã làm) */}
        <div className="adc-right" style={{ width: 180, flexShrink: 0, textAlign: 'right' }}>
          {status === 'todo' || status === 'late' ? (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 4 }}>
                {status === 'late' ? 'ĐÃ QUÁ HẠN' : 'CÒN LẠI'}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color:
                    status === 'late' ? '#EF4444' : a.daysLeft <= 2 ? '#F59E0B' : '#2563EB',
                  lineHeight: 1,
                }}
              >
                {Math.abs(a.daysLeft)}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>ngày</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 4 }}>
                ĐIỂM
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: scoreColor(a.score ?? 0),
                  lineHeight: 1,
                }}
              >
                {a.score ?? '—'}
                <span style={{ fontSize: 15, fontWeight: 600, color: '#9CA3AF' }}>/{a.maxScore}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta strip 1 dòng — hairline tách, không còn khối grid chiếm chỗ */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 20px',
          fontSize: 12.5,
          paddingTop: 12,
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <span>
          <span style={{ color: '#9CA3AF' }}>Hạn nộp:</span>{' '}
          <strong style={{ color: '#374151', fontWeight: 600 }}>{dueText}</strong>
        </span>
        {(status === 'done' || status === 'pending') && (
          <span>
            <span style={{ color: '#9CA3AF' }}>Nộp lúc:</span>{' '}
            <strong style={{ color: '#374151', fontWeight: 600 }}>
              {a.submittedDate ? fmtDateTime(a.submittedDate) : '—'}
            </strong>
          </span>
        )}
      </div>

      {/* Khối hành động — cùng component, min-height 72px (ẩn khi status=done) */}
      {status !== 'done' && (
        <div
          className="adc-action"
          style={{
            minHeight: 72,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            background: t.actionBg,
            border: `1px solid ${t.actionBorder}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
        {status === 'todo' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 240 }}>
              {[
                'Đồng hồ chạy khi xác nhận',
                'Chuyển tự do giữa các câu',
                'Thoát sẽ mất tiến độ',
              ].map((r) => (
                <span
                  key={r}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    color: t.actionText,
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 20,
                    padding: '5px 12px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.6" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {r}
                </span>
              ))}
            </div>
            <button
              className="btn-primary adc-btn"
              style={{ height: 44, padding: '0 28px', fontSize: 15, borderRadius: 12, flexShrink: 0 }}
              onClick={onStartQuiz}
            >
              Bắt đầu làm bài
            </button>
          </>
        )}

        {status === 'late' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Đã quá hạn nộp — liên hệ giáo viên nếu cần gia hạn.
          </div>
        )}

        {status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: t.actionText }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Bài đã nộp, đang chờ giáo viên chấm điểm.
          </div>
        )}
        </div>
      )}
    </div>
  );
}
