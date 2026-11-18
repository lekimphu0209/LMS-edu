/**
 * QuestionBankService — CRUD ngân hàng câu hỏi của giáo viên.
 * Câu hỏi SINGLE/MULTI có bảng options con sắp theo orderIndex;
 * FILL_BLANK không có option.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  /**
   * Danh sách câu hỏi kèm options, lọc theo giáo viên/môn/loại/độ khó/từ khóa
   * (tìm trong questionText, không phân biệt hoa thường) + phân trang.
   */
  async findAll(
    teacherId?: string,
    subject?: string,
    type?: string,
    difficulty?: string,
    q?: string,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = {};
    if (teacherId) where.teacherId = teacherId;
    if (subject) where.subject = subject;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (q) where.questionText = { contains: q, mode: 'insensitive' };

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { options: { orderBy: { orderIndex: 'asc' } } },
      }),
      this.prisma.question.count({ where }),
    ]);

    return { data: questions, total, page, limit };
  }

  /** Câu hỏi theo id kèm options; 404 nếu không tồn tại. */
  async findById(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  /** Tạo câu hỏi mới, nested-create luôn các options (nếu gửi kèm). */
  async create(dto: CreateQuestionDto, teacherId: string) {
    const { options, ...questionData } = dto;

    return this.prisma.question.create({
      data: {
        teacherId,
        subject: questionData.subject,
        type: questionData.type as 'SINGLE' | 'MULTI' | 'FILL_BLANK',
        questionText: questionData.questionText,
        questionImageUrl: questionData.questionImageUrl,
        difficulty: (questionData.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
        defaultScore: questionData.defaultScore ?? 1.0,
        options: options
          ? { create: options.map((opt) => ({
              optionText: opt.optionText,
              optionImageUrl: opt.optionImageUrl,
              isCorrect: opt.isCorrect,
              orderIndex: opt.orderIndex ?? 0,
            })) }
          : undefined,
      },
      include: { options: true },
    });
  }

  /**
   * Cập nhật các trường được gửi lên. Hiện chưa thay danh sách options —
   * nếu cần sửa đáp án phải mở rộng thêm.
   */
  async update(id: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    const { options, ...questionData } = dto;

    const data: Record<string, unknown> = {};
    if (questionData.subject !== undefined) data.subject = questionData.subject;
    if (questionData.type !== undefined) data.type = questionData.type as 'SINGLE' | 'MULTI' | 'FILL_BLANK';
    if (questionData.questionText !== undefined) data.questionText = questionData.questionText;
    if (questionData.questionImageUrl !== undefined) data.questionImageUrl = questionData.questionImageUrl;
    if (questionData.difficulty !== undefined) data.difficulty = questionData.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
    if (questionData.defaultScore !== undefined) data.defaultScore = questionData.defaultScore;

    return this.prisma.question.update({
      where: { id },
      data,
      include: { options: true },
    });
  }

  /** Xóa câu hỏi; P2003 → từ chối khi câu hỏi đã nằm trong bài nộp/bài tập. */
  async delete(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    try {
      await this.prisma.question.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new BadRequestException(
          'Không thể xóa câu hỏi đã có dữ liệu liên quan (đáp án, bài nộp).',
        );
      }
      throw e;
    }
    return { message: 'Question deleted' };
  }
}
