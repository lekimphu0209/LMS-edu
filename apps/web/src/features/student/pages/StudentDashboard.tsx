import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

const enrolledClasses = [
  { id: 1, name: 'Toán 10A', teacher: 'Nguyễn Văn An', subject: 'Toán học', progress: 72, icon: '∑', color: '#2563EB', pending: 2 },
  { id: 2, name: 'Văn 11B', teacher: 'Trần Thị Bình', subject: 'Ngữ văn', progress: 58, icon: '✍', color: '#7C3AED', pending: 1 },
  { id: 3, name: 'Lý 12C', teacher: 'Lê Minh Cường', subject: 'Vật lý', progress: 85, icon: 'φ', color: '#22C55E', pending: 0 },
  { id: 4, name: 'Anh 11E', teacher: 'Hoàng Văn Em', subject: 'Tiếng Anh', progress: 40, icon: 'A', color: '#F59E0B', pending: 3 },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const totalPending = enrolledClasses.reduce((a, c) => a + c.pending, 0);

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Xin chào, {user?.fullName || 'Học sinh'}! 🎓</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
          Bạn có {totalPending} bài tập cần hoàn thành. Cố lên nhé!
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Lớp đã đăng ký', value: enrolledClasses.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Bài tập chờ nộp', value: totalPending, color: '#EF4444', bg: '#FEF2F2' },
          { label: 'Điểm trung bình', value: '8.2', color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Tiến độ tổng', value: '69%', color: '#7C3AED', bg: '#F5F3FF' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: s.bg,
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: s.color,
                }}
              >
                {s.value}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title" style={{ marginBottom: 16 }}>
          Lớp học của tôi
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {enrolledClasses.map((cls) => (
            <div
              key={cls.id}
              className="card"
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => navigate(`/student/classes/${cls.id}`, { state: cls })}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '';
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: cls.color + '15',
                    color: cls.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {cls.icon}
                </div>
                {cls.pending > 0 && (
                  <span
                    style={{
                      background: '#FEF2F2',
                      color: '#EF4444',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {cls.pending} bài tập
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#111827',
                  marginBottom: 2,
                }}
              >
                {cls.name}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>GV: {cls.teacher}</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Tiến độ</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cls.color }}>{cls.progress}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${cls.progress}%`, background: cls.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
