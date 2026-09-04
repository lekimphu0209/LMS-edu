import type { ClassStatus, EnrollmentStatus } from './enums';

export interface Class {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassWithDetails extends Class {
  teacher?: { id: string; fullName: string };
  _count?: { students: number };
}

export interface CreateClassRequest {
  name: string;
  subject: string;
  teacherId: string;
}

export interface UpdateClassRequest {
  name?: string;
  subject?: string;
  teacherId?: string;
}

export interface EnrollStudentsRequest {
  studentIds: string[];
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  status: EnrollmentStatus;
  student: { id: string; fullName: string; email: string };
}

export interface ClassListResponse {
  data: ClassWithDetails[];
  total: number;
  page: number;
  limit: number;
}
