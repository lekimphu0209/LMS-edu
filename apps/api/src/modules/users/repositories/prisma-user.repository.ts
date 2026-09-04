import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  UserRepository,
  UserEntity,
  CreateUserInput,
  UpdateUserInput,
} from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll(params?: { role?: string; status?: string; skip?: number; take?: number }): Promise<UserEntity[]> {
    const where: Record<string, unknown> = {};
    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;

    return this.prisma.user.findMany({
      where,
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserInput): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword },
    });
  }

  async count(params?: { role?: string; status?: string }): Promise<number> {
    const where: Record<string, unknown> = {};
    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;
    return this.prisma.user.count({ where });
  }
}
