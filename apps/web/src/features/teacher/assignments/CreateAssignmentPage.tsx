import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Outline } from '../shared/data/outlines'
import { BankQuestion } from '@/data/questionBank'
import { classRosters, seedAssignments, scoreColor, type Assignment } from '@/data/assignments'
import { TypeBadge, DiffBadge, QuestionPicker } from '../shared/components/question'

interface Props {
  outlines: Outline[]
  bankQuestions: BankQuestion[]
}

// ── Assignment builder types ──────────────────────────────────────

interface AsgExercise { exerciseId: string; questionIds: string[] }
interface AsgSection  { sectionId: string; exercises: AsgExercise[] }
interface AsgOutline  { outlineId: string; sections: AsgSection[] }

/** Dữ liệu điền sẵn khi nhân bản một bài tập đã có (từ trang chi tiết). */
export interface AssignmentPrefill {
  sourceTitle?: string
  title?: string
  desc?: string
  class?: string
  dueDate?: string
  dueTime?: string
  durationMin?: number | null
  questionIds?: string[]
}

/** Dựng lại cấu trúc đề cương → mục → bài từ questionIds (dùng khi nhân bản bài tập). */
export function buildItemsFromQuestions(questionIds: string[], outlines: Outline[]): AsgOutline[] {
  const remaining = new Set(questionIds)
  const items: AsgOutline[] = []
  for (const o of outlines) {
    const sections: AsgSection[] = []
    for (const s of o.sections) {
      const exercises: AsgExercise[] = []
      for (const e of s.exercises) {
        const hit = e.questionIds.filter(q => remaining.has(q))
        if (hit.length === 0) continue
        hit.forEach(q => remaining.delete(q))
        exercises.push({ exerciseId: e.id, questionIds: hit })
      }
      if (exercises.length) sections.push({ sectionId: s.id, exercises })
    }
    if (sections.length) items.push({ outlineId: o.id, sections })
  }
  return items
}

const CLASSES = ['Toán 10A', 'Toán 10B', 'Toán 11B', 'Toán 12A', 'Toán 12C', 'Lý 12C', 'Hóa 10D']

/** Danh sách option lớp: lớp từ prefill (trang chi tiết lớp) nằm ngoài danh sách mẫu vẫn được giữ và đưa lên đầu. */
export function resolveClassOptions(targetClass: string): string[] {
  return targetClass && !CLASSES.includes(targetClass) ? [targetClass, ...CLASSES] : CLASSES
}
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

function today() { return new Date().toISOString().slice(0, 10) }

// ── Shared small styles ───────────────────────────────────────────

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
const sectionTitle: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }

const ClockIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

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
  const navigate = useNavigate()
  /** Điền sẵn khi đến từ nút "Tạo bản sao" ở trang chi tiết. */
  const prefill = (useLocation().state as { prefill?: AssignmentPrefill } | null)?.prefill
  const [title, setTitle]           = useState(prefill?.title ?? '')
  const [targetClass, setTargetClass] = useState(prefill?.class ?? '')
  const [dueDate, setDueDate]       = useState(prefill?.dueDate ?? '')
  const [dueTime, setDueTime]       = useState(prefill?.dueTime ?? '23:59')
  const [desc, setDesc]             = useState(prefill?.desc ?? '')
  const [durationOn, setDurationOn]   = useState(prefill?.durationMin != null)
  const [durationMin, setDurationMin] = useState(prefill?.durationMin ?? 45)
  // Giao cho: mặc định cả lớp; chuyển sang chọn từng học sinh bằng checkbox + search
  const [targetAll, setTargetAll]   = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [submitted, setSubmitted]   = useState<'assigned' | 'saved' | 'draft' | null>(null)

  // Builder state
  const [items, setItems] = useState<AsgOutline[]>(() =>
    prefill?.questionIds?.length ? buildItemsFromQuestions(prefill.questionIds, outlines) : [])
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

  const roster = classRosters[targetClass] ?? []
  const rosterAvg = roster.length ? roster.reduce((a, s) => a + s.avgScore, 0) / roster.length : 0
  // Lớp từ prefill (trang chi tiết lớp) có thể chưa nằm trong danh sách mẫu
  const classOptions = resolveClassOptions(targetClass)
  const canSubmit = Boolean(title.trim() && targetClass && dueDate && dueTime && totalQuestions > 0
    && (!durationOn || durationMin > 0)
    && (targetAll || selectedIds.length > 0))

  const resetForm = () => {
    setSubmitted(null); setTitle(''); setTargetClass(''); setDueDate(''); setDueTime('23:59'); setDesc('')
    setDurationOn(false); setDurationMin(45); setItems([])
    setTargetAll(true); setSelectedIds([]); setStudentSearch('')
  }

  const checks = [
    { ok: Boolean(title.trim()), t: 'Đặt tên bài tập' },
    { ok: Boolean(targetClass), t: 'Chọn lớp học' },
    { ok: Boolean(dueDate && dueTime), t: 'Chọn hạn nộp' },
    { ok: totalQuestions > 0, t: 'Chọn ít nhất 1 câu hỏi' },
    ...(durationOn ? [{ ok: durationMin > 0, t: 'Thời gian làm bài hợp lệ' }] : []),
    ...(!targetAll ? [{ ok: selectedIds.length > 0, t: 'Chọn ít nhất 1 học sinh' }] : []),
  ]

  /** Tạo bản ghi bài tập mới vào kho chung rồi hiện màn hình kết quả. */
  const finish = (mode: 'assigned' | 'saved' | 'draft') => {
    const targets = targetAll ? roster : roster.filter(s => selectedIds.includes(s.id))
    const newAsg: Assignment = {
      id: Math.max(0, ...seedAssignments.map(a => a.id)) + 1,
      title: title.trim() || 'Bài tập không tên',
      class: targetClass,
      status: mode === 'assigned' ? 'ASSIGNED' : mode === 'saved' ? 'SAVED' : 'DRAFT',
      durationMin: durationOn ? durationMin : null,
      dueDate, dueTime,
      createdAt: new Date().toISOString().slice(0, 10),
      totalQuestions,
      desc,
      questionIds: [...new Set(items.flatMap(o => o.sections.flatMap(s => s.exercises.flatMap(e => e.questionIds))))],
      version: 1, editedAt: null,
      students: mode === 'assigned'
        ? targets.map(s => ({ id: s.id, name: s.name, completedAt: null, score: null, timeSpent: null, answers: [] }))
        : [],
    }
    seedAssignments.push(newAsg)
    setSubmitted(mode)
  }

  if (submitted) {
    const msg = {
      assigned: { h: 'Giao bài thành công!', p: `Bài tập đã được giao cho ${targetAll ? `toàn bộ ${roster.length} học sinh` : `${selectedIds.length} học sinh`} lớp ${targetClass} (${totalQuestions} câu hỏi).` },
      saved:    { h: 'Đã lưu bài tập!',       p: 'Bài tập đủ điều kiện giao nhưng chưa được giao — xem trong tab "Đã lưu" ở danh sách bài tập.' },
      draft:    { h: 'Đã lưu nháp!',          p: 'Bài tập còn thiếu thông tin — xem trong tab "Nháp" ở danh sách bài tập để hoàn thiện sau.' },
    }[submitted]
    return (
      <div className="page-container" style={{ paddingTop: 72, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 10 }}>{msg.h}</h2>
        <p style={{ color: '#6B7280', marginBottom: 8, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          <strong>{title}</strong> — {msg.p}<br />
          {dueDate && <>Hạn nộp: {dueDate} lúc {dueTime} · </>}Thời gian làm bài: <strong>{durationOn ? `${durationMin} phút` : 'không giới hạn'}</strong>
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <button className="btn-primary" onClick={resetForm}>Tạo bài tập mới</button>
          <button onClick={() => navigate('/assignments')}
            style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 13.5, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            Về danh sách bài tập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 56, maxWidth: 1180 }}>
      {/* Header: tiêu đề trái · nhóm hành động phải (Hủy / Lưu / Giao) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 21, color: '#111827' }}>
            {prefill?.sourceTitle ? 'Chỉnh sửa bản sao' : 'Giao bài tập mới'}
          </h1>
          {prefill?.sourceTitle ? (
            <p style={{ fontSize: 12.5, color: '#B45309', marginTop: 3 }}>
              Bản sao của <strong>"{prefill.sourceTitle}"</strong> — đổi lớp, học sinh hoặc câu hỏi tùy ý rồi giao.
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>Chọn nội dung bên trái — cài đặt lớp, hạn nộp và thời gian làm bài ở cột phải.</p>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: totalQuestions > 0 ? '#2563EB' : '#9CA3AF', background: totalQuestions > 0 ? '#EFF6FF' : '#F3F4F6', padding: '4px 13px', borderRadius: 20, flexShrink: 0 }}>
          {totalQuestions} câu hỏi
        </span>
        <button onClick={() => navigate('/assignments')}
          style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', flexShrink: 0 }}>
          Hủy
        </button>
        <button onClick={() => finish(canSubmit ? 'saved' : 'draft')} disabled={!title.trim()}
          style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #2563EB', background: 'white', fontSize: 13, fontWeight: 700, color: '#2563EB', cursor: title.trim() ? 'pointer' : 'not-allowed', opacity: title.trim() ? 1 : 0.45, flexShrink: 0 }}>
          {canSubmit ? 'Lưu' : 'Lưu nháp'}
        </button>
        <button className="btn-primary" onClick={() => finish('assigned')} disabled={!canSubmit}
          style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, opacity: canSubmit ? 1 : 0.45, flexShrink: 0 }}>
          Giao bài
        </button>
      </div>

      {/* Bố cục 2 cột: nội dung trái · cài đặt + tóm tắt phải */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 18, alignItems: 'start' }}>

      {/* ── Builder (cột trái) ── */}
      <div className="card" style={{ padding: 22 }}>
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

      {/* ── Cột phải: cài đặt + tóm tắt (dính khi cuộn) ── */}
      <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Card cài đặt */}
        <div className="card" style={{ padding: 18 }}>
          <div style={sectionTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Cài đặt bài tập
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <label style={lbl}>Tên bài tập <span style={{ color: '#EF4444' }}>*</span></label>
              <input className="input-field" placeholder="VD: Kiểm tra chương 3 — Hàm số" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Lớp học <span style={{ color: '#EF4444' }}>*</span></label>
              <select className="input-field" value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                <option value="">-- Chọn lớp --</option>
                {classOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Hạn nộp <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
                <input className="input-field" type="date" min={today()} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                <input className="input-field" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
              </div>
              {dueDate && dueTime && (
                <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#2563EB', fontWeight: 500 }}>
                  <ClockIcon size={12} />
                  Đóng lúc {dueTime} ngày {dueDate.split('-').reverse().join('/')}
                </div>
              )}
            </div>

            {/* Giao cho: mặc định cả lớp, có thể chọn từng học sinh */}
            <div>
              <label style={lbl}>Giao cho <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 3 }}>
                {[{ all: true, t: 'Cả lớp' }, { all: false, t: 'Chọn học sinh' }].map(o => (
                  <button key={String(o.all)} type="button" onClick={() => setTargetAll(o.all)}
                    style={{ flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, transition: 'all 0.15s',
                      background: targetAll === o.all ? 'white' : 'transparent',
                      color: targetAll === o.all ? '#2563EB' : '#6B7280',
                      boxShadow: targetAll === o.all ? '0 1px 3px rgba(0,0,0,0.10)' : 'none' }}>
                    {o.t}
                  </button>
                ))}
              </div>

              {targetAll ? (
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#9CA3AF' }}>
                  {targetClass
                    ? <>Sẽ giao cho toàn bộ <strong style={{ color: '#2563EB' }}>{roster.length} học sinh</strong> lớp {targetClass} · ĐTB lớp <strong style={{ color: scoreColor(rosterAvg) }}>{rosterAvg.toFixed(1)}</strong>.</>
                    : 'Sẽ giao cho toàn bộ học sinh của lớp đã chọn.'}
                </div>
              ) : (
                <div style={{ marginTop: 9, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  {targetClass ? (
                    <>
                      {/* Tìm theo tên / email */}
                      <div style={{ position: 'relative', borderBottom: '1px solid #F3F4F6' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                          placeholder="Tìm theo tên hoặc email..."
                          style={{ width: '100%', border: 'none', outline: 'none', padding: '8px 10px 8px 30px', fontSize: 12, boxSizing: 'border-box' }} />
                      </div>

                      {/* Danh sách học sinh + checkbox */}
                      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                        {roster
                          .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(s => {
                            const checked = selectedIds.includes(s.id)
                            return (
                              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', cursor: 'pointer', background: checked ? '#F8FAFF' : 'white', borderBottom: '1px solid #F9FAFB' }}
                                onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLLabelElement).style.background = '#F9FAFB' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = checked ? '#F8FAFF' : 'white' }}>
                                <input type="checkbox" checked={checked} style={{ accentColor: '#2563EB', width: 14, height: 14 }}
                                  onChange={() => setSelectedIds(prev => checked ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {s.name.charAt(0)}
                                </span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                                  <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{s.email}</div>
                                </span>
                                <span title="Điểm trung bình" style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: scoreColor(s.avgScore), flexShrink: 0 }}>
                                  TB {s.avgScore.toFixed(1)}
                                </span>
                              </label>
                            )
                          })}
                      </div>

                      {/* Chân: đếm + chọn tất cả / bỏ chọn */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB', fontSize: 11 }}>
                        <span style={{ flex: 1, fontWeight: 700, color: selectedIds.length > 0 ? '#2563EB' : '#9CA3AF' }}>
                          Đã chọn {selectedIds.length}/{roster.length}
                        </span>
                        <button type="button" onClick={() => setSelectedIds(roster.map(s => s.id))}
                          style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Chọn tất cả</button>
                        <button type="button" onClick={() => setSelectedIds([])}
                          style={{ border: 'none', background: 'none', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Bỏ chọn</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '14px 12px', fontSize: 11.5, color: '#9CA3AF', textAlign: 'center' }}>
                      Chọn lớp học ở trên để hiện danh sách học sinh
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thời gian làm bài */}
            <div>
              <label style={lbl}>Thời gian làm bài</label>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 3 }}>
                {[{ on: false, t: 'Không giới hạn' }, { on: true, t: 'Đặt thời gian' }].map(o => (
                  <button key={String(o.on)} type="button" onClick={() => setDurationOn(o.on)}
                    style={{ flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, transition: 'all 0.15s',
                      background: durationOn === o.on ? 'white' : 'transparent',
                      color: durationOn === o.on ? '#2563EB' : '#6B7280',
                      boxShadow: durationOn === o.on ? '0 1px 3px rgba(0,0,0,0.10)' : 'none' }}>
                    {o.t}
                  </button>
                ))}
              </div>
              {durationOn ? (
                <div style={{ marginTop: 9 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {DURATION_PRESETS.map(m => (
                      <button key={m} type="button" onClick={() => setDurationMin(m)}
                        style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                          border: durationMin === m ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                          background: durationMin === m ? '#EFF6FF' : 'white',
                          color: durationMin === m ? '#2563EB' : '#4B5563' }}>
                        {m}′
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
                    <ClockIcon size={13} color="#6B7280" />
                    <input className="input-field" type="number" min={1} max={600} value={durationMin}
                      onChange={e => setDurationMin(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ width: 90, textAlign: 'center', padding: '6px 8px' }} />
                    <span style={{ fontSize: 12, color: '#6B7280' }}>phút — học sinh thấy đồng hồ đếm ngược</span>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#9CA3AF' }}>
                  Học sinh làm bài không bị giới hạn thời gian.
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Mô tả <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(tuỳ chọn)</span></label>
              <input className="input-field" placeholder="Hướng dẫn cho học sinh..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Card tóm tắt */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ ...sectionTitle, marginBottom: 11 }}>Tóm tắt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: '#4B5563', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nội dung</span>
              <strong>{items.length} đề cương · {items.reduce((a, o) => a + o.sections.length, 0)} mục · {items.reduce((a, o) => a + o.sections.reduce((b, s) => b + s.exercises.length, 0), 0)} bài · {totalQuestions} câu</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Thời gian</span>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: durationOn ? '#2563EB' : '#9CA3AF' }}>
                <ClockIcon size={12} />{durationOn ? `${durationMin} phút` : 'Không giới hạn'}
              </strong>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {checks.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: c.ok ? '#15803D' : '#9CA3AF' }}>
                <span style={{ width: 15, height: 15, borderRadius: '50%', background: c.ok ? '#D1FAE5' : '#F3F4F6', color: c.ok ? '#22C55E' : '#D1D5DB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {c.t}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10.5, color: '#9CA3AF', textAlign: 'center' }}>
            Hoàn thành checklist rồi bấm <strong>Giao bài</strong> hoặc <strong>Lưu</strong> ở đầu trang.
          </div>
        </div>
      </div>
      </div>

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
