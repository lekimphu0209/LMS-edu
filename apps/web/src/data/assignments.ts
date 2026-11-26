import { api } from '@/lib/api'
import { apiToBankQuestion, type BankQuestion } from './questionBank'

// Shared assignment data — teacher view, backed by /assignments API

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
  id: string              // student id
  name: string
  submissionId: string | null
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
  id: string
  title: string
  class: string           // tên lớp của target đầu tiên (hiển thị)
  classId: string         // classId của target đầu tiên
  targetId: string | null // target dùng để sửa hạn nộp
  status: AssignmentStatus
  durationMin: number | null  // chưa có trên API — luôn null
  dueDate: string   // YYYY-MM-DD
  dueTime: string   // HH:MM
  createdAt: string
  totalQuestions: number
  desc: string
  questionIds: string[]
  questions: BankQuestion[] // nội dung câu hỏi đầy đủ (trang chi tiết)
  students: StudentSubmission[]
  totalStudents: number  // số HS được giao (list không cần students đầy đủ)
  doneCount: number      // số bài đã nộp
  version: number        // cờ client đánh dấu bản đã sửa
  editedAt: string | null
}

// ── Helpers ───────────────────────────────────────────────────────

export interface RosterStudent { id: string; name: string; email: string; avgScore?: number }

export function isPast(date: string) { return new Date(date) < new Date() }
export function fmtDate(iso: string) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
export function scoreColor(s: number) { return s >= 8 ? '#22C55E' : s >= 6.5 ? '#F59E0B' : '#EF4444' }

/** Flag đánh dấu bản sửa đổi: tăng version + ghi thời điểm sửa (client-side). */
export function bumpVersion(a: Assignment): Pick<Assignment, 'version' | 'editedAt'> {
  return { version: a.version + 1, editedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
}

const DONE_STATUSES = ['SUBMITTED', 'LATE', 'GRADED']

const fmtDT = (iso: string) => iso.slice(0, 16).replace('T', ' ')

const splitDue = (due: string | Date | null | undefined) => {
  if (!due) return { dueDate: '', dueTime: '23:59' }
  const d = new Date(due)
  return { dueDate: d.toISOString().slice(0, 10), dueTime: d.toTimeString().slice(0, 5) }
}

const earliestDueTarget = (targets: any[]) =>
  targets.filter(t => t.dueDate).sort((x, y) => +new Date(x.dueDate) - +new Date(y.dueDate))[0]

const statusOf = (a: any, targets: any[]): AssignmentStatus =>
  targets.length > 0 ? 'ASSIGNED' : a.type === 'SAVED' ? 'SAVED' : 'DRAFT'

// ── API ───────────────────────────────────────────────────────────

/** Danh sách bài tập của giáo viên — kèm lớp, hạn nộp, tiến độ nộp. */
export async function fetchAssignments(): Promise<Assignment[]> {
  const { data } = await api.get('/assignments')
  const items = Array.isArray(data) ? data : data?.data ?? []
  return items.map((a: any): Assignment => {
    const targets: any[] = a.targets ?? []
    const classTarget = targets.find(t => t.class) ?? targets[0]
    const dueTarget = earliestDueTarget(targets)
    const { dueDate, dueTime } = splitDue(dueTarget?.dueDate)
    return {
      id: String(a.id),
      title: a.title ?? '',
      class: classTarget?.class?.name ?? '',
      classId: classTarget?.classId ?? '',
      targetId: dueTarget?.id ?? targets[0]?.id ?? null,
      status: statusOf(a, targets),
      durationMin: null,
      dueDate,
      dueTime,
      createdAt: a.createdAt ? String(a.createdAt).slice(0, 10) : '',
      totalQuestions: a._count?.questions ?? 0,
      desc: '',
      questionIds: [],
      questions: [],
      students: [],
      totalStudents: targets.reduce((n, t) => n + (t.class?._count?.students ?? (t.student ? 1 : 0)), 0),
      doneCount: targets.reduce(
        (n, t) => n + (t.submissions ?? []).filter((s: any) => DONE_STATUSES.includes(s.status)).length,
        0,
      ),
      version: 1,
      editedAt: null,
    }
  })
}

/** Chi tiết bài tập: câu hỏi đầy đủ + danh sách học sinh (roster lớp merge với bài nộp). */
export async function fetchAssignmentDetail(id: string): Promise<Assignment | null> {
  try {
    const [{ data: asg }, { data: subsRaw }] = await Promise.all([
      api.get(`/assignments/${id}`),
      api.get(`/assignments/${id}/submissions`),
    ])
    const subs: any[] = Array.isArray(subsRaw) ? subsRaw : subsRaw?.value ?? subsRaw?.items ?? []
    const subByStudent = new Map<string, any>(subs.map((s: any) => [s.student?.id, s]))

    const targets: any[] = asg.targets ?? []
    const classTarget = targets.find(t => t.class) ?? targets[0]
    const dueTarget = earliestDueTarget(targets)
    const { dueDate, dueTime } = splitDue(dueTarget?.dueDate)

    // Gộp roster các lớp được giao + học sinh được giao trực tiếp, merge bài nộp.
    const students = new Map<string, StudentSubmission>()
    const pushStudent = (st: any) => {
      if (!st?.id || students.has(st.id)) return
      const sub = subByStudent.get(st.id)
      const done = sub && (sub.submittedAt || DONE_STATUSES.includes(sub.status))
      students.set(st.id, {
        id: String(st.id),
        name: st.fullName ?? st.name ?? 'Học sinh',
        submissionId: sub?.id ?? null,
        completedAt: done ? fmtDT(String(sub.submittedAt ?? sub.updatedAt)) : null,
        score: sub?.totalScore ?? null,
        timeSpent: null,
        answers: [],
      })
    }
    for (const t of targets) {
      for (const cs of t.class?.students ?? []) pushStudent(cs.student)
      if (t.student) pushStudent(t.student)
    }
    // Học sinh có submission nhưng không nằm trong roster (hiếm) vẫn được hiển thị.
    for (const s of subs) {
      if (s.student?.id && !students.has(s.student.id)) pushStudent(s.student)
    }

    const questions: BankQuestion[] = (asg.questions ?? [])
      .map((aq: any) => aq.question ?? aq)
      .filter((q: any) => q && q.questionText)
      .map(apiToBankQuestion)

    return {
      id: String(asg.id),
      title: asg.title ?? '',
      class: classTarget?.class?.name ?? subs[0]?.assignmentTarget?.class?.name ?? '',
      classId: classTarget?.classId ?? '',
      targetId: dueTarget?.id ?? targets[0]?.id ?? null,
      status: statusOf(asg, targets),
      durationMin: null,
      dueDate,
      dueTime,
      createdAt: asg.createdAt ? String(asg.createdAt).slice(0, 10) : '',
      totalQuestions: (asg.questions ?? []).length,
      desc: '',
      questionIds: (asg.questions ?? []).map((aq: any) => aq.questionId ?? aq.question?.id ?? aq.id),
      questions,
      students: [...students.values()],
      totalStudents: students.size,
      doneCount: [...students.values()].filter(s => s.completedAt).length,
      version: 1,
      editedAt: null,
    }
  } catch {
    return null
  }
}

export interface CreateAssignmentInput {
  title: string
  /** 'QUIZ' = giao ngay | 'SAVED' | 'DRAFT' */
  type?: string
  questionIds: string[]
}

export async function createAssignment(input: CreateAssignmentInput): Promise<{ id: string }> {
  const { data } = await api.post('/assignments', {
    title: input.title,
    type: input.type,
    questions: input.questionIds.map((questionId, i) => ({ questionId, orderIndex: i })),
  })
  return data
}

export async function updateAssignment(id: string, patch: { title?: string; type?: string }): Promise<void> {
  await api.patch(`/assignments/${id}`, patch)
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

export interface AssignTargetInput {
  classId?: string
  studentId?: string
  dueDate?: string // ISO datetime
}

export async function assignTarget(assignmentId: string, target: AssignTargetInput): Promise<void> {
  await api.post(`/assignments/${assignmentId}/targets`, target)
}

export async function updateTargetDue(assignmentId: string, targetId: string, dueDateIso: string): Promise<void> {
  await api.patch(`/assignments/${assignmentId}/targets/${targetId}`, { dueDate: dueDateIso })
}

// ── Bài làm của học sinh ──────────────────────────────────────────

/** Map một submission answer từ API sang QuestionAnswer (dùng chung teacher/student view). */
export function apiToReviewAnswer(ans: any, index: number): QuestionAnswer {
  const q = ans.question ?? {}
  const options: any[] = (q.options ?? [])
    .slice()
    .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  const optTexts = options.map((o) => o.optionText ?? '')
  const type: QuestionAnswer['type'] =
    q.type === 'MULTI' ? 'multiple' : q.type === 'FILL_BLANK' ? 'short' : 'single'

  const correctIdx = options
    .map((o, i) => (o.isCorrect ? i : -1))
    .filter((i) => i >= 0)
  const selectedIds: string[] = Array.isArray(ans.selectedOptionIds) ? ans.selectedOptionIds : []
  const selIdx = options
    .map((o, i) => (selectedIds.includes(o.id) ? i : -1))
    .filter((i) => i >= 0)

  let correct: QuestionAnswer['correct']
  let studentAnswer: QuestionAnswer['studentAnswer']
  if (type === 'short') {
    correct = options.find((o) => o.isCorrect)?.optionText ?? ''
    studentAnswer = ans.textAnswer ?? ''
  } else if (type === 'multiple') {
    correct = correctIdx
    studentAnswer = selIdx
  } else {
    correct = correctIdx[0] ?? 0
    studentAnswer = selIdx[0] ?? -1
  }

  const isCorrect =
    ans.isCorrect ??
    (type === 'short'
      ? typeof correct === 'string' &&
        correct !== '' &&
        String(studentAnswer).trim().toLowerCase() === correct.toLowerCase()
      : type === 'multiple'
        ? JSON.stringify([...(correct as number[])].sort()) ===
          JSON.stringify([...(studentAnswer as number[])].sort())
        : studentAnswer === correct && (studentAnswer as number) >= 0)

  return {
    qi: index + 1,
    text: q.questionText ?? '',
    type,
    options: optTexts,
    correct,
    studentAnswer,
    isCorrect,
  }
}

/** Lấy đáp án chi tiết một bài nộp (giáo viên xem bài làm của học sinh). */
export async function fetchSubmissionAnswers(submissionId: string): Promise<QuestionAnswer[]> {
  const { data } = await api.get(`/submissions/${submissionId}`)
  return (data.answers ?? []).map((ans: any, i: number) => apiToReviewAnswer(ans, i))
}
