import { useState, useMemo } from 'react'
import {
  BankQuestion, QType, Difficulty, TYPE_LABELS, DIFF_LABELS, DIFF_COLORS,
  HIERARCHY,
} from '@/data/questionBank'

export function DiffBadge({ d }: { d: Difficulty }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: d === 'easy' ? '#F0FDF4' : d === 'medium' ? '#FFFBEB' : '#FEF2F2',
      color: DIFF_COLORS[d],
      border: '1px solid ' + (d === 'easy' ? '#BBF7D0' : d === 'medium' ? '#FDE68A' : '#FECACA'),
    }}>{DIFF_LABELS[d]}</span>
  )
}

export function TypeBadge({ t }: { t: QType }) {
  const colors: Record<QType, [string, string]> = {
    single: ['#EFF6FF', '#2563EB'], multiple: ['#F5F3FF', '#7C3AED'], short: ['#F0FDF4', '#16A34A'],
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: colors[t][0], color: colors[t][1] }}>
      {TYPE_LABELS[t]}
    </span>
  )
}

export function QuestionCard({ q, index, onDelete, onEdit, selectable, selected, onSelect }: {
  q: BankQuestion; index: number
  onDelete?: () => void
  onEdit?: () => void
  selectable?: boolean; selected?: boolean; onSelect?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: selected ? '2px solid #2563EB' : '1px solid #F3F4F6', background: selected ? '#F0F5FF' : 'white' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
        onClick={() => selectable ? onSelect?.() : setExpanded(e => !e)}>
        {selectable ? (
          <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid ' + (selected ? '#2563EB' : '#D1D5DB'), background: selected ? '#2563EB' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {q.imageUrl ? (
              <img src={q.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <TypeBadge t={q.type} />
            <DiffBadge d={q.difficulty} />
            <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 6px', borderRadius: 20 }}>{q.class}</span>
            <span style={{ fontSize: 10, color: '#6B7280', background: '#F9FAFB', padding: '2px 6px', borderRadius: 20, border: '1px solid #E5E7EB' }}>{q.area}</span>
            <span style={{ fontSize: 10, color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: 20 }}>{q.topic}</span>
            {!selectable && <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>{q.createdAt}</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#111827', fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.text}</p>
        </div>
        {!selectable && (
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {onEdit && (
              <button onClick={e => { e.stopPropagation(); onEdit() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2563EB'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '3px 5px', borderRadius: 6, transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            )}
            <span style={{ padding: '3px 2px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          </div>
        )}
      </div>
      {!selectable && expanded && (
        <div style={{ padding: '0 18px 14px 60px', borderTop: '1px solid #F9FAFB' }}>
          {q.imageUrl && (
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <img src={q.imageUrl} alt="question"
                style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, border: '1px solid #E5E7EB', display: 'block' }} />
            </div>
          )}
          {q.type !== 'short' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
              {q.answers.map((ans, ai) => {
                const isOk = q.type === 'single' ? q.correct === ai : Array.isArray(q.correct) && (q.correct as number[]).includes(ai)
                return (
                  <div key={ai} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 12, background: isOk ? '#F0FDF4' : '#F9FAFB', border: '1px solid ' + (isOk ? '#BBF7D0' : '#F3F4F6'), color: isOk ? '#166534' : '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isOk && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>{String.fromCharCode(65 + ai)}.</span>
                    {ans}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#166534' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Đáp án: <strong>{(q.shortAnswers && q.shortAnswers.length ? q.shortAnswers.join(', ') : q.correct as string) || ''}</strong>
              {q.caseInsensitive && <span style={{ fontSize: 10, marginLeft: 4, color: '#6B7280' }}>(không phân biệt hoa/thường)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function QuestionPicker({ questions, selectedIds, onConfirm, onClose }: {
  questions: BankQuestion[]
  selectedIds: string[]
  onConfirm: (ids: string[]) => void
  onClose: () => void
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds))
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<QType | ''>('')
  const [filterDiff, setFilterDiff] = useState<Difficulty | ''>('')
  const [filterClass, setFilterClass] = useState('')
  const [filterTopic, setFilterTopic] = useState('')

  const allTopics = useMemo(() => Array.from(new Set(questions.map(q => q.topic))).sort(), [questions])
  const filtered = useMemo(() => questions.filter(q =>
    (!search || q.text.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || q.type === filterType) &&
    (!filterDiff || q.difficulty === filterDiff) &&
    (!filterClass || q.class === filterClass) &&
    (!filterTopic || q.topic === filterTopic)
  ), [questions, search, filterType, filterDiff, filterClass, filterTopic])

  const toggle = (id: string) => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 720, padding: 0, overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#111827' }}>Chọn câu hỏi từ ngân hàng</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>Đã chọn <strong style={{ color: '#2563EB' }}>{picked.size}</strong> câu hỏi</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 160px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="input-field" placeholder="Tìm câu hỏi..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 28, fontSize: 12 }} />
            </div>
            <select className="input-field" style={{ width: 140, fontSize: 12 }} value={filterType} onChange={e => setFilterType(e.target.value as QType | '')}>
              <option value="">Tất cả dạng</option>
              <option value="single">Trắc nghiệm</option>
              <option value="multiple">Nhiều đáp án</option>
              <option value="short">Trả lời ngắn</option>
            </select>
            <select className="input-field" style={{ width: 126, fontSize: 12 }} value={filterDiff} onChange={e => setFilterDiff(e.target.value as Difficulty | '')}>
              <option value="">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
            <select className="input-field" style={{ width: 110, fontSize: 12 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {Object.keys(HIERARCHY).map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="input-field" style={{ width: 158, fontSize: 12 }} value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {allTopics.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 14 }}>Không tìm thấy câu hỏi nào</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i} selectable selected={picked.has(q.id)} onSelect={() => toggle(q.id)} />
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{picked.size > 0 ? picked.size + ' câu hỏi được chọn' : 'Chưa chọn câu hỏi nào'}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>Hủy</button>
            <button className="btn-primary" onClick={() => onConfirm(Array.from(picked))}>Xác nhận ({picked.size})</button>
          </div>
        </div>
      </div>
    </div>
  )
}
