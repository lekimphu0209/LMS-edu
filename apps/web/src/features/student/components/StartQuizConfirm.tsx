// Popup xác nhận bắt đầu làm bài — dùng chung cho trang chi tiết, danh sách và tab bài tập về nhà.
// Hủy (onCancel / click overlay) không điều hướng; xác nhận (onConfirm) do trang gọi tự xử lý.
export default function StartQuizConfirm({
  title,
  questions,
  onCancel,
  onConfirm,
}: {
  title: string;
  questions: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Layout chuẩn hệ thống: header (icon + tiêu đề + nút đóng) / body / footer nút phải
  return (
    <div className="modal-overlay" onClick={onCancel}>
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
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
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
              Bắt đầu làm bài?
            </h3>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{questions} câu hỏi</div>
          </div>
          <button
            className="btn-ghost"
            onClick={onCancel}
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
        <p
          style={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: 1.55,
            padding: '14px 20px',
            margin: 0,
          }}
        >
          "{title}" gồm <strong>{questions}</strong> câu hỏi. Đồng hồ sẽ bắt đầu đếm ngay sau khi
          bạn xác nhận.
        </p>

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
          <button className="btn-secondary" onClick={onCancel}>
            Để sau
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
