import { describe, it, expect } from 'vitest';
import {
  bumpVersion,
  STATUS_META,
  fmtDate,
  scoreColor,
  type Assignment,
} from '../../src/data/assignments';
import { buildItemsFromQuestions, resolveClassOptions, type ClassOption } from '../../src/features/teacher/assignments/CreateAssignmentPage';

// ── resolveClassOptions: lớp prefill từ trang chi tiết lớp ─────────

const API_CLASSES: ClassOption[] = [
  { id: 'c1', name: 'Toán 10A' },
  { id: 'c2', name: 'Toán 10B' },
];

describe('resolveClassOptions', () => {
  it('trả danh sách lớp từ API khi không có lớp nào được chọn', () => {
    expect(resolveClassOptions(API_CLASSES, '')).toEqual(API_CLASSES);
  });

  it('giữ nguyên danh sách khi lớp đã chọn nằm trong danh sách API', () => {
    const opts = resolveClassOptions(API_CLASSES, 'c2', 'Toán 10B');
    expect(opts.filter(c => c.id === 'c2')).toHaveLength(1);
    expect(opts[0].id).toBe('c1');
  });

  it('đưa lớp prefill (ngoài danh sách API) lên đầu để dropdown chọn được', () => {
    const opts = resolveClassOptions(API_CLASSES, 'c9', '10A - Toan Hoc');
    expect(opts[0]).toEqual({ id: 'c9', name: '10A - Toan Hoc' });
    expect(opts).toContainEqual({ id: 'c1', name: 'Toán 10A' });
  });
});

// ── bumpVersion: cờ đánh dấu bản sửa đổi của bài đã giao ──────────

describe('bumpVersion', () => {
  const base = { version: 1, editedAt: null } as Assignment;

  it('tăng version lên 1', () => {
    expect(bumpVersion(base).version).toBe(2);
  });

  it('ghi editedAt theo định dạng YYYY-MM-DD HH:MM', () => {
    expect(bumpVersion(base).editedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

// ── Trạng thái bài tập ────────────────────────────────────────────

describe('STATUS_META', () => {
  it('đủ nhãn cho 3 trạng thái', () => {
    for (const s of ['DRAFT', 'SAVED', 'ASSIGNED'] as const) {
      expect(STATUS_META[s].label).toBeTruthy();
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
