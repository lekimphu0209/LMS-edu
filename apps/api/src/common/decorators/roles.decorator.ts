import { SetMetadata } from '@nestjs/common';

/**
 * Decorator @Roles('ADMIN', 'TEACHER') đánh dấu vai trò được phép truy cập.
 * Metadata này được RolesGuard đọc và so với user.role trong JWT.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
