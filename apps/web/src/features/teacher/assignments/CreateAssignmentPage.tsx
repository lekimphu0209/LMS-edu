import { useState, useMemo } from 'react'
import type { Outline } from '../shared/data/outlines'
import { BankQuestion } from '@/data/questionBank'
import { TypeBadge, DiffBadge, QuestionPicker } from '../shared/components/question'

interface Props {
  outlines: Outline[]
  bankQuestions: BankQuestion[]
}

// ── Assignment builder types ──────────────────────────────────────

interface AsgExercise { exerciseId: string; questionIds: string[] }
interface AsgSection  { sectionId: string; exercises: AsgExercise[] }
interface AsgOutline  { outlineId: string; sections: AsgSection[] }

const CLASSES = ['Toán 10A', 'Toán 10B', 'Toán 11B', 'Toán 12C']

function today() { return new Date().toISOString().slice(0, 10) }

// ── Inline dropdown selector ──────────────────────────────────────

function AddDropdown({ label, options, onAdd, exclude }: {
  label: string
  options: { id: string; title: string }[]
  onAdd: (id: string) => void
  exclude?: string[]
}) {
  const [open, setOpen] = useState(false)
  const available = options.filter(o => !exclude?.includes(o.id))
  if (available.length === 0) return null
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'none', border: '1.5px dashed #D1D5DB', borderRadius: 7, cursor: 'pointer', color: '#6B7280', fontSize: 12, fontWeight: 500, transition: 'all 0.13s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {label}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 240, overflow: 'hidden' }}>
            {available.map(opt => (
              <button key={opt.id} onClick={() => { onAdd(opt.id); setOpen(false) }}
                style={{ width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13, color: '#374151', display: 'block' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                {opt.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Delete button ─────────────────────────────────────────────────

function DelBtn({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s', flexShrink: 0, lineHeight: 1 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      </svg>
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────

export default function CreateAssignment({ outlines, bankQuestions }: Props) {
  const [title, setTitle]           = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [dueTime, setDueTime]       = useState('23:59')
  const [desc, setDesc]             = useState('')
  const [submitted, setSubmitted]   = useState(false)

  // Builder state
  const [items, setItems] = useState<AsgOutline[]>([])
  const [picker, setPicker] = useState<{ outlineIdx: number; sectionIdx: number; exerciseIdx: number } | null>(null)

  // ── Outline ops ──

  const addOutline = (oid: string) => {
    setItems(prev => [...prev, { outlineId: oid, sections: [] }])
  }
  const removeOutline = (oi: number) => setItems(prev => prev.filter((_, i) => i !== oi))

  // ── Section ops ──

  const addSection = (oi: number, sid: string) => {
    setItems(prev => prev.map((o, i) => i !== oi ? o : { ...o, sections: [...o.sections, { sectionId: sid, exercises: [] }] }))
  }
  const removeSection = (oi: number, si: number) => {
    setItems(prev => prev.map((o, i) => i !== oi ? o : { ...o, sections: o.sections.filter((_, j) => j !== si) }))
  }

  // ── Exercise ops ──

  const addExercise = (oi: number, si: number, eid: string) => {
    const outline = outlines.find(o => o.id === items[oi].outlineId)
    const section = outline?.sections.find(s => s.id === items[oi].sections[si].sectionId)
    const ex = section?.exercises.find(e => e.id === eid)
    const questionIds = ex?.questionIds ?? []
    setItems(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      sections: o.sections.map((s, j) => j !== si ? s : {
        ...s, exercises: [...s.exercises, { exerciseId: eid, questionIds }]
      })
    }))
  }
  const removeExercise = (oi: number, si: number, ei: number) => {
    setItems(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      sections: o.sections.map((s, j) => j !== si ? s : { ...s, exercises: s.exercises.filter((_, k) => k !== ei) })
    }))
  }

  // ── Question ops ──

  const updateQuestions = (oi: number, si: number, ei: number, ids: string[]) => {
    setItems(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      sections: o.sections.map((s, j) => j !== si ? s : {
        ...s, exercises: s.exercises.map((e, k) => k !== ei ? e : { ...e, questionIds: ids })
      })
    }))
    setPicker(null)
  }

  const removeQuestion = (oi: number, si: number, ei: number, qid: string) => {
    setItems(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      sections: o.sections.map((s, j) => j !== si ? s : {
        ...s, exercises: s.exercises.map((e, k) => k !== ei ? e : { ...e, questionIds: e.questionIds.filter(q => q !== qid) })
      })
    }))
  }

  // ── Derived ──

  const totalQuestions = useMemo(() =>
    [...new Set(items.flatMap(o => o.sections.flatMap(s => s.exercises.flatMap(e => e.questionIds))))].length,
    [items])

  const canSubmit = title.trim() && targetClass && dueDate && dueTime && totalQuestions > 0

  const resetForm = () => {
    setSubmitted(false); setTitle(''); setTargetClass(''); setDueDate(''); setDueTime('23:59'); setDesc(''); setItems([])
  }

  if (submitted) {
    return (
      <div className="page-container" style={{ paddingTop: 72, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 10 }}>Giao bài thành công!</h2>
        <p style={{ color: '#6B7280', marginBottom: 18 }}>
          Bài tập <strong>{title}</strong> đã được giao cho lớp <strong>{targetClass}</strong> ({totalQuestions} câu hỏi). Hạn nộp: {dueDate} lúc {dueTime}.
        </p>
        <button className="btn-primary" onClick={resetForm}>Tạo bài tập mới</button>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 56 }}>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 18 }}>Giao bài tập</h1>

      {/* ── Metadata ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 16 }}>Thông tin bài tập</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Tên bài tập *</label>
            <input className="input-field" placeholder="VD: Kiểm tra chương 3 — Hàm số" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Lớp học *</label>
            <select className="input-field" value={targetClass} onChange={e => setTargetClass(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Ngày đóng bài *</label>
            <input className="input-field" type="date" min={today()} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Giờ đóng bài *</label>
            <input className="input-field" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
          </div>
          <div style={{ gridColumn: '3 / 5' }}>
            {dueDate && dueTime && (
              <div style={{ marginTop: 28, padding: '8px 12px', background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#2563EB', fontWeight: 500 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Đóng lúc {dueTime} ngày {dueDate.split('-').reverse().join('/')}
              </div>
            )}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Mô tả (tuỳ chọn)</label>
            <input className="input-field" placeholder="Hướng dẫn cho học sinh..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Builder ── */}
      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#374151' }}>Nội dung bài tập</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: totalQuestions > 0 ? '#2563EB' : '#9CA3AF', background: totalQuestions > 0 ? '#EFF6FF' : '#F3F4F6', padding: '3px 12px', borderRadius: 20 }}>
            {totalQuestions} câu hỏi
          </span>
        </div>

        {/* Outline list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((asgO, oi) => {
            const outline = outlines.find(o => o.id === asgO.outlineId)
            if (!outline) return null
            const usedSectionIds = asgO.sections.map(s => s.sectionId)
            const availableSections = outline.sections.map(s => ({ id: s.id, title: s.title }))

            return (
              <div key={oi} style={{ border: '1.5px solid #E5E7EB', borderRadius: 12 }}>
                {/* Outline header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE', borderRadius: '10px 10px 0 0' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#1D4ED8' }}>{outline.title}</span>
                  <span style={{ fontSize: 11, color: '#93C5FD' }}>{asgO.sections.length} mục</span>
                  <DelBtn onClick={() => removeOutline(oi)} title="Xóa đề cương này" />
                </div>

                {/* Sections */}
                <div style={{ padding: '10px 16px 14px' }}>
                  {asgO.sections.map((asgS, si) => {
                    const section = outline.sections.find(s => s.id === asgS.sectionId)
                    if (!section) return null
                    const usedExIds = asgS.exercises.map(e => e.exerciseId)
                    const availableExercises = section.exercises.map(e => ({ id: e.id, title: e.title }))

                    return (
                      <div key={si} style={{ marginBottom: 10, border: '1px solid #F3F4F6', borderRadius: 10 }}>
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', borderRadius: '9px 9px 0 0' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                          </svg>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>{section.title}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{asgS.exercises.length} bài</span>
                          <DelBtn onClick={() => removeSection(oi, si)} title="Xóa mục này" />
                        </div>

                        {/* Exercises */}
                        <div style={{ padding: '8px 14px 10px' }}>
                          {asgS.exercises.map((asgE, ei) => {
                            const ex = section.exercises.find(e => e.id === asgE.exerciseId)
                            if (!ex) return null
                            const exQs = asgE.questionIds.map(id => bankQuestions.find(q => q.id === id)).filter(Boolean) as BankQuestion[]

                            return (
                              <div key={ei} style={{ marginBottom: 8, border: '1px solid #F3F4F6', borderRadius: 8 }}>
                                {/* Exercise header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F9FAFB', borderRadius: '7px 7px 0 0' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                                  </svg>
                                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#374151' }}>{ex.title}</span>
                                  <span style={{ fontSize: 10, background: exQs.length > 0 ? '#EFF6FF' : '#F3F4F6', color: exQs.length > 0 ? '#2563EB' : '#9CA3AF', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                                    {exQs.length} câu
                                  </span>
                                  <button
                                    onClick={() => setPicker({ outlineIdx: oi, sectionIdx: si, exerciseIdx: ei })}
                                    style={{ background: '#EFF6FF', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#2563EB', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Chọn câu hỏi
                                  </button>
                                  <DelBtn onClick={() => removeExercise(oi, si, ei)} title="Xóa bài tập này" />
                                </div>

                                {/* Questions */}
                                {exQs.length > 0 && (
                                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {exQs.map((q, qi) => (
                                      <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'white', borderRadius: 6, border: '1px solid #F3F4F6' }}>
                                        <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, flexShrink: 0, width: 18 }}>{qi + 1}.</span>
                                        <TypeBadge t={q.type} />
                                        <DiffBadge d={q.difficulty} />
                                        <span style={{ flex: 1, fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</span>
                                        <button onClick={() => removeQuestion(oi, si, ei, q.id)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '2px 3px', borderRadius: 4, flexShrink: 0, lineHeight: 1, transition: 'all 0.12s' }}
                                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
                                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {exQs.length === 0 && (
                                  <div style={{ padding: '8px 12px', fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>
                                    Chưa có câu hỏi — click "Chọn câu hỏi"
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Add exercise */}
                          <AddDropdown
                            label="Thêm bài tập"
                            options={availableExercises}
                            exclude={usedExIds}
                            onAdd={eid => addExercise(oi, si, eid)}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {/* Add section */}
                  <AddDropdown
                    label="Thêm mục"
                    options={availableSections}
                    exclude={usedSectionIds}
                    onAdd={sid => addSection(oi, sid)}
                  />
                </div>
              </div>
            )
          })}

          {/* Add outline */}
          <AddDropdown
            label="Thêm đề cương"
            options={outlines.map(o => ({ id: o.id, title: o.title }))}
            exclude={items.map(i => i.outlineId)}
            onAdd={addOutline}
          />

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0 8px', fontSize: 13, color: '#D1D5DB' }}>
              Nhấn "Thêm đề cương" để bắt đầu chọn nội dung
            </div>
          )}
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        className="btn-primary"
        disabled={!canSubmit}
        style={{ opacity: canSubmit ? 1 : 0.45, padding: '13px 32px', fontSize: 15, fontWeight: 700, width: '100%' }}
        onClick={() => canSubmit && setSubmitted(true)}>
        Giao bài tập →
      </button>
      {!canSubmit && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
          Cần có tên bài tập, lớp học, hạn nộp và ít nhất 1 câu hỏi
        </div>
      )}

      {/* Question picker popup */}
      {picker && (() => {
        const asgE = items[picker.outlineIdx]?.sections[picker.sectionIdx]?.exercises[picker.exerciseIdx]
        return asgE ? (
          <QuestionPicker
            questions={bankQuestions}
            selectedIds={asgE.questionIds}
            onConfirm={ids => updateQuestions(picker.outlineIdx, picker.sectionIdx, picker.exerciseIdx, ids)}
            onClose={() => setPicker(null)}
          />
        ) : null
      })()}
    </div>
  )
}
