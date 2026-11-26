// Student-facing data layer — real data from /api/students/me/*
// Lỗi API → trả về rỗng/null để UI hiện empty-state (không còn mock fallback).

import { api } from '@/lib/api'
import { apiToReviewAnswer, fmtDate, type Assignment, type QuestionAnswer } from './assignments'
import { CATEGORY_LABELS, type FeedbackCategory } from './feedback'

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
  nextDue: { title: string; dueDate: string; dueTime?: string; daysLeft: number; overdue: boolean } | null
}

export async function getEnrolledClasses(): Promise<EnrolledClass[]> {
  try {
    const { data } = await api.get<EnrolledClass[]>('/students/me/classes')
    return data
  } catch {
    return []
  }
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
    const mapped = (Array.isArray(data) ? data : []).map(apiToStudentAssignment)
    return className ? mapped.filter((a) => a.className === className) : mapped
  } catch {
    return []
  }
}

export function isAssignmentDone(a: StudentAssignment | Assignment): boolean {
  if ('done' in a) return a.done
  return a.students.length > 0 && a.students.every((s) => !!s.completedAt)
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
    return null
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
    return []
  }
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
    return (Array.isArray(data) ? data : []).map((f: any) => ({
      id: f.id,
      class: f.className ?? '',
      classId: f.classId ?? null,
      className: f.className ?? '',
      student: f.student ?? '',
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
    return []
  }
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

export async function getQuiz(assignmentId: string): Promise<QuizData> {
  const { data } = await api.get(`/students/me/assignments/${assignmentId}/quiz`)
  return data as QuizData
}

export async function submitQuiz(targetId: string, answers: QuizAnswer[]) {
  const { data: submission } = await api.post('/submissions/start', { assignmentTargetId: targetId })
  return api.post(`/submissions/${submission.id}/submit`, { answers })
}
