interface TeacherDashboardProps {
  onNavigate: (page: string, data?: any) => void
}

const myClasses = [
  { id: 1, name: 'Toán 10A', subject: 'Toán học', students: 38, pendingSubmissions: 12, color: '#2563EB', icon: '∑' },
  { id: 2, name: 'Toán 11B', subject: 'Toán học', students: 35, pendingSubmissions: 5, color: '#7C3AED', icon: '∑' },
  { id: 3, name: 'Lý 12C', subject: 'Vật lý', students: 32, pendingSubmissions: 0, color: '#22C55E', icon: 'φ' },
  { id: 4, name: 'Hóa 10D', subject: 'Hóa học', students: 30, pendingSubmissions: 8, color: '#F59E0B', icon: 'H₂O' },
]

const recentAssignments = [
  { class: 'Toán 10A', title: 'Kiểm tra chương 3 - Hàm số', due: '18/08/2026', submitted: 26, total: 38 },
  { class: 'Toán 11B', title: 'Bài tập tích phân', due: '20/08/2026', submitted: 30, total: 35 },
  { class: 'Hóa 10D', title: 'Phản ứng hóa học cơ bản', due: '22/08/2026', submitted: 22, total: 30 },
]

export default function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const totalStudents = myClasses.reduce((a, c) => a + c.students, 0)
  const totalPending = myClasses.reduce((a, c) => a + c.pendingSubmissions, 0)

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Xin chào, thầy/cô Nguyễn Văn An! 👋</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
          Bạn có {totalPending} bài nộp chờ chấm điểm hôm nay
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Lớp đang dạy', value: myClasses.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Tổng học sinh', value: totalStudents, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Chờ chấm điểm', value: totalPending, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Bài tập đang mở', value: 5, color: '#22C55E', bg: '#F0FDF4' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Class cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title">Lớp học của tôi</h2>
            <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => onNavigate('teacher-classes')}>
              Xem tất cả →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {myClasses.map(cls => (
              <div
                key={cls.id}
                className="card"
                style={{ padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid #F3F4F6' }}
                onClick={() => onNavigate('teacher-class-detail', cls)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: cls.color + '15', color: cls.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800,
                  }}>
                    {cls.icon}
                  </div>
                  {cls.pendingSubmissions > 0 && (
                    <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                      {cls.pendingSubmissions} chờ chấm
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>
                  {cls.name}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{cls.subject}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{cls.students} học sinh</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent assignments */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title">Bài tập gần đây</h2>
            <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>Tất cả</button>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {recentAssignments.map((a, i) => {
              const pct = Math.round((a.submitted / a.total) * 100)
              return (
                <div key={i} style={{ padding: '16px 20px', borderBottom: i < recentAssignments.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.class} · Hạn: {a.due}</div>
                    </div>
                    <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{a.submitted}/{a.total}</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#22C55E' : '#2563EB' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{pct}% đã nộp</div>
                </div>
              )
            })}
            <div style={{ padding: '14px 20px' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 13 }}
                onClick={() => onNavigate('teacher-assign')}>
                + Giao bài tập mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
