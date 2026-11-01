import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminOverview(from?: string, to?: string) {
    const range =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        : undefined;
    const where = range ? { createdAt: range } : {};
    const enrollWhere = range ? { enrolledAt: range } : {};

    const [
      totalUsers,
      totalClasses,
      totalQuestions,
      totalAssignments,
      totalSubmissions,
      totalEnrolledStudents,
    ] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.class.count({ where }),
      this.prisma.question.count({ where }),
      this.prisma.assignment.count({ where }),
      this.prisma.submission.count({ where }),
      this.prisma.classStudent.count({ where: { status: 'ENROLLED', ...enrollWhere } }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
      where,
    });

    const usersByStatus = await this.prisma.user.groupBy({
      by: ['status'],
      _count: true,
      where,
    });

    const classesByStatus = await this.prisma.class.groupBy({
      by: ['status'],
      _count: true,
      where,
    });

    const submissionsByStatus = await this.prisma.submission.groupBy({
      by: ['status'],
      _count: true,
      where,
    });

    const roleCount = (role: string) =>
      (usersByRole.find((g: any) => g.role === role)?._count as number) ?? 0;

    const statusCount = (status: string, groups: any[]) =>
      (groups.find((g: any) => g.status === status)?._count as number) ?? 0;

    const gradedSubmissions =
      (submissionsByStatus.find((s: any) => s.status === 'GRADED')?._count as number) ?? 0;
    const pendingSubmissions =
      ((submissionsByStatus.find((s: any) => s.status === 'SUBMITTED')?._count as number) ?? 0) +
      ((submissionsByStatus.find((s: any) => s.status === 'LATE')?._count as number) ?? 0);
    const completionRate = totalSubmissions
      ? Math.round((gradedSubmissions / totalSubmissions) * 100)
      : 0;

    return {
      totalUsers,
      totalClasses,
      totalQuestions,
      totalAssignments,
      totalSubmissions,
      totalEnrolledStudents,
      totalStudents: roleCount('STUDENT'),
      totalTeachers: roleCount('TEACHER'),
      totalAdmins: roleCount('ADMIN'),
      activeUsers: statusCount('ACTIVE', usersByStatus as any),
      inactiveUsers: statusCount('INACTIVE', usersByStatus as any),
      activeClasses: statusCount('ACTIVE', classesByStatus as any),
      inactiveClasses: statusCount('INACTIVE', classesByStatus as any),
      gradedSubmissions,
      pendingSubmissions,
      completionRate,
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

  async getGrowth(from?: string, to?: string, interval: 'day' | 'week' | 'month' | 'year' = 'month') {
    const start = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { teachers: number; students: number; total: number }>();
    for (const u of users) {
      const key = this.formatDateByInterval(u.createdAt, interval);
      const cur = buckets.get(key) ?? { teachers: 0, students: 0, total: 0 };
      if (u.role === 'TEACHER') cur.teachers += 1;
      if (u.role === 'STUDENT') cur.students += 1;
      cur.total += 1;
      buckets.set(key, cur);
    }

    return { from: start, to: end, interval, data: [...buckets.entries()].map(([date, counts]) => ({ date, ...counts })) };
  }

  async getAdminInsights() {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const last7Start = new Date(now.getTime() - 7 * day);
    const prev7Start = new Date(now.getTime() - 14 * day);
    const staleStart = new Date(now.getTime() - 30 * day);

    const [
      classes,
      enrollGroups,
      unenrolledStudents,
      inactiveTeachers,
      newUsers7d,
      prevUsers7d,
      loginStats,
      teacherGroups,
    ] = await Promise.all([
      this.prisma.class.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          subject: true,
          teacherId: true,
          teacher: { select: { id: true, fullName: true, status: true } },
        },
      }),
      this.prisma.classStudent.groupBy({
        by: ['classId'],
        where: { status: 'ENROLLED' },
        _count: { _all: true },
      }),
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          status: 'ACTIVE',
          enrolledClasses: { none: { status: 'ENROLLED' } },
        },
      }),
      this.prisma.user.count({ where: { role: 'TEACHER', status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7Start } } }),
      this.prisma.user.count({ where: { createdAt: { gte: prev7Start, lt: last7Start } } }),
      // Raw SQL: lastLoginAt mới thêm vào schema, client có thể chưa regenerate —
      // dùng raw để không phụ thuộc generated types; -1 nếu query lỗi (UI hiển thị '—').
      this.prisma
        .$queryRaw<[{ never_logged_in: number; stale: number }]>`
          SELECT
            COUNT(*) FILTER (WHERE "lastLoginAt" IS NULL)::int AS never_logged_in,
            COUNT(*) FILTER (WHERE "lastLoginAt" < ${staleStart} AND status = 'ACTIVE')::int AS stale
          FROM users
        `
        .then((r) => [r[0]?.never_logged_in ?? 0, r[0]?.stale ?? 0] as const)
        .catch(() => [-1, -1] as const),
      this.prisma.class.groupBy({
        by: ['teacherId'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    const [neverLoggedIn, staleUsers] = loginStats;

    const enrollMap = new Map(enrollGroups.map((g) => [g.classId, g._count._all]));
    const withCount = classes.map((c) => ({ ...c, enrolled: enrollMap.get(c.id) ?? 0 }));

    const teacherNameMap = new Map(classes.map((c) => [c.teacherId, c.teacher.fullName]));

    const subjectMap = new Map<string, number>();
    for (const c of classes) {
      subjectMap.set(c.subject, (subjectMap.get(c.subject) ?? 0) + 1);
    }

    return {
      attention: {
        classesInactiveTeacher: classes.filter((c) => c.teacher.status === 'INACTIVE').length,
        classesNoStudents: withCount.filter((c) => c.enrolled === 0).length,
        unenrolledStudents,
        inactiveTeachers,
      },
      rankings: {
        topClasses: withCount
          .sort((a, b) => b.enrolled - a.enrolled)
          .slice(0, 5)
          .map((c) => ({ name: c.name, subject: c.subject, students: c.enrolled })),
        topTeachers: teacherGroups
          .map((g) => ({
            name: teacherNameMap.get(g.teacherId) ?? '—',
            classes: g._count._all,
          }))
          .sort((a, b) => b.classes - a.classes)
          .slice(0, 5),
      },
      subjects: [...subjectMap.entries()]
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      activity: { newUsers7d, prevUsers7d, neverLoggedIn, staleUsers },
    };
  }

  private formatDateByInterval(date: Date, interval: 'day' | 'week' | 'month' | 'year'): string {
    const d = new Date(date);
    if (interval === 'day') return d.toISOString().slice(0, 10);
    if (interval === 'year') return d.toISOString().slice(0, 4);
    if (interval === 'week') {
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      return startOfWeek.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 7);
  }

  async getQuestionStats(groupBy: 'teacher' | 'subject' = 'teacher') {
    const questions = await this.prisma.question.findMany({
      select: { subject: true, teacherId: true, teacher: { select: { fullName: true } } },
    });

    const map = new Map<string, { name: string; count: number }>();
    for (const q of questions) {
      const key = groupBy === 'teacher' ? q.teacherId : q.subject;
      const name = groupBy === 'teacher' ? q.teacher.fullName : q.subject;
      const cur = map.get(key) ?? { name, count: 0 };
      cur.count += 1;
      map.set(key, cur);
    }

    return { groupBy, data: [...map.values()] };
  }

  async getFileStats(_groupBy: 'teacher' = 'teacher') {
    // File upload tracking is not yet implemented in the schema.
    return { data: [], message: 'File upload tracking not implemented' };
  }
}
