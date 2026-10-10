import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, CreateAssignmentTargetDto } from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(createdBy?: string) {
    return this.prisma.assignment.findMany({
      where: createdBy ? { createdBy } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: { select: { id: true, title: true } },
        _count: { select: { targets: true, questions: true } },
      },
    });
  }

  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { question: { include: { options: true } } },
        },
        targets: true,
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async create(dto: CreateAssignmentDto, createdBy: string) {
    return this.prisma.assignment.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        createdBy,
        questions: {
          create: dto.questions.map((q) => ({
            questionId: q.questionId,
            orderIndex: q.orderIndex ?? 0,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async update(id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title,
        lessonId: dto.lessonId,
      },
    });
  }

  async delete(id: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    try {
      await this.prisma.assignment.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new BadRequestException(
          'Không thể xóa bài tập đã có bài nộp hoặc dữ liệu liên quan.',
        );
      }
      throw e;
    }
    return { message: 'Assignment deleted' };
  }

  async createTarget(assignmentId: string, dto: CreateAssignmentTargetDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (!dto.classId && !dto.studentId) {
      throw new BadRequestException('Either classId or studentId must be provided');
    }

    return this.prisma.assignmentTarget.create({
      data: {
        assignmentId,
        classId: dto.classId,
        studentId: dto.studentId,
        unlockDate: dto.unlockDate ? new Date(dto.unlockDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async getSubmissions(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.submission.findMany({
      where: { assignmentTarget: { assignmentId } },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        assignmentTarget: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async getTargets(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.assignmentTarget.findMany({
      where: { assignmentId },
      include: {
        class: { select: { id: true, name: true } },
        student: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
