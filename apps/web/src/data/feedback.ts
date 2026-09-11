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

export const seedFeedbacks: Feedback[] = [
  {
    id: '1', student: 'Lê Hoàng Anh', class: 'Toán 10A',
    title: 'Chưa hiểu tích phân từng phần', category: 'question',
    message: 'Thầy ơi, em chưa hiểu phần tích phân từng phần ạ. Thầy có thể giải thích lại cách chọn u và dv không?',
    date: '10/08/2026', replied: false,
  },
  {
    id: '2', student: 'Trần Minh Bảo', class: 'Toán 10A',
    title: 'Hỏi về bài 5 đề kiểm tra', category: 'question',
    message: 'Em muốn hỏi về bài tập số 5 trong đề kiểm tra vừa rồi ạ.',
    date: '12/08/2026', replied: true,
    reply: {
      text: 'Bài 5 em cần đặt điều kiện xác định trước khi bình phương hai vế. Thầy sẽ chữa lại trên lớp thứ 4 nhé.',
      date: '13/08/2026', teacher: 'Nguyễn Văn An',
    },
  },
  {
    id: '3', student: 'Nguyễn Thị Châu', class: 'Toán 11B',
    title: 'Giải thêm bài 12 trang 87', category: 'question',
    message: 'Thầy có thể giải thêm bài 12 trang 87 không ạ?',
    date: '14/08/2026', replied: false,
  },
  {
    id: '4', student: 'Lê Hoàng Anh', class: 'Lý 12C',
    title: 'Đề nghị thêm bài tập dao động', category: 'suggestion',
    message: 'Em thấy phần dao động điều hòa còn ít bài luyện, thầy có thể thêm bài tập vận dụng cao không ạ?',
    date: '20/08/2026', replied: true,
    reply: {
      text: 'Cảm ơn góp ý của em. Thầy đã thêm 1 bài luyện tập mới trong mục Dao động cơ, em vào làm thử nhé.',
      date: '21/08/2026', teacher: 'Lê Minh Cường',
    },
  },
  {
    id: '5', student: 'Lê Hoàng Anh', class: 'Hóa 10D',
    title: 'Câu 3 bài kiểm tra bị lỗi hiển thị', category: 'issue',
    message: 'Cô ơi, câu 3 trong bài "Kiểm tra 15 phút — Bảng tuần hoàn" các đáp án bị trùng nhau ạ.',
    date: '03/09/2026', replied: false,
  },
]

export async function getTeacherFeedbacks(): Promise<Feedback[]> {
  try {
    const { data } = await api.get('/feedback/inbox')
    const items = Array.isArray(data) ? data : data.value ?? data.items ?? []
    if (!items.length) throw new Error('empty')
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
  } catch {
    return seedFeedbacks
  }
}

export async function replyFeedback(feedbackId: string, reply: string) {
  return api.post(`/feedback/${feedbackId}/reply`, { reply })
}
