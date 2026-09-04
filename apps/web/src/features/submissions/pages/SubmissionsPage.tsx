import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'Đang làm',
  SUBMITTED: 'Đã nộp',
  LATE: 'Nộp muộn',
  GRADED: 'Đã chấm',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  IN_PROGRESS: 'secondary',
  SUBMITTED: 'default',
  LATE: 'destructive',
  GRADED: 'outline',
};

const typeLabels: Record<string, string> = {
  SINGLE: 'Chọn một đáp án',
  MULTI: 'Chọn nhiều đáp án',
  FILL_BLANK: 'Điền vào chỗ trống',
};

interface Submission {
  id: string;
  status: string;
  totalScore?: number | null;
  submittedAt?: string;
  teacherNote?: string;
  student?: { id: string; fullName: string };
  assignmentTarget?: {
    id: string;
    assignment?: { id: string; title: string };
  };
  answers?: SubmissionAnswer[];
}
interface SubmissionAnswer {
  id: string;
  questionId: string;
  question?: { id: string; questionText: string; type: string; options?: { id: string; optionText: string; isCorrect: boolean }[] };
  selectedOptionIds?: string[];
  textAnswer?: string;
  score?: number | null;
  isCorrect?: boolean;
}

export function SubmissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [quizSubmissionId, setQuizSubmissionId] = useState<string | null>(null);
  const [gradeSubmissionId, setGradeSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { optionIds: string[]; textAnswer: string }>>({});
  const [gradeScores, setGradeScores] = useState<Record<string, number>>({});
  const [teacherNote, setTeacherNote] = useState('');

  // List submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', user?.id, user?.role],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (isStudent) params.studentId = user!.id;
      const { data } = await api.get('/submissions', { params });
      return data as Submission[];
    },
    enabled: !!user,
  });

  // Get assignments available to student (for starting new submission)
  const { data: availableAssignments } = useQuery({
    queryKey: ['available-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/assignments');
      return data as { id: string; title: string; targets?: { id: string }[] }[];
    },
    enabled: isStudent,
  });

  // Get submission detail for quiz-taking
  const { data: quizDetail } = useQuery({
    queryKey: ['submission-quiz', quizSubmissionId],
    queryFn: async () => {
      const { data } = await api.get(`/submissions/${quizSubmissionId}`);
      return data as Submission;
    },
    enabled: !!quizSubmissionId,
  });

  // Get submission detail for grading
  const { data: gradeDetail } = useQuery({
    queryKey: ['submission-grade', gradeSubmissionId],
    queryFn: async () => {
      const { data } = await api.get(`/submissions/${gradeSubmissionId}`);
      return data as Submission;
    },
    enabled: !!gradeSubmissionId,
  });

  // Start submission
  const startMutation = useMutation({
    mutationFn: async (assignmentTargetId: string) => {
      const { data } = await api.post('/submissions/start', { assignmentTargetId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setQuizSubmissionId(data.id);
    },
  });

  // Submit answers
  const submitMutation = useMutation({
    mutationFn: async ({ submissionId, answers }: { submissionId: string; answers: { questionId: string; selectedOptionIds?: string[]; textAnswer?: string }[] }) => {
      const { data } = await api.post(`/submissions/${submissionId}/submit`, { answers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-quiz', quizSubmissionId] });
      setQuizSubmissionId(null);
      setAnswers({});
    },
  });

  // Grade submission
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, scores, teacherNote }: { submissionId: string; scores: { questionId: string; score: number }[]; teacherNote?: string }) => {
      const { data } = await api.post(`/submissions/${submissionId}/grade`, { scores, teacherNote });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-grade', gradeSubmissionId] });
      setGradeSubmissionId(null);
      setGradeScores({});
      setTeacherNote('');
    },
  });

  // Feedback
  const feedbackMutation = useMutation({
    mutationFn: async ({ submissionId, teacherNote }: { submissionId: string; teacherNote: string }) => {
      const { data } = await api.post('/feedback', { submissionId, teacherNote });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  const handleStartQuiz = (assignmentTargetId: string) => {
    startMutation.mutate(assignmentTargetId);
  };

  const handleSubmitQuiz = () => {
    if (!quizDetail || !quizSubmissionId) return;
    const answerList = (quizDetail.answers || []).map((a) => {
      const userAns = answers[a.questionId] || { optionIds: [], textAnswer: '' };
      return {
        questionId: a.questionId,
        selectedOptionIds: userAns.optionIds.length > 0 ? userAns.optionIds : undefined,
        textAnswer: userAns.textAnswer || undefined,
      };
    });
    submitMutation.mutate({ submissionId: quizSubmissionId, answers: answerList });
  };

  const handleGrade = () => {
    if (!gradeDetail || !gradeSubmissionId) return;
    const scores = (gradeDetail.answers || []).map((a) => ({
      questionId: a.questionId,
      score: gradeScores[a.questionId] ?? 0,
    }));
    gradeMutation.mutate({ submissionId: gradeSubmissionId, scores, teacherNote: teacherNote || undefined });
  };

  const updateAnswer = (questionId: string, field: 'optionIds' | 'textAnswer', val: string[] | string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionIds: field === 'optionIds' ? val as string[] : prev[questionId]?.optionIds || [], textAnswer: field === 'textAnswer' ? val as string : prev[questionId]?.textAnswer || '' },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bài nộp</h1>
          <p className="text-muted-foreground">{isStudent ? 'Làm bài và xem kết quả' : 'Xem và chấm điểm bài nộp'}</p>
        </div>

        {/* Student: start new submission */}
        {isStudent && !quizSubmissionId && (
          <Card>
            <CardHeader><CardTitle>Bắt đầu làm bài</CardTitle></CardHeader>
            <CardContent>
              {availableAssignments && availableAssignments.length > 0 ? (
                <div className="space-y-2">
                  {availableAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm font-medium">{a.title}</span>
                      {a.targets && a.targets.length > 0 ? (
                        <Button size="sm" onClick={() => handleStartQuiz(a.targets![0].id)} disabled={startMutation.isPending}>
                          Bắt đầu
                        </Button>
                      ) : (
                        <Badge variant="secondary">Chưa được giao</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có bài tập nào được giao</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quiz taking UI */}
        {quizSubmissionId && quizDetail && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Làm bài: {quizDetail.assignmentTarget?.assignment?.title || 'Bài tập'}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setQuizSubmissionId(null); setAnswers({}); }}>Thoát</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizDetail.answers?.map((a, idx) => {
                const q = a.question;
                if (!q) return null;
                return (
                  <div key={a.id} className="rounded-md border p-4">
                    <p className="font-medium">{idx + 1}. {q.questionText}</p>
                    <p className="mb-2 text-xs text-muted-foreground">{typeLabels[q.type] || q.type}</p>
                    {q.type === 'FILL_BLANK' ? (
                      <Input
                        value={answers[a.questionId]?.textAnswer || ''}
                        onChange={(e) => updateAnswer(a.questionId, 'textAnswer', e.target.value)}
                        placeholder="Nhập câu trả lời..."
                      />
                    ) : (
                      <div className="space-y-2">
                        {q.options?.map((opt) => (
                          <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type={q.type === 'SINGLE' ? 'radio' : 'checkbox'}
                              name={`q-${a.questionId}`}
                              checked={answers[a.questionId]?.optionIds?.includes(opt.id) || false}
                              onChange={(e) => {
                                if (q.type === 'SINGLE') {
                                  updateAnswer(a.questionId, 'optionIds', [opt.id]);
                                } else {
                                  const current = answers[a.questionId]?.optionIds || [];
                                  if (e.target.checked) {
                                    updateAnswer(a.questionId, 'optionIds', [...current, opt.id]);
                                  } else {
                                    updateAnswer(a.questionId, 'optionIds', current.filter(id => id !== opt.id));
                                  }
                                }
                              }}
                            />
                            <span className="text-sm">{opt.optionText}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <Button onClick={handleSubmitQuiz} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Đang nộp...' : 'Nộp bài'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grading UI */}
        {gradeSubmissionId && gradeDetail && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chấm điểm: {gradeDetail.assignmentTarget?.assignment?.title || 'Bài tập'}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setGradeSubmissionId(null); setGradeScores({}); setTeacherNote(''); }}>Đóng</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {gradeDetail.student && (
                <p className="text-sm text-muted-foreground">Học sinh: {gradeDetail.student.fullName}</p>
              )}
              {gradeDetail.answers?.map((a, idx) => {
                const q = a.question;
                if (!q) return null;
                return (
                  <div key={a.id} className="rounded-md border p-4">
                    <p className="font-medium">{idx + 1}. {q.questionText}</p>
                    <p className="mb-2 text-xs text-muted-foreground">{typeLabels[q.type] || q.type}</p>
                    {q.type === 'FILL_BLANK' ? (
                      <p className="text-sm">Câu trả lời: <span className="font-medium">{a.textAnswer || '(trống)'}</span></p>
                    ) : (
                      <div className="space-y-1">
                        {q.options?.map((opt) => {
                          const selected = a.selectedOptionIds?.includes(opt.id);
                          return (
                            <div key={opt.id} className={`text-sm ${selected ? 'font-medium' : ''} ${opt.isCorrect ? 'text-green-600' : ''}`}>
                              {selected ? '☑' : '☐'} {opt.optionText} {opt.isCorrect && '✓ (đúng)'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-sm">Điểm:</label>
                      <Input
                        type="number"
                        className="w-24"
                        value={gradeScores[a.questionId] ?? a.score ?? 0}
                        onChange={(e) => setGradeScores(prev => ({ ...prev, [a.questionId]: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nhận xét giáo viên</label>
                <Input value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} placeholder="Nhập nhận xét..." />
              </div>
              <Button onClick={handleGrade} disabled={gradeMutation.isPending}>
                {gradeMutation.isPending ? 'Đang lưu...' : 'Lưu điểm'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submissions list */}
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="space-y-3">
            {submissions?.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {s.assignmentTarget?.assignment?.title || 'Bài tập không xác định'}
                    </CardTitle>
                    <Badge variant={statusColors[s.status] || 'secondary'}>
                      {statusLabels[s.status] || s.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {s.student && (
                    <p className="text-sm text-muted-foreground">Học sinh: {s.student.fullName}</p>
                  )}
                  {s.totalScore !== null && s.totalScore !== undefined && (
                    <p className="mt-1 text-sm">Điểm: <span className="font-medium text-primary">{s.totalScore}</span></p>
                  )}
                  {s.submittedAt && (
                    <p className="mt-1 text-sm text-muted-foreground">Nộp lúc: {new Date(s.submittedAt).toLocaleString('vi-VN')}</p>
                  )}
                  {s.teacherNote && (
                    <p className="mt-2 rounded-md bg-muted p-2 text-sm">Nhận xét: {s.teacherNote}</p>
                  )}
                  <div className="mt-2 flex gap-1">
                    {isStudent && s.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="ghost" onClick={() => setQuizSubmissionId(s.id)}>
                        Tiếp tục làm
                      </Button>
                    )}
                    {isTeacher && (s.status === 'SUBMITTED' || s.status === 'LATE') && (
                      <Button size="sm" variant="ghost" onClick={() => setGradeSubmissionId(s.id)}>
                        Chấm điểm
                      </Button>
                    )}
                    {isTeacher && s.status === 'GRADED' && (
                      <Button size="sm" variant="ghost" onClick={() => setGradeSubmissionId(s.id)}>
                        Xem lại
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {submissions?.length === 0 && (
              <p className="text-muted-foreground">Chưa có bài nộp nào</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
