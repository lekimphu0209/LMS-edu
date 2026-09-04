import type { UserRole, UserStatus } from './enums';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
  mustChangePassword?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}
