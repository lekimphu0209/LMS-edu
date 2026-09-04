import type { CurriculumStatus } from './enums';

export interface Curriculum {
  id: string;
  title: string;
  subject: string;
  status: CurriculumStatus;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  curriculumId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  orderIndex: number;
  contentNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumWithContent extends Curriculum {
  chapters: (Chapter & { lessons: Lesson[] })[];
}

export interface CreateCurriculumRequest {
  title: string;
  subject: string;
}

export interface UpdateCurriculumRequest {
  title?: string;
  subject?: string;
  status?: CurriculumStatus;
}

export interface CreateChapterRequest {
  curriculumId: string;
  title: string;
  orderIndex?: number;
}

export interface UpdateChapterRequest {
  title?: string;
  orderIndex?: number;
}

export interface CreateLessonRequest {
  chapterId: string;
  title: string;
  orderIndex?: number;
  contentNote?: string;
}

export interface UpdateLessonRequest {
  title?: string;
  orderIndex?: number;
  contentNote?: string;
}
