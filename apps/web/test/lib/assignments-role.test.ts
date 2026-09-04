import { describe, it, expect } from 'vitest';

// Replicates the canManage guard used in the Assignments page
const canManage = (role?: string) => role === 'ADMIN' || role === 'TEACHER';

// Replicates target payload builder in AssignmentsPage
const buildTargetDto = (
  assignmentId: string,
  targetType: 'CLASS' | 'STUDENT',
  targetId: string,
  unlockDate?: string,
  dueDate?: string,
) => {
  return {
    assignmentId,
    targetType,
    classId: targetType === 'CLASS' ? targetId : undefined,
    studentId: targetType === 'STUDENT' ? targetId : undefined,
    unlockDate: unlockDate || undefined,
    dueDate: dueDate || undefined,
  };
};

describe('Assignments role & targeting logic', () => {
  it('allows ADMIN to manage assignments', () => {
    expect(canManage('ADMIN')).toBe(true);
  });

  it('allows TEACHER to manage assignments', () => {
    expect(canManage('TEACHER')).toBe(true);
  });

  it('does not allow STUDENT to manage assignments', () => {
    expect(canManage('STUDENT')).toBe(false);
  });

  it('builds class target payload correctly', () => {
    const dto = buildTargetDto('a1', 'CLASS', 'c1', '2026-08-25', '2026-08-30');
    expect(dto).toEqual({
      assignmentId: 'a1',
      targetType: 'CLASS',
      classId: 'c1',
      studentId: undefined,
      unlockDate: '2026-08-25',
      dueDate: '2026-08-30',
    });
  });

  it('builds student target payload correctly', () => {
    const dto = buildTargetDto('a1', 'STUDENT', 's1');
    expect(dto).toEqual({
      assignmentId: 'a1',
      targetType: 'STUDENT',
      classId: undefined,
      studentId: 's1',
      unlockDate: undefined,
      dueDate: undefined,
    });
  });
});
