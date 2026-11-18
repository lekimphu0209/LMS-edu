/**
 * FeedbackService — hai luồng phản hồi khác nhau:
 *  - Ghi chú trên bài nộp (teacherNote trên Submission).
 *  - Hộp thư góp ý (Feedback): học sinh gửi → giáo viên đọc/trả lời.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

/** Ghi chú của giáo viên lên một bài nộp. */
export class CreateFeedbackDto {
  @ApiProperty()
  @IsString()
  submissionId!: string;

  @ApiProperty()
  @IsString()
  teacherNote!: string;
}

/** Góp ý do học sinh gửi (gắn bài học/bài tập nếu có). */
export class CreateStudentFeedbackDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lessonId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignmentId?: string;
}

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  /** Ghi nhận xét của giáo viên lên bài nộp (teacherNote + gradedBy). */
  async create(dto: CreateFeedbackDto, teacherId: string) {
    return this.prisma.submission.update({
      where: { id: dto.submissionId },
      data: { teacherNote: dto.teacherNote, gradedBy: teacherId },
    });
  }

  /** Lấy phần nhận xét đã ghi của một bài nộp. */
  async findBySubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, teacherNote: true, gradedBy: true, gradedAt: true },
    });
    return submission;
  }

  /** Học sinh tạo góp ý mới trong hộp thư. */
  async createStudentFeedback(data: { studentId: string; content: string; lessonId?: string; assignmentId?: string }) {
    return this.prisma.feedback.create({ data });
  }

  /** Hộp thư góp ý của giáo viên, lọc theo đã đọc / học sinh (mới nhất trước). */
  async findInbox(filters: { isRead?: string; studentId?: string }) {
    return this.prisma.feedback.findMany({
      where: {
        ...(filters.isRead !== undefined ? { isRead: filters.isRead === 'true' } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Giáo viên trả lời góp ý — ghi repliedAt và reset isRead để học sinh thấy. */
  async reply(id: string, reply: string, teacherId: string) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return this.prisma.feedback.update({
      where: { id },
      data: { reply, teacherId, repliedAt: new Date(), isRead: false },
    });
  }

  /** Đánh dấu đã đọc/chưa đọc một góp ý. */
  async markRead(id: string, isRead: boolean) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return this.prisma.feedback.update({ where: { id }, data: { isRead } });
  }
}
