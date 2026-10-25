import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CATEGORY_COLORS, CATEGORY_LABELS, type FeedbackCategory } from '@/data/feedback';
import {
  STUDENT_NAME,
  getEnrolledClasses,
  getStudentFeedbacks,
  createStudentFeedback,
  type EnrolledClass,
  type Feedback,
} from '@/data/student';

const MAX_LEN = 500;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as FeedbackCategory[];

type Filter = 'all' | 'pending' | 'replied';

function todayVn() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function StudentFeedback() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: classes = [], isLoading: loadingClasses } = useQuery<EnrolledClass[]>({
    queryKey: ['myClasses'],
    queryFn: getEnrolledClasses,
  });
  const { data: items = [], isLoading: loadingItems, refetch } = useQuery<Feedback[]>({
    queryKey: ['myFeedbacks'],
    queryFn: getStudentFeedbacks,
  });

  const [className, setClassName] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('question');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (classes[0]?.name) setClassName(classes[0].name);
  }, [classes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loadingClasses || loadingItems) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Đang tải...
      </div>
    );
  }

  const teacher = classes.find((c) => c.name === className)?.teacher ?? '';
  const canSubmit = !!className && title.trim().length > 0 && message.trim().length > 0;

  const replied = items.filter((f) => f.replied).length;
  const pending = items.length - replied;

  const visible = items.filter((f) =>
    filter === 'all' ? true : filter === 'replied' ? f.replied : !f.replied,
  );

  const submit = async () => {
    if (!canSubmit) return;
    const cls = classes.find((c) => c.name === className);
    if (!cls) return;
    await createStudentFeedback({
      classId: cls.id,
      title: title.trim(),
      category,
      content: message.trim(),
    });
    await refetch();
    setTitle('');
    setMessage('');
    setCategory('question');
    setFilter('all');
    setToast(true);
  };

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>
          Gửi góp ý
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          {items.length} góp ý đã gửi · {replied} đã được phản hồi
        </p>
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
          { label: 'Đã gửi', value: items.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Đã phản hồi', value: replied, color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Chờ phản hồi', value: pending, color: '#F59E0B', bg: '#FFFBEB' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 88 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>
            Góp ý mới
          </h3>

          <label style={labelStyle}>Lớp học</label>
          <select
            className="input-field"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            style={{ marginBottom: 4 }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
            Giáo viên phụ trách: <span style={{ color: '#374151', fontWeight: 600 }}>{teacher}</span>
          </div>

          <label style={labelStyle}>Loại góp ý</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => {
              const active = c === category;
              const col = CATEGORY_COLORS[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1.5px solid ${active ? col.color : '#E5E7EB'}`,
                    background: active ? col.bg : 'white',
                    color: active ? col.color : '#6B7280',
                    transition: 'all 0.15s',
                  }}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>Tiêu đề</label>
          <input
            className="input-field"
            placeholder="Tóm tắt ngắn gọn vấn đề..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            style={{ marginBottom: 16 }}
          />

          <label style={labelStyle}>Nội dung</label>
          <textarea
            className="input-field"
            rows={5}
            placeholder="Mô tả chi tiết câu hỏi hoặc góp ý của bạn..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
            style={{ resize: 'vertical', marginBottom: 6 }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 12, color: message.length >= MAX_LEN ? '#EF4444' : '#9CA3AF' }}>
              {message.length}/{MAX_LEN} ký tự
            </span>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
            disabled={!canSubmit}
            onClick={submit}
          >
            Gửi góp ý
          </button>

          {toast && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 8,
                color: '#16A34A',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Đã gửi góp ý tới {teacher}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <h3 className="section-title" style={{ margin: 0 }}>
              Lịch sử góp ý
            </h3>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
              {(
                [
                  { key: 'all', label: `Tất cả (${items.length})` },
                  { key: 'pending', label: `Chờ (${pending})` },
                  { key: 'replied', label: `Đã phản hồi (${replied})` },
                ] as { key: Filter; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  style={{
                    padding: '5px 12px',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background: filter === t.key ? 'white' : 'transparent',
                    color: filter === t.key ? '#111827' : '#9CA3AF',
                    boxShadow: filter === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div
              className="card"
              style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}
            >
              Không có góp ý nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visible.map((fb) => (
                <FeedbackItem key={fb.id} fb={fb} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

function FeedbackItem({ fb }: { fb: Feedback }) {
  const col = CATEGORY_COLORS[fb.category];
  return (
    <div
      className="card"
      style={{ padding: 20, borderLeft: `4px solid ${fb.replied ? '#22C55E' : '#F59E0B'}` }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge-info">{fb.class}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: col.bg,
              color: col.color,
            }}
          >
            {CATEGORY_LABELS[fb.category]}
          </span>
        </div>
        <span className={fb.replied ? 'badge-success' : 'badge-warning'} style={{ flexShrink: 0 }}>
          {fb.replied ? 'Đã phản hồi' : 'Chờ phản hồi'}
        </span>
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 6 }}>{fb.title}</div>
      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{fb.message}</p>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Gửi ngày {fb.date}</div>

      {fb.reply && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: '#F0FDF4',
            borderRadius: 10,
            display: 'flex',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#22C55E',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {fb.reply.teacher.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>{fb.reply.teacher}</span>
              <span style={{ fontSize: 11, color: '#16A34A' }}>{fb.reply.date}</span>
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{fb.reply.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
