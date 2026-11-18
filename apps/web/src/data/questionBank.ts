// Shared question bank types and data
import { api } from '@/lib/api'

export type QType = 'single' | 'multiple' | 'short'
export type Difficulty = 'easy' | 'medium' | 'hard'

export const TYPE_LABELS: Record<QType, string> = {
  single: 'Trắc nghiệm',
  multiple: 'Nhiều đáp án',
  short: 'Trả lời ngắn',
}

export const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
}

export const DIFF_COLORS: Record<Difficulty, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
}

// Hierarchy: Class → Area → Topic
export const HIERARCHY: Record<string, Record<string, string[]>> = {
  'Lớp 10': {
    'Đại số': ['Hàm số', 'Phương trình bậc hai', 'Bất phương trình', 'Vectơ phẳng', 'Tổ hợp - Xác suất'],
    'Hình học': ['Tam giác', 'Tứ giác', 'Tọa độ phẳng Oxy', 'Đường tròn'],
  },
  'Lớp 11': {
    'Đại số': ['Đạo hàm', 'Giới hạn', 'Hàm số mũ - Logarit', 'Cấp số cộng - nhân'],
    'Hình học': ['Quan hệ song song', 'Quan hệ vuông góc', 'Vectơ không gian'],
  },
  'Lớp 12': {
    'Đại số': ['Tích phân', 'Hàm số và đồ thị', 'Số phức', 'Nguyên hàm'],
    'Hình học': ['Thiết diện', 'Khối đa diện', 'Mặt cầu - Mặt trụ - Mặt nón', 'Tọa độ không gian'],
  },
}

export interface BankQuestion {
  id: string
  text: string
  imageUrl?: string
  type: QType
  difficulty: Difficulty
  class: string
  area: string
  topic: string
  answers: string[]
  correct: number | number[] | string
  shortAnswers?: string[] // for 'short' type: accepted answers
  caseInsensitive?: boolean // for 'short' type
  createdAt: string // ISO date string
}

let _nextId = 100

export function genId() {
  return `q${_nextId++}`
}

// ── API integration (/question-bank) ─────────────────────────────

const TYPE_TO_API: Record<QType, string> = { single: 'SINGLE', multiple: 'MULTI', short: 'FILL_BLANK' }
const DIFF_TO_API: Record<Difficulty, string> = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' }

export function apiToBankQuestion(q: any): BankQuestion {
  const type: QType = q.type === 'SINGLE' ? 'single' : q.type === 'MULTI' ? 'multiple' : 'short'
  const difficulty: Difficulty = q.difficulty === 'EASY' ? 'easy' : q.difficulty === 'HARD' ? 'hard' : 'medium'
  const options: any[] = q.options ?? []
  const correctIdx = options
    .map((o: any, i: number) => (o.isCorrect ? i : -1))
    .filter((i: number) => i >= 0)
  return {
    id: q.id,
    text: q.questionText,
    imageUrl: q.questionImageUrl || undefined,
    type,
    difficulty,
    class: 'Lớp 12',
    area: 'Đại số',
    topic: q.subject ?? '',
    answers: type === 'short' ? [] : options.map((o: any) => o.optionText),
    correct:
      type === 'short'
        ? (options.find((o: any) => o.isCorrect)?.optionText ?? '')
        : type === 'multiple'
          ? correctIdx
          : correctIdx[0] ?? 0,
    shortAnswers:
      type === 'short'
        ? options.filter((o: any) => o.isCorrect).map((o: any) => o.optionText)
        : undefined,
    createdAt: q.createdAt?.slice(0, 10) ?? '',
  }
}

function bankToDto(q: BankQuestion) {
  return {
    subject: q.topic || 'Toán',
    type: TYPE_TO_API[q.type],
    questionText: q.text,
    questionImageUrl: q.imageUrl || null,
    difficulty: DIFF_TO_API[q.difficulty],
    defaultScore: 1,
    options:
      q.type === 'short'
        ? []
        : q.answers.map((text, i) => ({
            optionText: text,
            isCorrect: Array.isArray(q.correct) ? q.correct.includes(i) : q.correct === i,
            orderIndex: i,
          })),
  }
}

export async function getBankQuestions(): Promise<BankQuestion[]> {
  const { data } = await api.get('/question-bank', { params: { limit: 200 } })
  const items = data?.data ?? (Array.isArray(data) ? data : [])
  return items.map(apiToBankQuestion)
}

export async function createBankQuestion(q: BankQuestion): Promise<BankQuestion> {
  const { data } = await api.post('/question-bank', bankToDto(q))
  return apiToBankQuestion(data)
}

export async function updateBankQuestion(q: BankQuestion): Promise<BankQuestion> {
  const { options: _ignored, ...dto } = bankToDto(q)
  const { data } = await api.patch(`/question-bank/${q.id}`, dto)
  return apiToBankQuestion({ ...data, options: data.options ?? [] })
}

export async function deleteBankQuestion(id: string): Promise<void> {
  await api.delete(`/question-bank/${id}`)
}
