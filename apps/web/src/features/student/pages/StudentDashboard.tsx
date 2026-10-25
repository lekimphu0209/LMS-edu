import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, Star, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { getEnrolledClasses, getStudentAssignments, type EnrolledClass } from '@/data/student';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['myClasses'],
    queryFn: getEnrolledClasses,
  });
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
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

  const enrolledClasses = classes;

  const totalPending = assignments.filter((a) => !a.done).length;
  const totalOverdue = assignments.filter((a) => a.overdue).length;
  const completed = assignments.filter((a) => a.done && a.score !== null);
  const avgScore = completed.length
    ? (completed.reduce((a, c) => a + (c.score ?? 0), 0) / completed.length).toFixed(1)
    : '—';
  const overallProgress = enrolledClasses.length
    ? Math.round(enrolledClasses.reduce((a, c) => a + c.progress, 0) / enrolledClasses.length)
    : 0;

  const subjects = Array.from(new Set(enrolledClasses.map((c: EnrolledClass) => c.subject)));
  const visible = enrolledClasses.filter(
    (c) =>
      (!subject || c.subject === subject) &&
      (!search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.teacher.toLowerCase().includes(search.toLowerCase())),
  );

  const today = new Date();
  const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][today.getDay()];
  const dateStr = `${weekday}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Greeting */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h1 className="page-title">Xin chào, {user?.fullName || 'Học sinh'}</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
            {totalPending > 0
              ? `Bạn có ${totalPending} bài tập cần hoàn thành${totalOverdue ? `, ${totalOverdue} bài đã quá hạn` : ''}. Cố lên nhé!`
              : 'Bạn đã hoàn thành tất cả bài tập. Tuyệt vời!'}
          </p>
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>{dateStr}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        {[
          { label: 'Lớp đã đăng ký', value: enrolledClasses.length, color: '#2563EB', bg: '#EFF6FF', icon: BookOpen },
          { label: 'Bài tập chờ nộp', value: totalPending, color: '#EF4444', bg: '#FEF2F2', icon: ClipboardList },
          { label: 'Điểm trung bình', value: avgScore, color: '#22C55E', bg: '#F0FDF4', icon: Star },
          { label: 'Tiến độ học tập', value: `${overallProgress}%`, color: '#7C3AED', bg: '#F5F3FF', icon: TrendingUp },
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

      {/* Class list */}
      <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              gap: 12,
            }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              Lớp học của tôi{' '}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>({visible.length})</span>
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="Tìm lớp, giáo viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200, padding: '7px 12px', fontSize: 13 }}
              />
              <select
                className="input-field"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: 140, padding: '7px 12px', fontSize: 13 }}
              >
                <option value="">Tất cả môn</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              Không tìm thấy lớp học phù hợp
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {visible.map((cls) => (
                <ClassCard key={cls.id} cls={cls} onOpen={() => navigate(`/student/classes/${cls.id}`, { state: cls })} />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function ClassCard({ cls, onOpen }: { cls: EnrolledClass; onOpen: () => void }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 14,
        padding: 28,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 260,
      }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = cls.color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
      }}
    >
      {/* Top */}
      <div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: cls.color,
            lineHeight: 1,
            marginBottom: 32,
          }}
        >
          {cls.icon}
        </div>
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 4,
          }}
        >
          {cls.name}
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>
          {cls.subject} · {cls.grade}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Tiến độ</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cls.progress}%</span>
        </div>
        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${cls.progress}%`,
              background: cls.color,
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: cls.color,
          }}
        >
          Vào lớp →
        </span>
      </div>
    </div>
  );
}
