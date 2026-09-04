import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentsService } from '../src/modules/assignments/assignments.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AssignmentsService', () => {
  const mockPrisma = {
    assignment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    assignmentTarget: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  } as any;

  const service = new AssignmentsService(mockPrisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an assignment with questions', async () => {
    const dto = {
      title: 'Bài tập Toán',
      lessonId: 'lesson-1',
      questions: [{ questionId: 'q1', orderIndex: 0 }, { questionId: 'q2', orderIndex: 1 }],
    };
    mockPrisma.assignment.create.mockResolvedValue({ id: 'a1', ...dto });

    const result = await service.create(dto, 'admin-1');

    expect(mockPrisma.assignment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'Bài tập Toán',
        createdBy: 'admin-1',
        lessonId: 'lesson-1',
      }),
    }));
    expect(result.id).toBe('a1');
  });

  it('creates target for a class', async () => {
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 'a1', title: 'BT1' });
    mockPrisma.assignmentTarget.create.mockResolvedValue({ id: 't1', assignmentId: 'a1', classId: 'c1' });

    const result = await service.createTarget('a1', { classId: 'c1', dueDate: '2026-08-30' });

    expect(result.classId).toBe('c1');
    expect(mockPrisma.assignmentTarget.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignmentId: 'a1', classId: 'c1' }),
    }));
  });

  it('creates target for a specific student', async () => {
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 'a1', title: 'BT1' });
    mockPrisma.assignmentTarget.create.mockResolvedValue({ id: 't2', assignmentId: 'a1', studentId: 's1' });

    const result = await service.createTarget('a1', { studentId: 's1' });

    expect(result.studentId).toBe('s1');
  });

  it('throws if neither classId nor studentId provided when creating target', async () => {
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 'a1' });

    await expect(service.createTarget('a1', {})).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound when assignment does not exist', async () => {
    mockPrisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('returns targets with class and student details', async () => {
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 'a1' });
    mockPrisma.assignmentTarget.findMany.mockResolvedValue([
      { id: 't1', class: { id: 'c1', name: 'Lớp 10A' }, student: null },
      { id: 't2', class: null, student: { id: 's1', fullName: 'Nguyễn Văn A', email: 'a@edu.vn' } },
    ]);

    const result = await service.getTargets('a1');

    expect(result).toHaveLength(2);
    expect(result[0].class?.name).toBe('Lớp 10A');
    expect(result[1].student?.fullName).toBe('Nguyễn Văn A');
  });
});
