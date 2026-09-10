// Shared assignment data — used by both teacher and student views

export interface QuestionAnswer {
  qi: number
  text: string
  type: 'single' | 'multiple' | 'short'
  options: string[]
  correct: number | number[] | string
  studentAnswer: number | number[] | string
  isCorrect: boolean
}

export interface StudentSubmission {
  id: number
  name: string
  completedAt: string | null
  score: number | null
  timeSpent: string | null
  answers: QuestionAnswer[]
}

export interface Assignment {
  id: number
  title: string
  class: string
  dueDate: string   // YYYY-MM-DD
  dueTime: string   // HH:MM
  createdAt: string
  totalQuestions: number
  desc: string
  questionIds: string[] // links to BankQuestion ids in data/questionBank
  students: StudentSubmission[]
}

// ── Helpers ───────────────────────────────────────────────────────

export function isPast(date: string) { return new Date(date) < new Date() }
export function fmtDate(iso: string) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
export function scoreColor(s: number) { return s >= 8 ? '#22C55E' : s >= 6.5 ? '#F59E0B' : '#EF4444' }

// ── Seed data ─────────────────────────────────────────────────────

export const makeAnswers = (correct: boolean[]): QuestionAnswer[] => [
  {
    qi: 1, text: 'Nghiệm của phương trình x² − 5x + 6 = 0 là:',
    type: 'single', options: ['x = 2 và x = 3', 'x = 1 và x = 6', 'x = −2 và x = −3', 'Không có nghiệm'],
    correct: 0, studentAnswer: correct[0] ? 0 : 1, isCorrect: correct[0],
  },
  {
    qi: 2, text: 'Tập xác định của hàm số y = √(x − 1) là:',
    type: 'single', options: ['x ≥ 0', 'x ≥ 1', 'x > 1', 'x ∈ ℝ'],
    correct: 1, studentAnswer: correct[1] ? 1 : 0, isCorrect: correct[1],
  },
  {
    qi: 3, text: 'Các số nào sau đây là số nguyên tố?',
    type: 'multiple', options: ['2', '4', '7', '11', '15'],
    correct: [0, 2, 3], studentAnswer: correct[2] ? [0, 2, 3] : [0, 2], isCorrect: correct[2],
  },
  {
    qi: 4, text: 'Đạo hàm của hàm số y = x³ − 2x² + 5 là:',
    type: 'single', options: ["y' = 3x² − 4x", "y' = 3x² − 2x", "y' = x² − 4x", "y' = 3x³ − 4x²"],
    correct: 0, studentAnswer: correct[3] ? 0 : 2, isCorrect: correct[3],
  },
  {
    qi: 5, text: 'Công thức tính đạo hàm của hàm hợp f(g(x)) là gì?',
    type: 'short', options: [], correct: "f'(g(x)) · g'(x)",
    studentAnswer: correct[4] ? "f'(g(x)) · g'(x)" : "f'(x) · g'(x)", isCorrect: correct[4],
  },
]

export const seedAssignments: Assignment[] = [
  {
    id: 1, title: 'Kiểm tra chương 3 — Hàm số', class: 'Toán 10A',
    dueDate: '2026-09-10', dueTime: '23:59', createdAt: '2026-08-20', totalQuestions: 5, desc: '',
    questionIds: ['q1', 'q3', 'q2', 'q5', 'q4'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',    completedAt: '2026-08-21 08:34', score: 9.0, timeSpent: '14 phút', answers: makeAnswers([true,true,true,true,false]) },
      { id: 2, name: 'Trần Minh Bảo',   completedAt: '2026-08-21 09:12', score: 7.5, timeSpent: '22 phút', answers: makeAnswers([true,true,false,true,false]) },
      { id: 3, name: 'Nguyễn Thị Châu', completedAt: '2026-08-22 07:55', score: 8.5, timeSpent: '18 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 4, name: 'Phạm Quốc Dũng',  completedAt: '2026-08-22 14:30', score: 6.0, timeSpent: '31 phút', answers: makeAnswers([true,false,false,true,false]) },
      { id: 5, name: 'Vũ Thị Hà',       completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 6, name: 'Hoàng Văn Hùng',  completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 7, name: 'Đỗ Thị Lan',      completedAt: '2026-08-23 20:11', score: 9.5, timeSpent: '10 phút', answers: makeAnswers([true,true,true,true,true]) },
      { id: 8, name: 'Bùi Minh Long',   completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 9, name: 'Lý Thị Mai',      completedAt: '2026-08-21 15:42', score: 8.0, timeSpent: '16 phút', answers: makeAnswers([true,true,false,true,true]) },
      { id: 10, name: 'Tô Quang Nam',   completedAt: null, score: null, timeSpent: null, answers: [] },
    ],
  },
  {
    id: 2, title: 'Bài tập đạo hàm — Luyện tập', class: 'Toán 11B',
    dueDate: '2026-09-12', dueTime: '21:00', createdAt: '2026-08-21', totalQuestions: 5, desc: 'Ôn tập phần đạo hàm cơ bản',
    questionIds: ['q4', 'q5', 'q9'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',  completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Cao Thị An',    completedAt: '2026-08-22 07:20', score: 10,  timeSpent: '9 phút',  answers: makeAnswers([true,true,true,true,true]) },
      { id: 3, name: 'Đinh Văn Bình', completedAt: '2026-08-22 08:05', score: 8.5, timeSpent: '15 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 4, name: 'Hà Thị Cúc',    completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 5, name: 'Lê Đức Duy',    completedAt: '2026-08-23 19:44', score: 7.0, timeSpent: '24 phút', answers: makeAnswers([true,false,true,false,true]) },
      { id: 6, name: 'Mai Thị Hoa',   completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 7, name: 'Ngô Văn Khoa',  completedAt: '2026-08-22 10:30', score: 9.0, timeSpent: '12 phút', answers: makeAnswers([true,true,true,true,false]) },
    ],
  },
  {
    id: 3, title: 'Kiểm tra giữa kỳ — Tích phân', class: 'Toán 12A',
    dueDate: '2026-08-18', dueTime: '22:30', createdAt: '2026-08-14', totalQuestions: 5, desc: '',
    questionIds: ['q6', 'q8'],
    students: [
      { id: 1, name: 'An Thị Bảo',      completedAt: '2026-08-15 08:10', score: 8.0, timeSpent: '35 phút', answers: makeAnswers([true,true,false,true,true]) },
      { id: 2, name: 'Bùi Văn Cường',   completedAt: '2026-08-15 09:22', score: 7.5, timeSpent: '40 phút', answers: makeAnswers([true,false,true,true,false]) },
      { id: 3, name: 'Châu Thị Dung',   completedAt: '2026-08-16 07:50', score: 9.0, timeSpent: '28 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 4, name: 'Đặng Minh Đức',   completedAt: '2026-08-16 08:30', score: 6.5, timeSpent: '45 phút', answers: makeAnswers([true,false,false,true,true]) },
      { id: 5, name: 'Giang Thị Hương', completedAt: '2026-08-15 14:05', score: 8.5, timeSpent: '32 phút', answers: makeAnswers([true,true,true,true,false]) },
    ],
  },
  {
    id: 4, title: 'Bài tập hàm số — Ôn tập cuối chương', class: 'Toán 10A',
    dueDate: '2026-09-15', dueTime: '23:59', createdAt: '2026-09-01', totalQuestions: 5, desc: '',
    questionIds: ['q1', 'q3'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',    completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Trần Minh Bảo',   completedAt: '2026-09-03 10:15', score: 8.0, timeSpent: '20 phút', answers: makeAnswers([true,true,false,true,true]) },
      { id: 3, name: 'Nguyễn Thị Châu', completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 4, name: 'Vũ Thị Hà',       completedAt: '2026-09-04 08:40', score: 7.5, timeSpent: '25 phút', answers: makeAnswers([true,false,true,true,false]) },
    ],
  },
  {
    id: 5, title: 'Bài tập dao động cơ — Luyện tập', class: 'Lý 12C',
    dueDate: '2026-09-09', dueTime: '22:00', createdAt: '2026-09-02', totalQuestions: 5, desc: '',
    questionIds: ['q6', 'q8'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',   completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Phan Văn Đạt',   completedAt: '2026-09-03 15:30', score: 8.5, timeSpent: '18 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 3, name: 'Trịnh Thị Nga',  completedAt: null, score: null, timeSpent: null, answers: [] },
    ],
  },
  {
    id: 6, title: 'Kiểm tra 15 phút — Bảng tuần hoàn', class: 'Hóa 10D',
    dueDate: '2026-09-04', dueTime: '23:59', createdAt: '2026-08-30', totalQuestions: 5, desc: '',
    questionIds: ['q1', 'q2'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',   completedAt: '2026-09-03 19:20', score: 8.0, timeSpent: '12 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 2, name: 'Đoàn Văn Phúc',  completedAt: '2026-09-03 20:05', score: 7.0, timeSpent: '14 phút', answers: makeAnswers([true,false,true,false,true]) },
      { id: 3, name: 'Hồ Thị Quỳnh',   completedAt: null, score: null, timeSpent: null, answers: [] },
    ],
  },
  {
    id: 7, title: 'Bài tập vectơ — Ôn tập', class: 'Toán 10A',
    dueDate: '2026-09-02', dueTime: '23:59', createdAt: '2026-08-26', totalQuestions: 5, desc: '',
    questionIds: ['q1', 'q3'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',    completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Trần Minh Bảo',   completedAt: '2026-09-01 20:10', score: 8.5, timeSpent: '17 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 3, name: 'Nguyễn Thị Châu', completedAt: '2026-09-02 08:45', score: 9.0, timeSpent: '15 phút', answers: makeAnswers([true,true,true,true,false]) },
      { id: 4, name: 'Đỗ Thị Lan',      completedAt: '2026-08-30 21:30', score: 9.5, timeSpent: '11 phút', answers: makeAnswers([true,true,true,true,true]) },
    ],
  },
]
