import type { SubmissionStatus } from './enums';

export interface Submission {
  id: string;
  assignmentTargetId: string;
  studentId: string;
  status: SubmissionStatus;
  totalScore?: number | null;
  submittedAt?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  teacherNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  scoreEarned?: number | null;
}

export interface SubmissionWithDetails extends Submission {
  answers: SubmissionAnswer[];
  student: { id: string; fullName: string; email: string };
  assignmentTarget: { assignment: { id: string; title: string } };
}

export interface StartSubmissionRequest {
  assignmentTargetId: string;
}

export interface SubmitAnswerInput {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface SubmitSubmissionRequest {
  answers: SubmitAnswerInput[];
}

export interface GradeAnswerInput {
  answerId: string;
  isCorrect?: boolean;
  scoreEarned?: number;
}

export interface GradeSubmissionRequest {
  answers: GradeAnswerInput[];
  teacherNote?: string;
}
