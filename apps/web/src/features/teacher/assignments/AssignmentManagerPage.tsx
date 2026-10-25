import { useState } from 'react'
import {
  seedAssignments,
  isPast,
  fmtDate,
  scoreColor,
  type Assignment,
  type StudentSubmission,
} from '@/data/assignments'

// ── Student answer viewer ─────────────────────────────────────────

function AnswerViewer({ student, onBack, notes, onNoteChange }: {
  student: StudentSubmission
  onBack: () => void
  notes: Record<string, string>
  onNoteChange: (key: string, val: string) => void
}) {
  const correct = student.answers.filter(a => a.isCorrect).length

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '0 28px' }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Quay lại
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827' }}>{student.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
            Hoàn thành lúc {student.completedAt} · {student.timeSpent}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: scoreColor(student.score ?? 0) }}>{student.score}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{correct}/{student.answers.length} câu đúng</div>
        </div>
      </div>

      {/* Answers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {student.answers.map((ans, i) => {
          const noteKey = `${student.id}-${ans.qi}`
          const note = notes[noteKey] ?? ''
          const isMultiple = ans.type === 'multiple'
          const isShort = ans.type === 'short'

          const renderAnswer = (val: number | number[] | string, color: string) => {
            if (isShort) return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{val as string}</span>
            if (isMultiple) {
              const idxs = val as number[]
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {idxs.map(idx => (
                    <span key={idx} style={{ fontSize: 12, background: color + '18', color, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                      {ans.options[idx]}
                    </span>
                  ))}
                </div>
              )
            }
            return (
              <span style={{ fontSize: 13, background: color + '18', color, padding: '2px 12px', borderRadius: 20, fontWeight: 600 }}>
                {ans.options[val as number]}
              </span>
            )
          }

          return (
            <div key={ans.qi} style={{ padding: '16px 28px', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
              {/* Question */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: ans.isCorrect ? '#D1FAE5' : '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ans.isCorrect
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                    <span style={{ color: '#9CA3AF', marginRight: 6 }}>Câu {ans.qi}.</span>{ans.text}
                  </div>

                  {/* Options (single/multiple) */}
                  {!isShort && ans.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                      {ans.options.map((opt, oi) => {
                        const isCorrectOpt = isMultiple
                          ? (ans.correct as number[]).includes(oi)
                          : ans.correct === oi
                        const isStudentOpt = isMultiple
                          ? (ans.studentAnswer as number[]).includes(oi)
                          : ans.studentAnswer === oi
                        let bg = 'transparent'
                        let color = '#6B7280'
                        let border = '1px solid #F3F4F6'
                        if (isCorrectOpt) { bg = '#D1FAE5'; color = '#16A34A'; border = '1px solid #86EFAC' }
                        if (isStudentOpt && !isCorrectOpt) { bg = '#FEE2E2'; color = '#DC2626'; border = '1px solid #FCA5A5' }
                        return (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 7, background: bg, border }}>
                            <span style={{ width: 18, height: 18, borderRadius: isMultiple ? 4 : '50%', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {(isCorrectOpt || isStudentOpt) && <span style={{ width: 8, height: 8, borderRadius: isMultiple ? 2 : '50%', background: color }} />}
                            </span>
                            <span style={{ fontSize: 12, color, fontWeight: isCorrectOpt || isStudentOpt ? 600 : 400 }}>{opt}</span>
                            {isCorrectOpt && <span style={{ fontSize: 10, color: '#16A34A', marginLeft: 'auto' }}>Đáp án đúng</span>}
                            {isStudentOpt && !isCorrectOpt && <span style={{ fontSize: 10, color: '#DC2626', marginLeft: 'auto' }}>Học sinh chọn</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Short answer */}
                  {isShort && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                      <div style={{ flex: 1, padding: '6px 12px', background: '#D1FAE5', borderRadius: 8, border: '1px solid #86EFAC' }}>
                        <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 600, marginBottom: 2 }}>Đáp án đúng</div>
                        {renderAnswer(ans.correct, '#16A34A')}
                      </div>
                      <div style={{ flex: 1, padding: '6px 12px', background: ans.isCorrect ? '#D1FAE5' : '#FEE2E2', borderRadius: 8, border: `1px solid ${ans.isCorrect ? '#86EFAC' : '#FCA5A5'}` }}>
                        <div style={{ fontSize: 10, color: ans.isCorrect ? '#16A34A' : '#DC2626', fontWeight: 600, marginBottom: 2 }}>Học sinh trả lời</div>
                        {renderAnswer(ans.studentAnswer, ans.isCorrect ? '#16A34A' : '#DC2626')}
                      </div>
                    </div>
                  )}

                  {/* Teacher note */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Ghi chú của giáo viên
                    </div>
                    <textarea
                      value={note}
                      onChange={e => onNoteChange(noteKey, e.target.value)}
                      placeholder="Nhập nhận xét cho câu này..."
                      style={{ width: '100%', minHeight: 52, padding: '7px 10px', borderRadius: 8, border: note ? '1.5px solid #BFDBFE' : '1px solid #E5E7EB', fontSize: 12, color: '#374151', resize: 'vertical', outline: 'none', background: note ? '#EFF6FF' : 'white', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Assignment detail modal ───────────────────────────────────────

function AssignmentDetail({ a, onClose, onSave }: {
  a: Assignment
  onClose: () => void
  onSave: (updated: Assignment) => void
}) {
  const [tab, setTab] = useState<'done' | 'pending'>('done')
  const [editing, setEditing] = useState(false)
  const [dueDate, setDueDate] = useState(a.dueDate)
  const [dueTime, setDueTime] = useState(a.dueTime)
  const [viewingStudent, setViewingStudent] = useState<StudentSubmission | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const done    = a.students.filter(s => s.completedAt)
  const pending = a.students.filter(s => !s.completedAt)
  const pct     = Math.round((done.length / a.students.length) * 100)
  const avgScore = done.length > 0
    ? (done.reduce((s, x) => s + (x.score ?? 0), 0) / done.length).toFixed(1)
    : '—'

  const handleSaveDue = () => { onSave({ ...a, dueDate, dueTime }); setEditing(false) }
  const handleNoteChange = (key: string, val: string) => setNotes(prev => ({ ...prev, [key]: val }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box"
        style={{ width: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ padding: '20px 28px 14px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 17, color: '#111827', margin: '0 0 4px' }}>{a.title}</h2>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                <span className="badge-info" style={{ marginRight: 8 }}>{a.class}</span>
                Tạo ngày {fmtDate(a.createdAt)} · {a.totalQuestions} câu hỏi
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Hạn nộp:</span>
            {editing ? (
              <>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ border: '1.5px solid #2563EB', borderRadius: 6, padding: '3px 8px', fontSize: 12, outline: 'none', color: '#111827' }} />
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                  style={{ border: '1.5px solid #2563EB', borderRadius: 6, padding: '3px 8px', fontSize: 12, outline: 'none', color: '#111827', width: 90 }} />
                <button onClick={handleSaveDue} style={{ padding: '3px 10px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Lưu</button>
                <button onClick={() => { setEditing(false); setDueDate(a.dueDate); setDueTime(a.dueTime) }}
                  style={{ padding: '3px 8px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Hủy</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, fontWeight: 700, color: isPast(dueDate) ? '#EF4444' : '#111827' }}>
                  {fmtDate(dueDate)} lúc {dueTime}{isPast(dueDate) ? ' · Đã hết hạn' : ''}
                </span>
                <button onClick={() => setEditing(true)}
                  style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: '#6B7280' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Tổng HS', value: a.students.length, color: '#374151' },
              { label: 'Đã hoàn thành', value: done.length, color: '#22C55E' },
              { label: 'Chưa làm', value: pending.length, color: '#EF4444' },
              { label: 'Điểm TB', value: avgScore, color: '#2563EB' },
            ].map(s => (
              <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: '#9CA3AF' }}>Tỷ lệ hoàn thành</span>
              <span style={{ color: '#2563EB', fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#2563EB', borderRadius: 99 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        {!viewingStudent && (
          <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', padding: '0 28px', flexShrink: 0 }}>
            {([
              { key: 'done',    label: `Đã hoàn thành (${done.length})` },
              { key: 'pending', label: `Chưa làm (${pending.length})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.key ? '#2563EB' : '#6B7280', borderBottom: `2px solid ${tab === t.key ? '#2563EB' : 'transparent'}`, marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {viewingStudent ? (
            <AnswerViewer
              student={viewingStudent}
              onBack={() => setViewingStudent(null)}
              notes={notes}
              onNoteChange={handleNoteChange}
            />
          ) : tab === 'done' ? (
            done.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 13 }}>Chưa có học sinh nào hoàn thành</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '10px 20px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Học sinh</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Điểm</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Thời gian làm</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hoàn thành lúc</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {[...done].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((s, i) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                      <td style={{ padding: '11px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: scoreColor(s.score ?? 0) }}>{s.score}</span>
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>{s.timeSpent}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>{s.completedAt}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        <button onClick={() => setViewingStudent(s)}
                          style={{ padding: '5px 12px', background: '#EFF6FF', border: 'none', borderRadius: 7, color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Xem bài làm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 13 }}>Tất cả học sinh đã hoàn thành!</div>
            ) : (
              <div>
                {pending.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 28px', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.name.charAt(0)}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#374151' }}>{s.name}</span>
                    <span style={{ fontSize: 12, background: '#FEF2F2', color: '#EF4444', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Chưa làm</span>
                    <button style={{ padding: '5px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Nhắc nhở</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

interface Props {
  onCreateNew: () => void
  highlightClass?: string
}

export default function AssignmentManager({ onCreateNew, highlightClass }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments)
  const [detail, setDetail] = useState<Assignment | null>(() =>
    highlightClass ? seedAssignments.find(a => a.class === highlightClass) ?? null : null
  )
  const [filterClass, setFilterClass] = useState(highlightClass ?? '')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const classes = [...new Set(assignments.map(a => a.class))]

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.class.toLowerCase().includes(search.toLowerCase())
    const matchClass  = !filterClass || a.class === filterClass
    const past        = isPast(a.dueDate)
    const matchStatus = !filterStatus || (filterStatus === 'open' ? !past : past)
    return matchSearch && matchClass && matchStatus
  })

  const saveAssignment = (updated: Assignment) => {
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
    setDetail(updated)
  }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Bài tập đã giao</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>{assignments.length} bài tập · {assignments.filter(a => !isPast(a.dueDate)).length} đang mở</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={onCreateNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Giao bài mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Đang mở', value: assignments.filter(a => !isPast(a.dueDate)).length, color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Đã hết hạn', value: assignments.filter(a => isPast(a.dueDate)).length, color: '#9CA3AF', bg: '#F9FAFB' },
          { label: 'Tổng bài tập', value: assignments.length, color: '#2563EB', bg: '#EFF6FF' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="input-field" placeholder="Tìm bài tập..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input-field" style={{ width: 150 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input-field" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="open">Đang mở</option>
          <option value="closed">Đã hết hạn</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>Không tìm thấy bài tập nào</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const done = a.students.filter(s => s.completedAt).length
            const pct  = Math.round((done / a.students.length) * 100)
            const past = isPast(a.dueDate)
            return (
              <div key={a.id} style={{ padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: past ? '#F9FAFB' : '#EFF6FF', color: past ? '#9CA3AF' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge-info">{a.class}</span>
                    <span>Hạn: {fmtDate(a.dueDate)} · {a.dueTime}</span>
                    <span>· {a.totalQuestions} câu</span>
                  </div>
                </div>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#9CA3AF' }}>{done}/{a.students.length} hoàn thành</span>
                    <span style={{ color: pct === 100 ? '#22C55E' : '#2563EB', fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : '#2563EB', borderRadius: 99 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, background: past ? '#F3F4F6' : '#F0FDF4', color: past ? '#9CA3AF' : '#22C55E' }}>
                  {past ? 'Hết hạn' : 'Đang mở'}
                </span>
                <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }} onClick={() => setDetail(a)}>
                  Xem chi tiết
                </button>
              </div>
            )
          })}
        </div>
      )}

      {detail && (
        <AssignmentDetail a={detail} onClose={() => setDetail(null)} onSave={saveAssignment} />
      )}
    </div>
  )
}
