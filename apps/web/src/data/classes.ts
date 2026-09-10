// Shared class data — used by both teacher and student views

export interface ClassData {
  id: number
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
    id: 1, name: 'Toán 10A', subject: 'Toán học', grade: 'Lớp 10',
    students: 38, pendingSubmissions: 12, avgScore: 7.8,
    color: '#2563EB', schedule: 'Thứ 2, 4, 6 · 07:30', room: 'P.201',
    progress: 65,
  },
  {
    id: 2, name: 'Toán 11B', subject: 'Toán học', grade: 'Lớp 11',
    students: 35, pendingSubmissions: 5, avgScore: 8.2,
    color: '#7C3AED', schedule: 'Thứ 3, 5 · 09:15', room: 'P.305',
    progress: 52,
  },
  {
    id: 3, name: 'Lý 12C', subject: 'Vật lý', grade: 'Lớp 12',
    students: 32, pendingSubmissions: 0, avgScore: 8.5,
    color: '#22C55E', schedule: 'Thứ 2, 4 · 13:30', room: 'P.102',
    progress: 80,
  },
  {
    id: 4, name: 'Hóa 10D', subject: 'Hóa học', grade: 'Lớp 10',
    students: 30, pendingSubmissions: 8, avgScore: 7.1,
    color: '#F59E0B', schedule: 'Thứ 3, 6 · 07:30', room: 'P.Lab1',
    progress: 40,
  },
  {
    id: 5, name: 'Toán 12A', subject: 'Toán học', grade: 'Lớp 12',
    students: 36, pendingSubmissions: 3, avgScore: 8.9,
    color: '#EF4444', schedule: 'Thứ 2, 5 · 07:30', room: 'P.204',
    progress: 88,
  },
]
