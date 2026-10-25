import { api } from '@/lib/api'

// Shared class data — used by both teacher and student views

export interface ClassData {
  id: string
  name: string
  subject: string
  grade: string
  students: number
  pendingSubmissions: number
  avgScore: number
  color: string
  schedule: string
  room: string
  progress: number
}

export const teacherClasses: ClassData[] = [
  {
    id: 't1', name: 'Toán 10A', subject: 'Toán học', grade: 'Lớp 10',
    students: 38, pendingSubmissions: 12, avgScore: 7.8,
    color: '#2563EB', schedule: 'Thứ 2, 4, 6 · 07:30', room: 'P.201',
    progress: 65,
  },
  {
    id: 't2', name: 'Toán 11B', subject: 'Toán học', grade: 'Lớp 11',
    students: 35, pendingSubmissions: 5, avgScore: 8.2,
    color: '#7C3AED', schedule: 'Thứ 3, 5 · 09:15', room: 'P.305',
    progress: 52,
  },
  {
    id: 't3', name: 'Lý 12C', subject: 'Vật lý', grade: 'Lớp 12',
    students: 32, pendingSubmissions: 0, avgScore: 8.5,
    color: '#22C55E', schedule: 'Thứ 2, 4 · 13:30', room: 'P.102',
    progress: 80,
  },
  {
    id: 't4', name: 'Hóa 10D', subject: 'Hóa học', grade: 'Lớp 10',
    students: 30, pendingSubmissions: 8, avgScore: 7.1,
    color: '#F59E0B', schedule: 'Thứ 3, 6 · 07:30', room: 'P.Lab1',
    progress: 40,
  },
  {
    id: 't5', name: 'Toán 12A', subject: 'Toán học', grade: 'Lớp 12',
    students: 36, pendingSubmissions: 3, avgScore: 8.9,
    color: '#EF4444', schedule: 'Thứ 2, 5 · 07:30', room: 'P.204',
    progress: 88,
  },
]

export async function getTeacherClasses(): Promise<ClassData[]> {
  const { data } = await api.get('/classes')
  const items = Array.isArray(data) ? data : data?.data ?? data?.value ?? data?.items ?? []
  if (!items?.length) return []
  return items.map((c: any) => ({
    id: String(c.id ?? c._id),
    name: c.name ?? '',
    subject: typeof c.subject === 'object' ? (c.subject?.name ?? '') : (c.subject ?? ''),
    grade: c.grade ?? '',
    students: c.stats?.totalStudents ?? c._count?.students ?? c.students ?? 0,
    pendingSubmissions: c.stats?.ungradedSubmissions ?? c.pendingSubmissions ?? 0,
    avgScore: c.avgScore ?? 0,
    color: c.color ?? '#2563EB',
    schedule: c.schedule ?? '',
    room: c.room ?? '',
    progress: c.progress ?? 0,
  })) as ClassData[]
}

export interface ClassAssignment {
  id: string
  assignmentId: string
  title: string
  due: string | null
  type: string
  submitted: number
  total: number
  status: string
}

export interface ClassStudent {
  id: string
  name: string
  avatar: string
  assignments: Record<string, string>
  score: number
}

export interface ClassDetail {
  id: string
  name: string
  subject: string
  grade: string
  students: number
  color: string
  schedule: string
  room: string
  classStudents: ClassStudent[]
  assignments: ClassAssignment[]
  avgScore: number
}

export async function getTeacherClassDetail(id: string): Promise<ClassDetail> {
  try {
    const [{ data: cls }, { data: studentsRaw }, { data: assignmentsRaw }] = await Promise.all([
      api.get(`/classes/${id}`),
      api.get(`/classes/${id}/students`),
      api.get(`/classes/${id}/assignments`),
    ])

    const classStudents: any[] = Array.isArray(studentsRaw)
      ? studentsRaw
      : studentsRaw.value ?? studentsRaw.items ?? []
    const assignments: any[] = Array.isArray(assignmentsRaw)
      ? assignmentsRaw
      : assignmentsRaw.value ?? assignmentsRaw.items ?? []

    const assignmentIds = assignments.map((a: any) => a.assignmentId ?? a.id)

    const submissionsByAssignment = await Promise.all(
      assignmentIds.map(async (assignmentId: string) => {
        const { data: subs } = await api.get(`/assignments/${assignmentId}/submissions`)
        return { assignmentId, subs: Array.isArray(subs) ? subs : subs.value ?? subs.items ?? [] }
      }),
    )

    const studentMap = new Map<string, ClassStudent>()
    for (const cs of classStudents) {
      const s = cs.student ?? cs
      studentMap.set(s.id, {
        id: s.id,
        name: s.fullName ?? s.name,
        avatar: (s.fullName ?? s.name ?? 'A').charAt(0).toUpperCase(),
        assignments: {},
        score: 0,
      })
    }

    const scoreMap = new Map<string, number[]>()
    for (const { assignmentId, subs } of submissionsByAssignment) {
      const a = assignments.find((x: any) => x.assignmentId === assignmentId)
      const key = a?.assignmentId ?? assignmentId
      for (const sub of subs) {
        const st = studentMap.get(sub.studentId)
        if (!st) continue
        const status = sub.status
        st.assignments[key] =
          status === 'SUBMITTED' || status === 'GRADED'
            ? 'submitted'
            : status === 'LATE'
              ? 'late'
              : 'pending'
        const scores = scoreMap.get(sub.studentId) ?? []
        if (sub.totalScore != null) scores.push(sub.totalScore)
        scoreMap.set(sub.studentId, scores)
      }
    }

    for (const [sid, st] of studentMap) {
      st.score = (scoreMap.get(sid) ?? []).reduce((a, s) => a + s, 0) / (scoreMap.get(sid)?.length || 1)
    }

    const classAssignments: ClassAssignment[] = assignments.map((a: any) => ({
      id: a.assignmentId ?? a.id,
      assignmentId: a.assignmentId ?? a.id,
      title: a.title,
      due: a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : null,
      type: a.status === 'SCHEDULED' ? 'Sắp mở' : a.status === 'CLOSED' ? 'Đã đóng' : 'Trắc nghiệm',
      submitted: a.submittedCount ?? 0,
      total: a.totalStudents ?? classStudents.length ?? 0,
      status: a.status,
    }))

    return {
      id: String(cls.id ?? id),
      name: cls.name,
      subject: cls.subject,
      grade: cls.grade ?? '',
      students: classStudents.length,
      color: cls.color ?? '#2563EB',
      schedule: cls.schedule ?? '',
      room: cls.room ?? '',
      classStudents: [...studentMap.values()],
      assignments: classAssignments,
      avgScore: 0,
    }
  } catch {
    return {
      id,
      name: 'Lớp học',
      subject: 'Môn học',
      grade: '',
      students: 0,
      color: '#2563EB',
      schedule: '',
      room: '',
      classStudents: [],
      assignments: [],
      avgScore: 0,
    }
  }
}
