/**
 * Kiểu dữ liệu phía client cho cây đề cương giáo viên:
 * Outline → Section (chương) → Exercise (bài + danh sách id câu hỏi).
 */
export interface Exercise {
  id: string
  title: string
  questionIds: string[]
}

export interface Section {
  id: string
  title: string
  expanded: boolean
  exercises: Exercise[]
}

export interface Outline {
  id: string
  title: string
  subject?: string
  status?: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  sections: Section[]
}
