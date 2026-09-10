import { useState } from 'react'

interface HeaderProps {
  role: 'admin' | 'teacher' | 'student'
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  userName: string
}

const navItems = {
  admin: [
    { id: 'admin-dashboard', label: 'Trang chủ' },
    { id: 'admin-classes', label: 'Quản lý Lớp học' },
    { id: 'admin-teachers', label: 'Quản lý Giáo viên' },
    { id: 'admin-students', label: 'Quản lý Học sinh' },
  ],
  teacher: [
    { id: 'teacher-classes', label: 'Lớp của tôi' },
    { id: 'teacher-qbank', label: 'Ngân hàng câu hỏi' },
    { id: 'teacher-course-builder', label: 'Soạn bài' },
    { id: 'teacher-assign', label: 'Giao bài tập' },
    { id: 'teacher-curriculum', label: 'Giáo trình học sinh' },
    { id: 'teacher-feedback', label: 'Góp ý từ học sinh' },
  ],
  student: [
    { id: 'student-classes', label: 'Lớp đã đăng ký' },
    { id: 'student-assignments', label: 'Bài tập của tôi' },
    { id: 'student-feedback', label: 'Gửi góp ý' },
  ],
}

const roleColors = {
  admin: { bg: '#7C3AED', light: '#F5F3FF', label: 'Admin' },
  teacher: { bg: '#2563EB', light: '#EFF6FF', label: 'Teacher' },
  student: { bg: '#22C55E', light: '#F0FDF4', label: 'Student' },
}

export default function Header({ role, currentPage, onNavigate, onLogout, userName }: HeaderProps) {
  const [showAccount, setShowAccount] = useState(false)
  const items = navItems[role]
  const rc = roleColors[role]

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginRight: 16, flexShrink: 0 }}
          onClick={() => onNavigate(items[0].id)}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="white"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#111827' }}>
            EduConnect
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
          {items.map(item => (
            <button
              key={item.id}
              className={`nav-link${currentPage === item.id ? ' active' : ''}`}
              onClick={() => onNavigate(item.id)}
              style={{ border: 'none', background: currentPage === item.id ? '#EFF6FF' : 'transparent' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Role badge + account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ background: rc.light, color: rc.bg, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
            {rc.label.toUpperCase()}
          </span>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAccount(!showAccount)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                border: '1px solid #E5E7EB', borderRadius: 10, background: 'white',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: rc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 700,
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{userName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showAccount && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'white', borderRadius: 12, border: '1px solid #F3F4F6',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 8, minWidth: 180, zIndex: 50,
              }}>
                <button
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  Hồ sơ cá nhân
                </button>
                <button
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  Cài đặt
                </button>
                <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
                <button
                  onClick={onLogout}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
