import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRepository } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private repository: UserRepository;

  constructor(private prisma: PrismaService) {
    this.repository = new PrismaUserRepository(prisma);
  }

  async findAll(role?: string, status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.repository.findAll({ role, status, skip, take: limit }),
      this.repository.count({ role, status }),
    ]);
    return { data: users, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(dto.password);
    return this.repository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role as 'ADMIN' | 'TEACHER' | 'STUDENT',
      mustChangePassword: dto.mustChangePassword ?? true,
      createdBy,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return this.repository.update(id, {
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role as 'ADMIN' | 'TEACHER' | 'STUDENT' | undefined,
      mustChangePassword: dto.mustChangePassword,
    });
  }

  async deactivate(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repository.update(id, { status: 'INACTIVE' });
  }

  async activate(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repository.update(id, { status: 'ACTIVE' });
  }

  async resetPassword(id: string, dto: ResetPasswordDto, resetBy: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.repository.updatePassword(id, passwordHash, true);

    await this.prisma.passwordResetLog.create({
      data: { userId: id, resetBy },
    });

    return { message: 'Password reset successfully' };
  }
}
