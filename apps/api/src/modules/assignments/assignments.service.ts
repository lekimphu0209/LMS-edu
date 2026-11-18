/**
 * AssignmentsService — nghiệp vụ bài tập phía giáo viên.
 *
 * Một Assignment là đề bài (tiêu đề + danh sách câu hỏi); việc "giao" bài
 * được thể hiện qua các bản ghi AssignmentTarget trỏ tới lớp học hoặc
 * từng học sinh. Trạng thái hiển thị phía client (DRAFT/SAVED/QUIZ)
 * được suy ra từ trường `type` + việc có target hay chưa.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateAssignmentTargetDto,
  UpdateAssignmentTargetDto,
} from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Danh sách bài tập của một giáo viên (mới nhất trước).
   * Kèm targets → lớp (đếm học sinh), học sinh trực tiếp và trạng thái
   * submissions để client tính được tiến độ nộp bài mà không cần gọi thêm.
   */
  async findAll(createdBy?: string) {
    return this.prisma.assignment.findMany({
      where: createdBy ? { createdBy } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: { select: { id: true, title: true } },
        targets: {
          include: {
            class: {
              select: { id: true, name: true, _count: { select: { students: true } } },
            },
            student: { select: { id: true, fullName: true, email: true } },
            submissions: { select: { status: true } },
          },
        },
        _count: { select: { targets: true, questions: true } },
      },
    });
  }

  /**
   * Chi tiết bài tập: câu hỏi sắp theo orderIndex kèm đáp án, và targets
   * mở rộng roster lớp (học sinh ENROLLED) — client dùng để hiển thị
   * danh sách học sinh được giao kể cả khi chưa ai nộp bài.
   */
  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { question: { include: { options: true } } },
        },
        targets: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                students: {
                  where: { status: 'ENROLLED' },
                  include: {
                    student: { select: { id: true, fullName: true, email: true } },
                  },
                },
              },
            },
            student: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  /** Tạo bài tập mới kèm ngay danh sách câu hỏi (chưa giao — không có target). */
  async create(dto: CreateAssignmentDto, createdBy: string) {
    return this.prisma.assignment.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        type: dto.type ?? undefined,
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

  /** Cập nhật các trường đơn giản của bài tập (title/lessonId/type). */
  async update(id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title,
        lessonId: dto.lessonId,
        type: dto.type,
      },
    });
  }

  /** Xóa bài tập; P2003 → từ chối khi còn bài nộp/dữ liệu liên quan. */
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

  /**
   * Giao bài cho một lớp hoặc một học sinh kèm cửa sổ mở/hạn nộp.
   * Bắt buộc có ít nhất một trong classId/studentId.
   */
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

  /** Sửa unlock/due date của một target — kiểm tra target thuộc đúng bài tập trước. */
  async updateTarget(assignmentId: string, targetId: string, dto: UpdateAssignmentTargetDto) {
    const target = await this.prisma.assignmentTarget.findFirst({
      where: { id: targetId, assignmentId },
    });
    if (!target) throw new NotFoundException('Assignment target not found');

    return this.prisma.assignmentTarget.update({
      where: { id: targetId },
      data: {
        unlockDate: dto.unlockDate !== undefined ? new Date(dto.unlockDate) : undefined,
        dueDate: dto.dueDate !== undefined ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  /** Toàn bộ bài nộp của bài tập (qua mọi target), kèm thông tin học sinh và lớp. */
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

  /** Danh sách đối tượng đã được giao của bài tập (lớp + học sinh trực tiếp). */
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
