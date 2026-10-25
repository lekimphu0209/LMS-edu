import { useCallback, useRef, useState } from 'react'
import type { Outline } from '../shared/data/outlines'
import { DRAFT_PREFIX, NEW_ITEM_PREFIX, loadDrafts, storeDrafts } from '@/data/curriculum'

// ── Hàm tiện ích ─────────────────────────────────────────────────

/** Sinh id tạm cho mục/bài vừa tạo trong editor (chưa có trên server). */
export const uid = () => NEW_ITEM_PREFIX + Math.random().toString(36).slice(2, 8)

export function today() { return new Date().toISOString().slice(0, 10) }

/** True nếu đề cương chỉ tồn tại ở local (tạo mới, chưa lưu lần nào). */
export const isLocalId = (id: string) => id.startsWith(DRAFT_PREFIX)

/** Tổng số câu hỏi trong toàn bộ các bài của đề cương. */
export const countQuestions = (o: Outline) =>
  o.sections.flatMap(s => s.exercises).reduce((a, e) => a + e.questionIds.length, 0)

/**
 * Giữ map nháp (id đề cương → Outline chưa lưu) và đồng bộ xuống localStorage.
 * Trang danh sách và trang chi tiết đều dùng hook này nên nháp được chia sẻ
 * giữa hai trang và không mất khi tải lại.
 */
export function useOutlineDrafts() {
  const [drafts, setDrafts] = useState<Record<string, Outline>>(loadDrafts)
  const ref = useRef(drafts)

  // Ghi xuống localStorage ngay (không đợi effect) để nháp vừa tạo
  // vẫn còn khi chuyển trang ngay sau đó.
  const commit = useCallback((next: Record<string, Outline>) => {
    ref.current = next
    storeDrafts(next)
    setDrafts(next)
  }, [])

  const putDraft = useCallback((o: Outline) => commit({ ...ref.current, [o.id]: o }), [commit])
  const clearDrafts = useCallback((ids: string[]) => {
    const next = { ...ref.current }
    ids.forEach(id => delete next[id])
    commit(next)
  }, [commit])

  return { drafts, putDraft, clearDrafts }
}

// ── Trạng thái đề cương ──────────────────────────────────────────

/** Nhãn cho biết đề cương đã được lưu lên server. */
export function SavedBadge() {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      Đã lưu
    </span>
  )
}

/** Nhãn cho biết đề cương có thay đổi chưa được lưu lên server. */
export function UnsavedBadge() {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      Chưa lưu
    </span>
  )
}

// ── Nút icon ─────────────────────────────────────────────────────

/** Nút icon có vùng chạm lớn; dùng cùng `hover(...)` để đổi màu khi di chuột. */
export const iconBtn = (size = 32): React.CSSProperties => ({
  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
  width: size, height: size, borderRadius: 8, flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.12s', padding: 0,
})

/** Handler chuột vào/ra tạo hiệu ứng đổi màu cho nút `iconBtn`. */
export const hover = (color: string, bg: string) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = color; e.currentTarget.style.background = bg
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'none'
  },
})

type IconProps = { size?: number; stroke?: string }

export const PencilIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
export const TrashIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
  </svg>
)
export const PlusIcon = ({ size = 15, stroke = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
export const CloseIcon = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
export const EyeIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
export const SearchIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
export const CheckIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
export const ArrowLeftIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
export const FileIcon = ({ size = 15, stroke = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

// ── Ô nhập & modal ───────────────────────────────────────────────

/** Ô nhập nhỏ dùng cho "Thêm chương" / "Thêm bài"; Enter để xác nhận, Esc để hủy. */
export function InlineAdd({ placeholder, onConfirm, onCancel }: { placeholder: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input ref={ref} autoFocus className="input-field" placeholder={placeholder} value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) onConfirm(val.trim()); if (e.key === 'Escape') onCancel() }}
        style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
      <button className="btn-primary" style={{ padding: '7px 13px', fontSize: 13 }} onClick={() => val.trim() && onConfirm(val.trim())}>✓</button>
      <button className="btn-ghost" style={{ padding: '7px 11px', fontSize: 13 }} onClick={onCancel}>✕</button>
    </div>
  )
}

/** Modal nhập tên + môn học cho đề cương mới; đề cương giữ dạng nháp local tới lần lưu đầu tiên. */
export function CreateOutlineModal({ onConfirm, onClose }: { onConfirm: (title: string, subject: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const submit = () => title.trim() && onConfirm(title.trim(), subject.trim())
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#111827', margin: '0 0 16px' }}>Tạo đề cương mới</h2>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tên đề cương *</label>
        <input className="input-field" placeholder="VD: Toán 10A — Đề cương học kỳ 1" value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ marginBottom: 14 }} autoFocus />
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Môn học</label>
        <input className="input-field" placeholder="VD: Toán, Lý, Hóa..." value={subject} onChange={e => setSubject(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={!title.trim()} style={{ opacity: title.trim() ? 1 : 0.5 }} onClick={submit}>Tạo</button>
        </div>
      </div>
    </div>
  )
}

/** Hộp thoại xác nhận chung cho các thao tác không thể hoàn tác. */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: {
  title: string; message: React.ReactNode; confirmLabel: string; danger?: boolean
  onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 380, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 10px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
