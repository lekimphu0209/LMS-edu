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

  async findAll(teacherId?: string, status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      this.repository.findAll({ teacherId, status, skip, take: limit }),
      this.repository.count({ teacherId, status }),
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

  async create(dto: CreateClassDto, createdBy: string) {
    return this.repository.create({
      name: dto.name,
      subject: dto.subject,
      teacherId: dto.teacherId,
      createdBy,
    });
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
