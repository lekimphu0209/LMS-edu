import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BankQuestion, getBankQuestions } from '@/data/questionBank'
import type { Outline } from '../shared/data/outlines'
import { createCurriculum, getCurriculumDetail, saveCurriculumStructure } from '@/data/curriculum'
import OutlineEditor from './OutlineEditor'
import {
  isLocalId, countQuestions, useOutlineDrafts, iconBtn, hover,
  ConfirmDialog, PencilIcon, CheckIcon, FileIcon,
} from './shared'

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

/** Các icon nhỏ cho stepper hướng dẫn (vẽ tay, đồng nhất stroke 2). */
const BulbIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z" />
  </svg>
)
const LayersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
)
const ListChecksIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6l2 2 4-4" /><path d="M3 16l2 2 4-4" />
    <line x1="13" y1="6" x2="21" y2="6" /><line x1="13" y1="16" x2="21" y2="16" />
  </svg>
)
const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
)

/** Kiểu "keycap" cho phím tắt trong phần mẹo. */
const kbdStyle: React.CSSProperties = {
  display: 'inline-block', padding: '1px 6px', fontSize: 10, fontWeight: 700, lineHeight: '16px',
  color: '#374151', background: '#F9FAFB', border: '1px solid #D1D5DB', borderBottomWidth: 2, borderRadius: 5,
}

/** Stepper hướng dẫn 4 bước: icon + nhãn + chú thích ngắn, nối bằng đường ngang; mẹo ở cuối. */
function GuidePanel() {
  const steps = [
    { icon: <LayersIcon />, label: 'Thêm chương', sub: 'Chia nội dung thành phần lớn' },
    { icon: <FileIcon size={15} />, label: 'Thêm bài', sub: 'Bài học trong từng chương' },
    { icon: <ListChecksIcon />, label: 'Chọn câu hỏi', sub: 'Gắn từ ngân hàng câu hỏi' },
    { icon: <SaveIcon />, label: 'Bấm Lưu', sub: 'Đồng bộ thay đổi lên server' },
  ]
  return (
    <div className="card" style={{ padding: '10px 16px 8px', marginBottom: 14 }}>
      {/* Header: nhãn section + tóm tắt phía phải */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 6, background: '#EFF6FF', color: '#2563EB' }}>
          <BulbIcon size={12} />
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: '#2563EB', textTransform: 'uppercase' }}>Hướng dẫn nhanh</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#9CA3AF' }}>4 bước để hoàn thành đề cương</span>
      </div>

      {/* Stepper: từng bước là cột icon–nhãn–mô tả, nối nhau bằng đường ngang */}
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <Fragment key={s.label}>
            <div style={{ width: 96, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center' }}>
              <span style={{
                width: 28, height: 28, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: i === steps.length - 1 ? '#2563EB' : '#EFF6FF',
                color: i === steps.length - 1 ? 'white' : '#2563EB',
                boxShadow: i === steps.length - 1 ? '0 3px 7px rgba(37,99,235,0.25)' : 'none',
              }}>
                {s.icon}
              </span>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#111827' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: '1 1 20px', minWidth: 16, height: 2, background: '#E5E7EB', borderRadius: 2, marginTop: 13 }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Footer: mẹo dùng phím tắt + icon bút */}
      <div style={{ marginTop: 9, paddingTop: 7, borderTop: '1px dashed #E5E7EB', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 11, color: '#6B7280' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Mẹo</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={kbdStyle}>Ctrl</span>
          <span style={{ color: '#9CA3AF' }}>+</span>
          <span style={kbdStyle}>S</span>
          <span style={{ marginLeft: 3 }}>lưu nhanh</span>
        </span>
        <span style={{ color: '#D1D5DB' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <PencilIcon size={11} />
          icon bút đổi tên đề cương / chương / bài
        </span>
        <span style={{ color: '#D1D5DB' }}>·</span>
        <span>thay đổi giữ ở máy tới khi Lưu hoặc Hủy</span>
      </div>
    </div>
  )
}

/** Chỉ báo trạng thái lưu cạnh nút Lưu để người dùng biết dữ liệu đã lên server chưa. */
function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: Date | null }) {
  const cfg = {
    saved: { color: '#15803D', bg: '#F0FDF4', dot: '#22C55E', text: savedAt ? `Đã lưu lúc ${savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Đã lưu' },
    dirty: { color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B', text: 'Chưa lưu thay đổi' },
    saving: { color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6', text: 'Đang lưu...' },
    error: { color: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444', text: 'Lưu thất bại — thử lại' },
  }[state]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {state === 'saved'
        ? <CheckIcon size={12} />
        : <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />}
      {cfg.text}
    </span>
  )
}

/**
 * Trang chi tiết đề cương (/curriculum/:id).
 * Hiển thị tên đề cương (kèm icon sửa), các chương và câu hỏi. Mọi chỉnh sửa được giữ
 * thành nháp local; nút "Lưu" trên cùng gửi toàn bộ cây lên PUT /curriculum/:id/structure.
 * Với đề cương mới (id draft-*), lần lưu đầu tạo dòng trên server rồi chuyển sang URL id thật.
 */
export default function CurriculumDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { drafts, putDraft, clearDrafts } = useOutlineDrafts()

  const local = isLocalId(id)
  const { data: serverDetail, isLoading, isError } = useQuery({
    queryKey: ['curriculum', id],
    queryFn: () => getCurriculumDetail(id),
    enabled: !!id && !local,
    retry: 1,
  })
  // Không dùng seed làm fallback: id seed không trùng id thật.
  const { data: bankQuestions } = useQuery<BankQuestion[]>({
    queryKey: ['bank-questions'],
    queryFn: getBankQuestions,
    retry: 1,
  })

  const draft = drafts[id]
  const outline: Outline | undefined = draft ?? serverDetail
  const dirty = !!draft

  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async (o: Outline) => {
      const realId = isLocalId(o.id)
        ? (await createCurriculum({ title: o.title, subject: o.subject || 'Tổng hợp' })).id
        : o.id
      const saved = await saveCurriculumStructure(realId, o)
      return { saved, realId, draftId: o.id }
    },
    onSuccess: ({ saved, realId, draftId }) => {
      queryClient.setQueryData(['curriculum', realId], saved)
      queryClient.invalidateQueries({ queryKey: ['curriculums'] })
      clearDrafts([draftId])
      setSavedAt(new Date())
      if (realId !== draftId) navigate(`/curriculum/${realId}`, { replace: true })
    },
  })

  const saveState: SaveState = saveMutation.isPending ? 'saving'
    : saveMutation.isError && dirty ? 'error'
    : dirty ? 'dirty' : 'saved'

  const save = () => { if (outline && dirty && !saveMutation.isPending) saveMutation.mutate(outline) }

  // Ctrl/Cmd + S để lưu nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const commitTitle = () => {
    if (outline && editingTitle?.trim() && editingTitle.trim() !== outline.title) {
      putDraft({ ...outline, title: editingTitle.trim() })
    }
    setEditingTitle(null)
  }

  /** Đề cương mới chưa lưu: hủy = xóa hẳn và về danh sách; đề cương đã lưu: quay về bản trên server. */
  const discard = () => {
    clearDrafts([id])
    saveMutation.reset()
    setConfirmDiscard(false)
    if (local) navigate('/curriculum')
  }

  if (!local && isLoading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Đang tải đề cương...</div>
  }
  if (!outline) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#6B7280' }}>
        <p style={{ fontSize: 15, margin: '0 0 14px' }}>{isError ? 'Không tải được đề cương.' : 'Không tìm thấy đề cương.'}</p>
        <button className="btn-secondary" onClick={() => navigate('/curriculum')}>Về danh sách đề cương</button>
      </div>
    )
  }

  const totalQ = countQuestions(outline)
  const totalEx = outline.sections.reduce((a, s) => a + s.exercises.length, 0)

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 48 }}>
      {/* Thanh trên cùng: tên đề cương + trạng thái lưu + nút Lưu (dính khi cuộn) */}
      <div className="card" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {editingTitle !== null ? (
              <input autoFocus value={editingTitle} placeholder="Tên đề cương..."
                onChange={e => setEditingTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(null) }}
                onBlur={commitTitle}
                style={{ flex: 1, border: '1.5px solid #2563EB', borderRadius: 8, outline: 'none', fontSize: 20, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111827', padding: '3px 10px' }} />
            ) : (
              <>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {outline.title || 'Chưa đặt tên'}
                </h1>
                <button onClick={() => setEditingTitle(outline.title)} title="Sửa tên đề cương" style={iconBtn(32)} {...hover('#2563EB', '#EFF6FF')}>
                  <PencilIcon size={15} />
                </button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: '#9CA3AF', flexWrap: 'wrap' }}>
            <span>{outline.subject || 'Tổng hợp'}</span>
            <span>·</span>
            <span>{outline.sections.length} chương · {totalEx} bài · {totalQ} câu hỏi</span>
            <span>·</span>
            <span>Tạo ngày {outline.createdAt}</span>
          </div>
        </div>

        <SaveIndicator state={saveState} savedAt={savedAt} />
        {dirty && (
          <button className="btn-secondary" disabled={saveMutation.isPending}
            onClick={() => local ? setConfirmDiscard(true) : discard()}
            style={{ flexShrink: 0, opacity: saveMutation.isPending ? 0.5 : 1 }}>
            Hủy thay đổi
          </button>
        )}
        <button className="btn-primary" onClick={save} disabled={!dirty || saveMutation.isPending}
          title="Lưu (Ctrl+S)"
          style={{ flexShrink: 0, minWidth: 96, opacity: !dirty || saveMutation.isPending ? 0.55 : 1, cursor: !dirty || saveMutation.isPending ? 'default' : 'pointer' }}>
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>

      {saveMutation.isError && dirty && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#B91C1C' }}>
          {(saveMutation.error as any)?.response?.data?.message ?? 'Không lưu được đề cương.'} Thay đổi vẫn được giữ ở máy bạn.
        </div>
      )}

      {/* Thanh hướng dẫn ngang nằm trên phần thêm chương/bài */}
      <GuidePanel />

      <OutlineEditor
        outline={outline}
        bankQuestions={bankQuestions ?? []}
        bankReady={!!bankQuestions}
        onChange={putDraft}
      />

      {confirmDiscard && (
        <ConfirmDialog
          title="Hủy đề cương mới"
          message="Đề cương này chưa từng được lưu. Hủy thay đổi sẽ xóa hẳn đề cương. Bạn chắc chắn?"
          confirmLabel="Xóa đề cương"
          danger
          onConfirm={discard}
          onClose={() => setConfirmDiscard(false)}
        />
      )}
    </div>
  )
}
