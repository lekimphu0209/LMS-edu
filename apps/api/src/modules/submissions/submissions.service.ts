/**
 * SubmissionsService — vòng đời bài nộp của học sinh:
 * bắt đầu làm → nộp bài → giáo viên chấm. Trạng thái đi theo
 * IN_PROGRESS → SUBMITTED/LATE → GRADED.
 * Mỗi lần start/submit còn ghi LearningSession để thống kê thời gian học.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StartSubmissionDto, SubmitSubmissionDto, GradeSubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo submission mới cho target+student. Trả về submission đang mở
   * nếu đã có (idempotent); báo lỗi nếu học sinh đã nộp trước đó.
   */
  async start(dto: StartSubmissionDto, studentId: string) {
    const target = await this.prisma.assignmentTarget.findUnique({
      where: { id: dto.assignmentTargetId },
    });
    if (!target) throw new NotFoundException('Assignment target not found');

    const existing = await this.prisma.submission.findFirst({
      where: { assignmentTargetId: dto.assignmentTargetId, studentId },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      if (existing.status === 'IN_PROGRESS') return existing;
      throw new BadRequestException('Already submitted this assignment');
    }

    const submission = await this.prisma.submission.create({
      data: {
        assignmentTargetId: dto.assignmentTargetId,
        studentId,
        status: 'IN_PROGRESS',
      },
    });

    // Ghi nhận thời điểm bắt đầu làm bài
    await this.prisma.learningSession.create({
      data: { studentId, assignmentTargetId: dto.assignmentTargetId, submissionId: submission.id },
    });

    return submission;
  }

  /**
   * Nộp bài: ghi đè toàn bộ đáp án (xóa cũ, tạo mới trong transaction),
   * đánh dấu LATE nếu quá hạn và đóng LearningSession đang mở.
   */
  async submit(submissionId: string, dto: SubmitSubmissionDto, studentId: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.studentId !== studentId) throw new BadRequestException('Not your submission');
    if (submission.status !== 'IN_PROGRESS')
      throw new BadRequestException('Submission already submitted');

    await this.prisma.submissionAnswer.deleteMany({ where: { submissionId } });

    const target = await this.prisma.assignmentTarget.findUnique({
      where: { id: submission.assignmentTargetId },
    });

    const isLate = target?.dueDate ? new Date() > target.dueDate : false;

    await this.prisma.$transaction(
      dto.answers.map((answer) =>
        this.prisma.submissionAnswer.create({
          data: {
            submissionId,
            questionId: answer.questionId,
            selectedOptionIds: answer.selectedOptionIds ?? undefined,
            textAnswer: answer.textAnswer,
          },
        }),
      ),
    );

    // Ghi nhận thời điểm kết thúc phiên làm bài
    await this.prisma.learningSession.updateMany({
      where: { submissionId, endedAt: null },
      data: { endedAt: new Date() },
    });

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: isLate ? 'LATE' : 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { answers: true },
    });
  }

  /**
   * Chấm điểm: cập nhật đúng/sai + điểm từng câu, cộng totalScore
   * và chuyển trạng thái GRADED kèm nhận xét của giáo viên.
   */
  async grade(submissionId: string, dto: GradeSubmissionDto, gradedBy: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');

    let totalScore = 0;

    for (const ans of dto.answers) {
      const score = ans.scoreEarned ?? 0;
      totalScore += score;

      await this.prisma.submissionAnswer.update({
        where: { id: ans.answerId },
        data: {
          isCorrect: ans.isCorrect,
          scoreEarned: ans.scoreEarned,
        },
      });
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'GRADED',
        totalScore,
        teacherNote: dto.teacherNote,
        gradedBy,
        gradedAt: new Date(),
      },
      include: { answers: true },
    });
  }

  /** Chi tiết bài nộp: đáp án kèm câu hỏi/option, học sinh và bài tập gốc. */
  async findById(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        answers: { include: { question: { include: { options: true } } } },
        student: { select: { id: true, fullName: true, email: true } },
        assignmentTarget: { include: { assignment: true } },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  /** Toàn bộ bài nộp của một học sinh (mới nhất trước). */
  async findByStudent(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignmentTarget: { include: { assignment: { select: { id: true, title: true } } } },
      },
    });
  }

  /** Bài nộp của một target cụ thể — dùng cho giáo viên xem theo lớp/học sinh. */
  async findByTarget(assignmentTargetId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentTargetId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
