import { describe, it, expect } from 'vitest';
import {
  seedAssignments,
  classRosters,
  bumpVersion,
  STATUS_META,
  fmtDate,
  scoreColor,
  type Assignment,
} from '../../src/data/assignments';
import { buildItemsFromQuestions, resolveClassOptions } from '../../src/features/teacher/assignments/CreateAssignmentPage';

// ── resolveClassOptions: lớp prefill từ trang chi tiết lớp ─────────

describe('resolveClassOptions', () => {
  it('trả danh sách mẫu khi không có lớp nào được chọn', () => {
    const opts = resolveClassOptions('');
    expect(opts).toContain('Toán 10A');
    expect(opts[0]).toBe('Toán 10A');
  });

  it('giữ nguyên danh sách khi lớp đã nằm trong danh sách mẫu', () => {
    const opts = resolveClassOptions('Toán 10B');
    expect(opts.filter(c => c === 'Toán 10B')).toHaveLength(1);
    expect(opts[0]).toBe('Toán 10A');
  });

  it('đưa lớp từ API (ngoài danh sách mẫu) lên đầu để dropdown chọn được', () => {
    const opts = resolveClassOptions('10A - Toan Hoc');
    expect(opts[0]).toBe('10A - Toan Hoc');
    expect(opts).toContain('Toán 10A');
  });
});

// ── bumpVersion: cờ đánh dấu bản sửa đổi của bài đã giao ──────────

describe('bumpVersion', () => {
  const base = seedAssignments.find(a => a.version === 1)!;

  it('tăng version lên 1', () => {
    expect(bumpVersion(base).version).toBe(base.version + 1);
  });

  it('ghi editedAt theo định dạng YYYY-MM-DD HH:MM', () => {
    expect(bumpVersion(base).editedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

// ── Seed integrity ────────────────────────────────────────────────

describe('seedAssignments', () => {
  it('mọi bài tập đều có version >= 1', () => {
    expect(seedAssignments.every(a => a.version >= 1)).toBe(true);
  });

  it('bài version 1 không có editedAt; bài đã sửa (version > 1) có editedAt', () => {
    for (const a of seedAssignments) {
      if (a.version === 1) expect(a.editedAt).toBeNull();
      else expect(a.editedAt).toBeTruthy();
    }
  });

  it('mọi status đều hợp lệ trong STATUS_META', () => {
    for (const a of seedAssignments) {
      expect(STATUS_META[a.status as Assignment['status']]).toBeDefined();
    }
  });

  it('lớp của bài tập đều có roster học sinh (khi lớp không rỗng)', () => {
    const missing = seedAssignments
      .filter(a => a.class)
      .map(a => a.class)
      .filter(c => !classRosters[c]);
    expect(missing).toEqual([]);
  });
});

// ── Roster + điểm trung bình ──────────────────────────────────────

describe('classRosters', () => {
  it('mọi học sinh có avgScore trong khoảng 0–10', () => {
    for (const roster of Object.values(classRosters)) {
      for (const s of roster) {
        expect(s.avgScore).toBeGreaterThanOrEqual(0);
        expect(s.avgScore).toBeLessThanOrEqual(10);
      }
    }
  });
});

// ── buildItemsFromQuestions: dựng lại cấu trúc khi nhân bản ──────

const outlines: any[] = [
  {
    id: 'o1',
    sections: [
      {
        id: 's1',
        exercises: [
          { id: 'e1', questionIds: ['q1', 'q2'] },
          { id: 'e2', questionIds: ['q3'] },
        ],
      },
    ],
  },
  {
    id: 'o2',
    sections: [
      {
        id: 's2',
        exercises: [{ id: 'e3', questionIds: ['q4', 'q5'] }],
      },
    ],
  },
];

describe('buildItemsFromQuestions', () => {
  it('dựng đúng cấu trúc đề cương → mục → bài từ questionIds', () => {
    const items = buildItemsFromQuestions(['q1', 'q3', 'q5'], outlines);
    expect(items).toEqual([
      {
        outlineId: 'o1',
        sections: [
          {
            sectionId: 's1',
            exercises: [
              { exerciseId: 'e1', questionIds: ['q1'] },
              { exerciseId: 'e2', questionIds: ['q3'] },
            ],
          },
        ],
      },
      {
        outlineId: 'o2',
        sections: [
          { sectionId: 's2', exercises: [{ exerciseId: 'e3', questionIds: ['q5'] }] },
        ],
      },
    ]);
  });

  it('bỏ qua câu hỏi không thuộc bài tập nào trong đề cương', () => {
    const items = buildItemsFromQuestions(['q1', 'unknown-q'], outlines);
    expect(items.flatMap(o => o.sections.flatMap(s => s.exercises.flatMap(e => e.questionIds)))).toEqual(['q1']);
  });

  it('trả về mảng rỗng khi không có câu hỏi', () => {
    expect(buildItemsFromQuestions([], outlines)).toEqual([]);
  });
});

// ── Helpers hiển thị ──────────────────────────────────────────────

describe('helpers', () => {
  it('fmtDate đổi ISO sang dd/mm/yyyy', () => {
    expect(fmtDate('2026-09-10')).toBe('10/09/2026');
  });

  it('scoreColor: >=8 xanh lá, >=6.5 vàng, còn lại đỏ', () => {
    expect(scoreColor(8.5)).toBe('#22C55E');
    expect(scoreColor(7)).toBe('#F59E0B');
    expect(scoreColor(5)).toBe('#EF4444');
  });
});
