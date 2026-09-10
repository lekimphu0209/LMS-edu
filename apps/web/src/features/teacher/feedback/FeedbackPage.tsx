import { useState } from 'react'
import { seedFeedbacks, CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/feedback'

const feedbacks = seedFeedbacks

export default function TeacherFeedbackPage() {
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Góp ý từ học sinh</h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{feedbacks.filter(f => !f.replied).length} góp ý chưa phản hồi</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {feedbacks.map((fb, i) => (
          <div key={fb.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {fb.student.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fb.student}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{fb.class} · {fb.date}</div>
                </div>
              </div>
              <span className={fb.replied ? 'badge-success' : 'badge-warning'}>
                {fb.replied ? 'Đã phản hồi' : 'Chưa phản hồi'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: CATEGORY_COLORS[fb.category].bg, color: CATEGORY_COLORS[fb.category].color }}>
                {CATEGORY_LABELS[fb.category]}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{fb.title}</span>
            </div>
            <p style={{ fontSize: 14, color: '#374151', background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, margin: 0 }}>{fb.message}</p>
            {fb.replied && fb.reply && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#F0FDF4', borderRadius: 8, borderLeft: '3px solid #22C55E' }}>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 4 }}>Phản hồi của bạn · {fb.reply.date}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{fb.reply.text}</div>
              </div>
            )}
            {!fb.replied && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Viết phản hồi..."
                  value={replyTexts[i] || ''}
                  onChange={e => setReplyTexts({ ...replyTexts, [i]: e.target.value })}
                  style={{ marginBottom: 8, resize: 'vertical' }}
                />
                <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Gửi phản hồi</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
