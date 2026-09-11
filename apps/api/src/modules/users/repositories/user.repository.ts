export interface UserEntity {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  mustChangePassword?: boolean;
  createdBy?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status?: 'ACTIVE' | 'INACTIVE';
  mustChangePassword?: boolean;
}

export type UserWithClasses = UserEntity & {
  classesAsTeacher?: { id: string; name: string; subject: string }[];
  enrolledClasses?: { class: { id: string; name: string; subject: string } }[];
};

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByIdWithClasses(id: string): Promise<UserWithClasses | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(params?: { role?: string; status?: string; search?: string; skip?: number; take?: number }): Promise<UserEntity[]>;
  create(data: CreateUserInput): Promise<UserEntity>;
  update(id: string, data: UpdateUserInput): Promise<UserEntity>;
  updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void>;
  count(params?: { role?: string; status?: string; search?: string }): Promise<number>;
}
