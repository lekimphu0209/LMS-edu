import { useState } from 'react'

interface Feedback {
  student: string
  class: string
  message: string
  date: string
  replied: boolean
}

const feedbacks: Feedback[] = [
  { student: 'Lê Hoàng Anh', class: 'Toán 10A', message: 'Thầy ơi, em chưa hiểu phần tích phân từng phần ạ.', date: '10/08/2026', replied: false },
  { student: 'Trần Minh Bảo', class: 'Toán 10A', message: 'Em muốn hỏi về bài tập số 5 trong đề kiểm tra vừa rồi ạ.', date: '12/08/2026', replied: true },
  { student: 'Nguyễn Thị Châu', class: 'Toán 11B', message: 'Thầy có thể giải thêm bài 12 trang 87 không ạ?', date: '14/08/2026', replied: false },
]

export default function TeacherFeedbackPage() {
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Góp ý từ học sinh</h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{feedbacks.filter(f => !f.replied).length} góp ý chưa phản hồi</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {feedbacks.map((fb, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
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
            <p style={{ fontSize: 14, color: '#374151', background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, margin: 0 }}>{fb.message}</p>
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
