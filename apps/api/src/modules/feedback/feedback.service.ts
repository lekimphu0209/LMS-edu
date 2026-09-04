import { Injectable, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

export class CreateFeedbackDto {
  @ApiProperty()
  @IsString()
  submissionId!: string;

  @ApiProperty()
  @IsString()
  teacherNote!: string;
}

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

  async create(dto: CreateFeedbackDto, teacherId: string) {
    return this.prisma.submission.update({
      where: { id: dto.submissionId },
      data: { teacherNote: dto.teacherNote, gradedBy: teacherId },
    });
  }

  async findBySubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, teacherNote: true, gradedBy: true, gradedAt: true },
    });
    return submission;
  }

  async createStudentFeedback(data: { studentId: string; content: string; lessonId?: string; assignmentId?: string }) {
    return this.prisma.feedback.create({ data });
  }

  async findInbox(filters: { isRead?: string; studentId?: string }) {
    return this.prisma.feedback.findMany({
      where: {
        ...(filters.isRead !== undefined ? { isRead: filters.isRead === 'true' } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, isRead: boolean) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return this.prisma.feedback.update({ where: { id }, data: { isRead } });
  }
}
