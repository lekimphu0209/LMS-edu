import { api } from '@/lib/api'

// Shared feedback data — used by both teacher and student views

export type FeedbackCategory = 'question' | 'suggestion' | 'issue'

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  question: 'Câu hỏi bài học',
  suggestion: 'Góp ý',
  issue: 'Báo lỗi',
}

export const CATEGORY_COLORS: Record<FeedbackCategory, { bg: string; color: string }> = {
  question: { bg: '#EFF6FF', color: '#2563EB' },
  suggestion: { bg: '#F5F3FF', color: '#7C3AED' },
  issue: { bg: '#FEF2F2', color: '#DC2626' },
}

export interface FeedbackReply {
  text: string
  date: string
  teacher: string
}

export interface Feedback {
  id: string
  student: string
  class: string
  title: string
  category: FeedbackCategory
  message: string
  date: string // dd/mm/yyyy
  replied: boolean
  reply?: FeedbackReply
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN')
}

export async function getTeacherFeedbacks(): Promise<Feedback[]> {
  const { data } = await api.get('/feedback/inbox')
  const items = Array.isArray(data) ? data : data.value ?? data.items ?? []
  return items.map((f: any) => ({
    id: String(f.id),
    student: f.student?.fullName ?? f.studentName ?? 'Học sinh',
    class: f.className ?? f.class?.name ?? '',
    title: f.title,
    category: (CATEGORY_LABELS[f.category as FeedbackCategory] ? f.category : 'question') as FeedbackCategory,
    message: f.content,
    date: formatDate(f.createdAt),
    replied: !!f.reply,
    reply: f.reply
      ? { text: f.reply, date: formatDate(f.repliedAt), teacher: f.teacherName ?? f.teacher?.fullName ?? 'Giáo viên' }
      : undefined,
  })) as Feedback[]
}

export async function replyFeedback(feedbackId: string, reply: string) {
  return api.post(`/feedback/${feedbackId}/reply`, { reply })
}
