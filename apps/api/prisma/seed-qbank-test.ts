import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seed tối thiểu để kiểm thử ngân hàng câu hỏi trên DB thật:
 * 1 giáo viên (Nguyen Van Teacher) + 2 học sinh + 1 lớp + vài câu hỏi của giáo viên.
 * Idempotent — chạy lại nhiều lần vẫn an toàn nhờ upsert.
 */
async function main() {
  // ==================== USERS ====================
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@educonnect.local' },
    update: { fullName: 'Nguyen Van Teacher' },
    create: {
      fullName: 'Nguyen Van Teacher',
      email: 'teacher@educonnect.local',
      passwordHash: await argon2.hash('Teacher@123'),
      role: 'TEACHER',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Teacher:', teacher.email, '·', teacher.id);

  const studentPassword = await argon2.hash('Student@123');
  const [stu1, stu2] = await Promise.all(
    [
      { fullName: 'Test Student One', email: 'test-student1@educonnect.local' },
      { fullName: 'Test Student Two', email: 'test-student2@educonnect.local' },
    ].map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          ...s,
          passwordHash: studentPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      }),
    ),
  );
  console.log('Students:', stu1.email, '·', stu2.email);

  // ==================== CLASS ====================
  const cls = await prisma.class.upsert({
    where: { id: 'class-qbank-test' },
    update: { teacherId: teacher.id },
    create: {
      id: 'class-qbank-test',
      name: 'QBank Test Class',
      subject: 'Mathematics',
      grade: 'Lop 10',
      schedule: 'Thu 2 · 07:30',
      room: 'P.T01',
      color: '#7C3AED',
      icon: '∑',
      teacherId: teacher.id,
      status: 'ACTIVE',
    },
  });
  console.log('Class:', cls.name, '·', cls.id);

  await prisma.classTeacher.upsert({
    where: { classId_teacherId: { classId: cls.id, teacherId: teacher.id } },
    update: {},
    create: { classId: cls.id, teacherId: teacher.id },
  });

  for (const s of [stu1, stu2]) {
    await prisma.classStudent.upsert({
      where: { classId_studentId: { classId: cls.id, studentId: s.id } },
      update: {},
      create: { classId: cls.id, studentId: s.id, status: 'ENROLLED' },
    });
  }
  console.log('Enrolled 2 students into', cls.name);

  // ==================== QUESTIONS (ngân hàng câu hỏi của giáo viên) ====================
  const questions = [
    {
      id: 'q-test-001',
      type: 'SINGLE' as const,
      questionText: 'Ket qua cua 7 x 8 la bao nhieu?',
      difficulty: 'EASY' as const,
      defaultScore: 1.0,
      options: [
        { optionText: '54', isCorrect: false, orderIndex: 0 },
        { optionText: '56', isCorrect: true, orderIndex: 1 },
        { optionText: '58', isCorrect: false, orderIndex: 2 },
        { optionText: '64', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: 'q-test-002',
      type: 'MULTI' as const,
      questionText: 'Chon cac so nguyen to:',
      difficulty: 'MEDIUM' as const,
      defaultScore: 2.0,
      options: [
        { optionText: '2', isCorrect: true, orderIndex: 0 },
        { optionText: '4', isCorrect: false, orderIndex: 1 },
        { optionText: '7', isCorrect: true, orderIndex: 2 },
        { optionText: '9', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: 'q-test-003',
      type: 'FILL_BLANK' as const,
      questionText: 'Can bac hai cua 81 la ___',
      difficulty: 'EASY' as const,
      defaultScore: 1.0,
      options: [],
    },
    {
      id: 'q-test-004',
      type: 'SINGLE' as const,
      questionText: 'Nghiem cua phuong trinh x^2 - 5x + 6 = 0 la:',
      difficulty: 'HARD' as const,
      defaultScore: 3.0,
      options: [
        { optionText: 'x = 2 va x = 3', isCorrect: true, orderIndex: 0 },
        { optionText: 'x = 1 va x = 6', isCorrect: false, orderIndex: 1 },
        { optionText: 'x = -2 va x = -3', isCorrect: false, orderIndex: 2 },
        { optionText: 'Vo nghiem', isCorrect: false, orderIndex: 3 },
      ],
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        teacherId: teacher.id,
        subject: 'Mathematics',
        type: q.type,
        questionText: q.questionText,
        difficulty: q.difficulty,
        defaultScore: q.defaultScore,
        options: { create: q.options },
      },
    });
  }
  console.log('Questions seeded:', questions.map((q) => q.id).join(', '));

  console.log('\n=== QBank test seed completed ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
