// Student-facing mock data — derived from shared teacher data
// Links: classes → data/classes, curriculum → teacher outlines, assignments → data/assignments, quiz → data/questionBank

import { seedQuestions, type BankQuestion } from './questionBank'
import { seedOutlines } from '@/features/teacher/shared/data/outlines'
import { teacherClasses } from './classes'
import { seedAssignments, fmtDate, type Assignment } from './assignments'
import { seedFeedbacks, type Feedback } from './feedback'

// The demo student account (matches a submission name in seedAssignments)
export const STUDENT_NAME = 'Lê Hoàng Anh'

// ── Enrolled classes ──────────────────────────────────────────────

export interface EnrolledClass {
  id: number
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

const enrolledClassIds = [1, 2, 3, 4] // Toán 10A, Toán 11B, Lý 12C, Hóa 10D

const classTeachers: Record<number, string> = {
  1: 'Nguyễn Văn An',
  2: 'Nguyễn Văn An',
  3: 'Lê Minh Cường',
  4: 'Trần Thị Bình',
  5: 'Nguyễn Văn An',
}

const classIcons: Record<string, string> = {
  'Toán học': '∑',
  'Vật lý': 'φ',
  'Hóa học': '⚗',
  'Ngữ văn': '✍',
  'Tiếng Anh': 'A',
}

export function getClassTeacher(className: string): string {
  const cls = teacherClasses.find((c) => c.name === className)
  return cls ? classTeachers[cls.id] ?? 'Nguyễn Văn An' : 'Nguyễn Văn An'
}

// Student's own progress per class (differs from class-wide progress)
const studentProgress: Record<number, number> = { 1: 72, 2: 58, 3: 85, 4: 40 }

function studentSubmission(a: Assignment) {
  return a.students.find((s) => s.name === STUDENT_NAME)
}

export function isAssignmentDone(a: Assignment) {
  return !!studentSubmission(a)?.completedAt
}

export function getEnrolledClasses(): EnrolledClass[] {
  const now = Date.now()
  return teacherClasses
    .filter((c) => enrolledClassIds.includes(c.id))
    .map((c) => {
      const classAssignments = seedAssignments.filter((a) => a.class === c.name)
      const pendingList = classAssignments
        .filter((a) => !isAssignmentDone(a))
        .map((a) => ({ a, dueAt: new Date(`${a.dueDate}T${a.dueTime}:00`).getTime() }))
        .sort((x, y) => x.dueAt - y.dueAt)
      const scores = classAssignments
        .map((a) => studentSubmission(a)?.score)
        .filter((s): s is number => typeof s === 'number')
      const next = pendingList[0]
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        grade: c.grade,
        schedule: c.schedule,
        room: c.room,
        teacher: classTeachers[c.id] ?? 'Nguyễn Văn An',
        progress: studentProgress[c.id] ?? 0,
        icon: classIcons[c.subject] ?? c.name.charAt(0),
        color: c.color,
        pending: pendingList.length,
        completed: classAssignments.length - pendingList.length,
        avgScore: scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null,
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

export function getEnrolledClass(id: number | string | undefined): EnrolledClass | undefined {
  return getEnrolledClasses().find((c) => c.id === Number(id))
}

// ── Assignments (student view) ────────────────────────────────────

export interface StudentAssignment {
  id: number
  title: string
  className: string
  type: string
  due: string // dd/mm/yyyy
  dueDate: string // YYYY-MM-DD
  dueTime: string // HH:MM
  dueAt: number // timestamp for sorting
  daysLeft: number // negative when overdue
  overdue: boolean
  questions: number
  done: boolean
  score: number | null
  submittedDate: string | null
  maxScore: number
}

export function getStudentAssignments(className?: string): StudentAssignment[] {
  const enrolledNames = getEnrolledClasses().map((c) => c.name)
  return seedAssignments
    .filter((a) => enrolledNames.includes(a.class) && (!className || a.class === className))
    .map((a) => {
      const sub = studentSubmission(a)
      const dueAt = new Date(`${a.dueDate}T${a.dueTime}:00`).getTime()
      const daysLeft = Math.ceil((dueAt - Date.now()) / 86400000)
      const done = isAssignmentDone(a)
      return {
        id: a.id,
        title: a.title,
        className: a.class,
        type: 'Trắc nghiệm',
        due: fmtDate(a.dueDate),
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        dueAt,
        daysLeft,
        overdue: !done && dueAt < Date.now(),
        questions: a.totalQuestions,
        done,
        score: sub?.score ?? null,
        submittedDate: sub?.completedAt ?? null,
        maxScore: 10,
      }
    })
    .sort((a, b) => a.dueAt - b.dueAt)
}

// ── Curriculum (from teacher outlines) ────────────────────────────

export interface CurriculumSection {
  id: string
  title: string
  done: boolean
  score: number | null
  timeMin: number
}

export interface CurriculumChapter {
  id: string
  title: string
  color: string
  sections: CurriculumSection[]
}

// Student's completion state per exercise id (exercise ids come from teacher outlines)
const exerciseProgress: Record<string, { done: boolean; score: number | null; timeMin: number }> = {
  e1: { done: true, score: 9.0, timeMin: 35 },
  e2: { done: true, score: 8.5, timeMin: 42 },
  e3: { done: false, score: null, timeMin: 0 },
  e4: { done: true, score: 8.0, timeMin: 38 },
  e4b: { done: false, score: null, timeMin: 0 },
  e5: { done: true, score: 8.5, timeMin: 30 },
  e6: { done: true, score: 7.5, timeMin: 25 },
  e7: { done: false, score: null, timeMin: 0 },
  e8: { done: true, score: 7.0, timeMin: 40 },
  e9: { done: false, score: null, timeMin: 0 },
}

export function getCurriculum(classId: number | string | undefined): CurriculumChapter[] {
  const cls = teacherClasses.find((c) => c.id === Number(classId))
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
      done: exerciseProgress[ex.id]?.done ?? false,
      score: exerciseProgress[ex.id]?.score ?? null,
      timeMin: exerciseProgress[ex.id]?.timeMin ?? 0,
    })),
  }))
}

// ── Feedback (from shared feedback data) ────────────────────────

function parseVnDate(d: string) {
  const [dd, mm, yyyy] = d.split('/').map(Number)
  return new Date(yyyy, mm - 1, dd).getTime()
}

export function getStudentFeedbacks(): Feedback[] {
  return seedFeedbacks
    .filter((f) => f.student === STUDENT_NAME)
    .sort((a, b) => parseVnDate(b.date) - parseVnDate(a.date))
}

// ── Quiz (questions from the shared question bank) ────────────────

export interface QuizQuestion {
  id: string
  type: 'single' | 'multiple' | 'fill'
  text: string
  options: string[]
}

export interface QuizData {
  title: string
  className: string
  questions: QuizQuestion[]
}

function toQuizQuestion(q: BankQuestion): QuizQuestion {
  return {
    id: q.id,
    type: q.type === 'short' ? 'fill' : q.type,
    text: q.text,
    options: q.answers,
  }
}

export function getQuiz(assignmentId?: number): QuizData {
  const assignment =
    seedAssignments.find((a) => a.id === assignmentId) ??
    seedAssignments.find((a) => !isAssignmentDone(a)) ??
    seedAssignments[0]
  const questions = assignment.questionIds
    .map((qid) => seedQuestions.find((q) => q.id === qid))
    .filter((q): q is BankQuestion => !!q)
    .map(toQuizQuestion)
  return { title: assignment.title, className: assignment.class, questions }
}
