import { useState } from 'react'
import type { BankQuestion } from '@/data/questionBank'
import { QuestionPicker, TypeBadge, DiffBadge } from '../shared/components/question'
import type { Section, Outline } from '../shared/data/outlines'
import {
  uid, iconBtn, hover, InlineAdd, ConfirmDialog,
  PencilIcon, TrashIcon, PlusIcon, CloseIcon, FileIcon,
} from './shared'

const dashedBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'none',
  border: '1.5px dashed #D1D5DB', borderRadius: 10, cursor: 'pointer', color: '#9CA3AF',
  fontSize: 13, fontWeight: 500, width: '100%', transition: 'all 0.15s',
}
const dashedHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    const s = e.currentTarget.style; s.borderColor = '#2563EB'; s.color = '#2563EB'; s.background = '#EFF6FF'
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    const s = e.currentTarget.style; s.borderColor = '#D1D5DB'; s.color = '#9CA3AF'; s.background = 'none'
  },
}

/**
 * Thân trang chi tiết: danh sách chương → bài → câu hỏi.
 * Mọi thay đổi (thêm/đổi tên/xóa chương-bài, chọn/gỡ câu hỏi) đều đi qua `onChange`
 * và chỉ thành nháp local; việc gọi API do trang chi tiết đảm nhận khi bấm "Lưu".
 * Trạng thái đóng/mở chương là state hiển thị nên không đánh dấu đề cương là chưa lưu.
 */
export default function OutlineEditor({ outline, bankQuestions, bankReady, onChange }: {
  outline: Outline
  bankQuestions: BankQuestion[]
  /** false khi ngân hàng câu hỏi chưa tải xong — lúc đó không kết luận câu hỏi đã bị xóa. */
  bankReady: boolean
  onChange: (updated: Outline) => void
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [picker, setPicker] = useState<{ exerciseId: string; sectionId: string } | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null)
  const [editingExercise, setEditingExercise] = useState<{ sid: string; eid: string; title: string } | null>(null)
  const [confirmSection, setConfirmSection] = useState<Section | null>(null)

  const updateSections = (sections: Section[]) => onChange({ ...outline, sections })
  const mapExercises = (sid: string, fn: (ex: Section['exercises']) => Section['exercises']) =>
    updateSections(outline.sections.map(s => s.id === sid ? { ...s, exercises: fn(s.exercises) } : s))

  const addSection = (title: string) => {
    updateSections([...outline.sections, { id: uid(), title, expanded: true, exercises: [] }])
    setAdding(null)
  }
  const renameSection = (sid: string, title: string) => {
    updateSections(outline.sections.map(s => s.id === sid ? { ...s, title } : s))
    setEditingSection(null)
  }
  /** Chương trống xóa ngay; chương có bài thì hỏi xác nhận trước. */
  const requestDeleteSection = (sec: Section) => {
    if (sec.exercises.length === 0) updateSections(outline.sections.filter(s => s.id !== sec.id))
    else setConfirmSection(sec)
  }
  const toggleSection = (sid: string) => setCollapsed(prev => {
    const next = new Set(prev)
    next.has(sid) ? next.delete(sid) : next.add(sid)
    return next
  })

  const addExercise = (sid: string, title: string) => {
    mapExercises(sid, exs => [...exs, { id: uid(), title, questionIds: [] }])
    setAdding(null)
  }
  const renameExercise = (sid: string, eid: string, title: string) => {
    mapExercises(sid, exs => exs.map(e => e.id === eid ? { ...e, title } : e))
    setEditingExercise(null)
  }
  const deleteExercise = (sid: string, eid: string) => mapExercises(sid, exs => exs.filter(e => e.id !== eid))

  /** Thay danh sách câu hỏi của bài bằng các id đã chọn trong QuestionPicker. */
  const setExerciseQuestions = (sid: string, eid: string, ids: string[]) => {
    mapExercises(sid, exs => exs.map(e => e.id === eid ? { ...e, questionIds: ids } : e))
    setPicker(null)
  }
  const removeQuestion = (sid: string, eid: string, qid: string) =>
    mapExercises(sid, exs => exs.map(e => e.id === eid ? { ...e, questionIds: e.questionIds.filter(q => q !== qid) } : e))

  /** Tìm câu hỏi ngân hàng theo id; undefined nghĩa là câu hỏi đã bị xóa khỏi ngân hàng. */
  const getQ = (id: string) => bankQuestions.find(q => q.id === id)

  const pickerExercise = picker
    ? outline.sections.find(s => s.id === picker.sectionId)?.exercises.find(e => e.id === picker.exerciseId)
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {outline.sections.map((sec, si) => {
        const isExpanded = !collapsed.has(sec.id)
        const isEditing = editingSection?.id === sec.id
        const secQ = sec.exercises.reduce((a, e) => a + e.questionIds.length, 0)
        return (
          <div key={sec.id} className="card" style={{ overflow: 'hidden' }}>
            {/* Header của chương */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FAFAFA', borderBottom: isExpanded ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }}
              onClick={() => { if (!isEditing) toggleSection(sec.id) }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, flexShrink: 0, background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>Chương {si + 1}</span>
              {isEditing ? (
                <input autoFocus value={editingSection.title} onClick={e => e.stopPropagation()}
                  onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter' && editingSection.title.trim()) renameSection(sec.id, editingSection.title.trim()); if (e.key === 'Escape') setEditingSection(null) }}
                  onBlur={() => editingSection.title.trim() ? renameSection(sec.id, editingSection.title.trim()) : setEditingSection(null)}
                  style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111827', border: '1.5px solid #2563EB', borderRadius: 6, padding: '4px 10px', outline: 'none' }} />
              ) : (
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111827', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title}</span>
              )}
              <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{sec.exercises.length} bài · {secQ} câu hỏi</span>
              <button onClick={e => { e.stopPropagation(); setEditingSection({ id: sec.id, title: sec.title }) }}
                title="Đổi tên chương" style={iconBtn(32)} {...hover('#2563EB', '#EFF6FF')}>
                <PencilIcon size={14} />
              </button>
              <button onClick={e => { e.stopPropagation(); requestDeleteSection(sec) }}
                title="Xóa chương" style={iconBtn(32)} {...hover('#EF4444', '#FEF2F2')}>
                <TrashIcon size={14} />
              </button>
            </div>

            {/* Danh sách bài trong chương */}
            {isExpanded && (
              <div style={{ padding: '12px 16px 14px' }}>
                {sec.exercises.map((ex, ei) => {
                  const isEditingEx = editingExercise?.sid === sec.id && editingExercise?.eid === ex.id
                  return (
                    <div key={ex.id} style={{ marginBottom: 10, border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                      {/* Header của bài */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F9FAFB' }}>
                        <FileIcon size={15} stroke="#2563EB" />
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>Bài {ei + 1}</span>
                        {isEditingEx ? (
                          <input autoFocus value={editingExercise.title}
                            onChange={e => setEditingExercise({ ...editingExercise, title: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter' && editingExercise.title.trim()) renameExercise(sec.id, ex.id, editingExercise.title.trim()); if (e.key === 'Escape') setEditingExercise(null) }}
                            onBlur={() => editingExercise.title.trim() ? renameExercise(sec.id, ex.id, editingExercise.title.trim()) : setEditingExercise(null)}
                            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', border: '1.5px solid #2563EB', borderRadius: 6, padding: '4px 10px', outline: 'none' }} />
                        ) : (
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.title}</span>
                        )}
                        <span style={{ fontSize: 10, background: ex.questionIds.length ? '#EFF6FF' : '#F3F4F6', color: ex.questionIds.length ? '#2563EB' : '#9CA3AF', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          {ex.questionIds.length} câu
                        </span>
                        <button onClick={() => setPicker({ sectionId: sec.id, exerciseId: ex.id })}
                          style={{ background: '#EFF6FF', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', color: '#2563EB', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <PlusIcon size={13} />
                          Chọn câu hỏi
                        </button>
                        <button onClick={() => setEditingExercise({ sid: sec.id, eid: ex.id, title: ex.title })}
                          title="Đổi tên bài" style={iconBtn(32)} {...hover('#2563EB', '#EFF6FF')}>
                          <PencilIcon size={14} />
                        </button>
                        <button onClick={() => deleteExercise(sec.id, ex.id)}
                          title="Xóa bài" style={iconBtn(32)} {...hover('#EF4444', '#FEF2F2')}>
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      {/* Câu hỏi của bài */}
                      {ex.questionIds.length > 0 ? (
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {ex.questionIds.map((qid, qi) => {
                            const q = getQ(qid)
                            return (
                              <div key={qid} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7,
                                background: q || !bankReady ? 'white' : '#FFFBEB',
                                border: `1px solid ${q || !bankReady ? '#F3F4F6' : '#FDE68A'}`,
                              }}>
                                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0, width: 22 }}>{qi + 1}.</span>
                                {q ? (
                                  <>
                                    <TypeBadge t={q.type} />
                                    <DiffBadge d={q.difficulty} />
                                    <span style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</span>
                                    <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{q.topic}</span>
                                  </>
                                ) : (
                                  <span style={{ flex: 1, fontSize: 12, color: bankReady ? '#B45309' : '#9CA3AF' }}>
                                    {bankReady ? 'Câu hỏi đã bị xóa khỏi ngân hàng' : 'Đang tải câu hỏi...'}
                                  </span>
                                )}
                                <button onClick={() => removeQuestion(sec.id, ex.id, qid)}
                                  title="Gỡ câu hỏi khỏi bài" style={iconBtn(28)} {...hover('#EF4444', '#FEF2F2')}>
                                  <CloseIcon size={13} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>
                          Chưa có câu hỏi — bấm "Chọn câu hỏi" để thêm
                        </div>
                      )}
                    </div>
                  )
                })}

                {adding === `ex:${sec.id}` ? (
                  <InlineAdd placeholder="Tên bài..." onConfirm={v => addExercise(sec.id, v)} onCancel={() => setAdding(null)} />
                ) : (
                  <button onClick={() => setAdding('ex:' + sec.id)} style={{ ...dashedBtn, fontSize: 12, padding: '9px 13px', borderRadius: 8 }} {...dashedHover}>
                    <PlusIcon size={14} />
                    Thêm bài
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {adding === 'section' ? (
        <InlineAdd placeholder="Tên chương mới..." onConfirm={addSection} onCancel={() => setAdding(null)} />
      ) : (
        <button onClick={() => setAdding('section')} style={dashedBtn} {...dashedHover}>
          <PlusIcon size={15} />
          Thêm chương
        </button>
      )}

      {picker && pickerExercise && (
        <QuestionPicker
          questions={bankQuestions}
          selectedIds={pickerExercise.questionIds}
          onConfirm={ids => setExerciseQuestions(picker.sectionId, picker.exerciseId, ids)}
          onClose={() => setPicker(null)}
        />
      )}

      {confirmSection && (
        <ConfirmDialog
          title="Xóa chương"
          message={<>Xóa chương <strong>{confirmSection.title}</strong> cùng {confirmSection.exercises.length} bài bên trong? Thay đổi chỉ áp dụng khi bạn bấm Lưu.</>}
          confirmLabel="Xóa chương"
          danger
          onConfirm={() => { updateSections(outline.sections.filter(s => s.id !== confirmSection.id)); setConfirmSection(null) }}
          onClose={() => setConfirmSection(null)}
        />
      )}
    </div>
  )
}
