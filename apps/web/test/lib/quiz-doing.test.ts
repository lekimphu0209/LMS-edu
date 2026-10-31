import { describe, it, expect } from 'vitest';
import {
  buildQuizAnswers,
  toggleOption,
  isAnswered,
  answeredCount,
} from '../../src/features/student/pages/quizLogic';
import type { QuizQuestion } from '../../src/data/student';

const questions: QuizQuestion[] = [
  { id: 'q1', type: 'single', text: '2 + 3 = ?', options: [
    { id: 'a', text: '4' }, { id: 'b', text: '5' }, { id: 'c', text: '6' },
  ] },
  { id: 'q2', type: 'multiple', text: 'Chọn số nguyên tố', options: [
    { id: 'a', text: '2' }, { id: 'b', text: '4' }, { id: 'c', text: '7' },
  ] },
  { id: 'q3', type: 'fill', text: '√81 = ___', options: [] },
];

// ── toggleOption: chọn/bỏ chọn câu nhiều đáp án ──────────────────

describe('toggleOption', () => {
  it('thêm option vào danh sách đang chọn', () => {
    expect(toggleOption(['a'], 'c')).toEqual(['a', 'c']);
  });

  it('bỏ option đã chọn', () => {
    expect(toggleOption(['a', 'c'], 'a')).toEqual(['c']);
  });

  it('xử lý trạng thái ban đầu chưa chọn gì', () => {
    expect(toggleOption(undefined, 'a')).toEqual(['a']);
  });
});

// ── isAnswered / answeredCount ────────────────────────────────────

describe('isAnswered', () => {
  it('undefined và chuỗi rỗng coi như chưa trả lời', () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered('')).toBe(false);
  });

  it('mảng rỗng (đã bỏ chọn hết câu multi) coi như chưa trả lời', () => {
    expect(isAnswered([])).toBe(false);
  });

  it('có lựa chọn hoặc có text thì đã trả lời', () => {
    expect(isAnswered('a')).toBe(true);
    expect(isAnswered(['a', 'c'])).toBe(true);
    expect(isAnswered('30')).toBe(true);
  });
});

describe('answeredCount', () => {
  it('đếm đúng số câu đã trả lời thực tế', () => {
    const answers = { q1: 'b', q2: [] as string[], q3: '9' };
    expect(answeredCount(questions, answers)).toBe(2);
  });

  it('trả 0 khi chưa làm câu nào', () => {
    expect(answeredCount(questions, {})).toBe(0);
  });
});

// ── buildQuizAnswers: payload nộp bài ─────────────────────────────

describe('buildQuizAnswers', () => {
  it('single → selectedOptionIds 1 phần tử', () => {
    const payload = buildQuizAnswers(questions, { q1: 'b' });
    expect(payload[0]).toEqual({ questionId: 'q1', selectedOptionIds: ['b'] });
  });

  it('multiple → giữ nguyên mảng lựa chọn', () => {
    const payload = buildQuizAnswers(questions, { q2: ['a', 'c'] });
    expect(payload[1]).toEqual({ questionId: 'q2', selectedOptionIds: ['a', 'c'] });
  });

  it('fill → textAnswer; chưa trả lời → chuỗi rỗng', () => {
    const payload = buildQuizAnswers(questions, { q3: '9' });
    expect(payload[2]).toEqual({ questionId: 'q3', textAnswer: '9' });
    const empty = buildQuizAnswers(questions, {});
    expect(empty[2]).toEqual({ questionId: 'q3', textAnswer: '' });
  });

  it('câu chưa chọn → selectedOptionIds rỗng, vẫn đủ mọi câu trong payload', () => {
    const payload = buildQuizAnswers(questions, {});
    expect(payload).toHaveLength(3);
    expect(payload[0]).toEqual({ questionId: 'q1', selectedOptionIds: [] });
  });
});
