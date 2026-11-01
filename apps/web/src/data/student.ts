// Student-facing data layer — calls /api/students/me/*
// Falls back to the old mock data if the API is unavailable.

import { api } from '@/lib/api'
import { seedQuestions, type BankQuestion } from './questionBank'
import { seedOutlines } from '@/features/teacher/shared/data/outlines'
import { teacherClasses } from './classes'
import { seedAssignments, fmtDate, type Assignment, type QuestionAnswer } from './assignments'
import { seedFeedbacks, CATEGORY_LABELS, type FeedbackCategory } from './feedback'

export const STUDENT_NAME = 'Lê Hoàng Anh'

// Mock helpers (fallback) ─────────────────────────────────────────

const classIcons: Record<string, string> = {
  'Toán học': 'T',
  'Vật lý': 'L',
  'Hóa học': 'H',
  'Ngữ văn': 'V',
  'Tiếng Anh': 'A',
}

const classTeacherMap: Record<string, string> = {
  'Toán 10A': 'Nguyễn Văn An',
  'Toán 11B': 'Nguyễn Văn An',
  'Lý 12C': 'Lê Minh Cường',
  'Hóa 10D': 'Trần Thị Bình',
  'Toán 12A': 'Nguyễn Văn An',
}

function mockClassTeacher(className: string) {
  return classTeacherMap[className] ?? 'Nguyễn Văn An'
}

const studentProgress: Record<string, number> = {
  'Toán 10A': 72,
  'Toán 11B': 58,
  'Lý 12C': 85,
  'Hóa 10D': 40,
}

function mockStudentSubmission(a: Assignment) {
  return a.students.find((s) => s.name === STUDENT_NAME)
}

function mockIsAssignmentDone(a: Assignment) {
  return !!mockStudentSubmission(a)?.completedAt
}

// ── Enrolled classes ──────────────────────────────────────────────

export interface EnrolledClass {
  id: string
  name: string
  teacher: string
  subject: string
  grade: string
  schedule: string
  room: string
  progress: number
  icon: string
  color: string
  pending: number
  completed: number
  avgScore: number | null
  nextDue: { title: string; dueDate: string; dueTime: string; daysLeft: number; overdue: boolean } | null
}

export async function getEnrolledClasses(): Promise<EnrolledClass[]> {
  try {
    const { data } = await api.get<EnrolledClass[]>('/students/me/classes')
    return data
  } catch {
    return mockGetEnrolledClasses()
  }
}

function mockGetEnrolledClasses(): EnrolledClass[] {
  const now = Date.now()
  return ['Toán 10A', 'Toán 11B', 'Lý 12C', 'Hóa 10D']
    .map((name) => teacherClasses.find((c) => c.name === name))
    .filter((c): c is typeof teacherClasses[0] => !!c)
    .map((c) => {
      const classAssignments = seedAssignments.filter((a) => a.class === c.name)
      const pendingList = classAssignments
        .filter((a) => !mockIsAssignmentDone(a))
        .map((a) => ({ a, dueAt: new Date(`${a.dueDate}T${a.dueTime}:00`).getTime() }))
        .sort((x, y) => x.dueAt - y.dueAt)
      const scores = classAssignments
        .map((a) => mockStudentSubmission(a)?.score)
        .filter((s): s is number => typeof s === 'number')
      const next = pendingList[0]

      return {
        id: String(c.id),
        name: c.name,
        subject: c.subject,
        grade: c.grade,
        schedule: c.schedule,
        room: c.room,
        teacher: mockClassTeacher(c.name),
        progress: studentProgress[c.name] ?? 0,
        icon: classIcons[c.subject] ?? c.name.charAt(0),
        color: c.color,
        pending: pendingList.length,
        completed: classAssignments.length - pendingList.length,
        avgScore: scores.length
          ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
          : null,
        nextDue: next
          ? {
              title: next.a.title,
              dueDate: fmtDate(next.a.dueDate),
              dueTime: next.a.dueTime,
              daysLeft: Math.ceil((next.dueAt - now) / 86400000),
              overdue: next.dueAt < now,
            }
          : null,
      }
    })
}

export async function getEnrolledClass(id: string | undefined): Promise<EnrolledClass | undefined> {
  const classes = await getEnrolledClasses()
  return classes.find((c) => c.id === id)
}

// ── Assignments ───────────────────────────────────────────────────

export interface StudentAssignment {
  id: string
  targetId: string
  title: string
  classId: string | null
  className: string
  type: string
  due: string
  dueDate: string
  dueTime: string
  dueAt: number | null
  daysLeft: number
  overdue: boolean
  questions: number
  done: boolean
  score: number | null
  submittedDate: string | null
  submissionId: string | null
  maxScore: number
}

function apiToStudentAssignment(a: any): StudentAssignment {
  return {
    id: a.id,
    targetId: a.targetId,
    title: a.title,
    classId: a.classId ?? null,
    className: a.className,
    type: a.type,
    due: a.dueDate ? fmtDate(a.dueDate.slice(0, 10)) : '',
    dueDate: a.dueDate ? a.dueDate.slice(0, 10) : '',
    dueTime: a.dueDate ? a.dueDate.slice(11, 16) : '',
    dueAt: a.dueAt ? new Date(a.dueAt).getTime() : null,
    daysLeft: a.daysLeft ?? 0,
    overdue: a.overdue ?? false,
    questions: a.questions ?? 0,
    done: a.done ?? false,
    score: a.score ?? null,
    submittedDate: a.submittedAt ?? null,
    submissionId: a.submissionId ?? null,
    maxScore: a.maxScore ?? 10,
  }
}

export async function getStudentAssignments(className?: string): Promise<StudentAssignment[]> {
  try {
    const { data } = await api.get<StudentAssignment[]>('/students/me/assignments')
    const mapped = data.map(apiToStudentAssignment)
    return className ? mapped.filter((a) => a.className === className) : mapped
  } catch {
    return mockGetStudentAssignments(className)
  }
}

function mockGetStudentAssignments(className?: string): StudentAssignment[] {
  const enrolledNames = ['Toán 10A', 'Toán 11B', 'Lý 12C', 'Hóa 10D']
  return seedAssignments
    .filter((a) => enrolledNames.includes(a.class) && (!className || a.class === className))
    .map((a) => {
      const sub = mockStudentSubmission(a)
      const dueAt = new Date(`${a.dueDate}T${a.dueTime}:00`).getTime()
      const done = mockIsAssignmentDone(a)
      return {
        id: String(a.id),
        targetId: String(a.id),
        title: a.title,
        classId: String(teacherClasses.find((c) => c.name === a.class)?.id ?? '') || null,
        className: a.class,
        type: 'Trắc nghiệm',
        due: fmtDate(a.dueDate),
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        dueAt,
        daysLeft: Math.ceil((dueAt - Date.now()) / 86400000),
        overdue: !done && dueAt < Date.now(),
        questions: a.totalQuestions,
        done,
        score: sub?.score ?? null,
        submittedDate: sub?.completedAt ?? null,
        submissionId: done ? String(a.id) : null,
        maxScore: 10,
      }
    })
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
}

export function isAssignmentDone(a: StudentAssignment | Assignment): boolean {
  if ('done' in a) return a.done
  return !!mockStudentSubmission(a)?.completedAt
}

/** ISO / 'YYYY-MM-DD HH:mm' → 'DD/MM/YYYY HH:mm' (giữ nguyên nếu không parse được) */
export function fmtDateTime(s: string) {
  const d = new Date(s.replace(' ', 'T'))
  if (isNaN(d.getTime())) return s
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Assignment review (bài làm của học sinh: câu hỏi + đáp án đã chọn) ──

export interface AssignmentReview {
  title: string
  status: string
  score: number | null
  maxScore: number
  submittedAt: string | null
  answers: QuestionAnswer[]
}

export async function getAssignmentReview(submissionId: string): Promise<AssignmentReview | null> {
  try {
    const { data } = await api.get(`/submissions/${submissionId}`)
    const asg = data.assignmentTarget?.assignment
    const answers: QuestionAnswer[] = (data.answers ?? []).map((ans: any, i: number) =>
      apiToReviewAnswer(ans, i),
    )
    return {
      title: asg?.title ?? '',
      status: data.status ?? '',
      score: data.totalScore ?? null,
      maxScore: asg?.maxScore ?? 10,
      submittedAt: data.submittedAt ?? null,
      answers,
    }
  } catch {
    return mockGetAssignmentReview(submissionId)
  }
}

function apiToReviewAnswer(ans: any, index: number): QuestionAnswer {
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

function mockGetAssignmentReview(assignmentId: string): AssignmentReview | null {
  const a = seedAssignments.find((x) => String(x.id) === assignmentId)
  if (!a) return null
  const sub = mockStudentSubmission(a)
  if (!sub?.completedAt) return null
  return {
    title: a.title,
    status: 'GRADED',
    score: sub.score,
    maxScore: 10,
    submittedAt: sub.completedAt,
    answers: sub.answers,
  }
}

// ── Curriculum ────────────────────────────────────────────────────

export interface CurriculumSection {
  id: string
  title: string
  done: boolean
  score: number | null
  timeMin: number
  completedAt?: string | null
}

export interface CurriculumChapter {
  id: string
  title: string
  color: string
  sections: CurriculumSection[]
}

export async function getCurriculum(classId: string | undefined): Promise<CurriculumChapter[]> {
  try {
    const { data } = await api.get(`/students/me/classes/${classId}`)
    return ((data.curriculum ?? []) as CurriculumChapter[]).map((ch) => ({
      ...ch,
      sections: (ch.sections ?? []).map((s) => ({ ...s, timeMin: s.timeMin ?? 0 })),
    }))
  } catch {
    return mockGetCurriculum(classId)
  }
}

const mockExerciseProgress: Record<
  string,
  { done: boolean; score: number | null; timeMin: number; completedAt: string | null }
> = {
  // Toán 10A
  e1: { done: true, score: 9.0, timeMin: 35, completedAt: '2026-09-12T08:30:00' },
  e2: { done: true, score: 8.5, timeMin: 42, completedAt: '2026-09-25T20:15:00' },
  e10: { done: true, score: 8.0, timeMin: 30, completedAt: '2026-10-26T21:00:00' },
  e3: { done: true, score: 6.5, timeMin: 48, completedAt: '2026-10-18T19:10:00' },
  e11: { done: false, score: null, timeMin: 0, completedAt: null },
  e12: { done: true, score: 7.5, timeMin: 15, completedAt: '2026-10-30T17:45:00' },
  // Toán 11B
  e4: { done: true, score: 8.0, timeMin: 38, completedAt: '2026-10-08T19:40:00' },
  e13: { done: true, score: 9.0, timeMin: 36, completedAt: '2026-10-20T18:25:00' },
  e4b: { done: true, score: 7.0, timeMin: 44, completedAt: '2026-10-27T20:30:00' },
  e14: { done: false, score: null, timeMin: 0, completedAt: null },
  // Lý 12C
  e5: { done: true, score: 8.5, timeMin: 30, completedAt: '2026-10-15T21:05:00' },
  e6: { done: true, score: 7.5, timeMin: 25, completedAt: '2026-10-24T18:20:00' },
  e15: { done: true, score: 6.5, timeMin: 40, completedAt: '2026-10-10T20:00:00' },
  e7: { done: true, score: 8.0, timeMin: 33, completedAt: '2026-10-30T19:50:00' },
  e16: { done: false, score: null, timeMin: 0, completedAt: null },
  // Hóa 10D
  e8: { done: true, score: 7.0, timeMin: 40, completedAt: '2026-10-29T20:00:00' },
  e17: { done: true, score: 8.5, timeMin: 32, completedAt: '2026-10-28T21:15:00' },
  e9: { done: true, score: 6.0, timeMin: 28, completedAt: '2026-10-21T19:35:00' },
  e18: { done: false, score: null, timeMin: 0, completedAt: null },
}

function mockGetCurriculum(classId: string | undefined): CurriculumChapter[] {
  const cls = teacherClasses.find((c) => String(c.id) === classId)
  if (!cls) return []
  const outline = seedOutlines.find((o) => o.title.startsWith(cls.name))
  if (!outline) return []
  return outline.sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    color: cls.color,
    sections: sec.exercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      done: mockExerciseProgress[ex.id]?.done ?? false,
      score: mockExerciseProgress[ex.id]?.score ?? null,
      timeMin: mockExerciseProgress[ex.id]?.timeMin ?? 0,
      completedAt: mockExerciseProgress[ex.id]?.completedAt ?? null,
    })),
  }))
}

// ── Feedback ──────────────────────────────────────────────────────

export interface Feedback {
  id: string
  class: string
  className: string
  classId: string | null
  student: string
  teacherName?: string
  title: string
  category: FeedbackCategory
  message: string
  reply?: { text: string; date: string; teacher: string }
  date: string
  replied: boolean
  isRead?: boolean
  createdAt?: string
  repliedAt?: string | null
}

export async function getStudentFeedbacks(): Promise<Feedback[]> {
  try {
    const { data } = await api.get('/students/me/feedbacks')
    return data.map((f: any) => ({
      id: f.id,
      class: f.className ?? '',
      classId: f.classId ?? null,
      className: f.className ?? '',
      student: f.student ?? STUDENT_NAME,
      teacherName: f.teacherName,
      title: f.title,
      category: (() => {
        const c = String(f.category ?? '').toLowerCase() as FeedbackCategory
        return CATEGORY_LABELS[c] ? c : 'question'
      })(),
      message: f.content,
      date: f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : '',
      reply: f.reply
        ? {
            text: f.reply,
            date: f.repliedAt ? new Date(f.repliedAt).toLocaleDateString('vi-VN') : '',
            teacher: f.teacherName ?? '',
          }
        : undefined,
      replied: !!f.reply,
      isRead: f.isRead,
      createdAt: f.createdAt,
      repliedAt: f.repliedAt,
    }))
  } catch {
    return mockGetStudentFeedbacks()
  }
}

function mockGetStudentFeedbacks(): Feedback[] {
  return seedFeedbacks
    .filter((f) => f.student === STUDENT_NAME)
    .map((f) => ({
      id: String(f.id),
      class: f.class,
      classId: null,
      className: f.class,
      student: f.student,
      title: f.title,
      category: f.category,
      message: f.message,
      date: f.date,
      replied: f.replied,
      reply: f.reply,
    }))
    .sort((a, b) => {
      const [ad, am, ay] = a.date.split('/').map(Number)
      const [bd, bm, by] = b.date.split('/').map(Number)
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()
    })
}

export async function getClassTeacher(className: string): Promise<string> {
  const classes = await getEnrolledClasses()
  return classes.find((c) => c.name === className)?.teacher ?? ''
}

export async function createStudentFeedback(payload: {
  classId: string
  title: string
  category: FeedbackCategory
  content: string
}): Promise<void> {
  await api.post('/students/me/feedbacks', payload)
}

// ── Quiz ──────────────────────────────────────────────────────────

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  type: 'single' | 'multiple' | 'fill'
  text: string
  options: QuizOption[]
}

export interface QuizData {
  targetId: string
  title: string
  className: string
  dueDate: string | null
  questions: QuizQuestion[]
}

export interface QuizAnswer {
  questionId: string
  selectedOptionIds?: string[]
  textAnswer?: string
}

function toQuizQuestion(q: BankQuestion): QuizQuestion {
  return {
    id: q.id,
    type: q.type === 'short' ? 'fill' : q.type,
    text: q.text,
    options: q.answers.map((text, i) => ({
      id: `${q.id}-opt-${i}`,
      text,
    })),
  }
}

export async function getQuiz(assignmentId: string): Promise<QuizData> {
  try {
    const { data } = await api.get(`/students/me/assignments/${assignmentId}/quiz`)
    return data as QuizData
  } catch {
    return mockGetQuiz(assignmentId)
  }
}

export async function submitQuiz(targetId: string, answers: QuizAnswer[]) {
  const { data: submission } = await api.post('/submissions/start', { assignmentTargetId: targetId })
  return api.post(`/submissions/${submission.id}/submit`, { answers })
}

function mockGetQuiz(assignmentId: string): QuizData {
  const a =
    seedAssignments.find((x) => String(x.id) === assignmentId) ??
    seedAssignments.find((x) => !mockIsAssignmentDone(x)) ??
    seedAssignments[0]
  const questions = a.questionIds
    .map((qid) => seedQuestions.find((q) => q.id === qid))
    .filter((q): q is BankQuestion => !!q)
    .map(toQuizQuestion)
  return { targetId: String(a.id), title: a.title, className: a.class, dueDate: null, questions }
}
