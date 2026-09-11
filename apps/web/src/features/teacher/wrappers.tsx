import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { seedQuestions, type BankQuestion } from '@/data/questionBank';
import TeacherClasses from './classes/ClassesPage';
import TeacherClassDetail from './classes/ClassDetailPage';
import QuestionBank from './question-bank/QuestionBank';
import { seedOutlines, type Outline } from './shared/data/outlines';
import CourseBuilder from './curriculum/CourseBuilderPage';
import Curriculum from './personalized-curriculum/PersonalizedCurriculumPage';
import AssignmentManager from './assignments/AssignmentManagerPage';
import CreateAssignment from './assignments/CreateAssignmentPage';
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
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>(seedQuestions);
  const handleAdd = (q: BankQuestion) => setBankQuestions([...bankQuestions, q]);
  const handleDelete = (id: string) => setBankQuestions(bankQuestions.filter((q) => q.id !== id));
  const handleUpdate = (q: BankQuestion) =>
    setBankQuestions(bankQuestions.map((x) => (x.id === q.id ? q : x)));
  return (
    <QuestionBank
      questions={bankQuestions}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  );
}

export function CourseBuilderPage() {
  const [bankQuestions] = useState<BankQuestion[]>(seedQuestions);
  const [outlines, setOutlines] = useState<Outline[]>(seedOutlines);
  return (
    <CourseBuilder
      bankQuestions={bankQuestions}
      outlines={outlines}
      onOutlinesChange={setOutlines}
    />
  );
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

export function FeedbackPage() {
  return <TeacherFeedback />;
}
