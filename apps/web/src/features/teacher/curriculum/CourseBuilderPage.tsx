import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Outline } from '../shared/data/outlines'
import {
  DRAFT_PREFIX,
  createCurriculum,
  deleteCurriculum,
  getCurriculums,
  saveCurriculumStructure,
  type CurriculumSummary,
} from '@/data/curriculum'
import {
  today, isLocalId, countQuestions, useOutlineDrafts, iconBtn, hover,
  SavedBadge, UnsavedBadge, CreateOutlineModal, ConfirmDialog,
  PlusIcon, TrashIcon, EyeIcon, SearchIcon, FileIcon, CloseIcon,
} from './shared'

/** Một dòng trong bảng danh sách — gộp dữ liệu server với nháp local (nếu có). */
interface Row {
  id: string
  title: string
  subject: string
  createdAt: string
  chapterCount: number
  questionCount: number
  /** True khi có thay đổi chưa lưu (hoặc đề cương mới chưa từng lưu). */
  unsaved: boolean
}

type Filter = 'ALL' | 'SAVED' | 'UNSAVED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'SAVED', label: 'Đã lưu' },
  { key: 'UNSAVED', label: 'Chưa lưu' },
]

/** Bỏ dấu + chữ thường để tìm "toan" vẫn khớp "Toán". */
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/**
 * Trang danh sách đề cương ("Soạn bài", /curriculum).
 * - Tìm theo tên, lọc theo trạng thái.
 * - Nút "Xem" mở trang chi tiết /curriculum/:id.
 * - Chọn nhiều → xóa hàng loạt hoặc lưu các bản nháp chưa lưu lên server.
 * Đề cương mới chỉ là nháp local cho tới lần "Lưu" đầu tiên ở trang chi tiết.
 */
export default function CourseBuilder() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { drafts, putDraft, clearDrafts } = useOutlineDrafts()

  const { data: summaries = [], isLoading, isError } = useQuery<CurriculumSummary[]>({
    queryKey: ['curriculums'],
    queryFn: getCurriculums,
    retry: 1,
  })

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(t)
  }, [notice])

  // Gộp server + nháp: đề cương chỉ-có-nháp đứng đầu danh sách
  const rows = useMemo<Row[]>(() => {
    const serverIds = new Set(summaries.map(s => s.id))
    const fromServer: Row[] = summaries.map(s => {
      const d = drafts[s.id]
      return {
        id: s.id,
        title: d?.title ?? s.title,
        subject: s.subject,
        createdAt: s.createdAt,
        chapterCount: d ? d.sections.length : s.chapterCount,
        questionCount: d ? countQuestions(d) : s.questionCount,
        unsaved: !!d,
      }
    })
    const onlyLocal: Row[] = Object.values(drafts)
      .filter(d => isLocalId(d.id) && !serverIds.has(d.id))
      .map(d => ({
        id: d.id, title: d.title, subject: d.subject ?? '', createdAt: d.createdAt,
        chapterCount: d.sections.length, questionCount: countQuestions(d), unsaved: true,
      }))
    return [...onlyLocal, ...fromServer]
  }, [summaries, drafts])

  const counts = useMemo(() => ({
    ALL: rows.length,
    SAVED: rows.filter(r => !r.unsaved).length,
    UNSAVED: rows.filter(r => r.unsaved).length,
  }), [rows])

  const visible = useMemo(() => {
    const q = normalize(search.trim())
    return rows.filter(r =>
      (filter === 'ALL' || (filter === 'SAVED' ? !r.unsaved : r.unsaved)) &&
      (!q || normalize(r.title).includes(q)))
  }, [rows, search, filter])

  // Chỉ tính các dòng đã chọn còn tồn tại (tránh id cũ sau khi xóa)
  const selectedRows = rows.filter(r => checked.has(r.id))
  /** Nháp của các dòng đã chọn — chỉ những dòng này có gì để lưu. */
  const selectedDrafts = selectedRows.map(r => drafts[r.id]).filter((d): d is Outline => !!d)
  const alreadySaved = selectedRows.length - selectedDrafts.length
  const allVisibleChecked = visible.length > 0 && visible.every(r => checked.has(r.id))

  const toggle = (id: string) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAllVisible = () => setChecked(prev => {
    const next = new Set(prev)
    if (allVisibleChecked) visible.forEach(r => next.delete(r.id))
    else visible.forEach(r => next.add(r.id))
    return next
  })

  // ── Mutation ──

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(deleteCurriculum)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['curriculums'] }),
  })

  /** Lưu hàng loạt: nháp local (draft-*) được tạo trên server rồi ghi cây; nháp của đề cương đã có trên server ghi đè cây hiện tại. */
  const saveMutation = useMutation({
    mutationFn: async (outlines: Outline[]) => {
      for (const o of outlines) {
        const realId = isLocalId(o.id)
          ? (await createCurriculum({ title: o.title, subject: o.subject || 'Tổng hợp' })).id
          : o.id
        await saveCurriculumStructure(realId, o)
      }
      return outlines.map(o => o.id)
    },
    onSuccess: (draftIds) => {
      clearDrafts(draftIds)
      queryClient.invalidateQueries({ queryKey: ['curriculums'] })
      setChecked(new Set())
      setNotice({ type: 'ok', text: `Đã lưu ${draftIds.length} đề cương.` })
    },
    onError: (e: any) => setNotice({ type: 'error', text: e?.response?.data?.message ?? 'Không lưu được đề cương.' }),
  })

  // ── Handler ──

  /** Tạo nháp local rồi mở luôn trang chi tiết để soạn. */
  const createOutline = (title: string, subject: string) => {
    const o: Outline = {
      id: DRAFT_PREFIX + Math.random().toString(36).slice(2, 10),
      title, subject: subject || 'Tổng hợp', createdAt: today(), sections: [],
    }
    putDraft(o)
    setShowCreate(false)
    navigate(`/curriculum/${o.id}`)
  }

  /** Nháp local bị xóa ngay; đề cương trên server gọi DELETE (chương/bài/câu hỏi xóa theo cascade). */
  const doDelete = async (ids: string[]) => {
    setConfirmDelete(null)
    const serverIds = ids.filter(id => !isLocalId(id))
    clearDrafts(ids)
    setChecked(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
    if (!serverIds.length) { setNotice({ type: 'ok', text: `Đã xóa ${ids.length} đề cương.` }); return }
    try {
      await deleteMutation.mutateAsync(serverIds)
      setNotice({ type: 'ok', text: `Đã xóa ${ids.length} đề cương.` })
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.response?.data?.message ?? 'Không xóa được đề cương.' })
    }
  }

  const saveSelected = () => {
    if (!selectedDrafts.length) {
      setNotice({ type: 'error', text: 'Các đề cương đã chọn đều đã lưu — không có gì để lưu.' })
      return
    }
    saveMutation.mutate(selectedDrafts)
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 40 }}>
      {/* Tiêu đề trang */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Soạn bài</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Quản lý đề cương, chương và câu hỏi cho từng bài học</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PlusIcon size={15} stroke="white" />
          Tạo đề cương mới
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Thanh công cụ: tìm kiếm + lọc trạng thái */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex' }}>
              <SearchIcon size={15} />
            </span>
            <input className="input-field" placeholder="Tìm theo tên đề cương..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34, paddingRight: search ? 32 : 12 }} />
            {search && (
              <button onClick={() => setSearch('')} title="Xóa tìm kiếm"
                style={{ ...iconBtn(24), position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>
                <CloseIcon size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 3, borderRadius: 10 }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    background: active ? 'white' : 'transparent', color: active ? '#111827' : '#6B7280',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {f.label} <span style={{ color: active ? '#2563EB' : '#9CA3AF' }}>{counts[f.key]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Thanh thao tác hàng loạt — hiện khi có đề cương được chọn */}
        {selectedRows.length > 0 && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>Đã chọn {selectedRows.length} đề cương</span>
            {alreadySaved > 0 && (
              <span style={{ fontSize: 12, color: '#6B7280' }}>({alreadySaved} đã lưu sẽ bỏ qua)</span>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn-primary" onClick={saveSelected} disabled={saveMutation.isPending || !selectedDrafts.length}
              title={selectedDrafts.length ? `Lưu ${selectedDrafts.length} đề cương chưa lưu` : 'Không có đề cương chưa lưu'}
              style={{ padding: '8px 14px', fontSize: 13, opacity: saveMutation.isPending || !selectedDrafts.length ? 0.6 : 1 }}>
              {saveMutation.isPending ? 'Đang lưu...' : `Lưu${selectedDrafts.length ? ` (${selectedDrafts.length})` : ''}`}
            </button>
            <button className="btn-danger" onClick={() => setConfirmDelete(selectedRows.map(r => r.id))}
              style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrashIcon size={14} />
              Xóa đã chọn
            </button>
            <button className="btn-secondary" onClick={() => setChecked(new Set())} style={{ padding: '8px 12px', fontSize: 13 }}>Bỏ chọn</button>
          </div>
        )}

        {notice && (
          <div style={{
            padding: '10px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6',
            color: notice.type === 'ok' ? '#15803D' : '#B91C1C', background: notice.type === 'ok' ? '#F0FDF4' : '#FEF2F2',
          }}>
            {notice.text}
          </div>
        )}

        {/* Bảng đề cương */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible}
                    disabled={!visible.length} title="Chọn tất cả"
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }} />
                </th>
                <th style={{ textAlign: 'left' }}>Tên đề cương</th>
                <th style={{ textAlign: 'center', width: 90 }}>Chương</th>
                <th style={{ textAlign: 'center', width: 90 }}>Câu hỏi</th>
                <th style={{ textAlign: 'left', width: 170 }}>Trạng thái</th>
                <th style={{ textAlign: 'left', width: 110 }}>Ngày tạo</th>
                <th style={{ textAlign: 'right', width: 130 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Đang tải danh sách...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '44px 16px', color: '#9CA3AF' }}>
                    <FileIcon size={40} stroke="#E5E7EB" />
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      {isError ? 'Không tải được danh sách đề cương.'
                        : rows.length === 0 ? 'Chưa có đề cương nào — bấm "Tạo đề cương mới" để bắt đầu.'
                        : 'Không có đề cương phù hợp với bộ lọc.'}
                    </div>
                  </td>
                </tr>
              ) : visible.map(r => {
                const isChecked = checked.has(r.id)
                return (
                  <tr key={r.id} style={{ background: isChecked ? '#F5F9FF' : undefined }}>
                    <td>
                      <input type="checkbox" checked={isChecked} onChange={() => toggle(r.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }} />
                    </td>
                    <td>
                      <button onClick={() => navigate(`/curriculum/${r.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#111827' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#2563EB' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#111827' }}>
                        {r.title || 'Chưa đặt tên'}
                      </button>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{r.subject || 'Tổng hợp'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{r.chapterCount}</td>
                    <td style={{ textAlign: 'center' }}>{r.questionCount}</td>
                    <td>
                      {r.unsaved ? <UnsavedBadge /> : <SavedBadge />}
                    </td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>{r.createdAt}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => navigate(`/curriculum/${r.id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                          <EyeIcon size={14} />
                          Xem
                        </button>
                        <button onClick={() => setConfirmDelete([r.id])} title="Xóa đề cương"
                          style={iconBtn(32)} {...hover('#EF4444', '#FEF2F2')}>
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateOutlineModal onConfirm={createOutline} onClose={() => setShowCreate(false)} />}

      {confirmDelete && (
        <ConfirmDialog
          title="Xác nhận xóa"
          message={<>Xóa <strong>{confirmDelete.length}</strong> đề cương cùng toàn bộ chương, bài và liên kết câu hỏi bên trong? Hành động này không thể hoàn tác.</>}
          confirmLabel="Xóa"
          danger
          onConfirm={() => doDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
