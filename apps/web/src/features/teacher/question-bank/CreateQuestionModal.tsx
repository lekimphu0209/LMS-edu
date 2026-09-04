import { useState } from 'react'
import {
  BankQuestion, QType, Difficulty, HIERARCHY, genId,
} from '@/data/questionBank'

function today() { return new Date().toISOString().slice(0, 10) }

interface FormState {
  type: QType
  difficulty: Difficulty
  class: string
  area: string
  topic: string
  text: string
  imageUrl: string
  answers: string[]
  correct: number | number[]
  shortAnswerText: string
  caseInsensitive: boolean
}

const emptyForm = (): FormState => ({
  type: 'single', difficulty: 'easy', class: 'Lớp 10', area: 'Đại số', topic: '',
  text: '', imageUrl: '', answers: ['', ''], correct: 0,
  shortAnswerText: '', caseInsensitive: false,
})

function hasAnswerData(form: FormState) {
  if (form.type === 'short') {
    return form.shortAnswerText.trim().length > 0 || form.caseInsensitive
  }
  if (Array.isArray(form.correct) ? form.correct.length > 0 : form.correct !== 0) return true
  return form.answers.some(a => a.trim())
}

function typeDefaults(type: QType): Partial<FormState> {
  if (type === 'short') {
    return { answers: [], correct: 0, shortAnswerText: '', caseInsensitive: false }
  }
  if (type === 'multiple') {
    return { answers: ['', ''], correct: [], shortAnswerText: '', caseInsensitive: false }
  }
  return { answers: ['', ''], correct: 0, shortAnswerText: '', caseInsensitive: false }
}

export function CreateQuestionModal({ onSave, onClose, initial }: {
  onSave: (q: BankQuestion) => void
  onClose: () => void
  initial?: BankQuestion
}) {
  const [form, setForm] = useState<FormState>(initial ? {
    type: initial.type,
    difficulty: initial.difficulty,
    class: initial.class,
    area: initial.area,
    topic: initial.topic,
    text: initial.text,
    imageUrl: initial.imageUrl || '',
    answers: initial.type === 'short'
      ? []
      : [...initial.answers, ...Array(Math.max(0, 2 - initial.answers.length)).fill('')],
    correct: initial.type === 'short'
      ? 0
      : initial.type === 'multiple'
        ? (Array.isArray(initial.correct) ? initial.correct : [])
        : (typeof initial.correct === 'number' ? initial.correct : 0),
    shortAnswerText: initial.type === 'short'
      ? (initial.shortAnswers ? initial.shortAnswers.join(', ') : (typeof initial.correct === 'string' ? initial.correct : ''))
      : '',
    caseInsensitive: initial.caseInsensitive ?? false,
  } : emptyForm())

  const [dragOver, setDragOver] = useState(false)
  const areas = Object.keys(HIERARCHY[form.class] || {})
  const topics = HIERARCHY[form.class]?.[form.area] || []

  const setClass = (c: string) => {
    const fa = Object.keys(HIERARCHY[c] || {})[0] || ''
    const ft = (HIERARCHY[c]?.[fa] || [])[0] || ''
    setForm(f => ({ ...f, class: c, area: fa, topic: ft }))
  }

  const setArea = (a: string) => {
    const ft = (HIERARCHY[form.class]?.[a] || [])[0] || ''
    setForm(f => ({ ...f, area: a, topic: ft }))
  }

  const handleTypeChange = (newType: QType) => {
    if (form.type === newType) return
    if (hasAnswerData(form)) {
      if (!window.confirm('Đổi loại câu hỏi sẽ xóa dữ liệu đáp án đã nhập. Tiếp tục?')) return
    }
    setForm(f => ({ ...f, type: newType, ...typeDefaults(newType) }))
  }

  const toggleMulti = (i: number) => {
    const arr = Array.isArray(form.correct) ? (form.correct as number[]) : []
    setForm(f => ({ ...f, correct: arr.includes(i) ? arr.filter(x => x !== i) : [...arr, i].sort((a, b) => a - b) }))
  }

  const addAnswer = () => setForm(f => ({ ...f, answers: [...f.answers, ''] }))

  const removeAnswer = (i: number) => {
    setForm(f => {
      const next = f.answers.filter((_, idx) => idx !== i)
      const correct = Array.isArray(f.correct)
        ? (f.correct as number[]).filter(c => c !== i).map(c => c > i ? c - 1 : c)
        : (f.correct as number) === i ? 0 : (f.correct as number) > i ? (f.correct as number) - 1 : (f.correct as number)
      return { ...f, answers: next, correct }
    })
  }

  const canSave = (() => {
    if (!form.text.trim() && !form.imageUrl) return false
    if (!form.topic) return false
    if (form.type === 'short') {
      return form.shortAnswerText.split(',').some(s => s.trim())
    }
    if (form.type === 'single') {
      if (form.answers.length < 2) return false
      if (!form.answers.every(a => a.trim())) return false
      if (typeof form.correct !== 'number') return false
      return form.correct >= 0 && form.correct < form.answers.length
    }
    // multiple
    if (!form.answers.every(a => a.trim())) return false
    return Array.isArray(form.correct) && form.correct.length >= 1
  })()

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setForm(f => ({ ...f, imageUrl: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const shortAnswers = form.shortAnswerText.split(',').map(s => s.trim()).filter(Boolean)
    onSave({
      id: initial?.id || genId(),
      text: form.text.trim(),
      imageUrl: form.imageUrl || undefined,
      type: form.type,
      difficulty: form.difficulty,
      class: form.class,
      area: form.area,
      topic: form.topic,
      answers: form.type === 'short' ? [] : form.answers.filter(a => a.trim()),
      correct: form.type === 'short'
        ? (shortAnswers[0] || '')
        : form.type === 'single'
          ? form.correct as number
          : (form.correct as number[]).sort((a, b) => a - b),
      shortAnswers: form.type === 'short' ? shortAnswers : undefined,
      caseInsensitive: form.type === 'short' ? form.caseInsensitive : undefined,
      createdAt: initial?.createdAt || today(),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 680, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 26px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#111827' }}>{initial ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9CA3AF' }}>Chọn phân loại rồi nhập nội dung</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '18px 26px', maxHeight: '68vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại câu hỏi *</label>
              <select className="input-field" value={form.type}
                onChange={e => handleTypeChange(e.target.value as QType)}>
                <option value="single">1 đáp án</option>
                <option value="multiple">Nhiều đáp án</option>
                <option value="short">Điền đáp án</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Độ khó *</label>
              <select className="input-field" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>

          <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Phân loại học phần</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Lớp học</label>
                <select className="input-field" style={{ fontSize: 13 }} value={form.class} onChange={e => setClass(e.target.value)}>
                  {Object.keys(HIERARCHY).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phân môn</label>
                <select className="input-field" style={{ fontSize: 13 }} value={form.area} onChange={e => setArea(e.target.value)}>
                  {areas.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Chủ đề *</label>
                <select className="input-field" style={{ fontSize: 13 }} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}>
                  <option value="">-- Chọn chủ đề --</option>
                  {topics.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Nội dung câu hỏi <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(bắt buộc có TEXT hoặc ẢNH)</span>
            </label>
            {form.imageUrl ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                <img src={form.imageUrl} alt="preview"
                  style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, border: '1px solid #E5E7EB', display: 'block' }} />
                <button
                  onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                    width: 26, height: 26, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '24px 16px', marginBottom: 12,
                  border: '2px dashed ' + (dragOver ? '#2563EB' : '#D1D5DB'),
                  borderRadius: 10, cursor: 'pointer',
                  background: dragOver ? '#EFF6FF' : '#FAFAFA',
                  transition: 'all 0.15s',
                }}>
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#2563EB' : '#D1D5DB'} strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize: 13, color: dragOver ? '#2563EB' : '#6B7280', fontWeight: 500 }}>
                  Kéo thả ảnh vào đây hoặc <span style={{ color: '#2563EB', textDecoration: 'underline' }}>chọn từ máy tính</span>
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, GIF tối đa 5MB</span>
              </label>
            )}
            <textarea className="input-field" rows={3} placeholder="Nhập nội dung câu hỏi..."
              value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>

          {form.type !== 'short' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  Các đáp án <span style={{ color: '#9CA3AF', fontWeight: 400 }}>— click để chọn đáp án đúng</span>
                </label>
                <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 12 }} onClick={addAnswer}>+ Thêm lựa chọn</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {form.answers.map((ans, i) => {
                  const isCorrect = form.type === 'single' ? form.correct === i : (form.correct as number[]).includes(i)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type={form.type === 'single' ? 'radio' : 'checkbox'} checked={isCorrect}
                        onChange={() => form.type === 'single' ? setForm(f => ({ ...f, correct: i })) : toggleMulti(i)}
                        style={{ accentColor: '#2563EB', width: 16, height: 16, flexShrink: 0 }} />
                      <input className="input-field" placeholder={'Đáp án ' + String.fromCharCode(65 + i)} value={ans}
                        onChange={e => { const a = [...form.answers]; a[i] = e.target.value; setForm(f => ({ ...f, answers: a })) }}
                        style={{ flex: 1, background: isCorrect ? '#F0FDF4' : 'white', borderColor: isCorrect ? '#BBF7D0' : '#E5E7EB' }} />
                      {form.answers.length > (form.type === 'single' ? 2 : 1) && (
                        <button onClick={() => removeAnswer(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {form.type === 'single' && (
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>Chọn đúng 1 đáp án</p>
              )}
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Đáp án chấp nhận <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(phân cách bằng dấu phẩy nếu có nhiều đáp án)</span>
              </label>
              <input className="input-field" placeholder="VD: Hà Nội, ha noi"
                value={form.shortAnswerText} onChange={e => setForm(f => ({ ...f, shortAnswerText: e.target.value }))}
                style={{ marginBottom: 10 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.caseInsensitive}
                  onChange={e => setForm(f => ({ ...f, caseInsensitive: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#2563EB' }} />
                Không phân biệt hoa/thường khi chấm
              </label>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 26px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.5 }}>{initial ? 'Cập nhật' : 'Lưu câu hỏi'}</button>
        </div>
      </div>
    </div>
  )
}
