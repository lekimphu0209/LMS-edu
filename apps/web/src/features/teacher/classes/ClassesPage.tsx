import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTeacherClasses, type ClassData } from '@/data/classes'

interface Props {
  onNavigate: (page: string, data?: any) => void
}

export default function TeacherClasses({ onNavigate }: Props) {
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { data: myClasses = [], isLoading, isError, error, refetch } = useQuery<ClassData[]>({
    queryKey: ['teacher-classes'],
    queryFn: getTeacherClasses,
  })

  const subjects = [...new Set(myClasses.map(c => c.subject))]

  const filtered = myClasses.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !filterSubject || c.subject === filterSubject
    return matchSearch && matchSubject
  })

  const totalStudents = myClasses.reduce((a, c) => a + c.students, 0)

  if (isLoading) {
    return <div className="page-container" style={{ paddingTop: 32 }}>Đang tải danh sách lớp...</div>
  }

  if (isError) {
    return (
      <div className="page-container" style={{ paddingTop: 32 }}>
        <div style={{ color: '#EF4444', marginBottom: 12 }}>
          Không tải được danh sách lớp: {error instanceof Error ? error.message : 'Lỗi không xác định'}
        </div>
        <button className="btn-primary" onClick={() => refetch()}>Thử lại</button>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Lớp của tôi</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {myClasses.length} lớp · {totalStudents} học sinh
          </p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm lớp học
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Lớp đang dạy', value: myClasses.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Tổng học sinh', value: totalStudents, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'ĐTB toàn khoá', value: (myClasses.reduce((a, c) => a + c.avgScore, 0) / myClasses.length).toFixed(1), color: '#22C55E', bg: '#F0FDF4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="input-field" placeholder="Tìm lớp học..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }} />
        </div>
        <select className="input-field" style={{ width: 160 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">Tất cả môn</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        {/* View toggle */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2, marginLeft: 'auto' }}>
          {(['grid', 'list'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{ padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#111827' : '#9CA3AF', transition: 'all 0.15s', boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              {mode === 'grid'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Class list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>Không tìm thấy lớp nào</div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {filtered.map(cls => (
            <ClassCard key={cls.id} cls={cls} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((cls, i) => (
            <ClassRow key={cls.id} cls={cls} last={i === filtered.length - 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClassCard({ cls, onNavigate }: { cls: ClassData; onNavigate: (page: string, data?: any) => void }) {
  return (
    <div className="card"
      style={{ padding: 22, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid #F3F4F6', position: 'relative', overflow: 'hidden' }}
      onClick={() => onNavigate('teacher-class-detail', cls)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = '' }}>

      {/* Color accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: cls.color, borderRadius: '8px 8px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, marginTop: 8 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: cls.color + '18', color: cls.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {cls.name.charAt(0)}
        </div>
        <span style={{ background: '#F0FDF4', color: '#22C55E', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
          Đang hoạt động
        </span>
      </div>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 3 }}>{cls.name}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>{cls.subject} · {cls.grade}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          {cls.students} học sinh
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {cls.schedule}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Phòng {cls.room}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
          <span style={{ color: '#9CA3AF' }}>Tiến độ</span>
          <span style={{ color: cls.color, fontWeight: 700 }}>{cls.progress}%</span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${cls.progress}%`, background: cls.color, borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Avg score */}
      <div style={{ marginTop: 14, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>Điểm TB lớp</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: cls.avgScore >= 8 ? '#22C55E' : cls.avgScore >= 6.5 ? '#F59E0B' : '#EF4444' }}>
          {cls.avgScore}
        </span>
      </div>
    </div>
  )
}

function ClassRow({ cls, last, onNavigate }: { cls: ClassData; last: boolean; onNavigate: (page: string, data?: any) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: last ? 'none' : '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.13s' }}
      onClick={() => onNavigate('teacher-class-detail', cls)}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
      {/* Icon */}
      <div style={{ width: 42, height: 42, borderRadius: 10, background: cls.color + '18', color: cls.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 17, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
        {cls.name.charAt(0)}
      </div>
      {/* Name + subject */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827' }}>{cls.name}</div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>{cls.subject} · {cls.schedule} · {cls.room}</div>
      </div>
      {/* Students */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{cls.students}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>học sinh</div>
      </div>
      {/* Avg */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: cls.avgScore >= 8 ? '#22C55E' : cls.avgScore >= 6.5 ? '#F59E0B' : '#EF4444' }}>{cls.avgScore}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>ĐTB</div>
      </div>
      {/* Progress */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: '#9CA3AF' }}>Tiến độ</span>
          <span style={{ color: cls.color, fontWeight: 600 }}>{cls.progress}%</span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${cls.progress}%`, background: cls.color, borderRadius: 99 }} />
        </div>
      </div>
      {/* Badge */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ background: '#F0FDF4', color: '#22C55E', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
          Đang hoạt động
        </span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}
