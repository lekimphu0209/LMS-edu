import { useState } from 'react'

const students = ['Lê Hoàng Anh', 'Trần Minh Bảo', 'Nguyễn Thị Châu', 'Phạm Văn Đức', 'Hoàng Thị Em', 'Vũ Minh Giang']

const initialItems = [
  { id: 1, title: 'Chương 1: Hàm số và đồ thị', desc: 'Nghiên cứu khái niệm hàm số, đồ thị và tính chất.', assignment: 'Bài tập hàm số cơ bản', unlockDate: '01/09/2026', done: true },
  { id: 2, title: 'Chương 2: Phương trình bậc 2', desc: 'Giải phương trình bậc hai, ứng dụng thực tế.', assignment: 'Kiểm tra chương 2', unlockDate: '08/09/2026', done: true },
  { id: 3, title: 'Chương 3: Bất phương trình', desc: 'Hệ bất phương trình và biểu đồ giải.', assignment: 'Bài tập bất phương trình', unlockDate: '15/09/2026', done: false },
  { id: 4, title: 'Chương 4: Hàm số lượng giác', desc: 'Sin, cos, tan và các hệ thức lượng giác.', assignment: null, unlockDate: '22/09/2026', done: false },
]

export default function Curriculum() {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [items, setItems] = useState(initialItems)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', desc: '', assignment: '', unlockDate: '' })
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleDrop = (targetIdx: number) => {
    if (dragging === null || dragging === targetIdx) return
    const arr = [...items]
    const [moved] = arr.splice(dragging, 1)
    arr.splice(targetIdx, 0, moved)
    setItems(arr)
    setDragging(null)
    setDragOver(null)
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Date.now(), ...newItem, assignment: newItem.assignment || null, done: false }])
    setNewItem({ title: '', desc: '', assignment: '', unlockDate: '' })
    setShowAdd(false)
  }

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Giáo trình học sinh</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Xây dựng lộ trình học tập cá nhân hóa cho từng học sinh</p>
      </div>

      {/* Student selector */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Chọn học sinh</label>
            <select className="input-field" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ maxWidth: 400 }}>
              <option value="">-- Tìm và chọn học sinh --</option>
              {students.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {selectedStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EFF6FF', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedStudent.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{selectedStudent}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Toán 10A · {items.filter(i => i.done).length}/{items.length} hoàn thành</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <>
          {/* Progress summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Tổng modules', value: items.length, color: '#2563EB' },
              { label: 'Đã hoàn thành', value: items.filter(i => i.done).length, color: '#22C55E' },
              { label: 'Đang học', value: items.filter(i => !i.done).length, color: '#F59E0B' },
              { label: 'Tiến độ', value: `${Math.round((items.filter(i => i.done).length / items.length) * 100)}%`, color: '#7C3AED' },
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
                  + Thêm module
                </button>
              </div>

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
                      draggable
                      onDragStart={() => setDragging(idx)}
                      onDragOver={e => { e.preventDefault(); setDragOver(idx) }}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      style={{
                        flex: 1, marginBottom: 12,
                        background: 'white', border: `1px solid ${dragOver === idx ? '#2563EB' : '#F3F4F6'}`,
                        borderRadius: 12, padding: '16px 20px',
                        boxShadow: dragging === idx ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        cursor: 'grab', transition: 'all 0.15s',
                        opacity: dragging === idx ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, cursor: 'grab', padding: '2px 0', flexShrink: 0 }}>
                          {[0, 1, 2].map(i => <div key={i} style={{ width: 14, height: 2, background: '#D1D5DB', borderRadius: 1 }} />)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Module {idx + 1}</div>
                              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827' }}>{item.title}</div>
                              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, margin: '4px 0 10px' }}>{item.desc}</p>
                            </div>
                            <span className={item.done ? 'badge-success' : 'badge-gray'} style={{ flexShrink: 0 }}>
                              {item.done ? 'Hoàn thành' : 'Chưa học'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {item.assignment && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563EB' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {item.assignment}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              Mở: {item.unlockDate}
                            </div>
                          </div>
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
                  <span>{Math.round((items.filter(i => i.done).length / items.length) * 100)}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: 10 }}>
                  <div className="progress-bar-fill" style={{ width: `${(items.filter(i => i.done).length / items.length) * 100}%`, background: '#22C55E' }} />
                </div>
              </div>
              {items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.done ? '#22C55E' : '#E5E7EB', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{item.title.split(':')[0]}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unlockDate}</div>
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
          <p style={{ fontSize: 15 }}>Vui lòng chọn học sinh để xem và chỉnh sửa giáo trình</p>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ width: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', margin: '0 0 20px' }}>Thêm module học tập</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tiêu đề module *</label>
                <input className="input-field" placeholder="VD: Chương 5: Đạo hàm" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mô tả</label>
                <textarea className="input-field" rows={2} placeholder="Nội dung chính của module..." value={newItem.desc} onChange={e => setNewItem({ ...newItem, desc: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Bài tập liên kết</label>
                <input className="input-field" placeholder="Tên bài tập (tùy chọn)" value={newItem.assignment} onChange={e => setNewItem({ ...newItem, assignment: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Ngày mở khóa</label>
                <input type="date" className="input-field" value={newItem.unlockDate} onChange={e => setNewItem({ ...newItem, unlockDate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleAddItem}>Thêm module</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
