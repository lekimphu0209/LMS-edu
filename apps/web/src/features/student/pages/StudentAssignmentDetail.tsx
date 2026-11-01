import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getStudentAssignments,
  getAssignmentReview,
  type StudentAssignment,
} from '@/data/student';
import type { QuestionAnswer } from '@/data/assignments';
import StartQuizConfirm from '../components/StartQuizConfirm';
import AssignmentDetailCard, {
  type AssignmentDetailStatus,
} from '../components/AssignmentDetailCard';

export default function StudentAssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | AnswerState>('all');

  const { data: all = [], isLoading: loadingList } = useQuery<StudentAssignment[]>({
    queryKey: ['myAssignments'],
    queryFn: () => getStudentAssignments(),
  });
  const a = all.find((x) => x.id === id);

  const { data: review, isLoading: loadingReview } = useQuery({
    queryKey: ['assignmentReview', a?.submissionId],
    queryFn: () => getAssignmentReview(a!.submissionId!),
    enabled: !!a?.submissionId,
  });

  if (loadingList || (a?.done && loadingReview)) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Đang tải...
      </div>
    );
  }

  if (!a) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Không tìm thấy bài tập.
      </div>
    );
  }

  // Một layout chung, chỉ đổi trạng thái: đã nộp chờ chấm → pending (cam), đã chấm → done (xanh lá)
  const detailStatus: AssignmentDetailStatus = !a.done
    ? a.overdue
      ? 'late'
      : 'todo'
    : review && review.status !== 'GRADED'
      ? 'pending'
      : 'done';
  // Đếm 3 nhóm (đúng/sai/bỏ trống) + danh sách đang lọc — cùng nguồn answerState
  const counts = { correct: 0, wrong: 0, empty: 0 };
  review?.answers.forEach((x) => {
    counts[answerState(x)] += 1;
  });
  const visibleAnswers = (review?.answers ?? []).filter(
    (x) => reviewFilter === 'all' || answerState(x) === reviewFilter,
  );

  const onStartQuiz = () => setShowStartConfirm(true);

  const confirmStart = () => {
    setShowStartConfirm(false);
    navigate(`/student/assignments/${a.id}/quiz`, {
      state: { startNow: true },
    });
  };

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Thẻ chi tiết — component chung cho mọi trạng thái */}
      <AssignmentDetailCard
        a={a}
        status={detailStatus}
        onStartQuiz={onStartQuiz}
      />

      {/* Nội dung */}
      {!a.done ? null : !review ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          Không tải được chi tiết bài làm.
        </div>
      ) : (
        <div className="card" id="assignment-review" style={{ overflow: 'hidden' }}>
          {/* Tiêu đề + bộ lọc 3 nhóm — pill trạng thái đã hiện ở thẻ trên nên bỏ lặp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '15px 24px',
              borderBottom: '1px solid #F3F4F6',
              background: '#FAFAFA',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', marginRight: 6 }}>
              Bài làm của bạn
            </div>
            {(
              [
                { key: 'all', label: 'Tất cả', n: review.answers.length },
                { key: 'correct', label: 'Đúng', n: counts.correct },
                { key: 'wrong', label: 'Sai', n: counts.wrong },
                { key: 'empty', label: 'Bỏ trống', n: counts.empty },
              ] as const
            ).map((f) => {
              const active = reviewFilter === f.key;
              const tone =
                f.key === 'correct'
                  ? { on: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' }
                  : f.key === 'wrong'
                    ? { on: '#DC2626', bg: '#FEF2F2', bd: '#FECACA' }
                    : f.key === 'empty'
                      ? { on: '#6B7280', bg: '#F9FAFB', bd: '#E5E7EB' }
                      : { on: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' };
              return (
                <button
                  key={f.key}
                  onClick={() => setReviewFilter(f.key)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: '5px 12px',
                    borderRadius: 20,
                    color: active ? tone.on : '#6B7280',
                    background: active ? tone.bg : 'white',
                    border: `1px solid ${active ? tone.bd : '#E5E7EB'}`,
                  }}
                >
                  {f.label} {f.n}
                </button>
              );
            })}
          </div>

          {/* Danh sách câu hỏi + đáp án */}
          {review.answers.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
              Bài nộp này không có chi tiết câu trả lời (nộp file / chấm tay).
            </div>
          ) : visibleAnswers.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
              Không có câu hỏi nào ở nhóm này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visibleAnswers.map((ans, i) => (
                <ReviewQuestion key={ans.qi} ans={ans} first={i === 0} />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Popup xác nhận bắt đầu — hủy thì ở lại trang */}
      {showStartConfirm && (
        <StartQuizConfirm
          title={a.title}
          questions={a.questions}
          onCancel={() => setShowStartConfirm(false)}
          onConfirm={confirmStart}
        />
      )}
    </div>
  );
}

function optLetter(oi: number) {
  return String.fromCharCode(65 + oi); // A, B, C, D…
}

type AnswerState = 'correct' | 'wrong' | 'empty';

/** correct | wrong | empty — nguồn chung cho đếm, lọc và badge câu hỏi */
function answerState(ans: QuestionAnswer): AnswerState {
  const has =
    ans.type === 'short'
      ? String(ans.studentAnswer ?? '').trim() !== ''
      : Array.isArray(ans.studentAnswer)
        ? ans.studentAnswer.length > 0
        : ans.studentAnswer != null;
  if (!has) return 'empty';
  return ans.isCorrect ? 'correct' : 'wrong';
}

function panelMeta(kind: 'mine-correct' | 'mine-wrong' | 'correct' | 'empty') {
  switch (kind) {
    case 'mine-correct':
      return { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A', label: '#15803D' };
    case 'mine-wrong':
      return { bg: '#FEF2F2', border: '#FECACA', accent: '#DC2626', label: '#B91C1C' };
    case 'correct':
      return { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A', label: '#15803D' };
    case 'empty':
      return { bg: '#F9FAFB', border: '#E5E7EB', accent: '#9CA3AF', label: '#6B7280' };
  }
}

function AnswerPanel({
  title,
  kind,
  children,
}: {
  title: string;
  kind: 'mine-correct' | 'mine-wrong' | 'correct' | 'empty';
  children: React.ReactNode;
}) {
  const m = panelMeta(kind);
  return (
    <div
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
        borderLeft: `3px solid ${m.accent}`,
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: m.label,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ReviewQuestion({ ans, first }: { ans: QuestionAnswer; first: boolean }) {
  const isMultiple = ans.type === 'multiple';
  const isShort = ans.type === 'short';

  const mineIdx: number[] = isShort
    ? []
    : isMultiple
      ? (ans.studentAnswer as number[])
      : typeof ans.studentAnswer === 'number'
        ? [ans.studentAnswer]
        : [];
  const correctIdx: number[] = isShort
    ? []
    : isMultiple
      ? (ans.correct as number[])
      : typeof ans.correct === 'number'
        ? [ans.correct]
        : [];

  const state = answerState(ans);
  const hasAnswer = state !== 'empty';

  const badge =
    state === 'correct'
      ? { label: 'Đúng', color: '#15803D', bg: '#DCFCE7' }
      : state === 'wrong'
        ? { label: 'Sai', color: '#B91C1C', bg: '#FEE2E2' }
        : { label: 'Chưa trả lời', color: '#6B7280', bg: '#F3F4F6' };

  const chipBg = badge.bg;
  const chipColor = badge.color;

  return (
    <div style={{ padding: '18px 24px', borderTop: first ? 'none' : '1px solid #F3F4F6' }}>
      {/* Header: số câu + trạng thái */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: chipBg,
              color: chipColor,
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {ans.qi}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {isShort ? 'Tự luận' : isMultiple ? 'Chọn nhiều đáp án' : 'Trắc nghiệm'}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: badge.color,
            background: badge.bg,
            padding: '3px 10px',
            borderRadius: 20,
            flexShrink: 0,
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Đề bài */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        {ans.text}
      </div>

      {/* Trắc nghiệm / nhiều đáp án / đúng-sai: danh sách options */}
      {!isShort && ans.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ans.options.map((opt, oi) => {
            const isCorrectOpt = correctIdx.includes(oi);
            const isMine = mineIdx.includes(oi);

            let bg = '#FFFFFF';
            let border = '1px solid #EEF0F3';
            let color = '#6B7280';
            let chipBgOpt = '#F3F4F6';
            let chipColorOpt = '#6B7280';
            if (isCorrectOpt) {
              bg = '#F0FDF4';
              border = '1px solid #BBF7D0';
              color = '#15803D';
              chipBgOpt = '#16A34A';
              chipColorOpt = '#FFFFFF';
            }
            if (isMine && !isCorrectOpt) {
              bg = '#FEF2F2';
              border = '1px solid #FECACA';
              color = '#B91C1C';
              chipBgOpt = '#DC2626';
              chipColorOpt = '#FFFFFF';
            }
            if (isMine && isCorrectOpt) {
              border = '1.5px solid #16A34A';
            }

            return (
              <div
                key={oi}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 9,
                  background: bg,
                  border,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: isMultiple ? 6 : '50%',
                    background: chipBgOpt,
                    color: chipColorOpt,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {optLetter(oi)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: isCorrectOpt || isMine ? color : '#374151',
                    fontWeight: isCorrectOpt || isMine ? 600 : 400,
                    lineHeight: 1.5,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {opt}
                </span>
                {isCorrectOpt && !isMine && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#15803D',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đáp án đúng
                  </span>
                )}
                {isMine && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: isCorrectOpt ? '#15803D' : '#B91C1C',
                      background: isCorrectOpt ? '#DCFCE7' : '#FEE2E2',
                      padding: '2px 8px',
                      borderRadius: 20,
                      flexShrink: 0,
                    }}
                  >
                    {isCorrectOpt ? 'Bạn chọn ✓' : 'Bạn chọn ✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Điền đáp án: câu trả lời HS + đáp án đúng bên dưới */}
      {isShort && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnswerPanel
            title="Câu trả lời của bạn"
            kind={!hasAnswer ? 'empty' : ans.isCorrect ? 'mine-correct' : 'mine-wrong'}
          >
            {!hasAnswer ? (
              <span style={{ fontSize: 12.5, color: '#9CA3AF', fontStyle: 'italic' }}>
                Không có câu trả lời
              </span>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {String(ans.studentAnswer)}
              </span>
            )}
          </AnswerPanel>

          {!ans.isCorrect && (
            <AnswerPanel title="Đáp án đúng" kind="correct">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>
                {String(ans.correct)}
              </span>
            </AnswerPanel>
          )}
        </div>
      )}
    </div>
  );
}
