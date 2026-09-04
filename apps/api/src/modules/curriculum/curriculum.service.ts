import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCurriculumDto,
  UpdateCurriculumDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
} from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  // ── Curriculum ──

  async findAll(teacherId?: string) {
    return this.prisma.curriculum.findMany({
      where: teacherId ? { teacherId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { chapters: true } } },
    });
  }

  async findById(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');
    return curriculum;
  }

  async create(dto: CreateCurriculumDto, teacherId: string) {
    return this.prisma.curriculum.create({
      data: { title: dto.title, subject: dto.subject, teacherId },
    });
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id } });
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    return this.prisma.curriculum.update({
      where: { id },
      data: {
        title: dto.title,
        subject: dto.subject,
        status: dto.status as 'DRAFT' | 'PUBLISHED' | undefined,
      },
    });
  }

  async delete(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id } });
    if (!curriculum) throw new NotFoundException('Curriculum not found');
    await this.prisma.curriculum.delete({ where: { id } });
    return { message: 'Curriculum deleted' };
  }

  // ── Chapter ──

  async createChapter(dto: CreateChapterDto) {
    return this.prisma.chapter.create({
      data: {
        curriculumId: dto.curriculumId,
        title: dto.title,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async updateChapter(id: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) throw new NotFoundException('Chapter not found');

    return this.prisma.chapter.update({
      where: { id },
      data: { title: dto.title, orderIndex: dto.orderIndex },
    });
  }

  async deleteChapter(id: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    await this.prisma.chapter.delete({ where: { id } });
    return { message: 'Chapter deleted' };
  }

  // ── Lesson ──

  async createLesson(dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: {
        chapterId: dto.chapterId,
        title: dto.title,
        orderIndex: dto.orderIndex ?? 0,
        contentNote: dto.contentNote,
      },
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.lesson.update({
      where: { id },
      data: { title: dto.title, orderIndex: dto.orderIndex, contentNote: dto.contentNote },
    });
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.prisma.lesson.delete({ where: { id } });
    return { message: 'Lesson deleted' };
  }
}
