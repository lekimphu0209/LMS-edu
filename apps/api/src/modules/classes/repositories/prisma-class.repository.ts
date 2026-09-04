import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ClassRepository,
  ClassEntity,
  CreateClassInput,
  UpdateClassInput,
} from './class.repository';

@Injectable()
export class PrismaClassRepository implements ClassRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<ClassEntity | null> {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        students: { include: { student: { select: { id: true, fullName: true, email: true } } } },
        _count: { select: { students: true } },
      },
    }) as unknown as ClassEntity | null;
  }

  async findAll(params?: { teacherId?: string; status?: string; skip?: number; take?: number }): Promise<ClassEntity[]> {
    const where: Record<string, unknown> = {};
    if (params?.teacherId) where.teacherId = params.teacherId;
    if (params?.status) where.status = params.status;

    return this.prisma.class.findMany({
      where,
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { students: true } },
      },
    }) as unknown as ClassEntity[];
  }

  async create(data: CreateClassInput): Promise<ClassEntity> {
    return this.prisma.class.create({ data }) as unknown as ClassEntity;
  }

  async update(id: string, data: UpdateClassInput): Promise<ClassEntity> {
    return this.prisma.class.update({ where: { id }, data }) as unknown as ClassEntity;
  }

  async count(params?: { teacherId?: string; status?: string }): Promise<number> {
    const where: Record<string, unknown> = {};
    if (params?.teacherId) where.teacherId = params.teacherId;
    if (params?.status) where.status = params.status;
    return this.prisma.class.count({ where });
  }
}
