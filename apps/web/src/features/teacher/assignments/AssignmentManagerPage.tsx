import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  seedAssignments,
  isPast,
  fmtDate,
  STATUS_META,
  type AssignmentStatus,
} from '@/data/assignments'

// ── Main page ─────────────────────────────────────────────────────

interface Props {
  onCreateNew: () => void
  highlightClass?: string
}

const TABS: { key: '' | AssignmentStatus; label: string }[] = [
  { key: '',         label: 'Tất cả' },
  { key: 'ASSIGNED', label: 'Đã giao' },
  { key: 'SAVED',    label: 'Đã lưu' },
  { key: 'DRAFT',    label: 'Nháp' },
]

export default function AssignmentManager({ onCreateNew, highlightClass }: Props) {
  const navigate = useNavigate()
  const [assignments] = useState(seedAssignments)
  const [filterClass, setFilterClass] = useState(highlightClass ?? '')
  const [filterStatus, setFilterStatus] = useState<'' | AssignmentStatus>('')
  const [search, setSearch] = useState('')

  const classes = [...new Set(assignments.map(a => a.class).filter(Boolean))]
  const countOf = (s: '' | AssignmentStatus) => assignments.filter(a => !s || a.status === s).length
  const assigned = assignments.filter(a => a.status === 'ASSIGNED')

  const filtered = assignments.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.title.toLowerCase().includes(q) || a.class.toLowerCase().includes(q))
      && (!filterClass || a.class === filterClass)
      && (!filterStatus || a.status === filterStatus)
  })

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 56, maxWidth: 1180 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Bài tập</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {assignments.length} bài tập · {assigned.length} đã giao
            {assigned.some(a => isPast(a.dueDate)) && ` · ${assigned.filter(a => isPast(a.dueDate)).length} hết hạn`}
          </p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={onCreateNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Giao bài mới
        </button>
      </div>

      {/* Tabs trạng thái: Tất cả / Đã giao / Đã lưu / Nháp */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {TABS.map(t => {
          const active = filterStatus === t.key
          const meta = t.key ? STATUS_META[t.key] : null
          return (
            <button key={t.key || 'all'} onClick={() => setFilterStatus(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                border: active ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                background: active ? '#EFF6FF' : 'white',
                color: active ? '#2563EB' : '#6B7280' }}>
              {meta && <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />}
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: active ? '#DBEAFE' : '#F3F4F6', color: active ? '#2563EB' : '#9CA3AF' }}>
                {countOf(t.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + lọc lớp */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="input-field" placeholder="Tìm theo tên bài tập hoặc lớp..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input-field" style={{ width: 150 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Bảng danh sách */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>Không có bài tập nào</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Đầu bảng */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.4fr) 110px 150px 120px 150px 96px', gap: 10, padding: '10px 20px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Bài tập</span><span>Lớp</span><span>Hạn nộp</span><span>Hoàn thành</span><span>Trạng thái</span><span style={{ textAlign: 'right' }} />
          </div>

          {filtered.map((a, i) => {
            const done = a.students.filter(s => s.completedAt).length
            const pct  = a.students.length ? Math.round((done / a.students.length) * 100) : null
            const past = a.dueDate ? isPast(a.dueDate) : false
            const meta = STATUS_META[a.status]
            return (
              <div key={a.id} onClick={() => navigate(`/assignments/${a.id}`)}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.4fr) 110px 150px 120px 150px 96px', gap: 10, alignItems: 'center', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>

                {/* Tên + số câu + thời gian làm */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                    {a.totalQuestions} câu · {a.durationMin ? `${a.durationMin} phút` : 'không giới hạn'}
                  </div>
                </div>

                {/* Lớp */}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB' }}>{a.class || '—'}</span>

                {/* Hạn nộp + hết hạn */}
                <div>
                  {a.dueDate ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: past ? '#EF4444' : '#374151' }}>{fmtDate(a.dueDate)} · {a.dueTime}</div>
                      {a.status === 'ASSIGNED' && (
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: past ? '#EF4444' : '#22C55E' }}>{past ? 'Đã hết hạn' : 'Còn hạn'}</div>
                      )}
                    </>
                  ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                </div>

                {/* Tỉ lệ hoàn thành */}
                <div>
                  {pct !== null ? (
                    <>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{done}/{a.students.length} · <strong style={{ color: pct === 100 ? '#22C55E' : '#2563EB' }}>{pct}%</strong></div>
                      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : '#2563EB', borderRadius: 99 }} />
                      </div>
                    </>
                  ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                </div>

                {/* Trạng thái bài tập */}
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 20, background: meta.bg, color: meta.color, justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                  {meta.label}
                </span>

                {/* Xem */}
                <div style={{ textAlign: 'right' }}>
                  <button onClick={e => { e.stopPropagation(); navigate(`/assignments/${a.id}`) }}
                    style={{ padding: '5px 13px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                    Xem
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

