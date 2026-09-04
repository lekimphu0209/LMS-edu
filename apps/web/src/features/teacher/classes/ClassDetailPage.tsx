import { useState } from 'react'

const students = [
  { name: 'Lê Hoàng Anh', avatar: 'A', assignments: { hw1: 'submitted', hw2: 'submitted', hw3: 'pending' }, score: 8.5 },
  { name: 'Trần Minh Bảo', avatar: 'B', assignments: { hw1: 'submitted', hw2: 'late', hw3: 'pending' }, score: 7.2 },
  { name: 'Nguyễn Thị Châu', avatar: 'C', assignments: { hw1: 'submitted', hw2: 'submitted', hw3: 'submitted' }, score: 9.0 },
  { name: 'Phạm Văn Đức', avatar: 'D', assignments: { hw1: 'pending', hw2: 'pending', hw3: 'pending' }, score: 5.5 },
  { name: 'Hoàng Thị Em', avatar: 'E', assignments: { hw1: 'submitted', hw2: 'submitted', hw3: 'late' }, score: 7.8 },
  { name: 'Vũ Minh Giang', avatar: 'G', assignments: { hw1: 'late', hw2: 'submitted', hw3: 'pending' }, score: 6.5 },
  { name: 'Lý Thanh Hà', avatar: 'H', assignments: { hw1: 'submitted', hw2: 'submitted', hw3: 'submitted' }, score: 9.5 },
  { name: 'Đỗ Văn Kỳ', avatar: 'K', assignments: { hw1: 'submitted', hw2: 'pending', hw3: 'pending' }, score: 6.0 },
]

const assignments = [
  { id: 'hw1', title: 'Kiểm tra chương 1 - Hàm số', due: '05/08/2026', submitted: 7, total: 8, type: 'Trắc nghiệm' },
  { id: 'hw2', title: 'Bài tập tự luận chương 2', due: '12/08/2026', submitted: 6, total: 8, type: 'Tự luận' },
  { id: 'hw3', title: 'Kiểm tra giữa kỳ', due: '20/08/2026', submitted: 1, total: 8, type: 'Trắc nghiệm' },
]

const statusBadge = (s: string) => {
  if (s === 'submitted') return <span className="badge-success" style={{ fontSize: 11 }}>Đã nộp</span>
  if (s === 'late') return <span className="badge-danger" style={{ fontSize: 11 }}>Nộp muộn</span>
  return <span className="badge-warning" style={{ fontSize: 11 }}>Chưa nộp</span>
}

const avatarColors = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#06b6d4', '#ec4899', '#14b8a6']

export default function TeacherClassDetail({ classData, onNavigate }: { classData?: any; onNavigate?: (page: string, data?: any) => void }) {
  const [tab, setTab] = useState('students')
  const cls = classData || { name: 'Toán 10A', subject: 'Toán học', students: 38 }

  const avgScore = students.reduce((a, s) => a + s.score, 0) / students.length

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      {/* Class header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Lớp học</div>
          <h1 className="page-title">{cls.name}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span className="badge-info">{cls.subject}</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>38 học sinh</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>3 bài tập đang mở</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary">Tải báo cáo</button>
          <button className="btn-primary">+ Giao bài tập</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}>
        {[
          { id: 'students', label: 'Học sinh' },
          { id: 'assignments', label: 'Bài tập đã giao' },
          { id: 'stats', label: 'Thống kê' },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>{assignments[0].title.slice(0, 20)}...</th>
                <th>{assignments[1].title.slice(0, 20)}...</th>
                <th>{assignments[2].title.slice(0, 20)}...</th>
                <th>Điểm TB</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: avatarColors[i % avatarColors.length],
                        color: 'white', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s.avatar}
                      </div>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{s.name}</span>
                    </div>
                  </td>
                  <td>{statusBadge(s.assignments.hw1)}</td>
                  <td>{statusBadge(s.assignments.hw2)}</td>
                  <td>{statusBadge(s.assignments.hw3)}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.score >= 8 ? '#22C55E' : s.score >= 6.5 ? '#F59E0B' : '#EF4444', fontSize: 15 }}>
                      {s.score.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {assignments.map(a => {
            const pct  = Math.round((a.submitted / a.total) * 100)
            const done = a.submitted
            const left = a.total - a.submitted
            return (
              <div key={a.id} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 5 }}>{a.title}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className="badge-info" style={{ fontSize: 11 }}>{a.type}</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Hạn nộp: {a.due}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={() => onNavigate?.('teacher-assign', { highlightClass: cls.name })}>
                      Chỉnh sửa
                    </button>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={() => onNavigate?.('teacher-assign', { highlightClass: cls.name })}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>

                {/* Completion row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>{done}</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>học sinh đã hoàn thành</span>
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{left}</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>học sinh chưa làm</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 7, background: '#F3F4F6', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : '#2563EB', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: pct === 100 ? '#22C55E' : '#6B7280', fontWeight: 700, flexShrink: 0 }}>{pct}%</span>
                </div>
              </div>
            )
          })}
          <button className="btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            onClick={() => onNavigate?.('teacher-assign-create')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Giao bài tập mới
          </button>
        </div>
      )}

      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 className="section-title" style={{ marginBottom: 20 }}>Điểm trung bình theo học sinh</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name.split(' ').slice(-1)[0]}</div>
                  <div className="progress-bar-track" style={{ flex: 1, height: 10 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${(s.score / 10) * 100}%`,
                      background: s.score >= 8 ? '#22C55E' : s.score >= 6.5 ? '#F59E0B' : '#EF4444',
                    }} />
                  </div>
                  <span style={{ width: 32, fontSize: 13, fontWeight: 700, color: s.score >= 8 ? '#22C55E' : s.score >= 6.5 ? '#F59E0B' : '#EF4444' }}>
                    {s.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 className="section-title" style={{ marginBottom: 20 }}>Tổng quan lớp học</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Điểm TB lớp', value: avgScore.toFixed(1), color: '#2563EB' },
                { label: 'Học sinh giỏi (≥8)', value: students.filter(s => s.score >= 8).length, color: '#22C55E' },
                { label: 'Cần cải thiện (<6.5)', value: students.filter(s => s.score < 6.5).length, color: '#EF4444' },
                { label: 'Tỉ lệ nộp bài', value: '72%', color: '#F59E0B' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Phân bố điểm số</h4>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
                {[
                  { range: '0-4', count: 0, color: '#EF4444' },
                  { range: '4-5', count: 1, color: '#EF4444' },
                  { range: '5-6', count: 1, color: '#F59E0B' },
                  { range: '6-7', count: 1, color: '#F59E0B' },
                  { range: '7-8', count: 2, color: '#22C55E' },
                  { range: '8-9', count: 2, color: '#22C55E' },
                  { range: '9-10', count: 1, color: '#2563EB' },
                ].map(b => (
                  <div key={b.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: b.color, borderRadius: '4px 4px 0 0', height: `${(b.count / 3) * 60}px`, minHeight: b.count > 0 ? 8 : 0, opacity: 0.8 }} />
                    <span style={{ fontSize: 9, color: '#9CA3AF' }}>{b.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
