/** Trang giáo viên: tiến độ học sinh — dữ liệu thật từ API /progress
 *  (mốc học tập + snapshot + phiên học) và danh sách HS từ lớp thật. */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getTeacherClasses, getClassStudents } from '@/data/classes'

interface StudentOption {
  id: string
  name: string
  classId: string
  className: string
}
interface Milestone {
  id: string
  title: string
  description?: string | null
  milestoneDate?: string | null
  classId?: string | null
}
interface Snapshot {
  id: string
  percentComplete: number
  averageScore: number
  snapshotDate: string
}
interface Session {
  id: string
  startedAt: string
  endedAt?: string | null
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : ''

export default function Curriculum() {
  const queryClient = useQueryClient()
  const [selectedStudent, setSelectedStudent] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', desc: '', unlockDate: '' })

  // Lớp của giáo viên đang đăng nhập → danh sách học sinh thật.
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: getTeacherClasses,
    retry: 1,
  })
  const { data: students = [] } = useQuery<StudentOption[]>({
    queryKey: ['teacher-students', classes.map((c) => c.id).join(',')],
    queryFn: async () => {
      const seen = new Map<string, StudentOption>()
      for (const c of classes) {
        for (const s of await getClassStudents(c.id)) {
          if (!seen.has(s.id)) {
            seen.set(s.id, { id: s.id, name: s.name, classId: c.id, className: c.name })
          }
        }
      }
      return [...seen.values()]
    },
    enabled: classes.length > 0,
    retry: 1,
  })
  const selected = students.find((s) => s.id === selectedStudent)

  // Dữ liệu tiến độ thật: mốc + snapshot + phiên học của học sinh được chọn.
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['progress-milestones', selectedStudent],
    queryFn: async () =>
      (await api.get('/progress/milestones', { params: { studentId: selectedStudent } })).data,
    enabled: !!selectedStudent,
  })
  const { data: snapshots = [] } = useQuery<Snapshot[]>({
    queryKey: ['progress-snapshots', selectedStudent],
    queryFn: async () =>
      (await api.get('/progress/snapshots', { params: { studentId: selectedStudent } })).data,
    enabled: !!selectedStudent,
  })
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['progress-sessions', selectedStudent],
    queryFn: async () =>
      (await api.get('/progress/sessions', { params: { studentId: selectedStudent } })).data,
    enabled: !!selectedStudent,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/progress/milestones', {
        studentId: selectedStudent,
        classId: selected?.classId || undefined,
        title: newItem.title,
        description: newItem.desc || undefined,
        milestoneDate: newItem.unlockDate || undefined,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-milestones', selectedStudent] })
      setNewItem({ title: '', desc: '', unlockDate: '' })
      setShowAdd(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/progress/milestones/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['progress-milestones', selectedStudent] }),
  })

  // Timeline: mốc sắp xếp theo ngày; mốc trong quá khứ coi như đã đạt.
  const items = [...milestones]
    .sort((a, b) => new Date(a.milestoneDate ?? 0).getTime() - new Date(b.milestoneDate ?? 0).getTime())
    .map((m) => ({
      ...m,
      desc: m.description ?? '',
      done: m.milestoneDate ? new Date(m.milestoneDate).getTime() <= Date.now() : false,
    }))
  const done = items.filter((i) => i.done).length
  const latest = snapshots[0]
  const progress = latest
    ? Math.round(latest.percentComplete)
    : items.length
      ? Math.round((done / items.length) * 100)
      : 0

  const handleAddItem = () => {
    if (!newItem.title.trim() || !selectedStudent) return
    addMutation.mutate()
  }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title">Giáo trình học sinh</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Xây dựng lộ trình học tập cá nhân hóa cho từng học sinh</p>
      </div>

      {/* Student selector */}
      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Chọn học sinh</label>
            <select className="input-field" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ maxWidth: 400 }}>
              <option value="">-- Tìm và chọn học sinh --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EFF6FF', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{selected.className} · {done}/{items.length} mốc đã đạt</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <>
          {/* Progress summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
            {[
              { label: 'Tổng mốc', value: items.length, color: '#2563EB' },
              { label: 'Đã đạt', value: done, color: '#22C55E' },
              { label: 'Phiên học', value: sessions.length, color: '#F59E0B' },
              { label: 'Tiến độ', value: `${progress}%`, color: '#7C3AED' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
            {/* Curriculum builder */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 className="section-title">Lộ trình học tập</h2>
                <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => setShowAdd(true)}>
                  + Thêm mốc
                </button>
              </div>

              {items.length === 0 && (
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chưa có mốc học tập nào — bấm "+ Thêm mốc" để tạo.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: 0 }}>
                    {/* Timeline line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: item.done ? '#22C55E' : '#E5E7EB',
                        border: `3px solid ${item.done ? '#22C55E' : '#E5E7EB'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1, marginTop: 20,
                      }}>
                        {item.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {idx < items.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: item.done ? '#22C55E' : '#E5E7EB', minHeight: 24 }} />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      style={{
                        flex: 1, marginBottom: 12,
                        background: 'white', border: '1px solid #F3F4F6',
                        borderRadius: 12, padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Mốc {idx + 1}</div>
                            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827' }}>{item.title}</div>
                            {item.desc && <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 10px' }}>{item.desc}</p>}
                          </div>
                          <span className={item.done ? 'badge-success' : 'badge-gray'} style={{ flexShrink: 0 }}>
                            {item.done ? 'Đã đạt' : 'Sắp tới'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Mốc: {fmtDate(item.milestoneDate)}
                          </div>
                          <button
                            style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline visual */}
            <div className="card" style={{ padding: 20, alignSelf: 'flex-start', position: 'sticky', top: 80 }}>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Tiến độ tổng quan</h4>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  <span>Hoàn thành</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: 10 }}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#22C55E' }} />
                </div>
              </div>
              {latest && (
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                  Điểm TB: <b>{latest.averageScore.toFixed(1)}</b> · {sessions.length} phiên học
                </p>
              )}
              {items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.done ? '#22C55E' : '#E5E7EB', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{item.title.split(':')[0]}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(item.milestoneDate)}</div>
                  </div>
                  {item.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedStudent && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p style={{ fontSize: 15 }}>Vui lòng chọn học sinh để xem và chỉnh sửa lộ trình</p>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ width: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', margin: '0 0 20px' }}>Thêm mốc học tập</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tiêu đề mốc *</label>
                <input className="input-field" placeholder="VD: Chương 5: Đạo hàm" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mô tả</label>
                <textarea className="input-field" rows={2} placeholder="Nội dung chính của mốc..." value={newItem.desc} onChange={e => setNewItem({ ...newItem, desc: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Ngày dự kiến đạt</label>
                <input type="date" className="input-field" value={newItem.unlockDate} onChange={e => setNewItem({ ...newItem, unlockDate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleAddItem} disabled={!newItem.title.trim() || addMutation.isPending}>
                {addMutation.isPending ? 'Đang lưu...' : 'Thêm mốc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
