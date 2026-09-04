import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminOverview() {
    const [totalUsers, totalClasses, totalQuestions, totalAssignments, totalSubmissions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.class.count(),
        this.prisma.question.count(),
        this.prisma.assignment.count(),
        this.prisma.submission.count(),
      ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const submissionsByStatus = await this.prisma.submission.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalUsers,
      totalClasses,
      totalQuestions,
      totalAssignments,
      totalSubmissions,
      usersByRole,
      submissionsByStatus,
    };
  }

  async getTeacherOverview(teacherId: string) {
    const [totalClasses, totalQuestions, totalAssignments, totalCurriculums] = await Promise.all([
      this.prisma.class.count({ where: { teacherId } }),
      this.prisma.question.count({ where: { teacherId } }),
      this.prisma.assignment.count({ where: { createdBy: teacherId } }),
      this.prisma.curriculum.count({ where: { teacherId } }),
    ]);

    const classIds = await this.prisma.class.findMany({
      where: { teacherId },
      select: { id: true },
    });

    const totalStudents = await this.prisma.classStudent.count({
      where: { classId: { in: classIds.map((c: { id: string }) => c.id) }, status: 'ENROLLED' },
    });

    return {
      totalClasses,
      totalQuestions,
      totalAssignments,
      totalCurriculums,
      totalStudents,
    };
  }

  async getStudentOverview(studentId: string) {
    const [totalSubmissions, gradedSubmissions, enrolledClasses] = await Promise.all([
      this.prisma.submission.count({ where: { studentId } }),
      this.prisma.submission.findMany({
        where: { studentId, status: 'GRADED' },
        select: { totalScore: true },
      }),
      this.prisma.classStudent.count({ where: { studentId, status: 'ENROLLED' } }),
    ]);

    const avgScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum: number, s: { totalScore: number | null }) => sum + (s.totalScore ?? 0), 0) / gradedSubmissions.length
      : 0;

    const learningSessions = await this.prisma.learningSession.findMany({
      where: { studentId, endedAt: { not: null } },
      select: { startedAt: true, endedAt: true },
    });

    const totalLearningTime = learningSessions.reduce((sum: number, session: { startedAt: Date; endedAt: Date | null }) => {
      if (session.endedAt) {
        return sum + (session.endedAt.getTime() - session.startedAt.getTime());
      }
      return sum;
    }, 0);

    return {
      totalSubmissions,
      gradedSubmissions: gradedSubmissions.length,
      enrolledClasses,
      averageScore: avgScore,
      totalLearningTimeMs: totalLearningTime,
    };
  }
}
