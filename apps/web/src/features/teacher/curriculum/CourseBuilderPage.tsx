import { useState, useRef } from 'react'
import { BankQuestion } from '@/data/questionBank'
import { QuestionPicker, TypeBadge, DiffBadge } from '../shared/components/question'
import type { Exercise, Section, Outline } from '../shared/data/outlines'
import { seedOutlines } from '../shared/data/outlines'

// ── Helpers ──────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8)

function today() { return new Date().toISOString().slice(0, 10) }

function InlineAdd({ placeholder, onConfirm, onCancel }: { placeholder: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input ref={ref} autoFocus className="input-field" placeholder={placeholder} value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) onConfirm(val.trim()); if (e.key === 'Escape') onCancel() }}
        style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => val.trim() && onConfirm(val.trim())}>✓</button>
      <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onCancel}>✕</button>
    </div>
  )
}

// ── Outline list sidebar ─────────────────────────────────────────

function OutlineSidebar({ outlines, selectedId, onSelect, onCreate, onDelete }: {
  outlines: Outline[]; selectedId: string | null
  onSelect: (id: string) => void; onCreate: () => void
  onDelete: (ids: string[]) => void
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checked.size === outlines.length) setChecked(new Set())
    else setChecked(new Set(outlines.map(o => o.id)))
  }

  const doDelete = () => {
    onDelete([...checked])
    setChecked(new Set())
    setConfirmDelete(false)
  }

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0, borderRight: '1px solid #F3F4F6', background: 'white' }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Danh sách đề cương</div>
        <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }} onClick={onCreate}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo đề cương mới
        </button>
        {outlines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <input type="checkbox" style={{ cursor: 'pointer', accentColor: '#2563EB' }}
              checked={checked.size === outlines.length && outlines.length > 0}
              onChange={toggleAll} title="Chọn tất cả" />
            <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>
              {checked.size > 0 ? `Đã chọn ${checked.size}` : 'Chọn tất cả'}
            </span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {outlines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>Chưa có đề cương nào</div>
        ) : (
          outlines.map(o => {
            const totalQ = o.sections.flatMap(s => s.exercises).reduce((a, e) => a + e.questionIds.length, 0)
            const isActive = o.id === selectedId
            const isChecked = checked.has(o.id)
            return (
              <div key={o.id}
                onClick={() => onSelect(o.id)}
                style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: isActive ? '#EFF6FF' : isChecked ? '#FEF2F2' : 'transparent',
                  border: isActive ? '1.5px solid #BFDBFE' : isChecked ? '1.5px solid #FECACA' : '1.5px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive && !isChecked) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (!isActive && !isChecked) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <input type="checkbox" style={{ cursor: 'pointer', accentColor: '#EF4444', marginTop: 2, flexShrink: 0 }}
                  checked={isChecked}
                  onClick={e => toggleCheck(o.id, e)}
                  onChange={() => {}} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#1D4ED8' : '#111827', marginBottom: 3, lineHeight: 1.4 }}>{o.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {o.sections.length} mục · {totalQ} câu hỏi · {o.createdAt}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete bar */}
      {checked.size > 0 && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #FEE2E2', background: '#FFF5F5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#DC2626', flex: 1, fontWeight: 500 }}>{checked.size} đề cương được chọn</span>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '5px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></svg>
            Xóa
          </button>
          <button onClick={() => setChecked(new Set())} style={{ padding: '5px 8px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Bỏ chọn</button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-box" style={{ width: 360, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 10px' }}>Xác nhận xóa</h3>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>Bạn có chắc muốn xóa <strong>{checked.size}</strong> đề cương đã chọn? Hành động này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Hủy</button>
              <button onClick={doDelete} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Create outline modal ─────────────────────────────────────────

function CreateOutlineModal({ onConfirm, onClose }: { onConfirm: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#111827', margin: '0 0 16px' }}>Tạo đề cương mới</h2>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tên đề cương *</label>
        <input className="input-field" placeholder="VD: Toán 10A — Đề cương học kỳ 1" value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && title.trim() && onConfirm(title.trim())}
          style={{ marginBottom: 20 }} autoFocus />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={!title.trim()} style={{ opacity: title.trim() ? 1 : 0.5 }} onClick={() => title.trim() && onConfirm(title.trim())}>Tạo</button>
        </div>
      </div>
    </div>
  )
}

// ── Editor ───────────────────────────────────────────────────────

function OutlineEditor({ outline, bankQuestions, onUpdate }: {
  outline: Outline; bankQuestions: BankQuestion[]
  onUpdate: (updated: Outline) => void
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [picker, setPicker] = useState<{ exerciseId: string; sectionId: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null)
  const [editingExercise, setEditingExercise] = useState<{ sid: string; eid: string; title: string } | null>(null)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const updateSections = (sections: Section[]) => onUpdate({ ...outline, sections })

  const addSection = (title: string) => {
    updateSections([...outline.sections, { id: uid(), title, expanded: true, exercises: [] }])
    setAdding(null)
  }

  const toggleSection = (sid: string) => {
    updateSections(outline.sections.map(s => s.id === sid ? { ...s, expanded: !s.expanded } : s))
  }

  const addExercise = (sid: string, title: string) => {
    updateSections(outline.sections.map(s => s.id === sid
      ? { ...s, exercises: [...s.exercises, { id: uid(), title, questionIds: [] }] }
      : s))
    setAdding(null)
  }

  const deleteExercise = (sid: string, eid: string) => {
    updateSections(outline.sections.map(s => s.id === sid
      ? { ...s, exercises: s.exercises.filter(e => e.id !== eid) }
      : s))
  }

  const deleteSection = (sid: string) => {
    updateSections(outline.sections.filter(s => s.id !== sid))
  }

  const updateExerciseQuestions = (sid: string, eid: string, ids: string[]) => {
    updateSections(outline.sections.map(s => s.id === sid
      ? { ...s, exercises: s.exercises.map(e => e.id === eid ? { ...e, questionIds: ids } : e) }
      : s))
    setPicker(null)
  }

  const renameSection = (sid: string, title: string) => {
    updateSections(outline.sections.map(s => s.id === sid ? { ...s, title } : s))
    setEditingSection(null)
  }

  const renameExercise = (sid: string, eid: string, title: string) => {
    updateSections(outline.sections.map(s => s.id === sid
      ? { ...s, exercises: s.exercises.map(e => e.id === eid ? { ...e, title } : e) }
      : s))
    setEditingExercise(null)
  }

  const removeQuestion = (sid: string, eid: string, qid: string) => {
    updateSections(outline.sections.map(s => s.id === sid
      ? { ...s, exercises: s.exercises.map(e => e.id === eid ? { ...e, questionIds: e.questionIds.filter(q => q !== qid) } : e) }
      : s))
  }

  const getQ = (id: string) => bankQuestions.find(q => q.id === id)

  const totalQ = outline.sections.flatMap(s => s.exercises).reduce((a, e) => a + e.questionIds.length, 0)

  const pickerSection = picker ? outline.sections.find(s => s.id === picker.sectionId) : null
  const pickerExercise = pickerSection?.exercises.find(e => e.id === picker?.exerciseId)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Editor top bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12, background: 'white' }}>
        <div style={{ flex: 1 }}>
          <input
            value={outline.title}
            onChange={e => onUpdate({ ...outline, title: e.target.value })}
            style={{ border: 'none', outline: 'none', fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111827', background: 'transparent', width: '100%' }}
            placeholder="Tên đề cương..." />
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {outline.sections.length} mục · {totalQ} câu hỏi · Tạo ngày {outline.createdAt}
          </div>
        </div>
        <button className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#22C55E' : '#2563EB', transition: 'background 0.3s' }}
          onClick={handleSave}>
          {saved
            ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Đã lưu</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Lưu lại</>
          }
        </button>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outline.sections.map((sec, si) => (
            <div key={sec.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FAFAFA', borderBottom: sec.expanded ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }}
                onClick={() => { if (!editingSection || editingSection.id !== sec.id) toggleSection(sec.id) }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
                  style={{ transform: sec.expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>Mục {si + 1}</span>
                {editingSection?.id === sec.id ? (
                  <input autoFocus value={editingSection.title} onClick={e => e.stopPropagation()}
                    onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter' && editingSection.title.trim()) renameSection(sec.id, editingSection.title.trim()); if (e.key === 'Escape') setEditingSection(null) }}
                    onBlur={() => editingSection.title.trim() ? renameSection(sec.id, editingSection.title.trim()) : setEditingSection(null)}
                    style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111827', border: '1.5px solid #2563EB', borderRadius: 6, padding: '2px 8px', outline: 'none' }} />
                ) : (
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111827' }}>{sec.title}</span>
                )}
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{sec.exercises.length} bài tập</span>
                <button onClick={e => { e.stopPropagation(); setEditingSection({ id: sec.id, title: sec.title }) }}
                  title="Đổi tên mục"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s', flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={e => { e.stopPropagation(); deleteSection(sec.id) }}
                  title="Xóa mục"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s', flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>

              {/* Exercises */}
              {sec.expanded && (
                <div style={{ padding: '10px 16px 14px' }}>
                  {sec.exercises.map((ex, ei) => (
                    <div key={ex.id} style={{ marginBottom: 10, border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                      {/* Exercise header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F9FAFB' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>Bài {ei + 1}</span>
                        {editingExercise?.sid === sec.id && editingExercise?.eid === ex.id ? (
                          <input autoFocus value={editingExercise.title}
                            onChange={e => setEditingExercise({ ...editingExercise, title: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter' && editingExercise.title.trim()) renameExercise(sec.id, ex.id, editingExercise.title.trim()); if (e.key === 'Escape') setEditingExercise(null) }}
                            onBlur={() => editingExercise.title.trim() ? renameExercise(sec.id, ex.id, editingExercise.title.trim()) : setEditingExercise(null)}
                            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', border: '1.5px solid #2563EB', borderRadius: 6, padding: '2px 8px', outline: 'none' }} />
                        ) : (
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>{ex.title}</span>
                        )}
                        <span style={{ fontSize: 10, background: ex.questionIds.length > 0 ? '#EFF6FF' : '#F3F4F6', color: ex.questionIds.length > 0 ? '#2563EB' : '#9CA3AF', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          {ex.questionIds.length} câu
                        </span>
                        <button
                          onClick={() => setPicker({ sectionId: sec.id, exerciseId: ex.id })}
                          style={{ background: '#EFF6FF', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', color: '#2563EB', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Chọn câu hỏi
                        </button>
                        <button onClick={() => setEditingExercise({ sid: sec.id, eid: ex.id, title: ex.title })}
                          title="Đổi tên bài tập"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s', flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deleteExercise(sec.id, ex.id)}
                          title="Xóa bài tập"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s', flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </div>

                      {/* Selected questions */}
                      {ex.questionIds.length > 0 && (
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {ex.questionIds.map((qid, qi) => {
                            const q = getQ(qid)
                            if (!q) return null
                            return (
                              <div key={qid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'white', borderRadius: 7, border: '1px solid #F3F4F6' }}>
                                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0, width: 20 }}>{qi + 1}.</span>
                                <TypeBadge t={q.type} />
                                <DiffBadge d={q.difficulty} />
                                <span style={{ flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</span>
                                <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{q.topic}</span>
                                <button onClick={() => removeQuestion(sec.id, ex.id, qid)}
                                  title="Xóa câu hỏi này"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '2px 4px', borderRadius: 4, transition: 'all 0.12s', flexShrink: 0, lineHeight: 1 }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {ex.questionIds.length === 0 && (
                        <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>
                          Chưa có câu hỏi — click "Chọn câu hỏi" để thêm
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add exercise */}
                  {adding === `ex:${sec.id}` ? (
                    <InlineAdd placeholder="Tên bài tập..." onConfirm={v => addExercise(sec.id, v)} onCancel={() => setAdding(null)} />
                  ) : (
                    <button onClick={() => setAdding('ex:' + sec.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'none', border: '1.5px dashed #D1D5DB', borderRadius: 8, cursor: 'pointer', color: '#9CA3AF', fontSize: 12, fontWeight: 500, width: '100%', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Thêm bài tập
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add section */}
          {adding === 'section' ? (
            <InlineAdd placeholder="Tên mục mới..." onConfirm={addSection} onCancel={() => setAdding(null)} />
          ) : (
            <button onClick={() => setAdding('section')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: '1.5px dashed #D1D5DB', borderRadius: 10, cursor: 'pointer', color: '#9CA3AF', fontSize: 13, fontWeight: 500, width: '100%', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm mục mới
            </button>
          )}
        </div>
      </div>

      {/* Question picker popup */}
      {picker && pickerExercise && (
        <QuestionPicker
          questions={bankQuestions}
          selectedIds={pickerExercise.questionIds}
          onConfirm={ids => updateExerciseQuestions(picker.sectionId, picker.exerciseId, ids)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────

export default function CourseBuilder({ bankQuestions, outlines: initOutlines, onOutlinesChange }: {
  bankQuestions?: BankQuestion[]
  outlines?: Outline[]
  onOutlinesChange?: (outlines: Outline[]) => void
}) {
  const [outlines, setOutlines] = useState<Outline[]>(initOutlines ?? seedOutlines)
  const [selectedId, setSelectedId] = useState<string | null>((initOutlines ?? seedOutlines)[0]?.id || null)
  const [showCreate, setShowCreate] = useState(false)

  const setAndNotify = (fn: (prev: Outline[]) => Outline[]) => {
    setOutlines(prev => {
      const next = fn(prev)
      onOutlinesChange?.(next)
      return next
    })
  }

  const selected = outlines.find(o => o.id === selectedId) || null

  const createOutline = (title: string) => {
    const o: Outline = { id: uid(), title, createdAt: today(), sections: [] }
    setAndNotify(prev => [...prev, o])
    setSelectedId(o.id)
    setShowCreate(false)
  }

  const updateOutline = (updated: Outline) => {
    setAndNotify(prev => prev.map(o => o.id === updated.id ? updated : o))
  }

  const deleteOutlines = (ids: string[]) => {
    const idSet = new Set(ids)
    setAndNotify(prev => {
      const remaining = prev.filter(o => !idSet.has(o.id))
      if (selectedId && idSet.has(selectedId)) {
        setSelectedId(remaining[0]?.id || null)
      }
      return remaining
    })
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <OutlineSidebar
        outlines={outlines}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setShowCreate(true)}
        onDelete={deleteOutlines}
      />

      {selected ? (
        <OutlineEditor
          outline={selected}
          bankQuestions={bankQuestions || []}
          onUpdate={updateOutline}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#9CA3AF', background: '#FAFAFA' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p style={{ fontSize: 15, margin: 0 }}>Chọn đề cương để chỉnh sửa</p>
          <p style={{ fontSize: 13, margin: 0 }}>hoặc tạo đề cương mới</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setShowCreate(true)}>Tạo đề cương mới</button>
        </div>
      )}

      {showCreate && <CreateOutlineModal onConfirm={createOutline} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
