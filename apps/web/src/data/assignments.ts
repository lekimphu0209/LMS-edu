import { api } from '@/lib/api'

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

export type AssignmentStatus = 'DRAFT' | 'SAVED' | 'ASSIGNED'

/** Nhãn + màu cho 3 trạng thái bài tập. */
export const STATUS_META: Record<AssignmentStatus, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Nháp',    color: '#6B7280', bg: '#F3F4F6' },
  SAVED:    { label: 'Đã lưu',  color: '#B45309', bg: '#FFFBEB' },
  ASSIGNED: { label: 'Đã giao', color: '#15803D', bg: '#F0FDF4' },
}

export interface Assignment {
  id: number
  title: string
  class: string
  status: AssignmentStatus
  durationMin: number | null  // null = không giới hạn
  dueDate: string   // YYYY-MM-DD
  dueTime: string   // HH:MM
  createdAt: string
  totalQuestions: number
  desc: string
  questionIds: string[] // links to BankQuestion ids in data/questionBank
  students: StudentSubmission[]
  version: number          // 1 = bản gốc; tăng mỗi lần giáo viên sửa thông tin sau khi giao
  editedAt: string | null  // thời điểm sửa gần nhất
}

// ── Danh sách học sinh theo lớp (dùng chọn giao cho từng HS) ──────

export interface RosterStudent { id: number; name: string; email: string; avgScore: number }

export const classRosters: Record<string, RosterStudent[]> = {
  'Toán 10A': [
    { id: 1,  name: 'Lê Hoàng Anh',    email: 'anh.lh@student.edu.vn',    avgScore: 8.4 },
    { id: 2,  name: 'Trần Minh Bảo',   email: 'bao.tm@student.edu.vn',    avgScore: 7.1 },
    { id: 3,  name: 'Nguyễn Thị Châu', email: 'chau.nt@student.edu.vn',   avgScore: 9.0 },
    { id: 4,  name: 'Phạm Quốc Dũng',  email: 'dung.pq@student.edu.vn',   avgScore: 6.2 },
    { id: 5,  name: 'Vũ Thị Hà',       email: 'ha.vt@student.edu.vn',     avgScore: 7.8 },
    { id: 6,  name: 'Hoàng Văn Hùng',  email: 'hung.hv@student.edu.vn',   avgScore: 5.9 },
    { id: 7,  name: 'Đỗ Thị Lan',      email: 'lan.dt@student.edu.vn',    avgScore: 9.3 },
    { id: 8,  name: 'Bùi Minh Long',   email: 'long.bm@student.edu.vn',   avgScore: 6.8 },
    { id: 9,  name: 'Lý Thị Mai',      email: 'mai.lt@student.edu.vn',    avgScore: 8.1 },
    { id: 10, name: 'Tô Quang Nam',    email: 'nam.tq@student.edu.vn',    avgScore: 7.4 },
  ],
  'Toán 10B': [
    { id: 1, name: 'Cao Thị An',     email: 'an.ct@student.edu.vn',    avgScore: 8.9 },
    { id: 2, name: 'Đinh Văn Bình',  email: 'binh.dv@student.edu.vn',  avgScore: 6.5 },
    { id: 3, name: 'Hà Thị Cúc',     email: 'cuc.ht@student.edu.vn',   avgScore: 7.7 },
    { id: 4, name: 'Lê Đức Duy',     email: 'duy.ld@student.edu.vn',   avgScore: 8.2 },
    { id: 5, name: 'Mai Thị Hoa',    email: 'hoa.mt@student.edu.vn',   avgScore: 6.0 },
    { id: 6, name: 'Ngô Văn Khoa',   email: 'khoa.nv@student.edu.vn',  avgScore: 9.1 },
  ],
  'Toán 11B': [
    { id: 1, name: 'An Thị Bảo',      email: 'bao.at@student.edu.vn',   avgScore: 8.0 },
    { id: 2, name: 'Bùi Văn Cường',   email: 'cuong.bv@student.edu.vn', avgScore: 7.5 },
    { id: 3, name: 'Châu Thị Dung',   email: 'dung.ct@student.edu.vn',  avgScore: 8.6 },
    { id: 4, name: 'Đặng Minh Đức',   email: 'duc.dm@student.edu.vn',   avgScore: 6.4 },
    { id: 5, name: 'Giang Thị Hương', email: 'huong.gt@student.edu.vn', avgScore: 8.8 },
  ],
  'Toán 12C': [
    { id: 1, name: 'Phan Văn Đạt',   email: 'dat.pv@student.edu.vn',   avgScore: 7.9 },
    { id: 2, name: 'Trịnh Thị Nga',  email: 'nga.tt@student.edu.vn',   avgScore: 8.3 },
    { id: 3, name: 'Đoàn Văn Phúc',  email: 'phuc.dv@student.edu.vn',  avgScore: 6.7 },
    { id: 4, name: 'Hồ Thị Quỳnh',   email: 'quynh.ht@student.edu.vn', avgScore: 9.2 },
  ],
  'Toán 12A': [
    { id: 1, name: 'An Thị Bảo',      email: 'bao.at@student.edu.vn',   avgScore: 8.2 },
    { id: 2, name: 'Bùi Văn Cường',   email: 'cuong.bv@student.edu.vn', avgScore: 7.6 },
    { id: 3, name: 'Châu Thị Dung',   email: 'dung.ct@student.edu.vn',  avgScore: 9.0 },
    { id: 4, name: 'Đặng Minh Đức',   email: 'duc.dm@student.edu.vn',   avgScore: 6.8 },
    { id: 5, name: 'Giang Thị Hương', email: 'huong.gt@student.edu.vn', avgScore: 8.5 },
  ],
  'Lý 12C': [
    { id: 1, name: 'Lê Hoàng Anh',   email: 'anh.lh@student.edu.vn',  avgScore: 7.6 },
    { id: 2, name: 'Phan Văn Đạt',   email: 'dat.pv@student.edu.vn',  avgScore: 8.4 },
    { id: 3, name: 'Trịnh Thị Nga',  email: 'nga.tt@student.edu.vn',  avgScore: 7.0 },
  ],
  'Hóa 10D': [
    { id: 1, name: 'Lê Hoàng Anh',   email: 'anh.lh@student.edu.vn',  avgScore: 8.1 },
    { id: 2, name: 'Đoàn Văn Phúc',  email: 'phuc.dv@student.edu.vn', avgScore: 6.9 },
    { id: 3, name: 'Hồ Thị Quỳnh',   email: 'quynh.ht@student.edu.vn', avgScore: 8.7 },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────

export function isPast(date: string) { return new Date(date) < new Date() }
export function fmtDate(iso: string) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
export function scoreColor(s: number) { return s >= 8 ? '#22C55E' : s >= 6.5 ? '#F59E0B' : '#EF4444' }

/** Flag đánh dấu bản sửa đổi: tăng version + ghi thời điểm sửa (dùng khi sửa bài đã giao). */
export function bumpVersion(a: Assignment): Pick<Assignment, 'version' | 'editedAt'> {
  return { version: a.version + 1, editedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
}

/** Lấy bài tập thật từ API theo assignmentId (chuỗi) → map sang Assignment cho trang chi tiết. */
export async function fetchAssignmentDetail(id: string): Promise<Assignment | null> {
  try {
    const [{ data: asg }, { data: subsRaw }] = await Promise.all([
      api.get(`/assignments/${id}`),
      api.get(`/assignments/${id}/submissions`),
    ])
    const subs: any[] = Array.isArray(subsRaw) ? subsRaw : subsRaw?.value ?? subsRaw?.items ?? []
    const target = asg.targets?.[0]
    const due = target?.dueDate ? new Date(target.dueDate) : null
    return {
      id: -1,
      title: asg.title ?? '',
      class: subs[0]?.assignmentTarget?.class?.name ?? '',
      status: (asg.targets?.length ?? 0) > 0 ? 'ASSIGNED' : 'DRAFT',
      durationMin: null,
      dueDate: due ? due.toISOString().slice(0, 10) : '',
      dueTime: due ? due.toTimeString().slice(0, 5) : '23:59',
      createdAt: asg.createdAt ? String(asg.createdAt).slice(0, 10) : '',
      totalQuestions: asg.questions?.length ?? 0,
      desc: '',
      questionIds: (asg.questions ?? []).map((q: any) => q.questionId ?? q.id),
      students: subs.map((s: any, i: number): StudentSubmission => ({
        id: i + 1,
        name: s.student?.fullName ?? s.student?.name ?? `Học sinh ${i + 1}`,
        completedAt: s.submittedAt ?? (s.status === 'SUBMITTED' || s.status === 'GRADED' ? s.updatedAt ?? null : null),
        score: s.totalScore ?? null,
        timeSpent: null,
        answers: [],
      })),
      version: 1,
      editedAt: null,
    }
  } catch {
    return null
  }
}

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
    status: 'ASSIGNED', durationMin: 45,
    dueDate: '2026-09-10', dueTime: '23:59', createdAt: '2026-08-20', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
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
    status: 'ASSIGNED', durationMin: null,
    dueDate: '2026-09-12', dueTime: '21:00', createdAt: '2026-08-21', totalQuestions: 5, desc: 'Ôn tập phần đạo hàm cơ bản',
    version: 2, editedAt: '2026-08-23 09:00',
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
    status: 'ASSIGNED', durationMin: 60,
    dueDate: '2026-08-18', dueTime: '22:30', createdAt: '2026-08-14', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
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
    status: 'ASSIGNED', durationMin: null,
    dueDate: '2026-09-15', dueTime: '23:59', createdAt: '2026-09-01', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
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
    status: 'ASSIGNED', durationMin: 30,
    dueDate: '2026-09-09', dueTime: '22:00', createdAt: '2026-09-02', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
    questionIds: ['q6', 'q8'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',   completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Phan Văn Đạt',   completedAt: '2026-09-03 15:30', score: 8.5, timeSpent: '18 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 3, name: 'Trịnh Thị Nga',  completedAt: null, score: null, timeSpent: null, answers: [] },
    ],
  },
  {
    id: 6, title: 'Kiểm tra 15 phút — Bảng tuần hoàn', class: 'Hóa 10D',
    status: 'ASSIGNED', durationMin: 15,
    dueDate: '2026-09-04', dueTime: '23:59', createdAt: '2026-08-30', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
    questionIds: ['q1', 'q2'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',   completedAt: '2026-09-03 19:20', score: 8.0, timeSpent: '12 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 2, name: 'Đoàn Văn Phúc',  completedAt: '2026-09-03 20:05', score: 7.0, timeSpent: '14 phút', answers: makeAnswers([true,false,true,false,true]) },
      { id: 3, name: 'Hồ Thị Quỳnh',   completedAt: null, score: null, timeSpent: null, answers: [] },
    ],
  },
  {
    id: 7, title: 'Bài tập vectơ — Ôn tập', class: 'Toán 10A',
    status: 'ASSIGNED', durationMin: null,
    dueDate: '2026-09-02', dueTime: '23:59', createdAt: '2026-08-26', totalQuestions: 5, desc: '',
    version: 3, editedAt: '2026-08-31 15:20',
    questionIds: ['q1', 'q3'],
    students: [
      { id: 1, name: 'Lê Hoàng Anh',    completedAt: null, score: null, timeSpent: null, answers: [] },
      { id: 2, name: 'Trần Minh Bảo',   completedAt: '2026-09-01 20:10', score: 8.5, timeSpent: '17 phút', answers: makeAnswers([true,true,true,false,true]) },
      { id: 3, name: 'Nguyễn Thị Châu', completedAt: '2026-09-02 08:45', score: 9.0, timeSpent: '15 phút', answers: makeAnswers([true,true,true,true,false]) },
      { id: 4, name: 'Đỗ Thị Lan',      completedAt: '2026-08-30 21:30', score: 9.5, timeSpent: '11 phút', answers: makeAnswers([true,true,true,true,true]) },
    ],
  },
  {
    id: 8, title: 'Ôn tập phương trình lượng giác', class: 'Toán 11B',
    status: 'SAVED', durationMin: 30,
    dueDate: '2026-11-05', dueTime: '23:59', createdAt: '2026-10-27', totalQuestions: 5, desc: '',
    version: 1, editedAt: null,
    questionIds: ['q2', 'q7'],
    students: [],
  },
  {
    id: 9, title: 'Bài tập nháp — chưa hoàn thiện', class: '',
    status: 'DRAFT', durationMin: null,
    dueDate: '', dueTime: '23:59', createdAt: '2026-10-28', totalQuestions: 0, desc: '',
    version: 1, editedAt: null,
    questionIds: [],
    students: [],
  },
]
