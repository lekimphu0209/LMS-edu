import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLASS_ID = 'class-10a-math';

type QType = 'SINGLE' | 'MULTI' | 'FILL_BLANK';
type Diff = 'EASY' | 'MEDIUM' | 'HARD';

interface SeedQ {
  type: QType;
  q: string;
  d: Diff;
  /** SINGLE/MULTI: [text, isCorrect][] — FILL_BLANK: đáp án đúng */
  opts?: [string, boolean][];
  ans?: string;
}

/**
 * 40 câu hỏi kiểm thử cho học sinh demo (student@educonnect.local):
 * - 32 câu SINGLE · 4 câu MULTI · 4 câu FILL_BLANK → đủ để test mọi loại input.
 * - Độ khó EASY/MEDIUM/HARD trộn đều; mỗi câu 0.25đ → tổng 10đ.
 * - Tạo assignment + target cho lớp 10A - Toán, KHÔNG tạo submission
 *   → học sinh thấy bài ở mục "Chưa hoàn thành" và tự làm/nộp/xem lại.
 * Idempotent — chạy lại nhiều lần an toàn nhờ upsert + id cố định.
 */

const S = (q: string, d: Diff, correct: string, wrongs: string[]): SeedQ => ({
  type: 'SINGLE',
  q,
  d,
  opts: [[correct, true], ...wrongs.map((w): [string, boolean] => [w, false])],
});
const M = (q: string, d: Diff, opts: [string, boolean][]): SeedQ => ({ type: 'MULTI', q, d, opts });
const F = (q: string, d: Diff, ans: string): SeedQ => ({ type: 'FILL_BLANK', q, d, ans });

const QUESTIONS: SeedQ[] = [
  // ── SINGLE (32) ─────────────────────────────────────────────
  S('Tập {1; 2; 3} có bao nhiêu tập con?', 'EASY', '8', ['4', '6', '9']),
  S('Nghiệm của phương trình 2x − 6 = 0 là:', 'EASY', 'x = 3', ['x = 2', 'x = −3', 'x = 6']),
  S('Đỉnh của parabol y = x² là điểm nào?', 'EASY', '(0; 0)', ['(1; 1)', '(0; 1)', 'Không có đỉnh']),
  S('sin 30° bằng:', 'EASY', '1/2', ['√3/2', '√2/2', '1']),
  S('Cho A = {1; 2}, B = {2; 3}. A ∪ B = ?', 'EASY', '{1; 2; 3}', ['{2}', '{1; 3}', '{1; 2}']),
  S('Cho A = {1; 2}, B = {2; 3}. A ∩ B = ?', 'EASY', '{2}', ['{1; 2; 3}', '∅', '{1}']),
  S('Nghiệm của phương trình x² − 4 = 0 là:', 'EASY', 'x = ±2', ['x = 4', 'x = 2', 'Vô nghiệm']),
  S('Hệ số góc của đường thẳng y = 2x + 1 là:', 'EASY', '2', ['1', '3', 'x']),
  S('Vectơ đơn vị có độ dài bằng:', 'EASY', '1', ['0', '2', 'Tùy vectơ']),
  S('Tổng ba góc của một tam giác bằng:', 'EASY', '180°', ['90°', '270°', '360°']),
  S('Điều kiện xác định của biểu thức √(x − 2) là:', 'MEDIUM', 'x ≥ 2', ['x > 2', 'x ≤ 2', 'x ≠ 2']),
  S('5! bằng bao nhiêu?', 'EASY', '120', ['25', '60', '720']),
  S('Trung điểm của đoạn AB với A(0; 0), B(4; 6) là:', 'MEDIUM', '(2; 3)', ['(4; 6)', '(2; 6)', '(1; 3)']),
  S('Khoảng cách giữa A(0; 0) và B(3; 4) bằng:', 'MEDIUM', '5', ['7', '12', '√7']),
  S('Phương trình x² + 1 = 0 có bao nhiêu nghiệm thực?', 'MEDIUM', '0', ['1', '2', 'Vô số']),
  S('Parabol y = −x² có bề lõm quay về hướng nào?', 'MEDIUM', 'Quay xuống', ['Quay lên', 'Sang trái', 'Sang phải']),
  S('Hàm số nào sau đây là hàm số chẵn?', 'MEDIUM', 'y = x²', ['y = x³', 'y = x', 'y = x + 1']),
  S('Tập xác định của hàm số y = 1/(x − 1) là:', 'MEDIUM', 'x ≠ 1', ['x > 1', 'x ≥ 1', 'Mọi x ∈ R']),
  S('cos 60° bằng:', 'EASY', '1/2', ['√3/2', '√2/2', '0']),
  S('Tam thức x² − 3x + 2 có các nghiệm là:', 'MEDIUM', 'x = 1 và x = 2', ['x = −1 và x = −2', 'x = 1 và x = −2', 'Vô nghiệm']),
  S('Nghiệm của hệ {2x + y = 5; x − y = 1} là:', 'MEDIUM', 'x = 2, y = 1', ['x = 1, y = 2', 'x = 3, y = −1', 'x = 2, y = −1']),
  S('Tập nghiệm của bất phương trình x + 3 > 7 là:', 'EASY', 'x > 4', ['x < 4', 'x > 10', 'x ≥ 4']),
  S('Giá trị của 2³ · 2² bằng:', 'EASY', '32', ['10', '16', '64']),
  S('Căn bậc hai của 144 là:', 'EASY', '12', ['14', '72', '24']),
  S('Diện tích hình tròn bán kính R là:', 'EASY', 'πR²', ['2πR', 'πR', '2πR²']),
  S('Chu vi hình vuông cạnh a là:', 'EASY', '4a', ['a²', '2a', 'a + 4']),
  S('Tam giác có ba cạnh 3, 4, 5 là tam giác gì?', 'MEDIUM', 'Vuông', ['Cân', 'Đều', 'Tù']),
  S('Giá trị lớn nhất của hàm số y = sin x là:', 'MEDIUM', '1', ['0', '2', '−1']),
  S('|−7| bằng:', 'EASY', '7', ['−7', '0', '1/7']),
  S('Ký hiệu tập rỗng là:', 'EASY', '∅', ['0', '{0}', 'ε']),
  S('Số phần tử của tập {a; b; c; d} là:', 'EASY', '4', ['3', '5', '0']),
  S('Nếu a > b và c > 0 thì:', 'HARD', 'ac > bc', ['ac < bc', 'ac = bc', 'a/c < b/c']),

  // ── MULTI (4) ───────────────────────────────────────────────
  M('Chọn tất cả các số nguyên tố:', 'EASY', [
    ['2', true],
    ['9', false],
    ['11', true],
    ['15', false],
  ]),
  M('Chọn các hàm số đồng biến trên R:', 'HARD', [
    ['y = x', true],
    ['y = −x', false],
    ['y = x³', true],
    ['y = −x²', false],
  ]),
  M('Hình nào sau đây có trục đối xứng?', 'MEDIUM', [
    ['Hình vuông', true],
    ['Tam giác đều', true],
    ['Hình bình hành (thường)', false],
    ['Hình chữ nhật', true],
  ]),
  M('Khẳng định nào đúng về vectơ?', 'HARD', [
    ['Mọi vectơ đều có độ dài ≥ 0', true],
    ['Vectơ có phương và hướng xác định', true],
    ['Vectơ đơn vị có độ dài bằng 1', true],
    ['Mọi vectơ đều có độ dài > 0', false],
  ]),

  // ── FILL_BLANK (4) ──────────────────────────────────────────
  F('15 × 4 = ___', 'EASY', '60'),
  F('Nghiệm của phương trình x − 9 = 0 là x = ___', 'EASY', '9'),
  F('10% của 250 là ___', 'MEDIUM', '25'),
  F('Số tiếp theo của dãy 2, 4, 6, 8, … là ___', 'EASY', '10'),
];

async function main() {
  // 1) Tạo/cập nhật 40 câu hỏi vào ngân hàng của giáo viên lớp 10A - Toán
  const cls = await prisma.class.findUnique({
    where: { id: CLASS_ID },
    include: {
      curriculums: {
        include: { curriculum: { include: { chapters: { orderBy: { orderIndex: 'asc' } } } } },
      },
    },
  });
  if (!cls?.teacherId) throw new Error(`Class ${CLASS_ID} or its teacher not found`);
  const chapter = cls.curriculums[0]?.curriculum.chapters[0];
  if (!chapter) throw new Error(`No chapter found in ${CLASS_ID} curriculum`);

  const qIds: string[] = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const q = QUESTIONS[i];
    const id = `q40-${n}`;
    qIds.push(id);
    // FILL_BLANK lưu đáp án đúng dưới dạng 1 option isCorrect (đúng quy ước hiện có)
    const options =
      q.type === 'FILL_BLANK'
        ? [{ optionText: q.ans ?? '', isCorrect: true, orderIndex: 0 }]
        : (q.opts ?? []).map(([optionText, isCorrect], orderIndex) => ({ optionText, isCorrect, orderIndex }));
    await prisma.question.upsert({
      where: { id },
      update: { questionText: q.q, type: q.type, difficulty: q.d, defaultScore: 0.25 },
      create: {
        id,
        teacherId: cls.teacherId,
        subject: cls.subject ?? 'Toán',
        type: q.type,
        questionText: q.q,
        difficulty: q.d,
        defaultScore: 0.25,
        options: { create: options },
      },
    });
  }
  console.log(`Upserted ${qIds.length} questions (q40-01..q40-40)`);

  // 2) Lesson + assignment gồm đủ 40 câu
  const lesson = await prisma.lesson.upsert({
    where: { id: 'les-demo-quiz40' },
    update: { title: 'Kiểm tra tổng hợp 40 câu' },
    create: {
      id: 'les-demo-quiz40',
      chapterId: chapter.id,
      title: 'Kiểm tra tổng hợp 40 câu',
      orderIndex: 200,
    },
  });
  await prisma.assignment.upsert({
    where: { id: 'asg-demo-quiz40' },
    update: { title: 'Kiểm tra tổng hợp — 40 câu', maxScore: 10 },
    create: {
      id: 'asg-demo-quiz40',
      title: 'Kiểm tra tổng hợp — 40 câu',
      type: 'QUIZ',
      lessonId: lesson.id,
      maxScore: 10,
      createdBy: cls.teacherId,
    },
  });
  await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: 'asg-demo-quiz40' } });
  await prisma.assignmentQuestion.createMany({
    data: qIds.map((questionId, orderIndex) => ({
      assignmentId: 'asg-demo-quiz40',
      questionId,
      orderIndex,
    })),
  });

  // 3) Target cho cả lớp → học sinh demo thấy ở mục "Chưa hoàn thành"
  await prisma.assignmentTarget.upsert({
    where: { id: 'target-demo-quiz40' },
    update: { dueDate: new Date('2026-11-15T23:59:00') },
    create: {
      id: 'target-demo-quiz40',
      assignmentId: 'asg-demo-quiz40',
      classId: CLASS_ID,
      dueDate: new Date('2026-11-15T23:59:00'),
    },
  });

  // Không tạo submission: bài phải ở trạng thái chưa làm để học sinh tự test
  const pending = await prisma.submission.count({
    where: { assignmentTargetId: 'target-demo-quiz40' },
  });
  console.log(`Assignment asg-demo-quiz40 → target-demo-quiz40 (due 15/11/2026) · ${pending} submissions hiện có`);
  console.log('=== Quiz40 seed done ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
