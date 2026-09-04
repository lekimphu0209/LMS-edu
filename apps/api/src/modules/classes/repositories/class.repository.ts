export interface ClassEntity {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassInput {
  name: string;
  subject: string;
  teacherId: string;
  createdBy?: string;
}

export interface UpdateClassInput {
  name?: string;
  subject?: string;
  teacherId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ClassRepository {
  findById(id: string): Promise<ClassEntity | null>;
  findAll(params?: { teacherId?: string; status?: string; skip?: number; take?: number }): Promise<ClassEntity[]>;
  create(data: CreateClassInput): Promise<ClassEntity>;
  update(id: string, data: UpdateClassInput): Promise<ClassEntity>;
  count(params?: { teacherId?: string; status?: string }): Promise<number>;
}
