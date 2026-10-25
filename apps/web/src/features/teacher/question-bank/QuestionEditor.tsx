import { useState, useRef } from 'react'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type QType = 'single' | 'multiple' | 'fill'
type Difficulty = 'easy' | 'medium' | 'hard'

interface AnswerOption {
  id: string
  text: string
  image: string | null
  correct: boolean
}

const uid = () => Math.random().toString(36).slice(2, 8)

const defaultOptions = (): AnswerOption[] => [
  { id: uid(), text: '', image: null, correct: true },
  { id: uid(), text: '', image: null, correct: false },
  { id: uid(), text: '', image: null, correct: false },
  { id: uid(), text: '', image: null, correct: false },
]

// ──────────────────────────────────────────────────────────────
// ImageUploadZone
// ──────────────────────────────────────────────────────────────

function ImageUploadZone({
  image, onChange, size = 'full',
}: {
  image: string | null
  onChange: (url: string | null) => void
  size?: 'full' | 'mini'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    onChange(url)
  }

  if (image) {
    return size === 'mini' ? (
      <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
        <img src={image} alt="option" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button
          onClick={() => onChange(null)}
          style={{ position: 'absolute', top: 1, right: 1, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
        >✕</button>
      </div>
    ) : (
      <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#F3F4F6' }}>
        <img src={image} alt="question" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 6, padding: '5px 10px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >Thay thế</button>
          <button
            onClick={() => onChange(null)}
            style={{ background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 6, padding: '5px 10px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >Xóa</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    )
  }

  if (size === 'mini') {
    return (
      <button
        title="Thêm ảnh cho đáp án"
        onClick={() => inputRef.current?.click()}
        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', flexShrink: 0 }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.color = '#2563EB' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </button>
    )
  }

  return (
    <div
      style={{
        border: `2px dashed ${dragging ? '#2563EB' : '#D1D5DB'}`,
        borderRadius: 12, padding: '36px 24px', textAlign: 'center',
        background: dragging ? '#EFF6FF' : '#FAFAFA',
        cursor: 'pointer', transition: 'all 0.18s',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: dragging ? '#DBEAFE' : '#F3F4F6', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#2563EB' : '#9CA3AF'} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: dragging ? '#2563EB' : '#374151', margin: '0 0 4px' }}>
        {dragging ? 'Thả ảnh vào đây' : 'Kéo & thả ảnh, hoặc click để chọn'}
      </p>
      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>PNG, JPG, GIF · Tối đa 5MB</p>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────

export default function QuestionEditor({ initialQuestion, onBack }: {
  initialQuestion?: { text?: string; type?: QType }
  onBack?: () => void
}) {
  const [qType, setQType] = useState<QType>(initialQuestion?.type ?? 'single')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [score, setScore] = useState('1')
  const [subject, setSubject] = useState('Toán học')

  const [stemText, setStemText] = useState(initialQuestion?.text ?? '')
  const [stemImage, setStemImage] = useState<string | null>(null)

  const [options, setOptions] = useState<AnswerOption[]>(defaultOptions)
  const [acceptedAnswers, setAcceptedAnswers] = useState('')
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 2200)
  }

  // Option helpers
  const updateOption = (id: string, patch: Partial<AnswerOption>) =>
    setOptions(opts => opts.map(o => o.id === id ? { ...o, ...patch } : o))

  const setCorrect = (id: string) => {
    if (qType === 'single') {
      setOptions(opts => opts.map(o => ({ ...o, correct: o.id === id })))
    } else {
      updateOption(id, { correct: !options.find(o => o.id === id)?.correct })
    }
  }

  const addOption = () => setOptions(opts => [...opts, { id: uid(), text: '', image: null, correct: false }])
  const removeOption = (id: string) => setOptions(opts => opts.filter(o => o.id !== id))

  const isValid = (stemText.trim() || stemImage) && (qType === 'fill' ? acceptedAnswers.trim() : options.some(o => o.correct && o.text.trim()))

  const handleSave = (andNext = false) => {
    if (!isValid) return
    showToast(andNext ? 'Đã lưu! Sẵn sàng câu hỏi mới.' : 'Đã lưu câu hỏi thành công.')
    if (andNext) {
      setStemText(''); setStemImage(null)
      setOptions(defaultOptions()); setAcceptedAnswers('')
    }
  }

  const difficultyOpts: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Dễ', color: '#22C55E' },
    { value: 'medium', label: 'Trung bình', color: '#F59E0B' },
    { value: 'hard', label: 'Khó', color: '#EF4444' },
  ]

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        {onBack && (
          <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={onBack}>
            ← Quay lại
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{initialQuestion ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</h1>
        </div>

        {/* Type selector — prominent, top of page */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { value: 'single' as QType, label: 'Một đáp án' },
            { value: 'multiple' as QType, label: 'Nhiều đáp án' },
            { value: 'fill' as QType, label: 'Điền từ' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setQType(opt.value)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: qType === opt.value ? 700 : 500,
                background: qType === opt.value ? 'white' : 'transparent',
                color: qType === opt.value ? '#111827' : '#6B7280',
                boxShadow: qType === opt.value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── LEFT: Question stem ── */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
              Nội dung câu hỏi
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="input-field"
                style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                <option>Toán học</option>
                <option>Vật lý</option>
                <option>Hóa học</option>
                <option>Ngữ văn</option>
                <option>Tiếng Anh</option>
              </select>
            </div>
          </div>

          {/* Image zone */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hình ảnh minh họa (tùy chọn)
            </label>
            <ImageUploadZone image={stemImage} onChange={setStemImage} />
          </div>

          {/* Text */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nội dung câu hỏi {stemImage ? '(tùy chọn)' : '*'}
            </label>
            <textarea
              className="input-field"
              rows={5}
              placeholder={
                qType === 'fill'
                  ? 'VD: Công thức tính diện tích hình tròn là S = ___ '
                  : 'Nhập nội dung câu hỏi ở đây...'
              }
              value={stemText}
              onChange={e => setStemText(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
            {qType === 'fill' && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                Dùng <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>___</code> để đánh dấu chỗ trống trong câu.
              </p>
            )}
          </div>

          {/* Preview hint */}
          {stemImage && stemText && (
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, border: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xem trước</div>
              <img src={stemImage} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 6, marginBottom: 8, background: '#F3F4F6' }} />
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{stemText}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Answer options ── */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
              {qType === 'fill' ? 'Đáp án chấp nhận' : 'Các đáp án'}
            </h3>
            {qType !== 'fill' && (
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                {qType === 'single' ? 'Chọn 1 đáp án đúng' : 'Chọn tất cả đáp án đúng'}
              </span>
            )}
          </div>

          {/* Fill-in-blank answer */}
          {qType === 'fill' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Đáp án đúng *
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder={'Nhập các đáp án được chấp nhận, mỗi đáp án một dòng.\nVD:\nH₂O\nh2o\nnước'}
                value={acceptedAnswers}
                onChange={e => setAcceptedAnswers(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }}
              />
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                Mỗi dòng là một biến thể đáp án chấp nhận (không phân biệt hoa thường).
              </p>
            </div>
          )}

          {/* Option list */}
          {qType !== 'fill' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, i) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    index={i}
                    qType={qType}
                    onToggleCorrect={() => setCorrect(opt.id)}
                    onTextChange={text => updateOption(opt.id, { text })}
                    onImageChange={image => updateOption(opt.id, { image })}
                    onRemove={options.length > 2 ? () => removeOption(opt.id) : undefined}
                  />
                ))}
              </div>

              {options.length < 6 && (
                <button
                  onClick={addOption}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2563EB', fontSize: 13, fontWeight: 600, padding: '4px 0',
                    alignSelf: 'flex-start',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Thêm đáp án
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #F3F4F6',
        padding: '14px 0', marginTop: 8,
        zIndex: 30,
      }}>
        <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Difficulty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Độ khó:</span>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
                {difficultyOpts.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: difficulty === d.value ? 700 : 400,
                      background: difficulty === d.value ? 'white' : 'transparent',
                      color: difficulty === d.value ? d.color : '#9CA3AF',
                      boxShadow: difficulty === d.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Điểm:</span>
              <input
                type="number"
                min={0.25}
                max={10}
                step={0.25}
                value={score}
                onChange={e => setScore(e.target.value)}
                className="input-field"
                style={{ width: 72, padding: '6px 10px', fontSize: 13 }}
              />
            </div>

            <div style={{ flex: 1 }} />

            {/* Validation hint */}
            {!isValid && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                {qType === 'fill' ? 'Nhập nội dung câu hỏi và đáp án để lưu.' : 'Cần nội dung câu hỏi và ít nhất 1 đáp án đúng.'}
              </span>
            )}

            <button
              className="btn-secondary"
              onClick={() => handleSave(false)}
              disabled={!isValid}
              style={{ opacity: isValid ? 1 : 0.45 }}
            >
              Lưu câu hỏi
            </button>
            <button
              className="btn-primary"
              onClick={() => handleSave(true)}
              disabled={!isValid}
              style={{ opacity: isValid ? 1 : 0.45, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Lưu & Thêm câu tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 88, right: 32, zIndex: 60,
          background: '#111827', color: 'white', borderRadius: 10, padding: '12px 20px',
          fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {savedToast}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Option row
// ──────────────────────────────────────────────────────────────

function OptionRow({ option, index, qType, onToggleCorrect, onTextChange, onImageChange, onRemove }: {
  option: AnswerOption
  index: number
  qType: QType
  onToggleCorrect: () => void
  onTextChange: (t: string) => void
  onImageChange: (u: string | null) => void
  onRemove?: () => void
}) {
  const letter = String.fromCharCode(65 + index) // A, B, C…
  const isCorrect = option.correct

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      border: `2px solid ${isCorrect ? '#22C55E' : '#F3F4F6'}`,
      background: isCorrect ? '#F0FDF4' : 'white',
      transition: 'all 0.15s',
    }}>
      {/* Correct toggle */}
      <button
        onClick={onToggleCorrect}
        title={isCorrect ? 'Đáp án đúng' : 'Đánh dấu đúng'}
        style={{
          width: 24, height: 24, borderRadius: qType === 'single' ? '50%' : 6,
          border: `2px solid ${isCorrect ? '#22C55E' : '#D1D5DB'}`,
          background: isCorrect ? '#22C55E' : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', marginTop: 6,
        }}
      >
        {isCorrect && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
      </button>

      {/* Letter badge */}
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: isCorrect ? '#DCFCE7' : '#F3F4F6',
        color: isCorrect ? '#16a34a' : '#6B7280',
        fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 7,
      }}>
        {letter}
      </span>

      {/* Text input */}
      <div style={{ flex: 1 }}>
        <input
          className="input-field"
          placeholder={`Đáp án ${letter}`}
          value={option.text}
          onChange={e => onTextChange(e.target.value)}
          style={{
            border: 'none', background: 'transparent', padding: '6px 0',
            fontSize: 14, outline: 'none', width: '100%', color: isCorrect ? '#166534' : '#374151',
          }}
        />
        {option.image && (
          <img src={option.image} alt={`option ${letter}`} style={{ marginTop: 6, width: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 6, background: '#F3F4F6' }} />
        )}
      </div>

      {/* Image mini button */}
      <div style={{ marginTop: 6 }}>
        <ImageUploadZone image={option.image} onChange={onImageChange} size="mini" />
      </div>

      {/* Remove */}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '6px 2px', flexShrink: 0, transition: 'color 0.12s', marginTop: 3 }}
          title="Xóa đáp án"
          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
