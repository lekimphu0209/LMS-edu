export interface AdminOverviewStats {
  totalUsers: number;
  totalClasses: number;
  totalQuestions: number;
  totalAssignments: number;
  totalSubmissions: number;
  usersByRole: { role: string; _count: number }[];
  submissionsByStatus: { status: string; _count: number }[];
}

export interface TeacherOverviewStats {
  totalClasses: number;
  totalQuestions: number;
  totalAssignments: number;
  totalCurriculums: number;
  totalStudents: number;
}

export interface StudentOverviewStats {
  totalSubmissions: number;
  gradedSubmissions: number;
  enrolledClasses: number;
  averageScore: number;
  totalLearningTimeMs: number;
}
