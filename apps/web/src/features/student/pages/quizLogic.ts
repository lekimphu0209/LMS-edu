import type { QuizAnswer, QuizQuestion } from '@/data/student'

export type QuizAnswers = Record<string, string | string[]>

/** Thêm/bỏ một lựa chọn trong câu nhiều đáp án. */
export function toggleOption(current: string[] | undefined, optId: string): string[] {
  const cur = current ?? []
  return cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId]
}

/** Câu đã trả lời: mảng cần ≥1 lựa chọn; chuỗi cần khác rỗng và khác ''. */
export function isAnswered(v: string | string[] | undefined): boolean {
  return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ''
}

/** Đếm số câu đã trả lời — bỏ qua câu nhiều đáp án đã bỏ chọn hết. */
export function answeredCount(questions: QuizQuestion[], answers: QuizAnswers): number {
  return questions.filter((q) => isAnswered(answers[q.id])).length
}

/** Dựng payload nộp bài: fill → textAnswer; còn lại → selectedOptionIds. */
export function buildQuizAnswers(questions: QuizQuestion[], answers: QuizAnswers): QuizAnswer[] {
  return questions.map((q) => {
    const ans = answers[q.id]
    if (q.type === 'fill') return { questionId: q.id, textAnswer: (ans as string) || '' }
    return { questionId: q.id, selectedOptionIds: Array.isArray(ans) ? ans : ans ? [ans] : [] }
  })
}
