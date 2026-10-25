import { useState, useMemo, useEffect } from 'react'
import { BankQuestion, QType, Difficulty } from '@/data/questionBank'
import { QuestionCard } from '../shared/components/question'
import { CreateQuestionModal } from './CreateQuestionModal'

interface Props {
  questions: BankQuestion[]
  onAdd: (q: BankQuestion) => void
  onDelete: (id: string) => void
  onUpdate: (q: BankQuestion) => void
}

export default function QuestionBank({ questions, onAdd, onDelete, onUpdate }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<QType | ''>('')
  const [filterDiff, setFilterDiff] = useState<Difficulty | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingQ, setEditingQ] = useState<BankQuestion | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const filtered = useMemo(() => questions.filter(q =>
    (!search || q.text.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || q.type === filterType) &&
    (!filterDiff || q.difficulty === filterDiff)
  ), [questions, search, filterType, filterDiff])

  const hasFilters = search || filterType || filterDiff
  const clearFilters = () => { setSearchInput(''); setSearch(''); setFilterType(''); setFilterDiff('') }

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Tổng cộng <strong style={{ color: '#111827' }}>{questions.length}</strong> câu hỏi</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }} onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo câu hỏi
        </button>
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="input-field" placeholder="Tìm theo nội dung..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: 32, fontSize: 13 }} />
          </div>
          <select className="input-field" style={{ width: 165, fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value as QType | '')}>
            <option value="">Tất cả dạng</option>
            <option value="single">1 đáp án</option>
            <option value="multiple">Nhiều đáp án</option>
            <option value="short">Điền đáp án</option>
          </select>
          <select className="input-field" style={{ width: 148, fontSize: 13 }} value={filterDiff} onChange={e => setFilterDiff(e.target.value as Difficulty | '')}>
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ fontSize: 12, color: '#EF4444', background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
          Hiển thị <strong style={{ color: '#374151' }}>{filtered.length}</strong> / {questions.length} câu hỏi
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontSize: 15, margin: 0 }}>Không tìm thấy câu hỏi phù hợp</p>
          <p style={{ fontSize: 13, margin: '4px 0 0' }}>Thử thay đổi bộ lọc hoặc tạo câu hỏi mới</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((q, idx) => (
            <QuestionCard key={q.id} q={q} index={idx} onEdit={() => setEditingQ(q)} onDelete={() => setDeleteConfirm(q.id)} />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ width: 360, padding: 28, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 8px' }}>Xóa câu hỏi?</h3>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 18px' }}>Câu hỏi sẽ bị xóa vĩnh viễn.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button style={{ padding: '8px 18px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateQuestionModal onSave={q => { onAdd(q); setShowCreate(false) }} onClose={() => setShowCreate(false)} />}
      {editingQ && <CreateQuestionModal initial={editingQ} onSave={q => { onUpdate(q); setEditingQ(null) }} onClose={() => setEditingQ(null)} />}
    </div>
  )
}
