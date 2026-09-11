import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PrismaClassRepository } from './repositories/prisma-class.repository';
import { CreateClassDto, UpdateClassDto, EnrollStudentsDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  private repository: PrismaClassRepository;

  constructor(private prisma: PrismaService) {
    this.repository = new PrismaClassRepository(prisma);
  }

  async findAll(
    teacherId?: string,
    status?: string,
    page = 1,
    limit = 50,
    search?: string,
    subject?: string,
  ) {
    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      this.repository.findAll({ teacherId, status, search, subject, skip, take: limit }),
      this.repository.count({ teacherId, status, search, subject }),
    ]);
    const now = new Date();
    const data = await Promise.all(
      classes.map(async (cls) => {
        const [openAssignments, ungradedSubmissions, totalStudents] = await Promise.all([
          this.prisma.assignmentTarget.count({
            where: {
              classId: cls.id,
              AND: [
                { OR: [{ unlockDate: null }, { unlockDate: { lte: now } }] },
                { OR: [{ dueDate: null }, { dueDate: { gte: now } }] },
              ],
            },
          }),
          this.prisma.submission.count({
            where: {
              assignmentTarget: { classId: cls.id },
              status: { in: ['SUBMITTED', 'LATE'] },
            },
          }),
          this.prisma.classStudent.count({ where: { classId: cls.id, status: 'ENROLLED' } }),
        ]);
        return { ...cls, stats: { openAssignments, ungradedSubmissions, totalStudents } };
      }),
    );
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const cls = await this.repository.findById(id);
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async findByIdWithStudents(id: string) {
    return this.findById(id);
  }

  async create(dto: CreateClassDto, createdBy: string) {
    const cls = await this.repository.create({
      name: dto.name,
      subject: dto.subject,
      teacherId: dto.teacherId,
      createdBy,
    });

    if (dto.studentIds && dto.studentIds.length > 0) {
      const data = dto.studentIds.map((studentId) => ({
        classId: cls.id,
        studentId,
        status: 'ENROLLED' as const,
      }));
      await this.prisma.classStudent.createMany({ data, skipDuplicates: true });
    }

    return cls;
  }

  async update(id: string, dto: UpdateClassDto) {
    const cls = await this.repository.findById(id);
    if (!cls) throw new NotFoundException('Class not found');
    return this.repository.update(id, {
      name: dto.name,
      subject: dto.subject,
      teacherId: dto.teacherId,
    });
  }

  async deactivate(id: string) {
    const cls = await this.repository.findById(id);
    if (!cls) throw new NotFoundException('Class not found');
    return this.repository.update(id, { status: 'INACTIVE' });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const cls = await this.repository.findById(id);
    if (!cls) throw new NotFoundException('Class not found');
    return this.repository.update(id, { status });
  }

  async enrollStudents(classId: string, dto: EnrollStudentsDto) {
    const cls = await this.repository.findById(classId);
    if (!cls) throw new NotFoundException('Class not found');

    const data = dto.studentIds.map((studentId) => ({
      classId,
      studentId,
      status: 'ENROLLED' as const,
    }));

    await this.prisma.classStudent.createMany({
      data,
      skipDuplicates: true,
    });

    return { message: `Enrolled ${dto.studentIds.length} students` };
  }

  async removeStudent(classId: string, studentId: string) {
    const enrollment = await this.prisma.classStudent.findFirst({
      where: { classId, studentId, status: 'ENROLLED' },
    });

    if (!enrollment) throw new NotFoundException('Student not enrolled in this class');

    await this.prisma.classStudent.update({
      where: { id: enrollment.id },
      data: { status: 'REMOVED' },
    });

    return { message: 'Student removed from class' };
  }

  async getAssignments(classId: string) {
    const [targets, totalStudents] = await Promise.all([
      this.prisma.assignmentTarget.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        include: {
          assignment: { select: { id: true, title: true } },
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.classStudent.count({ where: { classId, status: 'ENROLLED' } }),
    ]);
    const now = new Date();
    return targets.map((t) => ({
      id: t.id,
      assignmentId: t.assignment.id,
      title: t.assignment.title,
      unlockDate: t.unlockDate?.toISOString() || null,
      dueDate: t.dueDate?.toISOString() || null,
      submittedCount: t._count.submissions,
      totalStudents,
      status:
        t.unlockDate && t.unlockDate > now
          ? 'SCHEDULED'
          : t.dueDate && t.dueDate < now
            ? 'CLOSED'
            : 'OPEN',
    }));
  }

  async getStats(classId: string) {
    const cls = await this.repository.findById(classId);
    if (!cls) throw new NotFoundException('Class not found');

    const [totalStudents, targets, submissions] = await Promise.all([
      this.prisma.classStudent.count({ where: { classId, status: 'ENROLLED' } }),
      this.prisma.assignmentTarget.findMany({
        where: { classId },
        select: { id: true, dueDate: true },
      }),
      this.prisma.submission.findMany({
        where: { assignmentTarget: { classId } },
        select: { status: true, totalScore: true, studentId: true },
      }),
    ]);

    const targetIds = new Set(targets.map((t) => t.id));
    const ungraded = submissions.filter((s) => ['SUBMITTED', 'LATE'].includes(s.status)).length;
    const graded = submissions.filter((s) => s.status === 'GRADED' && s.totalScore !== null);
    const avgScore = graded.length
      ? Math.round((graded.reduce((a, s) => a + (s.totalScore ?? 0), 0) / graded.length) * 10) / 10
      : null;

    // Per-student completion → average progress
    const byStudent = new Map<string, { done: number; total: number }>();
    for (const s of submissions) {
      const cur = byStudent.get(s.studentId) ?? { done: 0, total: 0 };
      cur.total = targetIds.size;
      if (['SUBMITTED', 'LATE', 'GRADED'].includes(s.status)) cur.done += 1;
      byStudent.set(s.studentId, cur);
    }
    const avgProgress = byStudent.size
      ? Math.round(
          [...byStudent.values()].reduce(
            (a, v) => a + (v.total ? (v.done / v.total) * 100 : 0),
            0,
          ) / byStudent.size,
        )
      : 0;

    return {
      totalStudents,
      totalAssignments: targets.length,
      ungradedSubmissions: ungraded,
      avgScore,
      avgProgress,
    };
  }

  async getStudents(classId: string) {
    const cls = await this.repository.findById(classId);
    if (!cls) throw new NotFoundException('Class not found');

    return this.prisma.classStudent.findMany({
      where: { classId, status: 'ENROLLED' },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
