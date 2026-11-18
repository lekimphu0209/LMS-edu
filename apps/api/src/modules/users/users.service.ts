/**
 * UsersService — CRUD tài khoản người dùng (admin), reset mật khẩu và
 * nhật ký reset. Truy cập dữ liệu qua UserRepository (hiện là bản Prisma).
 */
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UserRepository } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from './dto/user.dto';

/** Sinh mật khẩu tạm ngẫu nhiên (khi admin không nhập sẵn mật khẩu). */
function generateTempPassword(length = 10): string {
  return randomBytes(length).toString('base64').slice(0, length).replace(/[^a-zA-Z0-9]/g, 'A');
}

@Injectable()
export class UsersService {
  private repository: UserRepository;

  constructor(private prisma: PrismaService) {
    this.repository = new PrismaUserRepository(prisma);
  }

  /** Danh sách người dùng có lọc role/status/search + phân trang. */
  async findAll(role?: string, status?: string, search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.repository.findAll({ role, status, search, skip, take: limit }),
      this.repository.count({ role, status, search }),
    ]);
    return { data: users, total, page, limit };
  }

  /** Lấy user theo id; 404 nếu không tồn tại. */
  async findById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** User + danh sách lớp: học sinh lấy lớp đã ghi danh, giáo viên lấy lớp phụ trách. */
  async findByIdWithClasses(id: string) {
    const user = await this.repository.findByIdWithClasses(id);
    if (!user) throw new NotFoundException('User not found');

    const classes =
      user.role === 'STUDENT'
        ? user.enrolledClasses?.map((e) => e.class) ?? []
        : user.classesAsTeacher ?? [];

    return { ...user, classes };
  }

  /** Lịch sử các lần reset mật khẩu của một user (mới nhất trước). */
  async getPasswordResetLogs(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.passwordResetLog.findMany({
      where: { userId },
      orderBy: { resetAt: 'desc' },
    });
  }

  /**
   * Tạo tài khoản. Không có mật khẩu sẵn → sinh mật khẩu tạm và bắt buộc
   * đổi lần đăng nhập đầu; trả temporaryPassword để admin gửi cho user.
   */
  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    if (dto.role === 'STUDENT' || dto.role === 'TEACHER') {
      if (!dto.password) throw new BadRequestException('Password is required for students and teachers');
    }

    const temporaryPassword = dto.password ?? generateTempPassword();
    const mustChangePassword = dto.password ? (dto.mustChangePassword ?? false) : true;
    const passwordHash = await argon2.hash(temporaryPassword);
    const user = await this.repository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role as 'ADMIN' | 'TEACHER' | 'STUDENT',
      mustChangePassword,
      createdBy,
    });

    return { user, temporaryPassword: dto.password ? undefined : temporaryPassword };
  }

  /** Cập nhật thông tin hồ sơ (tên, email, role, cờ đổi mật khẩu). */
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

  /** Khóa/mở khóa tài khoản. */
  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repository.update(id, { status });
  }

  /**
   * Reset mật khẩu về giá trị do admin nhập hoặc mật khẩu tạm ngẫu nhiên;
   * ghi log và đặt cờ mustChangePassword để user đổi lại ngay.
   */
  async resetPassword(id: string, dto: ResetPasswordDto, resetBy: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const temporaryPassword = dto.newPassword ?? generateTempPassword();
    const passwordHash = await argon2.hash(temporaryPassword);
    await this.repository.updatePassword(id, passwordHash, true);

    await this.prisma.passwordResetLog.create({
      data: { userId: id, resetBy },
    });

    return { message: 'Password reset successfully', temporaryPassword: dto.newPassword ? undefined : temporaryPassword };
  }
}
