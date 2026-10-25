import { api } from '@/lib/api'
import type { Outline, Section, Exercise } from '@/features/teacher/shared/data/outlines'

// ── Types ────────────────────────────────────────────────────────

export interface CurriculumSummary {
  id: string
  title: string
  subject: string
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  chapterCount: number
  questionCount: number
}

/** Id bắt đầu bằng tiền tố này chỉ tồn tại phía client (đề cương "Nháp" chưa lưu). */
export const DRAFT_PREFIX = 'draft-'
/** Id của mục/bài vừa tạo trong editor, chưa được lưu lên API. */
export const NEW_ITEM_PREFIX = 'new-'

// ── Chuyển đổi dữ liệu ───────────────────────────────────────────

/** Đổi dữ liệu chi tiết đề cương từ API (mục → bài → câu hỏi) sang dạng Outline của editor. */
export function apiDetailToOutline(c: any): Outline {
  return {
    id: c.id,
    title: c.title ?? '',
    subject: c.subject ?? '',
    status: c.status,
    createdAt: (c.createdAt ?? '').slice(0, 10),
    sections: (c.chapters ?? []).map(
      (ch: any): Section => ({
        id: ch.id,
        title: ch.title ?? '',
        expanded: true,
        exercises: (ch.lessons ?? []).map(
          (ls: any): Exercise => ({
            id: ls.id,
            title: ls.title ?? '',
            questionIds: (ls.questions ?? []).map((lq: any) => lq.questionId),
          }),
        ),
      }),
    ),
  }
}

/**
 * Đóng gói Outline từ editor thành payload gửi lên PUT /structure.
 * Id tạm phía client (new-* mục/bài) được bỏ trống để API hiểu là cần tạo mới.
 */
export function outlineToStructure(o: Outline) {
  return {
    title: o.title,
    chapters: o.sections.map((s) => ({
      id: s.id.startsWith(NEW_ITEM_PREFIX) ? undefined : s.id,
      title: s.title,
      lessons: s.exercises.map((e) => ({
        id: e.id.startsWith(NEW_ITEM_PREFIX) ? undefined : e.id,
        title: e.title,
        questionIds: e.questionIds,
      })),
    })),
  }
}

// ── Gọi API ──────────────────────────────────────────────────────

/** Lấy danh sách đề cương cho sidebar; API tự lọc theo giáo viên đang đăng nhập. */
export async function getCurriculums(): Promise<CurriculumSummary[]> {
  const { data } = await api.get('/curriculum')
  const items = Array.isArray(data) ? data : data?.data ?? []
  return items.map((c: any) => ({
    id: c.id,
    title: c.title ?? '',
    subject: c.subject ?? '',
    status: c.status ?? 'DRAFT',
    createdAt: (c.createdAt ?? '').slice(0, 10),
    chapterCount: c._count?.chapters ?? 0,
    questionCount: c._count?.questions ?? 0,
  }))
}

/** Lấy chi tiết một đề cương kèm toàn bộ cây mục/bài/câu hỏi. */
export async function getCurriculumDetail(id: string): Promise<Outline> {
  const { data } = await api.get(`/curriculum/${id}`)
  return apiDetailToOutline(data)
}

/** Chỉ tạo dòng đề cương; mục/bài sẽ được ghi sau qua saveCurriculumStructure. */
export async function createCurriculum(dto: { title: string; subject: string }): Promise<{ id: string }> {
  const { data } = await api.post('/curriculum', dto)
  return data
}

/** Thay toàn bộ cây mục/bài/câu hỏi trong một transaction; trả về dữ liệu đã lưu. */
export async function saveCurriculumStructure(id: string, o: Outline): Promise<Outline> {
  const { data } = await api.put(`/curriculum/${id}/structure`, outlineToStructure(o))
  return apiDetailToOutline(data)
}

/** Xóa đề cương; các mục, bài và liên kết câu hỏi bên trong bị xóa theo cascade. */
export async function deleteCurriculum(id: string): Promise<void> {
  await api.delete(`/curriculum/${id}`)
}

// ── Local drafts (chưa lưu → "Nháp") ─────────────────────────────

const DRAFT_KEY = 'educonnect-outline-drafts'

/** Đọc các bản nháp chưa lưu từ localStorage; trả {} nếu không có hoặc dữ liệu lỗi. */
export function loadDrafts(): Record<string, Outline> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Record<string, Outline>) : {}
  } catch {
    return {}
  }
}

/** Ghi toàn bộ map nháp xuống localStorage; lỗi (vd tràn quota) chỉ khiến nháp còn trong bộ nhớ. */
export function storeDrafts(drafts: Record<string, Outline>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
  } catch {
    // Tràn quota — nháp vẫn giữ trong state, chỉ không lưu được xuống đĩa
  }
}
