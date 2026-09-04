import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getSnapshots(studentId: string, curriculumId?: string) {
    return this.prisma.progressSnapshot.findMany({
      where: {
        studentId,
        ...(curriculumId ? { curriculumId } : {}),
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

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

  async getLearningSessions(studentId: string) {
    return this.prisma.learningSession.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startLearningSession(studentId: string, assignmentTargetId?: string) {
    return this.prisma.learningSession.create({
      data: { studentId, assignmentTargetId },
    });
  }

  async endLearningSession(sessionId: string) {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Learning session not found');

    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  async getMilestones(studentId?: string, classId?: string) {
    return this.prisma.milestone.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(classId ? { classId } : {}),
      },
      orderBy: { milestoneDate: 'desc' },
    });
  }

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

  async deleteMilestone(id: string) {
    return this.prisma.milestone.delete({ where: { id } });
  }
}
