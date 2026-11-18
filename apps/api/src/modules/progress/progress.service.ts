/**
 * ProgressService — snapshot tiến độ, phiên học (LearningSession)
 * và mốc học tập (Milestone) của học sinh.
 * Lưu ý: các endpoint sessions phần lớn được tự động ghi từ
 * SubmissionsService khi học sinh làm bài; controller này mở API tay.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /** Lịch sử snapshot tiến độ của học sinh, mới nhất trước. */
  async getSnapshots(studentId: string, curriculumId?: string) {
    return this.prisma.progressSnapshot.findMany({
      where: {
        studentId,
        ...(curriculumId ? { curriculumId } : {}),
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  /** Ghi một điểm chụp tiến độ (% hoàn thành + điểm TB) tại thời điểm hiện tại. */
  async createSnapshot(data: {
    studentId: string;
    classId?: string;
    curriculumId?: string;
    percentComplete: number;
    averageScore: number;
  }) {
    return this.prisma.progressSnapshot.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        curriculumId: data.curriculumId,
        percentComplete: data.percentComplete,
        averageScore: data.averageScore,
      },
    });
  }

  /** Các phiên học đã ghi của học sinh (mới nhất trước). */
  async getLearningSessions(studentId: string) {
    return this.prisma.learningSession.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /** Mở phiên học mới (gắn target bài tập nếu có). */
  async startLearningSession(studentId: string, assignmentTargetId?: string) {
    return this.prisma.learningSession.create({
      data: { studentId, assignmentTargetId },
    });
  }

  /** Đóng phiên học bằng cách ghi endedAt hiện tại. */
  async endLearningSession(sessionId: string) {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Learning session not found');

    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  /** Mốc học tập của học sinh/lớp (mới nhất trước). */
  async getMilestones(studentId?: string, classId?: string) {
    return this.prisma.milestone.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(classId ? { classId } : {}),
      },
      orderBy: { milestoneDate: 'desc' },
    });
  }

  /** Giáo viên/admin tạo mốc học tập cho học sinh. */
  async createMilestone(data: {
    studentId: string;
    classId?: string;
    title: string;
    description?: string;
    milestoneDate?: string;
    createdBy: string;
  }) {
    return this.prisma.milestone.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        title: data.title,
        description: data.description,
        milestoneDate: data.milestoneDate ? new Date(data.milestoneDate) : undefined,
        createdBy: data.createdBy,
      },
    });
  }

  /** Xóa một mốc học tập. */
  async deleteMilestone(id: string) {
    return this.prisma.milestone.delete({ where: { id } });
  }
}
