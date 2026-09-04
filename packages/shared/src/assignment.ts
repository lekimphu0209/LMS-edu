export interface Assignment {
  id: string;
  lessonId?: string | null;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionId: string;
  orderIndex: number;
}

export interface AssignmentTarget {
  id: string;
  assignmentId: string;
  classId?: string | null;
  studentId?: string | null;
  unlockDate?: string | null;
  dueDate?: string | null;
}

export interface AssignmentWithDetails extends Assignment {
  questions: (AssignmentQuestion & { question: { id: string; questionText: string } })[];
  targets: AssignmentTarget[];
}

export interface AssignmentQuestionInput {
  questionId: string;
  orderIndex?: number;
}

export interface CreateAssignmentRequest {
  lessonId?: string;
  title: string;
  questions: AssignmentQuestionInput[];
}

export interface UpdateAssignmentRequest {
  lessonId?: string;
  title?: string;
}

export interface CreateAssignmentTargetRequest {
  classId?: string;
  studentId?: string;
  unlockDate?: string;
  dueDate?: string;
}
