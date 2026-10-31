import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  seedAssignments, classRosters, isPast, fmtDate, scoreColor, bumpVersion, fetchAssignmentDetail, STATUS_META,
  type Assignment, type StudentSubmission,
} from '@/data/assignments'
import type { AssignmentPrefill } from './CreateAssignmentPage'
import { seedQuestions, type BankQuestion } from '@/data/questionBank'
import { QuestionCard } from '../shared/components/question'

// ── Icons nhỏ ─────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const WarnIcon = ({ color = '#B45309' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
  </svg>
)

// ── Nút ghost nhỏ trong header ────────────────────────────────────

function GhostBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s',
        border: danger ? '1.5px solid #FECACA' : '1.5px solid #E5E7EB',
        background: 'white', color: danger ? '#DC2626' : '#6B7280' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : '#F9FAFB' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
      {children}
    </button>
  )
}

// ── Xem bài làm của học sinh (đáp án + ghi chú GV) ────────────────

function AnswerViewer({ student, onBack, notes, onNoteChange }: {
  student: StudentSubmission
  onBack: () => void
  notes: Record<string, string>
  onNoteChange: (key: string, val: string) => void
}) {
  const correct = student.answers.filter(a => a.isCorrect).length

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid #F3F4F6' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {student.answers.map((ans, i) => {
          const noteKey = `${student.id}-${ans.qi}`
          const note = notes[noteKey] ?? ''
          const isMultiple = ans.type === 'multiple'
          const isShort = ans.type === 'short'

          const renderAnswer = (val: number | number[] | string, color: string) => {
            if (isShort) return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{val as string}</span>
            if (isMultiple) {
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(val as number[]).map(idx => (
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
            <div key={ans.qi} style={{ padding: '16px 24px', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
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

                  {!isShort && ans.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                      {ans.options.map((opt, oi) => {
                        const isCorrectOpt = isMultiple ? (ans.correct as number[]).includes(oi) : ans.correct === oi
                        const isStudentOpt = isMultiple ? (ans.studentAnswer as number[]).includes(oi) : ans.studentAnswer === oi
                        let bg = 'transparent', color = '#6B7280', border = '1px solid #F3F4F6'
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

                  {/* Ghi chú giáo viên */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <PencilIcon /> Ghi chú của giáo viên
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

// ── Hàng thông tin chỉ hiển thị (sửa qua popup chung) ─────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
      <span style={{ width: 130, fontSize: 12, fontWeight: 600, color: '#6B7280', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  )
}

// ── Export điểm ra file Excel (.xls) ──────────────────────────────

function exportScores(a: Assignment) {
  const rows = a.students.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.score ?? '—'}</td>
      <td>${s.timeSpent ?? '—'}</td>
      <td>${s.completedAt ?? 'Chưa làm'}</td>
      <td>${s.completedAt ? 'Đã hoàn thành' : 'Chưa làm'}</td>
    </tr>`).join('')
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>
    <h3>Bảng điểm — ${a.title} (lớp ${a.class})</h3>
    <table border="1">
      <tr style="background:#DBEAFE"><th>STT</th><th>Học sinh</th><th>Điểm</th><th>Thời gian làm</th><th>Hoàn thành lúc</th><th>Trạng thái</th></tr>
      ${rows}
    </table></body></html>`
  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${a.title.replace(/[^\w\s\u00C0-\u024F-]/g, '').trim() || 'bang-diem'}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

// ── Main ──────────────────────────────────────────────────────────

export default function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const idx = seedAssignments.findIndex(x => x.id === Number(id) || String(x.id) === id)
  const [a, setA] = useState<Assignment | null>(() => {
    if (idx >= 0) return seedAssignments[idx]
    // Bài tập mở từ trang chi tiết lớp: id là khóa API — dựng bản xem từ dữ liệu đi kèm + roster lớp
    const f = (state as { fallback?: { title: string; className?: string; due?: string | null; submitted?: number; total?: number } } | null)?.fallback
    if (!f) return null
    const [d, m, y] = (f.due ?? '').split('/')
    const submitted = f.submitted ?? 0
    return {
      id: -1,
      title: f.title,
      class: f.className ?? '',
      status: 'ASSIGNED',
      durationMin: null,
      dueDate: d && m && y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '',
      dueTime: '23:59',
      createdAt: '',
      totalQuestions: 0,
      desc: '',
      questionIds: [],
      students: (classRosters[f.className ?? ''] ?? []).map((s, i) => ({
        id: s.id, name: s.name,
        completedAt: i < submitted ? '2026-10-27 20:00' : null,
        score: i < submitted ? 8 : null,
        timeSpent: i < submitted ? '15 phút' : null,
        answers: [],
      })),
      version: 1, editedAt: null,
    }
  })

  // id không khớp seed → bài từ API (trang lớp): fetch dữ liệu thật; fallback state giữ lại nếu API lỗi
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (idx >= 0 || !id) return
    setLoading(true)
    fetchAssignmentDetail(id)
      .then(res => { if (res) setA(res) })
      .finally(() => setLoading(false))
  }, [id])

  const [editField, setEditField] = useState<string | null>(null)
  const [tmp, setTmp] = useState({ title: '', desc: '', dueDate: '', dueTime: '', durationMin: 0 })
  const [tab, setTab] = useState<'done' | 'pending'>('done')
  const [viewingStudent, setViewingStudent] = useState<StudentSubmission | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const done = useMemo(() => a?.students.filter(s => s.completedAt) ?? [], [a])
  const pending = useMemo(() => a?.students.filter(s => !s.completedAt) ?? [], [a])
  const contentQuestions = useMemo(
    () => a?.questionIds.map(qid => seedQuestions.find(q => q.id === qid)).filter((q): q is BankQuestion => !!q) ?? [],
    [a],
  )

  if (!a && loading) {
    return <div className="page-container" style={{ paddingTop: 40, color: '#6B7280' }}>Đang tải bài tập…</div>
  }

  if (!a) {
    return (
      <div className="page-container" style={{ paddingTop: 72, textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#111827', marginBottom: 8 }}>Không tìm thấy bài tập</h2>
        <button className="btn-primary" onClick={() => navigate('/assignments')}>Về danh sách</button>
      </div>
    )
  }

  const meta = STATUS_META[a.status]
  const past = a.dueDate ? isPast(a.dueDate) : false
  const pct = a.students.length ? Math.round((done.length / a.students.length) * 100) : 0
  const avgScore = done.length ? (done.reduce((s, x) => s + (x.score ?? 0), 0) / done.length).toFixed(1) : '—'
  const isAssigned = a.status === 'ASSIGNED'
  /** Đủ điều kiện giao: có tên, lớp, hạn nộp và ít nhất 1 câu hỏi. */
  const canAssign = Boolean(a.title.trim() && a.class && a.dueDate && a.dueTime && a.totalQuestions > 0)

  /** Lưu thay đổi — bài đã giao sửa thông tin thì tăng version để đánh dấu bản sửa đổi. */
  const save = (patch: Partial<Assignment>) => {
    const bumped: Partial<Assignment> = isAssigned && !('status' in patch) ? bumpVersion(a) : {}
    const next: Assignment = { ...a, ...patch, ...bumped }
    if (idx >= 0) seedAssignments[idx] = next
    setA(next)
  }

  const startEdit = (field: string) => {
    setTmp({ title: a.title, desc: a.desc, dueDate: a.dueDate, dueTime: a.dueTime, durationMin: a.durationMin ?? 0 })
    setEditField(field)
  }

  /** Popup sửa thông tin: 1 form chung cho Mô tả / Hạn nộp / Thời gian làm. */
  const [infoOpen, setInfoOpen] = useState(false)
  const openInfo = () => {
    setTmp({ title: a.title, desc: a.desc, dueDate: a.dueDate, dueTime: a.dueTime, durationMin: a.durationMin ?? 0 })
    setInfoOpen(true)
  }
  const saveInfo = () => {
    save({ desc: tmp.desc, dueDate: tmp.dueDate, dueTime: tmp.dueTime, durationMin: tmp.durationMin > 0 ? tmp.durationMin : null })
    setInfoOpen(false)
  }

  const assignNow = () => {
    if (!canAssign) return
    const roster = classRosters[a.class] ?? []
    save({
      status: 'ASSIGNED',
      students: roster.map(s => ({ id: s.id, name: s.name, completedAt: null, score: null, timeSpent: null, answers: [] })),
    })
  }

  const removeAssignment = () => {
    if (!window.confirm(`Xóa bài tập "${a.title}"? ${isAssigned ? 'Dữ liệu bài làm học sinh cũng mất.' : ''}`)) return
    if (idx >= 0) seedAssignments.splice(idx, 1)
    navigate('/assignments')
  }

  /** Nhân bản: mở trang soạn đề với toàn bộ nội dung bản gốc — sửa lớp/HS/câu hỏi rồi giao cho đối tượng khác. */
  const createCopy = () => {
    const prefill: AssignmentPrefill = {
      sourceTitle: a.title,
      title: `${a.title} - Bản sao`,
      desc: a.desc,
      class: a.class,
      dueDate: a.dueDate,
      dueTime: a.dueTime,
      durationMin: a.durationMin,
      questionIds: [...a.questionIds],
    }
    navigate('/assignments/new', { state: { prefill } })
  }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 56, maxWidth: 1180 }}>

      {/* ── Header: tên + trạng thái + hành động theo trạng thái ── */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 20, background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />{meta.label}
            </span>
            {isAssigned && a.dueDate && (
              <span style={{ fontSize: 11, fontWeight: 600, color: past ? '#EF4444' : '#22C55E' }}>{past ? '· Đã hết hạn' : '· Còn hạn'}</span>
            )}
          </div>
          {editField === 'title' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input autoFocus value={tmp.title} onChange={e => setTmp(t => ({ ...t, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { save({ title: tmp.title.trim() || a.title }); setEditField(null) } if (e.key === 'Escape') setEditField(null) }}
                style={{ flex: 1, border: '1.5px solid #2563EB', borderRadius: 8, outline: 'none', fontSize: 19, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111827', padding: '3px 10px' }} />
              <button onClick={() => { save({ title: tmp.title.trim() || a.title }); setEditField(null) }} style={{ padding: '6px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Lưu</button>
              <button onClick={() => setEditField(null)} style={{ padding: '6px 10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12.5, color: '#6B7280', cursor: 'pointer' }}>Hủy</button>
            </div>
          ) : (
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 21, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              {a.title}
              <button onClick={() => startEdit('title')} title="Đổi tên" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'inline-flex' }}><PencilIcon /></button>
            </h1>
          )}
          <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 6 }}>
            {a.class && <span className="badge-info" style={{ marginRight: 8 }}>{a.class}</span>}
            Tạo ngày {fmtDate(a.createdAt)} · {a.totalQuestions} câu hỏi · {a.durationMin ? `${a.durationMin} phút` : 'không giới hạn thời gian'}
            {a.version > 1 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 12, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                title={a.editedAt ? `Sửa lần cuối: ${a.editedAt}` : 'Bài tập đã được chỉnh sửa'}>
                v{a.version} · đã chỉnh sửa
              </span>
            )}
          </div>
        </div>

        {/* Hành động theo trạng thái */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {isAssigned && (
            <GhostBtn danger onClick={removeAssignment}><TrashIcon /> Xóa</GhostBtn>
          )}
          {a.status === 'SAVED' && (
            <>
              <button className="btn-primary" onClick={assignNow} disabled={!canAssign}
                style={{ fontSize: 13, fontWeight: 700, opacity: canAssign ? 1 : 0.45, padding: '8px 18px' }}>
                Giao bài
              </button>
              <GhostBtn danger onClick={removeAssignment}><TrashIcon /> Xóa</GhostBtn>
            </>
          )}
          {a.status === 'DRAFT' && (
            <>
              <button className="btn-primary" onClick={assignNow} disabled={!canAssign}
                style={{ fontSize: 13, fontWeight: 700, opacity: canAssign ? 1 : 0.45, padding: '8px 18px' }}>
                Giao bài
              </button>
              <GhostBtn onClick={() => save({ status: 'SAVED' })}>Lưu</GhostBtn>
              <GhostBtn danger onClick={removeAssignment}><TrashIcon /> Xóa</GhostBtn>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16, alignItems: 'start' }}>
        {/* ── Cột trái: thống kê + học sinh hoặc viewer ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {isAssigned ? (
                <>
                  {/* Thống kê */}
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                      {[
                        { label: 'Tổng HS được giao', value: a.students.length, color: '#374151' },
                        { label: 'Đã hoàn thành', value: done.length, color: '#22C55E' },
                        { label: 'Chưa làm', value: pending.length, color: '#EF4444' },
                        { label: 'Điểm TB', value: avgScore, color: '#2563EB' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 14px' }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                        <span style={{ color: '#9CA3AF' }}>Tỷ lệ hoàn thành</span>
                        <span style={{ color: '#2563EB', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 7, background: '#F3F4F6', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#2563EB', borderRadius: 99, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>

                  {/* Danh sách học sinh */}
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingRight: 14 }}>
                      <div style={{ display: 'flex', flex: 1 }}>
                        {([
                          { key: 'done',    label: `Đã hoàn thành (${done.length})` },
                          { key: 'pending', label: `Chưa làm (${pending.length})` },
                        ] as const).map(t => (
                          <button key={t.key} onClick={() => setTab(t.key)}
                            style={{ padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.key ? '#2563EB' : '#6B7280', borderBottom: `2px solid ${tab === t.key ? '#2563EB' : 'transparent'}`, marginBottom: -1 }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => exportScores(a)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                        <DownloadIcon /> Xuất Excel
                      </button>
                    </div>

                    {tab === 'done' ? (
                      done.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 13 }}>Chưa có học sinh nào hoàn thành</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                              <th style={{ padding: '9px 20px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left' }}>Học sinh</th>
                              <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>Điểm</th>
                              <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>Thời gian làm</th>
                              <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'right' }}>Hoàn thành lúc</th>
                              <th style={{ padding: '9px 16px' }} />
                            </tr>
                          </thead>
                          <tbody>
                            {[...done].sort((x, y) => (y.score ?? 0) - (x.score ?? 0)).map((s, i) => (
                              <tr key={s.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                <td style={{ padding: '10px 20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {s.name.charAt(0)}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{s.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: scoreColor(s.score ?? 0) }}>{s.score}</span>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, color: '#6B7280' }}>{s.timeSpent}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>{s.completedAt}</td>
                                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
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
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {s.name.charAt(0)}
                              </div>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#374151' }}>{s.name}</span>
                              <span style={{ fontSize: 11.5, background: '#FEF2F2', color: '#EF4444', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Chưa làm</span>
                              <button style={{ padding: '5px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Nhắc nhở</button>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                /* Bài chưa giao: empty state */
                <div className="card" style={{ padding: '44px 24px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 5 }}>Chưa có dữ liệu học sinh</div>
                  <div style={{ fontSize: 12.5, color: '#9CA3AF', maxWidth: 380, margin: '0 auto' }}>
                    Bài tập đang ở trạng thái "{meta.label}". Bấm <strong>Giao bài</strong> để giao cho học sinh và bắt đầu thu thập bài làm, điểm số.
                  </div>
                </div>
              )}

          {/* Nội dung bài tập: danh sách câu hỏi (bấm để xem đáp án) */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              Nội dung bài tập
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 9px', borderRadius: 12 }}>{a.questionIds.length} câu</span>
            </div>
            {contentQuestions.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contentQuestions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>Chưa có nội dung câu hỏi — bài tập từ hệ thống chỉ hiện số lượng câu.</div>
            )}
          </div>
        </div>

        {/* ── Cột phải: thông tin (sửa an toàn) + nội dung/đối tượng (nhạy cảm) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>

          {/* Thông tin — 1 nút sửa mở popup chỉnh tất cả trường */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
              Thông tin
              <button onClick={openInfo} title="Chỉnh sửa thông tin" aria-label="Chỉnh sửa thông tin"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 4, border: 'none', borderRadius: 6, background: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <PencilIcon />
              </button>
            </div>

            <InfoRow label="Mô tả">
              <span style={{ fontSize: 12.5, color: a.desc ? '#111827' : '#D1D5DB' }}>{a.desc || 'Chưa có mô tả'}</span>
            </InfoRow>

            <InfoRow label="Hạn nộp">
              <span style={{ fontSize: 12.5, fontWeight: 600, color: past && isAssigned ? '#EF4444' : '#111827' }}>
                {a.dueDate ? `${fmtDate(a.dueDate)} lúc ${a.dueTime}` : 'Chưa đặt'}
                {past && isAssigned ? ' · Đã hết hạn' : ''}
              </span>
            </InfoRow>

            <InfoRow label="Thời gian làm">
              <span style={{ fontSize: 12.5, color: '#111827' }}>{a.durationMin ? `${a.durationMin} phút` : 'Không giới hạn'}</span>
            </InfoRow>
          </div>

          {/* Nội dung & đối tượng — nhạy cảm, cần cân nhắc */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>Nội dung & đối tượng</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Lớp học</span>
                <strong>{a.class || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Đối tượng được giao</span>
                <strong>{isAssigned ? `${a.students.length} học sinh` : 'Chưa giao'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Số câu hỏi</span>
                <strong>{a.totalQuestions} câu</strong>
              </div>
            </div>

            {isAssigned ? (
              /* Đã giao: cảnh báo + đề xuất nhân bản thay vì sửa trực tiếp */
              <div style={{ padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 7, fontSize: 11.5, color: '#B45309', lineHeight: 1.5 }}>
                  <WarnIcon />
                  <span>
                    <strong>Sửa câu hỏi / lớp / đối tượng sau khi đã giao</strong> sẽ làm sai lệch bài làm học sinh đang làm.
                    Tạo bản sao để chỉnh câu hỏi, đổi lớp hoặc chọn học sinh khác rồi giao lại.
                  </span>
                </div>
                <button onClick={createCopy}
                  style={{ marginTop: 9, width: '100%', padding: '7px 0', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'white', fontSize: 12, fontWeight: 700, color: '#B45309', cursor: 'pointer' }}>
                  Tạo bản sao chỉnh sửa được
                </button>
              </div>
            ) : (
              /* Chưa giao: cho phép chỉnh nội dung ở trang soạn */
              <>
                <div style={{ padding: '9px 12px', background: '#EFF6FF', borderRadius: 9, fontSize: 11.5, color: '#1D4ED8', marginBottom: 10 }}>
                  Bài chưa giao — có thể chỉnh nội dung, câu hỏi, lớp và đối tượng tự do.
                </div>
                <button onClick={createCopy}
                  style={{ width: '100%', padding: '7px 0', marginBottom: 10, borderRadius: 8, border: '1.5px solid #BFDBFE', background: 'white', fontSize: 12, fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>
                  Tạo bản sao chỉnh sửa được
                </button>
              </>
            )}

            <button onClick={() => navigate('/assignments/new')}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              Giao bài mới
            </button>
          </div>
        </div>
      </div>

      {/* ── Popup xem bài làm của học sinh ── */}
      {viewingStudent && (
        <div className="modal-overlay" onClick={() => setViewingStudent(null)}>
          <div className="modal-box" style={{ width: 680, maxWidth: '95vw', padding: 0 }} onClick={e => e.stopPropagation()}>
            <AnswerViewer
              student={viewingStudent}
              onBack={() => setViewingStudent(null)}
              notes={notes}
              onNoteChange={(k, v) => setNotes(prev => ({ ...prev, [k]: v }))}
            />
          </div>
        </div>
      )}

      {/* ── Popup sửa thông tin: Mô tả / Hạn nộp / Thời gian làm ── */}
      {infoOpen && (
        <div className="modal-overlay" onClick={() => setInfoOpen(false)}>
          <div className="modal-box" style={{ width: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 18 }}>
              Chỉnh sửa thông tin
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Mô tả</label>
                <textarea rows={3} value={tmp.desc} onChange={e => setTmp(t => ({ ...t, desc: e.target.value }))}
                  placeholder="Mô tả cho học sinh..."
                  style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 11px', fontSize: 12.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Hạn nộp</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={tmp.dueDate} onChange={e => setTmp(t => ({ ...t, dueDate: e.target.value }))}
                    style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' }} />
                  <input type="time" value={tmp.dueTime} onChange={e => setTmp(t => ({ ...t, dueTime: e.target.value }))}
                    style={{ width: 100, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Thời gian làm</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={0} max={600} value={tmp.durationMin}
                    onChange={e => setTmp(t => ({ ...t, durationMin: Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={{ width: 90, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>phút · 0 = không giới hạn</span>
                </div>
              </div>

              {isAssigned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 11px' }}>
                  <WarnIcon /> Thay đổi áp dụng cho học sinh chưa nộp bài
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setInfoOpen(false)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={saveInfo}
                style={{ padding: '8px 20px', background: '#2563EB', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
