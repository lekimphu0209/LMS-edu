/**
 * Wrappers khu giáo viên: cầu nối giữa route (App.tsx) và các trang
 * viết theo kiểu "page tự điều hướng" — cung cấp onNavigate để map page-id
 * cũ sang route React Router thật, và fetch dữ liệu (React Query) truyền xuống.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type BankQuestion,
  getBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
} from '@/data/questionBank';
import { getCurriculums, getCurriculumDetail } from '@/data/curriculum';
import TeacherClasses from './classes/ClassesPage';
import TeacherClassDetail from './classes/ClassDetailPage';
import QuestionBank from './question-bank/QuestionBank';
import type { Outline } from './shared/data/outlines';
import CourseBuilder from './curriculum/CourseBuilderPage';
import CurriculumDetail from './curriculum/CurriculumDetailPage';
import Curriculum from './personalized-curriculum/PersonalizedCurriculumPage';
import AssignmentManager from './assignments/AssignmentManagerPage';
import CreateAssignment from './assignments/CreateAssignmentPage';
import AssignmentDetail from './assignments/AssignmentDetailPage';
import TeacherFeedback from './feedback/FeedbackPage';

/** Map tên page-id cũ → route thật (giữ API onNavigate(page) của các trang). */
const pageToRoute: Record<string, string> = {
  'teacher-class-detail': '/classes',
  'teacher-classes': '/classes',
  'teacher-qbank': '/questions',
  'teacher-course-builder': '/curriculum',
  'teacher-assign': '/assignments',
  'teacher-assign-create': '/assignments/new',
  'teacher-curriculum': '/progress',
  'teacher-feedback': '/feedback',
};

/** Tạo hàm onNavigate(page, data?) cho page component; state route mang data đi kèm. */
function usePageNavigate() {
  const navigate = useNavigate();
  return (page: string, data?: any) => {
    const base = pageToRoute[page] || page;
    if (page === 'teacher-class-detail' && data?.id != null) {
      navigate(`/classes/${data.id}`, { state: data });
      return;
    }
    navigate(base, data ? { state: data } : undefined);
  };
}

export function ClassesPage() {
  const onNavigate = usePageNavigate();
  return <TeacherClasses onNavigate={onNavigate} />;
}

export function ClassDetailPage() {
  const onNavigate = usePageNavigate();
  const { state } = useLocation();
  return <TeacherClassDetail classData={state} onNavigate={onNavigate} />;
}

/** Trang ngân hàng câu hỏi: fetch + mutation CRUD, invalidate cache khi thay đổi. */
export function QuestionBankPage() {
  const queryClient = useQueryClient();
  const { data: bankQuestions = [] } = useQuery<BankQuestion[]>({
    queryKey: ['bank-questions'],
    queryFn: getBankQuestions,
    retry: 1,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bank-questions'] });
  const addMutation = useMutation({ mutationFn: createBankQuestion, onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: updateBankQuestion, onSuccess: invalidate });
  const deleteMutation = useMutation({
    mutationFn: deleteBankQuestion,
    onSuccess: invalidate,
    onError: (e: any) =>
      window.alert(e?.response?.data?.message ?? 'Không xóa được câu hỏi.'),
  });

  return (
    <QuestionBank
      questions={bankQuestions}
      onAdd={(q) => addMutation.mutate(q)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onUpdate={(q) => updateMutation.mutate(q)}
    />
  );
}

export function CourseBuilderPage() {
  return <CourseBuilder />;
}

export function CurriculumDetailPage() {
  return <CurriculumDetail />;
}

export function CurriculumPage() {
  return <Curriculum />;
}

export function AssignmentManagerPage() {
  const navigate = useNavigate();
  return <AssignmentManager onCreateNew={() => navigate('/assignments/new')} />;
}

/** Trang tạo bài tập: cần cả ngân hàng câu hỏi lẫn cây đề cương để chọn nguồn. */
export function CreateAssignmentPage() {
  const { data: bankQuestions = [] } = useQuery<BankQuestion[]>({
    queryKey: ['bank-questions'],
    queryFn: getBankQuestions,
    retry: 1,
  });
  const { data: outlines = [] } = useQuery<Outline[]>({
    queryKey: ['assignment-outlines'],
    queryFn: async () => {
      const list = await getCurriculums();
      return Promise.all(list.map((c) => getCurriculumDetail(c.id)));
    },
    retry: 1,
  });
  return <CreateAssignment bankQuestions={bankQuestions} outlines={outlines} />;
}

export function AssignmentDetailPage() {
  return <AssignmentDetail />;
}

export function FeedbackPage() {
  return <TeacherFeedback />;
}
