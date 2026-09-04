import type { QuestionType, QuestionDifficulty } from './enums';

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  optionImageUrl?: string | null;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  teacherId: string;
  subject: string;
  type: QuestionType;
  questionText: string;
  questionImageUrl?: string | null;
  difficulty: QuestionDifficulty;
  defaultScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export interface QuestionOptionInput {
  optionText: string;
  optionImageUrl?: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface CreateQuestionRequest {
  subject: string;
  type: QuestionType;
  questionText: string;
  questionImageUrl?: string;
  difficulty?: QuestionDifficulty;
  defaultScore?: number;
  options?: QuestionOptionInput[];
}

export interface UpdateQuestionRequest {
  subject?: string;
  type?: QuestionType;
  questionText?: string;
  questionImageUrl?: string;
  difficulty?: QuestionDifficulty;
  defaultScore?: number;
}

export interface QuestionListResponse {
  data: QuestionWithOptions[];
  total: number;
  page: number;
  limit: number;
}
