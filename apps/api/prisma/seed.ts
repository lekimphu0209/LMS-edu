import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // ==================== USERS ====================
  const adminPassword = await argon2.hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@educonnect.local' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@educonnect.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded admin:', admin.email);

  const teacherPassword = await argon2.hash('Teacher@123');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@educonnect.local' },
    update: {},
    create: {
      fullName: 'Nguyen Van Teacher',
      email: 'teacher@educonnect.local',
      passwordHash: teacherPassword,
      role: 'TEACHER',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded teacher:', teacher.email);

  const teacher2Password = await argon2.hash('Teacher@123');
  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@educonnect.local' },
    update: {},
    create: {
      fullName: 'Tran Thi Teacher',
      email: 'teacher2@educonnect.local',
      passwordHash: teacher2Password,
      role: 'TEACHER',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded teacher2:', teacher2.email);

  const studentPassword = await argon2.hash('Student@123');
  const student = await prisma.user.upsert({
    where: { email: 'student@educonnect.local' },
    update: {},
    create: {
      fullName: 'Le Van Student',
      email: 'student@educonnect.local',
      passwordHash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded student:', student.email);

  const student2Password = await argon2.hash('Student@123');
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@educonnect.local' },
    update: {},
    create: {
      fullName: 'Pham Thi Student',
      email: 'student2@educonnect.local',
      passwordHash: student2Password,
      role: 'STUDENT',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded student2:', student2.email);

  const student3Password = await argon2.hash('Student@123');
  const student3 = await prisma.user.upsert({
    where: { email: 'student3@educonnect.local' },
    update: {},
    create: {
      fullName: 'Hoang Van Student',
      email: 'student3@educonnect.local',
      passwordHash: student3Password,
      role: 'STUDENT',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });
  console.log('Seeded student3:', student3.email);

  // ==================== MORE MOCK USERS ====================
  const moreTeacherPassword = await argon2.hash('Teacher@123');
  const moreStudentPassword = await argon2.hash('Student@123');

  const mockTeachers = [
    { fullName: 'Phạm Văn Giáo', email: 'teacher3@educonnect.local' },
    { fullName: 'Ngô Thị Hạnh', email: 'teacher4@educonnect.local' },
    { fullName: 'Bùi Văn Nam', email: 'teacher5@educonnect.local' },
    { fullName: 'Đỗ Thị Mai', email: 'teacher6@educonnect.local' },
    { fullName: 'Vũ Văn Tùng', email: 'teacher7@educonnect.local' },
  ];

  await Promise.all(
    mockTeachers.map((t) =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
          ...t,
          passwordHash: moreTeacherPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      }),
    ),
  );
  console.log('Seeded mock teachers:', mockTeachers.length);

  const mockStudents = [
    { fullName: 'Nguyễn Văn A', email: 'student4@educonnect.local' },
    { fullName: 'Trần Thị B', email: 'student5@educonnect.local' },
    { fullName: 'Lê Văn C', email: 'student6@educonnect.local' },
    { fullName: 'Phạm Thị D', email: 'student7@educonnect.local' },
    { fullName: 'Hoàng Văn E', email: 'student8@educonnect.local' },
    { fullName: 'Ngô Thị F', email: 'student9@educonnect.local' },
    { fullName: 'Bùi Văn G', email: 'student10@educonnect.local' },
    { fullName: 'Đỗ Thị H', email: 'student11@educonnect.local' },
    { fullName: 'Vũ Văn I', email: 'student12@educonnect.local' },
    { fullName: 'Nguyễn Thị K', email: 'student13@educonnect.local' },
  ];

  await Promise.all(
    mockStudents.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          ...s,
          passwordHash: moreStudentPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      }),
    ),
  );
  console.log('Seeded mock students:', mockStudents.length);

  // ==================== CLASSES ====================
  const class1 = await prisma.class.upsert({
    where: { id: 'class-10a-math' },
    update: {},
    create: {
      id: 'class-10a-math',
      name: '10A - Toan Hoc',
      subject: 'Mathematics',
      teacherId: teacher.id,
      status: 'ACTIVE',
    },
  });
  console.log('Seeded class:', class1.name);

  const class2 = await prisma.class.upsert({
    where: { id: 'class-10b-physics' },
    update: {},
    create: {
      id: 'class-10b-physics',
      name: '10B - Vat Ly',
      subject: 'Physics',
      teacherId: teacher2.id,
      status: 'ACTIVE',
    },
  });
  console.log('Seeded class:', class2.name);

  // Class teachers
  await prisma.classTeacher.upsert({
    where: { classId_teacherId: { classId: class1.id, teacherId: teacher.id } },
    update: {},
    create: { classId: class1.id, teacherId: teacher.id },
  });

  await prisma.classTeacher.upsert({
    where: { classId_teacherId: { classId: class2.id, teacherId: teacher2.id } },
    update: {},
    create: { classId: class2.id, teacherId: teacher2.id },
  });

  // Enroll students
  for (const [sId, cId] of [
    [student.id, class1.id],
    [student2.id, class1.id],
    [student3.id, class1.id],
    [student.id, class2.id],
    [student2.id, class2.id],
  ] as const) {
    await prisma.classStudent.upsert({
      where: { classId_studentId: { classId: cId, studentId: sId } },
      update: {},
      create: { classId: cId, studentId: sId, status: 'ENROLLED' },
    });
  }
  console.log('Enrolled students into classes');

  // ==================== CURRICULUM ====================
  const curriculum = await prisma.curriculum.upsert({
    where: { id: 'curr-math-10' },
    update: {},
    create: {
      id: 'curr-math-10',
      teacherId: teacher.id,
      title: 'Toan Hoc Lop 10',
      subject: 'Mathematics',
      status: 'PUBLISHED',
    },
  });
  console.log('Seeded curriculum:', curriculum.title);

  // Chapters
  const chapter1 = await prisma.chapter.upsert({
    where: { id: 'chap-math-10-1' },
    update: {},
    create: {
      id: 'chap-math-10-1',
      curriculumId: curriculum.id,
      title: 'Chuong 1: Tap Hop',
      orderIndex: 0,
    },
  });

  const chapter2 = await prisma.chapter.upsert({
    where: { id: 'chap-math-10-2' },
    update: {},
    create: {
      id: 'chap-math-10-2',
      curriculumId: curriculum.id,
      title: 'Chuong 2: Ham So',
      orderIndex: 1,
    },
  });
  console.log('Seeded chapters');

  // Lessons
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-math-10-1-1' },
    update: {},
    create: {
      id: 'lesson-math-10-1-1',
      chapterId: chapter1.id,
      title: 'Bai 1: Cac phep toan tap hop',
      orderIndex: 0,
      contentNote: 'Gioi thieu cac phep toan tap hop: hop, giao, hieu.',
    },
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-math-10-1-2' },
    update: {},
    create: {
      id: 'lesson-math-10-1-2',
      chapterId: chapter1.id,
      title: 'Bai 2: Tap hop con',
      orderIndex: 1,
      contentNote: 'Dinh nghia tap hop con, vi du va bai tap.',
    },
  });

  const lesson3 = await prisma.lesson.upsert({
    where: { id: 'lesson-math-10-2-1' },
    update: {},
    create: {
      id: 'lesson-math-10-2-1',
      chapterId: chapter2.id,
      title: 'Bai 1: Khai niem ham so',
      orderIndex: 0,
      contentNote: 'Khai niem ham so, do thi ham so.',
    },
  });
  console.log('Seeded lessons');

  // Link curriculum to class
  await prisma.classCurriculum.upsert({
    where: { classId_curriculumId: { classId: class1.id, curriculumId: curriculum.id } },
    update: {},
    create: { classId: class1.id, curriculumId: curriculum.id },
  });

  // ==================== QUESTIONS ====================
  const q1 = await prisma.question.upsert({
    where: { id: 'q-math-001' },
    update: {},
    create: {
      id: 'q-math-001',
      teacherId: teacher.id,
      subject: 'Mathematics',
      type: 'SINGLE',
      questionText: 'Ket qua cua 2 + 3 la bao nhieu?',
      difficulty: 'EASY',
      defaultScore: 1.0,
      options: {
        create: [
          { optionText: '4', isCorrect: false, orderIndex: 0 },
          { optionText: '5', isCorrect: true, orderIndex: 1 },
          { optionText: '6', isCorrect: false, orderIndex: 2 },
          { optionText: '7', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  const q2 = await prisma.question.upsert({
    where: { id: 'q-math-002' },
    update: {},
    create: {
      id: 'q-math-002',
      teacherId: teacher.id,
      subject: 'Mathematics',
      type: 'SINGLE',
      questionText: 'Khai niem nao sau day la dung ve tap hop?',
      difficulty: 'MEDIUM',
      defaultScore: 2.0,
      options: {
        create: [
          { optionText: 'Tap hop la tap cac phan tu khong trung nhau', isCorrect: true, orderIndex: 0 },
          { optionText: 'Tap hop co the chua phan tu trung nhau', isCorrect: false, orderIndex: 1 },
          { optionText: 'Tap hop khong co thu tu', isCorrect: true, orderIndex: 2 },
          { optionText: 'Tap hop luon co so phan tu hu han', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  const q3 = await prisma.question.upsert({
    where: { id: 'q-math-003' },
    update: {},
    create: {
      id: 'q-math-003',
      teacherId: teacher.id,
      subject: 'Mathematics',
      type: 'FILL_BLANK',
      questionText: 'Ket qua cua 5 x 6 = ___',
      difficulty: 'EASY',
      defaultScore: 1.0,
    },
  });

  const q4 = await prisma.question.upsert({
    where: { id: 'q-math-004' },
    update: {},
    create: {
      id: 'q-math-004',
      teacherId: teacher.id,
      subject: 'Mathematics',
      type: 'MULTI',
      questionText: 'Chon cac phep toan dung cho tap hop:',
      difficulty: 'HARD',
      defaultScore: 3.0,
      options: {
        create: [
          { optionText: 'Hop cua hai tap hop', isCorrect: true, orderIndex: 0 },
          { optionText: 'Giao cua hai tap hop', isCorrect: true, orderIndex: 1 },
          { optionText: 'Tich cua hai tap hop', isCorrect: false, orderIndex: 2 },
          { optionText: 'Hieu cua hai tap hop', isCorrect: true, orderIndex: 3 },
        ],
      },
    },
  });
  console.log('Seeded questions:', q1.id, q2.id, q3.id, q4.id);

  // ==================== ASSIGNMENT ====================
  const assignment = await prisma.assignment.upsert({
    where: { id: 'asg-math-001' },
    update: {},
    create: {
      id: 'asg-math-001',
      lessonId: lesson1.id,
      title: 'Bai tap chuong 1: Tap hop',
      createdBy: teacher.id,
    },
  });
  console.log('Seeded assignment:', assignment.title);

  // Assignment questions
  await prisma.assignmentQuestion.upsert({
    where: { assignmentId_questionId: { assignmentId: assignment.id, questionId: q1.id } },
    update: {},
    create: { assignmentId: assignment.id, questionId: q1.id, orderIndex: 0 },
  });
  await prisma.assignmentQuestion.upsert({
    where: { assignmentId_questionId: { assignmentId: assignment.id, questionId: q2.id } },
    update: {},
    create: { assignmentId: assignment.id, questionId: q2.id, orderIndex: 1 },
  });
  await prisma.assignmentQuestion.upsert({
    where: { assignmentId_questionId: { assignmentId: assignment.id, questionId: q3.id } },
    update: {},
    create: { assignmentId: assignment.id, questionId: q3.id, orderIndex: 2 },
  });
  await prisma.assignmentQuestion.upsert({
    where: { assignmentId_questionId: { assignmentId: assignment.id, questionId: q4.id } },
    update: {},
    create: { assignmentId: assignment.id, questionId: q4.id, orderIndex: 3 },
  });

  // Assignment target for class1
  const target = await prisma.assignmentTarget.upsert({
    where: { id: 'target-asg-math-001-class1' },
    update: {},
    create: {
      id: 'target-asg-math-001-class1',
      assignmentId: assignment.id,
      classId: class1.id,
      unlockDate: new Date('2026-01-01'),
      dueDate: new Date('2026-12-31'),
    },
  });
  console.log('Seeded assignment target');

  // ==================== SUBMISSION ====================
  const submission = await prisma.submission.upsert({
    where: { id: 'sub-student1-asg001' },
    update: {},
    create: {
      id: 'sub-student1-asg001',
      assignmentTargetId: target.id,
      studentId: student.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      answers: {
        create: [
          {
            questionId: q1.id,
            selectedOptionIds: JSON.stringify(['5']),
            isCorrect: true,
            scoreEarned: 1.0,
          },
          {
            questionId: q2.id,
            selectedOptionIds: JSON.stringify(['Tap hop la tap cac phan tu khong trung nhau']),
            isCorrect: false,
            scoreEarned: 0,
          },
          {
            questionId: q3.id,
            textAnswer: '30',
            isCorrect: true,
            scoreEarned: 1.0,
          },
        ],
      },
    },
  });
  console.log('Seeded submission:', submission.id);

  // ==================== PROGRESS SNAPSHOT ====================
  await prisma.progressSnapshot.upsert({
    where: { id: 'prog-student1-001' },
    update: {},
    create: {
      id: 'prog-student1-001',
      studentId: student.id,
      classId: class1.id,
      curriculumId: curriculum.id,
      percentComplete: 35.0,
      averageScore: 7.5,
    },
  });
  console.log('Seeded progress snapshot');

  // ==================== LEARNING SESSION ====================
  const sessionStart = new Date();
  sessionStart.setHours(sessionStart.getHours() - 1);
  await prisma.learningSession.upsert({
    where: { id: 'session-student1-001' },
    update: {},
    create: {
      id: 'session-student1-001',
      studentId: student.id,
      assignmentTargetId: target.id,
      startedAt: sessionStart,
      endedAt: new Date(),
    },
  });
  console.log('Seeded learning session');

  console.log('\n=== Seed completed successfully ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
