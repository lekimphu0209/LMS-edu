import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCurriculumDto,
  UpdateCurriculumDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  SetCurriculumStructureDto,
} from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  // ── Curriculum ──

  /**
   * Lấy danh sách đề cương (có thể lọc theo một giáo viên), mới nhất trước.
   * Mỗi dòng kèm `_count.chapters` và `_count.questions` gộp phẳng
   * (tổng số dòng LessonQuestion của mọi bài) để hiển thị ở sidebar.
   */
  async findAll(teacherId?: string) {
    const curriculums = await this.prisma.curriculum.findMany({
      where: teacherId ? { teacherId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chapters: true } },
        chapters: {
          select: {
            lessons: {
              select: { _count: { select: { questions: true } } },
            },
          },
        },
      },
    });
    return curriculums.map(({ chapters, ...c }) => ({
      ...c,
      _count: {
        chapters: c._count.chapters,
        questions: chapters.reduce(
          (sum, ch) => sum + ch.lessons.reduce((s, l) => s + l._count.questions, 0),
          0,
        ),
      },
    }));
  }

  /**
   * Trả về cây đề cương đầy đủ cho editor: mục và bài đã sắp theo `orderIndex`,
   * mỗi bài kèm danh sách id câu hỏi theo đúng thứ tự.
   */
  async findById(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                questions: {
                  orderBy: { orderIndex: 'asc' },
                  select: { questionId: true },
                },
              },
            },
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

  /**
   * Thay toàn bộ cây đề cương trong một transaction.
   * Mục/bài có id trùng được cập nhật và giữ lại (áp thứ tự mới);
   * id không còn trong payload bị xóa; phần không có id được tạo mới.
   * questionIds của mỗi bài được ghi lại thành các dòng LessonQuestion theo thứ tự.
   */
  async setStructure(id: string, dto: SetCurriculumStructureDto) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: { chapters: { include: { lessons: true } } },
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    // Id có trong payload thì được giữ; mọi thứ khác sẽ bị xóa ở dưới.
    // Phần mới đến không có id nên đi vào nhánh create.
    // Chỉ chấp nhận id thuộc đúng đề cương này — id lạ/thuộc đề cương khác
    // bị coi như phần tử mới để tránh ghi đè dữ liệu nơi khác.
    const ownedChapterIds = new Set(curriculum.chapters.map((c) => c.id));
    const ownedLessonIds = new Set(
      curriculum.chapters.flatMap((c) => c.lessons.map((l) => l.id)),
    );
    const keepChapterIds = (dto.chapters ?? [])
      .map((c) => c.id)
      .filter((x): x is string => !!x && ownedChapterIds.has(x));
    const keepLessonIds = (dto.chapters ?? [])
      .flatMap((c) => c.lessons ?? [])
      .map((l) => l.id)
      .filter((x): x is string => !!x && ownedLessonIds.has(x));

    await this.prisma.$transaction(async (tx) => {
      if (dto.title !== undefined) {
        await tx.curriculum.update({ where: { id }, data: { title: dto.title } });
      }

      // Xóa mục/bài không còn trong payload (lesson_questions xóa theo cascade)
      await tx.chapter.deleteMany({
        where: { curriculumId: id, id: { notIn: keepChapterIds } },
      });
      await tx.lesson.deleteMany({
        where: { chapter: { curriculumId: id }, id: { notIn: keepLessonIds } },
      });

      for (const [ci, ch] of (dto.chapters ?? []).entries()) {
        const chapter = ch.id && ownedChapterIds.has(ch.id)
          ? await tx.chapter.update({
              where: { id: ch.id },
              data: { title: ch.title, orderIndex: ci },
            })
          : await tx.chapter.create({
              data: { curriculumId: id, title: ch.title, orderIndex: ci },
            });

        for (const [li, ls] of (ch.lessons ?? []).entries()) {
          const lesson = ls.id && ownedLessonIds.has(ls.id)
            ? await tx.lesson.update({
                where: { id: ls.id },
                data: {
                  title: ls.title,
                  orderIndex: li,
                  contentNote: ls.contentNote,
                  chapterId: chapter.id,
                },
              })
            : await tx.lesson.create({
                data: {
                  chapterId: chapter.id,
                  title: ls.title,
                  orderIndex: li,
                  contentNote: ls.contentNote,
                },
              });

          const questionIds = [...new Set(ls.questionIds ?? [])];
          await tx.lessonQuestion.deleteMany({ where: { lessonId: lesson.id } });
          if (questionIds.length) {
            await tx.lessonQuestion.createMany({
              data: questionIds.map((questionId, qi) => ({
                lessonId: lesson.id,
                questionId,
                orderIndex: qi,
              })),
              skipDuplicates: true,
            });
          }
        }
      }
    });

    return this.findById(id);
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
