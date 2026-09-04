import { useOutletContext, useLocation } from 'react-router-dom';
import type { BankQuestion } from '@/data/questionBank';
import type { FigmaTeacherContext } from './shared/layouts/TeacherLayout';
import TeacherClasses from './classes/ClassesPage';
import TeacherClassDetail from './classes/ClassDetailPage';
import TeacherDashboard from './dashboard/DashboardPage';
import QuestionBank from './question-bank/QuestionBank';
import type { Outline } from './shared/data/outlines';
import CourseBuilder from './curriculum/CourseBuilderPage';
import Curriculum from './personalized-curriculum/PersonalizedCurriculumPage';
import AssignmentManager from './assignments/AssignmentManagerPage';
import CreateAssignment from './assignments/CreateAssignmentPage';
import TeacherFeedback from './feedback/FeedbackPage';

function useCtx() {
  return useOutletContext<FigmaTeacherContext>();
}

export function ClassesPage() {
  const { onNavigate } = useCtx();
  return <TeacherClasses onNavigate={onNavigate} />;
}

export function ClassDetailPage() {
  const { onNavigate } = useCtx();
  const { state } = useLocation();
  return <TeacherClassDetail classData={state} onNavigate={onNavigate} />;
}

export function TeacherDashboardPage() {
  const { onNavigate } = useCtx();
  return <TeacherDashboard onNavigate={onNavigate} />;
}

export function QuestionBankPage() {
  const { bankQuestions, setBankQuestions } = useCtx();
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
  const { bankQuestions, outlines, setOutlines } = useCtx();
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
  const { onNavigate } = useCtx();
  return <AssignmentManager onCreateNew={() => onNavigate('teacher-assign-create')} />;
}

export function CreateAssignmentPage() {
  const { bankQuestions, outlines } = useCtx();
  return <CreateAssignment bankQuestions={bankQuestions} outlines={outlines} />;
}

export function FeedbackPage() {
  return <TeacherFeedback />;
}
