import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  UserRepository,
  UserEntity,
  UserWithClasses,
  CreateUserInput,
  UpdateUserInput,
} from './user.repository';

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  mustChangePassword: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  async findByIdWithClasses(id: string): Promise<UserWithClasses | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        classesAsTeacher: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, subject: true },
        },
        enrolledClasses: {
          where: { status: 'ENROLLED' },
          select: {
            class: { select: { id: true, name: true, subject: true } },
          },
        },
      },
    }) as unknown as UserWithClasses | null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email }, select: userSelect });
  }

  async findAll(params?: { role?: string; status?: string; search?: string; skip?: number; take?: number }): Promise<UserEntity[]> {
    const where: Record<string, unknown> = {};
    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    });
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    return this.prisma.user.create({ data, select: userSelect });
  }

  async update(id: string, data: UpdateUserInput): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data, select: userSelect });
  }

  async updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword },
    });
  }

  async count(params?: { role?: string; status?: string; search?: string }): Promise<number> {
    const where: Record<string, unknown> = {};
    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.count({ where });
  }
}
