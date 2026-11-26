import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentsService } from '../src/modules/students/students.service';
import { SubmissionsService } from '../src/modules/submissions/submissions.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// ── Shared fixtures ──────────────────────────────────────────
const STUDENT_ID = 'stu-1';
const NOW = Date.now();

function makeTarget(overrides: Partial<any> = {}) {
  return {
    id: 'target-1',
    classId: 'class-1',
    studentId: null,
    dueDate: new Date(NOW + 3 * 86400000),
    assignment: {
      id: 'asg-1',
      title: 'Bài tập Toán 1',
      type: 'QUIZ',
      maxScore: 10,
      _count: { questions: 5 },
    },
    class: { id: 'class-1', name: '10A - Toán', subject: 'Toán' },
    submissions: [],
    ...overrides,
  };
}

function makeSubmission(overrides: Partial<any> = {}) {
  return {
    id: 'sub-1',
    status: 'GRADED',
    totalScore: 8.5,
    submittedAt: new Date(NOW - 86400000),
    createdAt: new Date(NOW - 86400000),
    learningSession: null,
    ...overrides,
  };
}

// ── StudentsService.toStudentAssignment ──────────────────────
describe('StudentsService.toStudentAssignment', () => {
  const prisma = { classStudent: { findMany: vi.fn() } } as any;
  const service = new StudentsService(prisma);
  const map = (t: any) => (service as any).toStudentAssignment(t);

  it('maps pending assignment with submissionId = null', () => {
    const r = map(makeTarget());
    expect(r.id).toBe('asg-1');
    expect(r.targetId).toBe('target-1');
    expect(r.done).toBe(false);
    expect(r.score).toBeNull();
    expect(r.submissionId).toBeNull();
    expect(r.overdue).toBe(false);
    expect(r.questions).toBe(5);
    expect(r.daysLeft).toBe(3);
  });

  it('maps done assignment with score + submissionId', () => {
    const t = makeTarget({ submissions: [makeSubmission()] });
    const r = map(t);
    expect(r.done).toBe(true);
    expect(r.score).toBe(8.5);
    expect(r.submissionId).toBe('sub-1');
    expect(r.submittedAt).toBe(t.submissions[0].submittedAt.toISOString());
  });

  it('flags overdue only when pending + past due', () => {
    const pastDue = new Date(NOW - 2 * 86400000);
    expect(map(makeTarget({ dueDate: pastDue })).overdue).toBe(true);
    expect(
      map(makeTarget({ dueDate: pastDue, submissions: [makeSubmission({ status: 'SUBMITTED' })] })).overdue,
    ).toBe(false);
  });

  it('treats IN_PROGRESS as not done and uses latest submission', () => {
    const t = makeTarget({
      submissions: [
        makeSubmission({ id: 'sub-new', status: 'IN_PROGRESS', totalScore: null }),
        makeSubmission({ id: 'sub-old', status: 'GRADED', totalScore: 9 }),
      ],
    });
    const r = map(t);
    expect(r.done).toBe(false); // latest submission is IN_PROGRESS
    expect(r.submissionId).toBe('sub-new');
  });
});

// ── StudentsService.getMyAssignments ─────────────────────────
describe('StudentsService.getMyAssignments', () => {
  const prisma = {
    classStudent: { findMany: vi.fn() },
    assignmentTarget: { findMany: vi.fn() },
  } as any;
  const service = new StudentsService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.classStudent.findMany.mockResolvedValue([{ classId: 'class-1' }]);
    prisma.assignmentTarget.findMany.mockResolvedValue([
      makeTarget({ id: 't1', submissions: [makeSubmission()] }),
      makeTarget({ id: 't2', assignment: { ...makeTarget().assignment, id: 'asg-2', _count: { questions: 3 } } }),
    ]);
  });

  it('returns all items mapped with done flags', async () => {
    const items = await service.getMyAssignments(STUDENT_ID);
    expect(items).toHaveLength(2);
    expect(items[0].done).toBe(true);
    expect(items[1].done).toBe(false);
  });

  it('filters status=pending / done', async () => {
    const pending = await service.getMyAssignments(STUDENT_ID, 'pending');
    expect(pending).toHaveLength(1);
    expect(pending[0].done).toBe(false);
    const done = await service.getMyAssignments(STUDENT_ID, 'done');
    expect(done).toHaveLength(1);
    expect(done[0].submissionId).toBe('sub-1');
  });
});

// ── StudentsService.getMyClass (timeMin từ LearningSession) ──
describe('StudentsService.getMyClass — curriculum timeMin', () => {
  const prisma = {
    classStudent: { findFirst: vi.fn() },
    assignmentTarget: { findMany: vi.fn() },
    class: { findUnique: vi.fn() },
  } as any;
  const service = new StudentsService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.classStudent.findFirst.mockResolvedValue({ id: 'enr-1' });
    prisma.assignmentTarget.findMany.mockResolvedValue([]);
  });

  function mockClass(endedMin: number | null) {
    const startedAt = new Date('2026-10-20T10:00:00Z');
    const session =
      endedMin === null
        ? { startedAt, endedAt: null }
        : { startedAt, endedAt: new Date(startedAt.getTime() + endedMin * 60000) };
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      name: '10A - Toán',
      subject: 'Toán',
      color: '#2563EB',
      icon: '∑',
      grade: '10',
      schedule: 'T2 T6',
      room: 'P101',
      teacher: { id: 't', fullName: 'GV Toán' },
      curriculums: [
        {
          curriculum: {
            chapters: [
              {
                id: 'ch-1',
                title: 'Chương 1',
                lessons: [
                  {
                    id: 'les-1',
                    title: 'Bài 1',
                    assignments: [
                      {
                        targets: [
                          {
                            submissions: [
                              makeSubmission({
                                status: 'GRADED',
                                totalScore: 8,
                                learningSession: session,
                              }),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  }

  it('computes timeMin from endedAt - startedAt', async () => {
    mockClass(35);
    const r = await service.getMyClass('class-1', STUDENT_ID);
    const sec = r.curriculum[0].sections[0];
    expect(sec.timeMin).toBe(35);
    expect(sec.done).toBe(true);
    expect(sec.score).toBe(8);
    expect(sec.completedAt).not.toBeNull();
  });

  it('returns timeMin 0 when session has not ended', async () => {
    mockClass(null);
    const r = await service.getMyClass('class-1', STUDENT_ID);
    expect(r.curriculum[0].sections[0].timeMin).toBe(0);
  });

  it('throws Forbidden when not enrolled', async () => {
    prisma.classStudent.findFirst.mockResolvedValue(null);
    await expect(service.getMyClass('class-1', STUDENT_ID)).rejects.toThrow(ForbiddenException);
  });
});

// ── SubmissionsService.start / submit / grade / findById ─────
describe('SubmissionsService', () => {
  const prisma = {
    assignmentTarget: { findUnique: vi.fn() },
    submission: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    submissionAnswer: { deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    learningSession: { create: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  } as any;
  const service = new SubmissionsService(prisma);

  beforeEach(() => vi.clearAllMocks());

  it('start: creates submission + learning session', async () => {
    prisma.assignmentTarget.findUnique.mockResolvedValue({ id: 't1' });
    prisma.submission.findFirst.mockResolvedValue(null);
    prisma.submission.create.mockResolvedValue({ id: 'sub-new' });

    const r = await service.start({ assignmentTargetId: 't1' }, STUDENT_ID);

    expect(prisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
    );
    expect(prisma.learningSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ submissionId: 'sub-new', studentId: STUDENT_ID }),
      }),
    );
    expect(r.id).toBe('sub-new');
  });

  it('start: reuses existing IN_PROGRESS submission', async () => {
    prisma.assignmentTarget.findUnique.mockResolvedValue({ id: 't1' });
    prisma.submission.findFirst.mockResolvedValue({ id: 'sub-existing' });

    const r = await service.start({ assignmentTargetId: 't1' }, STUDENT_ID);
    expect(r.id).toBe('sub-existing');
    expect(prisma.submission.create).not.toHaveBeenCalled();
    expect(prisma.learningSession.create).not.toHaveBeenCalled();
  });

  it('submit: stores answers, ends session, marks SUBMITTED', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 's1', studentId: STUDENT_ID, assignmentTargetId: 't1' });
    prisma.assignmentTarget.findUnique.mockResolvedValue({ id: 't1', dueDate: new Date(NOW + 86400000) });
    prisma.submission.update.mockResolvedValue({ id: 's1', status: 'SUBMITTED' });

    await service.submit('s1', { answers: [{ questionId: 'q1', selectedOptionIds: ['o1'] }, { questionId: 'q2', textAnswer: 'x' }] }, STUDENT_ID);

    expect(prisma.submissionAnswer.deleteMany).toHaveBeenCalledWith({ where: { submissionId: 's1' } });
    expect(prisma.submissionAnswer.create).toHaveBeenCalledTimes(2);
    expect(prisma.learningSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { submissionId: 's1', endedAt: null } }),
    );
    expect(prisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SUBMITTED' }) }),
    );
  });

  it('submit: marks LATE when past due date', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 's1', studentId: STUDENT_ID, assignmentTargetId: 't1' });
    prisma.assignmentTarget.findUnique.mockResolvedValue({ id: 't1', dueDate: new Date(NOW - 86400000) });
    prisma.submission.update.mockResolvedValue({ id: 's1', status: 'LATE' });

    await service.submit('s1', { answers: [] }, STUDENT_ID);

    expect(prisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'LATE' }) }),
    );
  });

  it('submit: rejects other students submission', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 's1', studentId: 'other' });
    await expect(service.submit('s1', { answers: [] }, STUDENT_ID)).rejects.toThrow(BadRequestException);
  });

  it('grade: sums scoreEarned into totalScore + sets GRADED', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 's1' });
    prisma.submission.update.mockResolvedValue({ id: 's1', status: 'GRADED' });

    await service.grade(
      's1',
      { answers: [{ answerId: 'a1', scoreEarned: 3 }, { answerId: 'a2', scoreEarned: 4.5 }] },
      'teacher-1',
    );

    expect(prisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'GRADED', totalScore: 7.5, gradedBy: 'teacher-1' }),
      }),
    );
  });

  it('findById: throws when missing', async () => {
    prisma.submission.findUnique.mockResolvedValue(null);
    await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
  });

  it('findById: queries answers with question options for review page', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 's1', answers: [{ id: 'a1' }] });
    await service.findById('s1');
    const arg = prisma.submission.findUnique.mock.calls[0][0];
    expect(arg.include.answers.include.question.include.options).toBe(true);
  });
});
