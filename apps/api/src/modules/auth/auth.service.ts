/**
 * AuthService — đăng nhập/đăng ký, cấp và thu hồi JWT access/refresh token,
 * đổi mật khẩu và lấy hồ sơ người dùng.
 *
 * Mật khẩu băm bằng argon2. Refresh token bị thu hồi được lưu dạng hash
 * (SHA-256) trong bảng revoked_tokens — tồn tại qua restart và dùng được
 * cho nhiều instance. Hàng đã quá hạn được dọn trong refresh().
 */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/** Payload nhúng trong cả access và refresh token. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** Băm refresh token trước khi lưu/so sánh — không lưu token thô trong DB. */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /** Xác thực email + mật khẩu; tài khoản INACTIVE bị coi như sai credentials. */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Raw SQL: lastLoginAt mới thêm vào schema — không phụ thuộc generated client.
    void this.prisma
      .$executeRaw`UPDATE users SET "lastLoginAt" = NOW() WHERE id = ${user.id}`
      .catch(() => undefined);

    return this.generateTokens(user);
  }

  /** Đăng ký tài khoản mới (mặc định role STUDENT), trả về cặp token đầu tiên. */
  async register(dto: RegisterDto, createdBy?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: (dto.role as 'ADMIN' | 'TEACHER' | 'STUDENT') || 'STUDENT',
        createdBy,
      },
    });

    return this.generateTokens(user);
  }

  /** Cấp lại cặp token mới từ refresh token hợp lệ; token đã logout/hết hạn bị từ chối. */
  async refresh(refreshToken: string) {
    try {
      // Raw SQL: bảng revoked_tokens mới thêm — không phụ thuộc generated client.
      const revoked = await this.prisma.$queryRaw<{ tokenHash: string }[]>`
        SELECT "tokenHash" FROM revoked_tokens
        WHERE "tokenHash" = ${hashToken(refreshToken)}
        LIMIT 1
      `;
      if (revoked.length > 0) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Dọn token đã quá hạn — chúng vốn không refresh được nữa.
      void this.prisma.$executeRaw`
        DELETE FROM revoked_tokens WHERE "expiresAt" < NOW()
      `.catch(() => undefined);

      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Đăng xuất: ghi hash refresh token vào revoked_tokens để chặn refresh
   * về sau. Idempotent — token hỏng/hết hạn vẫn trả về thành công vì
   * chúng vốn không dùng refresh được.
   */
  async logout(refreshToken: string) {
    let payload: JwtPayload & { exp?: number };
    try {
      payload = this.jwtService.verify<JwtPayload & { exp?: number }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return { message: 'Logged out successfully' };
    }

    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date();
    await this.prisma.$executeRaw`
      INSERT INTO revoked_tokens ("id", "tokenHash", "userId", "expiresAt")
      VALUES (${crypto.randomUUID()}, ${hashToken(refreshToken)}, ${payload.sub}, ${expiresAt})
      ON CONFLICT ("tokenHash") DO NOTHING
    `;
    return { message: 'Logged out successfully' };
  }

  /**
   * Đổi mật khẩu. Tài khoản bị cờ mustChangePassword (mật khẩu tạm do admin
   * cấp) được đổi luôn không cần mật khẩu hiện tại.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mustChangePassword) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    return { message: 'Password changed successfully' };
  }

  /** Hồ sơ cơ bản của người dùng đang đăng nhập (không trả passwordHash). */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /** Ký access (mặc định 15m) + refresh token (mặc định 7d) từ env config. */
  private generateTokens(user: { id: string; email: string; role: string; fullName: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      tokens: { accessToken, refreshToken },
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    };
  }
}
