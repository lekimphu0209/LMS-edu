import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StartSubmissionDto, SubmitSubmissionDto, GradeSubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async start(dto: StartSubmissionDto, studentId: string) {
    const target = await this.prisma.assignmentTarget.findUnique({
      where: { id: dto.assignmentTargetId },
    });
    if (!target) throw new NotFoundException('Assignment target not found');

    const existing = await this.prisma.submission.findFirst({
      where: { assignmentTargetId: dto.assignmentTargetId, studentId, status: 'IN_PROGRESS' },
    });
    if (existing) return existing;

    return this.prisma.submission.create({
      data: {
        assignmentTargetId: dto.assignmentTargetId,
        studentId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async submit(submissionId: string, dto: SubmitSubmissionDto, studentId: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.studentId !== studentId) throw new BadRequestException('Not your submission');

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

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: isLate ? 'LATE' : 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { answers: true },
    });
  }

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

  async findByStudent(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignmentTarget: { include: { assignment: { select: { id: true, title: true } } } },
      },
    });
  }

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
