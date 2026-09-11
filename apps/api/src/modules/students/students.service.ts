import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMyFeedbackDto } from './dto/student.dto';

const DAY_MS = 86400000;

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────

  private async getEnrolledClassIds(studentId: string): Promise<string[]> {
    const rows = await this.prisma.classStudent.findMany({
      where: { studentId, status: 'ENROLLED' },
      select: { classId: true },
    });
    return rows.map((r) => r.classId);
  }

  private async assertEnrolled(classId: string, studentId: string) {
    const enrollment = await this.prisma.classStudent.findFirst({
      where: { classId, studentId, status: 'ENROLLED' },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this class');
  }

  /** Targets visible to the student: assigned to their class or directly to them. */
  private async getVisibleTargets(studentId: string, classIds?: string[]) {
    const enrolled = classIds ?? (await this.getEnrolledClassIds(studentId));
    return this.prisma.assignmentTarget.findMany({
      where: {
        OR: [{ classId: { in: enrolled } }, { studentId }],
      },
      include: {
        assignment: {
          include: { _count: { select: { questions: true } } },
        },
        class: { select: { id: true, name: true, subject: true } },
        submissions: {
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private toStudentAssignment(t: any) {
    const now = Date.now();
    const dueAt = t.dueDate ? new Date(t.dueDate).getTime() : null;
    const sub = t.submissions[0] ?? null;
    const done = !!sub && ['SUBMITTED', 'LATE', 'GRADED'].includes(sub.status);
    const daysLeft = dueAt ? Math.ceil((dueAt - now) / DAY_MS) : 0;
    return {
      id: t.assignment.id,
      targetId: t.id,
      title: t.assignment.title,
      classId: t.class?.id ?? null,
      className: t.class?.name ?? '',
      type: t.assignment.type,
      dueDate: t.dueDate?.toISOString() ?? null,
      dueAt,
      daysLeft,
      overdue: !done && dueAt !== null && dueAt < now,
      questions: t.assignment._count.questions,
      done,
      score: sub?.totalScore ?? null,
      submittedAt: sub?.submittedAt?.toISOString() ?? null,
      maxScore: t.assignment.maxScore,
    };
  }

  // ── Classes ──────────────────────────────────────────────────

  async getMyClasses(studentId: string) {
    const enrollments = await this.prisma.classStudent.findMany({
      where: { studentId, status: 'ENROLLED' },
      include: {
        class: {
          include: { teacher: { select: { id: true, fullName: true } } },
        },
      },
    });

    const classIds = enrollments.map((e) => e.classId);
    const targets = await this.getVisibleTargets(studentId, classIds);
    const now = Date.now();

    return enrollments.map((e) => {
      const cls = e.class;
      const classTargets = targets.filter((t) => t.classId === cls.id || t.studentId === studentId);
      const items = classTargets.map((t) => this.toStudentAssignment(t));
      const pending = items.filter((a) => !a.done);
      const scored = items.filter((a) => a.done && a.score !== null);
      const avgScore = scored.length
        ? Math.round((scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) * 10) / 10
        : null;
      const next = pending
        .filter((a) => a.dueAt !== null)
        .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))[0];

      return {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        grade: cls.grade,
        schedule: cls.schedule,
        room: cls.room,
        color: cls.color,
        icon: cls.icon,
        teacher: cls.teacher.fullName,
        progress: items.length ? Math.round((items.filter((a) => a.done).length / items.length) * 100) : 0,
        pending: pending.length,
        completed: items.length - pending.length,
        avgScore,
        nextDue: next
          ? {
              title: next.title,
              dueDate: next.dueDate,
              daysLeft: next.daysLeft,
              overdue: next.overdue,
            }
          : null,
        _now: now,
      };
    });
  }

  async getMyClass(classId: string, studentId: string) {
    await this.assertEnrolled(classId, studentId);

    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: { select: { id: true, fullName: true } },
        curriculums: {
          include: {
            curriculum: {
              include: {
                chapters: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    lessons: {
                      orderBy: { orderIndex: 'asc' },
                      include: {
                        assignments: {
                          include: {
                            targets: {
                              where: {
                                OR: [{ classId }, { studentId }],
                              },
                              include: {
                                submissions: {
                                  where: { studentId },
                                  orderBy: { createdAt: 'desc' },
                                  take: 1,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');

    // Curriculum with per-student lesson state
    const curriculum = cls.curriculums.flatMap((cc) =>
      cc.curriculum.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        color: cls.color,
        sections: ch.lessons.map((ls) => {
          const subs = ls.assignments.flatMap((a) => a.targets.flatMap((t) => t.submissions));
          const done = subs.some((s) => ['SUBMITTED', 'LATE', 'GRADED'].includes(s.status));
          const scores = subs.map((s) => s.totalScore).filter((s): s is number => s !== null);
          return {
            id: ls.id,
            title: ls.title,
            done,
            score: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
          };
        }),
      })),
    );

    const targets = await this.getVisibleTargets(studentId, [classId]);
    const assignments = targets
      .filter((t) => t.classId === classId || t.studentId === studentId)
      .map((t) => this.toStudentAssignment(t));

    return {
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      grade: cls.grade,
      schedule: cls.schedule,
      room: cls.room,
      color: cls.color,
      icon: cls.icon,
      teacher: cls.teacher.fullName,
      curriculum,
      assignments,
    };
  }

  // ── Assignments ──────────────────────────────────────────────

  async getMyAssignments(studentId: string, status?: string, classId?: string) {
    const targets = await this.getVisibleTargets(studentId);
    let items = targets.map((t) => this.toStudentAssignment(t));
    if (classId) items = items.filter((a) => a.classId === classId);
    if (status === 'pending') items = items.filter((a) => !a.done);
    if (status === 'done') items = items.filter((a) => a.done);
    return items;
  }

  async getQuiz(assignmentId: string, studentId: string) {
    const classIds = await this.getEnrolledClassIds(studentId);
    const target = await this.prisma.assignmentTarget.findFirst({
      where: {
        assignmentId,
        OR: [{ classId: { in: classIds } }, { studentId }],
      },
      include: {
        assignment: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                question: {
                  include: {
                    options: { orderBy: { orderIndex: 'asc' } },
                  },
                },
              },
            },
          },
        },
        class: { select: { name: true } },
      },
    });
    if (!target) throw new NotFoundException('Assignment not found or not assigned to you');

    return {
      targetId: target.id,
      title: target.assignment.title,
      className: target.class?.name ?? '',
      dueDate: target.dueDate?.toISOString() ?? null,
      questions: target.assignment.questions.map((aq) => ({
        id: aq.question.id,
        type:
          aq.question.type === 'SINGLE'
            ? 'single'
            : aq.question.type === 'MULTI'
              ? 'multiple'
              : 'fill',
        text: aq.question.questionText,
        options: aq.question.options.map((o) => ({
          id: o.id,
          text: o.optionText,
        })),
      })),
    };
  }

  // ── Feedback ─────────────────────────────────────────────────

  async getMyFeedbacks(studentId: string) {
    const rows = await this.prisma.feedback.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    const classIds = rows.map((f) => f.classId).filter((v): v is string => !!v);
    const teacherIds = rows.map((f) => f.teacherId).filter((v): v is string => !!v);
    const [classes, teachers] = await Promise.all([
      this.prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } }),
      this.prisma.user.findMany({ where: { id: { in: teacherIds } }, select: { id: true, fullName: true } }),
    ]);
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));

    return rows.map((f) => ({
      id: f.id,
      classId: f.classId,
      className: f.classId ? (classMap.get(f.classId) ?? '') : '',
      teacherName: f.teacherId ? (teacherMap.get(f.teacherId) ?? '') : '',
      title: f.title,
      category: f.category,
      content: f.content,
      reply: f.reply,
      replied: !!f.reply,
      isRead: f.isRead,
      createdAt: f.createdAt.toISOString(),
      repliedAt: f.repliedAt?.toISOString() ?? null,
    }));
  }

  async createFeedback(dto: CreateMyFeedbackDto, studentId: string) {
    await this.assertEnrolled(dto.classId, studentId);
    const cls = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    return this.prisma.feedback.create({
      data: {
        studentId,
        teacherId: cls?.teacherId,
        classId: dto.classId,
        title: dto.title,
        category: dto.category ?? 'question',
        content: dto.content,
      },
    });
  }

  // ── Stats ────────────────────────────────────────────────────

  async getMyStats(studentId: string) {
    const classes = await this.getMyClasses(studentId);
    const targets = await this.getVisibleTargets(studentId);
    const items = targets.map((t) => this.toStudentAssignment(t));
    const pending = items.filter((a) => !a.done);
    const scored = items.filter((a) => a.done && a.score !== null);

    return {
      totalClasses: classes.length,
      pendingAssignments: pending.length,
      overdueAssignments: pending.filter((a) => a.overdue).length,
      avgScore: scored.length
        ? Math.round((scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) * 10) / 10
        : null,
      overallProgress: classes.length
        ? Math.round(classes.reduce((s, c) => s + c.progress, 0) / classes.length)
        : 0,
    };
  }
}
