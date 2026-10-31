import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  seedQuestions,
  type BankQuestion,
  getBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
} from '@/data/questionBank';
import TeacherClasses from './classes/ClassesPage';
import TeacherClassDetail from './classes/ClassDetailPage';
import QuestionBank from './question-bank/QuestionBank';
import { seedOutlines, type Outline } from './shared/data/outlines';
import CourseBuilder from './curriculum/CourseBuilderPage';
import CurriculumDetail from './curriculum/CurriculumDetailPage';
import Curriculum from './personalized-curriculum/PersonalizedCurriculumPage';
import AssignmentManager from './assignments/AssignmentManagerPage';
import CreateAssignment from './assignments/CreateAssignmentPage';
import AssignmentDetail from './assignments/AssignmentDetailPage';
import TeacherFeedback from './feedback/FeedbackPage';

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

export function QuestionBankPage() {
  const queryClient = useQueryClient();
  const { data: bankQuestions = seedQuestions, isLoading, isError } = useQuery<BankQuestion[]>({
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

export function CreateAssignmentPage() {
  const [bankQuestions] = useState<BankQuestion[]>(seedQuestions);
  const [outlines] = useState<Outline[]>(seedOutlines);
  return <CreateAssignment bankQuestions={bankQuestions} outlines={outlines} />;
}

export function AssignmentDetailPage() {
  return <AssignmentDetail />;
}

export function FeedbackPage() {
  return <TeacherFeedback />;
}
