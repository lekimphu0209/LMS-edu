// Shared question bank types and data

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

export const seedQuestions: BankQuestion[] = [
  {
    id: 'q1', text: 'Nghiệm của phương trình x² − 5x + 6 = 0 là:', type: 'single', difficulty: 'easy',
    class: 'Lớp 10', area: 'Đại số', topic: 'Phương trình bậc hai',
    answers: ['x = 2 và x = 3', 'x = 1 và x = 6', 'x = −2 và x = −3', 'Không có nghiệm'],
    correct: 0, createdAt: '2026-08-01',
  },
  {
    id: 'q2', text: 'Các số nào sau đây là số nguyên tố?', type: 'multiple', difficulty: 'medium',
    class: 'Lớp 10', area: 'Đại số', topic: 'Tổ hợp - Xác suất',
    answers: ['2', '4', '7', '11', '15'], correct: [0, 2, 3], createdAt: '2026-08-03',
  },
  {
    id: 'q3', text: 'Tập xác định của hàm số y = √(x − 1) là:', type: 'single', difficulty: 'easy',
    class: 'Lớp 10', area: 'Đại số', topic: 'Hàm số',
    answers: ['x ≥ 0', 'x ≥ 1', 'x > 1', 'x ∈ ℝ'], correct: 1, createdAt: '2026-08-05',
  },
  {
    id: 'q4', text: 'Công thức tính đạo hàm của hàm hợp f(g(x)) là gì?', type: 'short', difficulty: 'medium',
    class: 'Lớp 11', area: 'Đại số', topic: 'Đạo hàm',
    answers: [], correct: "f'(g(x)) · g'(x)", shortAnswers: ["f'(g(x)) · g'(x)"], caseInsensitive: false, createdAt: '2026-08-08',
  },
  {
    id: 'q5', text: 'Đạo hàm của hàm số y = x³ − 2x² + 5 là:', type: 'single', difficulty: 'easy',
    class: 'Lớp 11', area: 'Đại số', topic: 'Đạo hàm',
    answers: ["y' = 3x² − 4x", "y' = 3x² − 2x", "y' = x² − 4x", "y' = 3x³ − 4x²"],
    correct: 0, createdAt: '2026-08-10',
  },
  {
    id: 'q6', text: 'Tích phân ∫₀¹ x² dx bằng:', type: 'single', difficulty: 'medium',
    class: 'Lớp 12', area: 'Đại số', topic: 'Tích phân',
    answers: ['1/3', '1/2', '1', '2/3'], correct: 0, createdAt: '2026-08-12',
  },
  {
    id: 'q7', text: 'Thiết diện của hình lập phương khi cắt bởi mặt phẳng qua 3 đỉnh có thể là hình gì?', type: 'multiple', difficulty: 'hard',
    class: 'Lớp 12', area: 'Hình học', topic: 'Thiết diện',
    answers: ['Tam giác đều', 'Hình chữ nhật', 'Hình lục giác đều', 'Hình thang'], correct: [0, 2], createdAt: '2026-08-14',
  },
  {
    id: 'q8', text: 'Diện tích mặt cầu có bán kính R là:', type: 'short', difficulty: 'easy',
    class: 'Lớp 12', area: 'Hình học', topic: 'Mặt cầu - Mặt trụ - Mặt nón',
    answers: [], correct: '4πR²', shortAnswers: ['4πR²'], caseInsensitive: false, createdAt: '2026-08-15',
  },
  {
    id: 'q9', text: 'Hai đường thẳng phân biệt trong không gian không song song thì:', type: 'single', difficulty: 'medium',
    class: 'Lớp 11', area: 'Hình học', topic: 'Quan hệ song song',
    answers: ['Luôn cắt nhau', 'Luôn chéo nhau', 'Cắt nhau hoặc chéo nhau', 'Vuông góc nhau'],
    correct: 2, createdAt: '2026-08-16',
  },
  {
    id: 'q10', text: 'Điều kiện để một đường thẳng vuông góc với một mặt phẳng là:', type: 'multiple', difficulty: 'hard',
    class: 'Lớp 11', area: 'Hình học', topic: 'Quan hệ vuông góc',
    answers: ['Vuông góc với 1 đường trong mp', 'Vuông góc với 2 đường giao nhau trong mp', 'Song song với pháp tuyến của mp', 'Tạo góc 90° với mp'],
    correct: [1, 2, 3], createdAt: '2026-08-18',
  },
]
