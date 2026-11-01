import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STUDENT_ID = '70b754a1-9a70-4849-84c0-b58437bdca95'; // student@educonnect.local — Lê Hoàng Anh

/**
 * Tạo dữ liệu kiểm thử cho học sinh Lê Hoàng Anh (student@educonnect.local):
 * - Chấm điểm + ngày nộp cho các submissions đã có (điểm đang trống).
 * - Tạo submissions cho các bài tập của lớp 10A - Toán chưa làm.
 * Idempotent — chạy lại nhiều lần vẫn an toàn.
 */
async function main() {
  // 1) Chấm điểm + ngày nộp cho submissions đã tồn tại của học sinh
  const gradeExisting = [
    // asg-math-001 (target-asg-math-001-class1) — 2 submissions cùng target
    { id: '1f6a9cf7-4ccc-460a-a59f-648283f9a230', score: 9.0, at: '2026-10-08T19:40:00' },
    { id: 'sub-student1-asg001', score: 9.0, at: '2026-10-08T19:40:00' },
    // asg-math-004 (target-asg-math-004-class2 — lớp 10B Vật Lý)
    { id: '9267ea47-7626-4433-ab46-baa141e83a52', score: 7.0, at: '2026-10-31T21:00:00' },
  ];
  for (const u of gradeExisting) {
    const res = await prisma.submission.updateMany({
      where: { id: u.id },
      data: {
        status: 'GRADED',
        totalScore: u.score,
        submittedAt: new Date(u.at),
        gradedAt: new Date(u.at),
      },
    });
    if (res.count) console.log(`Graded existing submission ${u.id} → ${u.score}`);
  }

  // 2) Submissions còn thiếu cho các bài tập của class-10a-math
  const newSubs = [
    { id: 'sub-demo-student-asg002', targetId: 'target-asg-math-002-class1', score: 7.5, at: '2026-10-20T18:30:00' },
    { id: 'sub-demo-student-asg003', targetId: 'target-asg-math-003-class1', score: 8.5, at: '2026-10-29T20:15:00' },
  ];
  for (const s of newSubs) {
    await prisma.submission.upsert({
      where: { id: s.id },
      update: {
        status: 'GRADED',
        totalScore: s.score,
        submittedAt: new Date(s.at),
        gradedAt: new Date(s.at),
      },
      create: {
        id: s.id,
        assignmentTargetId: s.targetId,
        studentId: STUDENT_ID,
        status: 'GRADED',
        totalScore: s.score,
        submittedAt: new Date(s.at),
        gradedAt: new Date(s.at),
      },
    });
    console.log(`Upserted submission ${s.id} → ${s.score}`);
  }

  // 3) LearningSession ghi lại thời gian làm từng bài (startedAt → endedAt)
  const sessions = [
    // asg-math-001 — 35 phút
    { id: 'sess-demo-asg001', submissionId: '1f6a9cf7-4ccc-460a-a59f-648283f9a230', targetId: 'target-asg-math-001-class1', start: '2026-10-08T19:05:00', end: '2026-10-08T19:40:00' },
    // asg-math-002 — 28 phút
    { id: 'sess-demo-asg002', submissionId: 'sub-demo-student-asg002', targetId: 'target-asg-math-002-class1', start: '2026-10-20T18:02:00', end: '2026-10-20T18:30:00' },
    // asg-math-003 — 40 phút
    { id: 'sess-demo-asg003', submissionId: 'sub-demo-student-asg003', targetId: 'target-asg-math-003-class1', start: '2026-10-29T19:35:00', end: '2026-10-29T20:15:00' },
    // asg-math-004 (Vật Lý) — 45 phút
    { id: 'sess-demo-asg004', submissionId: '9267ea47-7626-4433-ab46-baa141e83a52', targetId: 'target-asg-math-004-class2', start: '2026-10-31T20:15:00', end: '2026-10-31T21:00:00' },
  ];
  for (const s of sessions) {
    await prisma.learningSession.upsert({
      where: { id: s.id },
      update: { startedAt: new Date(s.start), endedAt: new Date(s.end) },
      create: {
        id: s.id,
        studentId: STUDENT_ID,
        assignmentTargetId: s.targetId,
        submissionId: s.submissionId,
        startedAt: new Date(s.start),
        endedAt: new Date(s.end),
      },
    });
    console.log(`Upserted session ${s.id}`);
  }

  // 4) SubmissionAnswer — đáp án từng câu để trang chi tiết bài làm xem được
  const subByTarget: Record<string, string[]> = {
    'target-asg-math-001-class1': ['sub-student1-asg001', '1f6a9cf7-4ccc-460a-a59f-648283f9a230'],
    'target-asg-math-002-class1': ['sub-demo-student-asg002'],
    'target-asg-math-003-class1': ['sub-demo-student-asg003'],
    'target-asg-math-004-class2': ['9267ea47-7626-4433-ab46-baa141e83a52'],
  };
  for (const [targetId, subIds] of Object.entries(subByTarget)) {
    const target = await prisma.assignmentTarget.findUnique({
      where: { id: targetId },
      include: {
        assignment: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                question: { include: { options: { orderBy: { orderIndex: 'asc' } } } },
              },
            },
          },
        },
      },
    });
    if (!target) {
      console.warn(`Target ${targetId} not found — skip answers`);
      continue;
    }
    const questions = target.assignment.questions;
    for (const submissionId of subIds) {
      await prisma.submissionAnswer.deleteMany({ where: { submissionId } });
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i].question;
        const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        // Câu cuối để sai → trang review có cả đúng lẫn sai
        const wrong = i === questions.length - 1 && correctIds.length > 0;
        let selectedOptionIds: string[] | undefined;
        let textAnswer: string | undefined;
        if (q.type === 'FILL_BLANK') {
          textAnswer = wrong ? 'chưa xác định' : (q.options.find((o) => o.isCorrect)?.optionText ?? '0');
        } else if (q.type === 'MULTI') {
          selectedOptionIds = wrong
            ? q.options.filter((o) => !o.isCorrect).slice(0, 1).map((o) => o.id)
            : correctIds;
        } else {
          selectedOptionIds = [
            wrong ? (q.options.find((o) => !o.isCorrect)?.id ?? correctIds[0]) : correctIds[0],
          ];
        }
        await prisma.submissionAnswer.create({
          data: {
            submissionId,
            questionId: q.id,
            selectedOptionIds: selectedOptionIds ?? undefined,
            textAnswer,
            isCorrect: !wrong,
            scoreEarned: !wrong ? q.defaultScore : 0,
          },
        });
      }
      console.log(`Seeded ${questions.length} answers → ${submissionId}`);
    }
  }

  // 5) Bài kiểm tra có đáp án SAI — để kiểm tra UI review câu sai
  const WRONG_SUB_ID = 'sub-demo-student-wrong';
  const existingWrong = await prisma.submission.findUnique({
    where: { id: WRONG_SUB_ID },
    select: { assignmentTargetId: true },
  });
  const targetInclude = {
    assignment: {
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' as const },
          include: { question: { include: { options: { orderBy: { orderIndex: 'asc' as const } } } } },
        },
      },
    },
  };
  let wrongTarget = existingWrong
    ? await prisma.assignmentTarget.findUnique({
        where: { id: existingWrong.assignmentTargetId },
        include: targetInclude,
      })
    : null;
  if (!wrongTarget) {
    const enrolled = await prisma.classStudent.findMany({
      where: { studentId: STUDENT_ID, status: 'ENROLLED' },
      select: { classId: true },
    });
    wrongTarget = await prisma.assignmentTarget.findFirst({
      where: {
        OR: [{ classId: { in: enrolled.map((e) => e.classId) } }, { studentId: STUDENT_ID }],
        submissions: { none: { studentId: STUDENT_ID } },
      },
      orderBy: { dueDate: 'asc' },
      include: targetInclude,
    });
  }
  if (!wrongTarget) {
    // Không còn target pending → tạo assignment + target demo riêng (clone câu hỏi từ bài có sẵn)
    const src = await prisma.assignmentTarget.findFirst({
      where: { submissions: { some: { studentId: STUDENT_ID } } },
      include: {
        assignment: {
          include: { questions: { orderBy: { orderIndex: 'asc' }, select: { questionId: true, orderIndex: true } } },
        },
      },
    });
    if (!src) {
      console.warn('No source assignment to clone — skipped wrong-answer demo');
    } else {
      await prisma.assignment.upsert({
        where: { id: 'asg-demo-wrong' },
        update: {},
        create: {
          id: 'asg-demo-wrong',
          title: 'Kiểm tra demo — đáp án sai',
          type: 'QUIZ',
          lessonId: src.assignment.lessonId,
          maxScore: src.assignment.maxScore,
          createdBy: src.assignment.createdBy,
          questions: {
            create: src.assignment.questions.map((q) => ({
              questionId: q.questionId,
              orderIndex: q.orderIndex,
            })),
          },
        },
      });
      wrongTarget = await prisma.assignmentTarget.upsert({
        where: { id: 'target-demo-wrong-class1' },
        update: {},
        create: {
          id: 'target-demo-wrong-class1',
          assignmentId: 'asg-demo-wrong',
          classId: src.classId,
          dueDate: new Date('2026-11-02T23:59:00'),
        },
        include: targetInclude,
      });
      console.log(`Created demo assignment asg-demo-wrong → target ${wrongTarget.id}`);
    }
  }
  if (!wrongTarget) {
    console.warn('No target for wrong-answer demo — skipped');
  } else {
    await prisma.submission.upsert({
      where: { id: WRONG_SUB_ID },
      update: { status: 'GRADED', totalScore: 0, submittedAt: new Date('2026-10-30T21:10:00'), gradedAt: new Date('2026-10-30T21:30:00') },
      create: {
        id: WRONG_SUB_ID,
        assignmentTargetId: wrongTarget.id,
        studentId: STUDENT_ID,
        status: 'GRADED',
        totalScore: 0,
        submittedAt: new Date('2026-10-30T21:10:00'),
        gradedAt: new Date('2026-10-30T21:30:00'),
      },
    });
    await prisma.learningSession.upsert({
      where: { id: 'sess-demo-wrong' },
      update: { startedAt: new Date('2026-10-30T20:45:00'), endedAt: new Date('2026-10-30T21:10:00') },
      create: {
        id: 'sess-demo-wrong',
        studentId: STUDENT_ID,
        assignmentTargetId: wrongTarget.id,
        submissionId: WRONG_SUB_ID,
        startedAt: new Date('2026-10-30T20:45:00'),
        endedAt: new Date('2026-10-30T21:10:00'),
      },
    });
    await prisma.submissionAnswer.deleteMany({ where: { submissionId: WRONG_SUB_ID } });
    let wrongCount = 0;
    for (const aq of wrongTarget.assignment.questions) {
      const q = aq.question;
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const wrongIds = q.options.filter((o) => !o.isCorrect).map((o) => o.id);
      // Tất cả câu đều sai để dễ kiểm tra UI (chọn option sai / text sai)
      let selectedOptionIds: string[] | undefined;
      let textAnswer: string | undefined;
      if (q.type === 'FILL_BLANK') {
        textAnswer = 'đáp án sai';
      } else if (wrongIds.length > 0) {
        selectedOptionIds = q.type === 'MULTI' ? wrongIds.slice(0, 2) : [wrongIds[0]];
      } else {
        // Câu không có option sai (mọi option đều đúng) — chọn bỏ sót 1 đáp án đúng
        selectedOptionIds = correctIds.slice(0, 1);
      }
      await prisma.submissionAnswer.create({
        data: {
          submissionId: WRONG_SUB_ID,
          questionId: q.id,
          selectedOptionIds: selectedOptionIds ?? undefined,
          textAnswer,
          isCorrect: false,
          scoreEarned: 0,
        },
      });
      wrongCount++;
    }
    console.log(`Seeded wrong-answer submission ${WRONG_SUB_ID} → ${wrongTarget.id} (${wrongCount} câu sai, 0đ)`);
  }

  // 6) ~20 bài kiểm tra phụ để kiểm tra giao diện (list + biểu đồ thống kê)
  //    Mỗi bài = 1 lesson riêng → mỗi bài là 1 mục riêng trong curriculum/biểu đồ.
  const cls = await prisma.class.findUnique({
    where: { id: 'class-10a-math' },
    include: {
      curriculums: {
        include: {
          curriculum: { include: { chapters: { orderBy: { orderIndex: 'asc' } } } },
        },
      },
    },
  });
  const chapter = cls?.curriculums[0]?.curriculum.chapters[0];
  const qsrc = await prisma.assignment.findFirst({
    where: { targets: { some: { classId: 'class-10a-math' } } },
    include: {
      questions: { orderBy: { orderIndex: 'asc' }, select: { questionId: true, orderIndex: true } },
    },
  });
  if (!chapter || !qsrc) {
    console.warn('Missing chapter or question source — skipped bulk demo');
  } else {
    const qDetails = await prisma.question.findMany({
      where: { id: { in: qsrc.questions.map((q) => q.questionId) } },
      include: { options: { orderBy: { orderIndex: 'asc' } } },
    });
    const qById = new Map(qDetails.map((q) => [q.id, q]));

    // score / phút làm / số ngày trước — deterministic để chạy lại ra cùng dữ liệu
    const demoData: { score: number; mins: number; daysAgo: number }[] = [
      { score: 9.5, mins: 22, daysAgo: 1 },
      { score: 8.0, mins: 35, daysAgo: 2 },
      { score: 7.0, mins: 18, daysAgo: 3 },
      { score: 6.0, mins: 40, daysAgo: 4 },
      { score: 8.5, mins: 27, daysAgo: 5 },
      { score: 5.5, mins: 45, daysAgo: 6 },
      { score: 9.0, mins: 30, daysAgo: 7 },
      { score: 7.5, mins: 25, daysAgo: 8 },
      { score: 4.5, mins: 50, daysAgo: 9 },
      { score: 8.0, mins: 33, daysAgo: 10 },
      { score: 6.5, mins: 20, daysAgo: 12 },
      { score: 10, mins: 28, daysAgo: 13 },
      { score: 7.0, mins: 38, daysAgo: 15 },
      { score: 5.0, mins: 55, daysAgo: 16 },
      { score: 8.5, mins: 24, daysAgo: 18 },
      { score: 6.0, mins: 42, daysAgo: 20 },
      { score: 9.0, mins: 31, daysAgo: 22 },
      { score: 3.5, mins: 60, daysAgo: 24 },
      { score: 7.5, mins: 26, daysAgo: 26 },
      { score: 8.0, mins: 36, daysAgo: 28 },
    ];
    const BASE = new Date('2026-10-31T21:00:00').getTime();

    for (let i = 0; i < demoData.length; i++) {
      const n = String(i + 1).padStart(2, '0');
      const { score, mins, daysAgo } = demoData[i];
      const endAt = new Date(BASE - daysAgo * 86400000);
      const startAt = new Date(endAt.getTime() - mins * 60000);

      const lesson = await prisma.lesson.upsert({
        where: { id: `les-demo-bt${n}` },
        update: {},
        create: {
          id: `les-demo-bt${n}`,
          chapterId: chapter.id,
          title: `Bài tập bổ sung ${n}`,
          orderIndex: 100 + i,
        },
      });
      await prisma.assignment.upsert({
        where: { id: `asg-demo-bt${n}` },
        update: {},
        create: {
          id: `asg-demo-bt${n}`,
          title: `Kiểm tra ${n}`,
          type: 'QUIZ',
          lessonId: lesson.id,
          maxScore: 10,
          createdBy: qsrc.createdBy,
        },
      });
      await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: `asg-demo-bt${n}` } });
      await prisma.assignmentQuestion.createMany({
        data: qsrc.questions.map((q) => ({
          assignmentId: `asg-demo-bt${n}`,
          questionId: q.questionId,
          orderIndex: q.orderIndex,
        })),
      });
      await prisma.assignmentTarget.upsert({
        where: { id: `target-demo-bt${n}` },
        update: {},
        create: {
          id: `target-demo-bt${n}`,
          assignmentId: `asg-demo-bt${n}`,
          classId: 'class-10a-math',
          dueDate: new Date(endAt.getTime() + 2 * 86400000),
        },
      });
      await prisma.submission.upsert({
        where: { id: `sub-demo-bt${n}` },
        update: { status: 'GRADED', totalScore: score, submittedAt: endAt, gradedAt: endAt },
        create: {
          id: `sub-demo-bt${n}`,
          assignmentTargetId: `target-demo-bt${n}`,
          studentId: STUDENT_ID,
          status: 'GRADED',
          totalScore: score,
          submittedAt: endAt,
          gradedAt: endAt,
        },
      });
      await prisma.learningSession.upsert({
        where: { id: `sess-demo-bt${n}` },
        update: { startedAt: startAt, endedAt: endAt },
        create: {
          id: `sess-demo-bt${n}`,
          studentId: STUDENT_ID,
          assignmentTargetId: `target-demo-bt${n}`,
          submissionId: `sub-demo-bt${n}`,
          startedAt: startAt,
          endedAt: endAt,
        },
      });

      // Answers: số câu sai ~ tỉ lệ điểm (score 10 → 0 sai, score 0 → tất cả sai)
      await prisma.submissionAnswer.deleteMany({ where: { submissionId: `sub-demo-bt${n}` } });
      const totalQ = qsrc.questions.length;
      const wrongCount = Math.round((1 - score / 10) * totalQ);
      for (let qi = 0; qi < totalQ; qi++) {
        const q = qById.get(qsrc.questions[qi].questionId);
        if (!q) continue;
        const wrong = qi < wrongCount;
        const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        const wrongIds = q.options.filter((o) => !o.isCorrect).map((o) => o.id);
        let selectedOptionIds: string[] | undefined;
        let textAnswer: string | undefined;
        if (q.type === 'FILL_BLANK') {
          textAnswer = wrong ? 'đáp án sai' : (q.options.find((o) => o.isCorrect)?.optionText ?? '0');
        } else if (wrong && wrongIds.length > 0) {
          selectedOptionIds = q.type === 'MULTI' ? wrongIds.slice(0, 2) : [wrongIds[0]];
        } else {
          selectedOptionIds = correctIds.slice(0, Math.max(correctIds.length, 1));
        }
        await prisma.submissionAnswer.create({
          data: {
            submissionId: `sub-demo-bt${n}`,
            questionId: q.id,
            selectedOptionIds: selectedOptionIds ?? undefined,
            textAnswer,
            isCorrect: !wrong,
            scoreEarned: !wrong ? q.defaultScore : 0,
          },
        });
      }
    }
    console.log(`Seeded ${demoData.length} demo exams (asg-demo-bt01..20)`);
  }

  const total = await prisma.submission.count({ where: { studentId: STUDENT_ID } });
  const totalSessions = await prisma.learningSession.count({ where: { studentId: STUDENT_ID } });
  const totalAnswers = await prisma.submissionAnswer.count({
    where: { submission: { studentId: STUDENT_ID } },
  });
  console.log(`\n=== Done — ${total} submissions · ${totalSessions} sessions · ${totalAnswers} answers ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
