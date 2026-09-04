import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/auth-context';
import { seedQuestions, type BankQuestion } from '@/data/questionBank';
import { seedOutlines, type Outline } from '@/features/teacher/shared/data/outlines';

const routeToPage: Record<string, string> = {
  '/dashboard': 'teacher-dashboard',
  '/classes': 'teacher-classes',
  '/questions': 'teacher-qbank',
  '/curriculum': 'teacher-course-builder',
  '/assignments': 'teacher-assign',
  '/progress': 'teacher-curriculum',
  '/feedback': 'teacher-feedback',
};

const pageToRoute: Record<string, string> = {
  'teacher-dashboard': '/dashboard',
  'teacher-classes': '/classes',
  'teacher-class-detail': '/classes',
  'teacher-qbank': '/questions',
  'teacher-course-builder': '/curriculum',
  'teacher-assign': '/assignments',
  'teacher-assign-create': '/assignments/new',
  'teacher-curriculum': '/progress',
  'teacher-feedback': '/feedback',
};

export interface FigmaTeacherContext {
  onNavigate: (page: string, data?: any) => void;
  bankQuestions: BankQuestion[];
  setBankQuestions: (qs: BankQuestion[]) => void;
  outlines: Outline[];
  setOutlines: (os: Outline[]) => void;
}

export function FigmaTeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>(seedQuestions);
  const [outlines, setOutlines] = useState<Outline[]>(seedOutlines);

  const activePath = Object.keys(routeToPage).find((p) =>
    p === '/classes' ? location.pathname.startsWith('/classes') : location.pathname === p
  ) || '/classes';
  const currentPage = routeToPage[activePath] || 'teacher-classes';

  const onNavigate = (page: string, data?: any) => {
    const base = pageToRoute[page];
    if (!base) return;
    if (page === 'teacher-class-detail' && data?.id != null) {
      navigate(`/classes/${data.id}`, { state: data });
      return;
    }
    navigate(base, data ? { state: data } : undefined);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header
        role="teacher"
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={logout}
        userName={user?.fullName || ''}
      />
      <main className="mx-auto max-w-[1440px]">
        <Outlet
          context={{
            onNavigate,
            bankQuestions,
            setBankQuestions,
            outlines,
            setOutlines,
          }}
        />
      </main>
    </div>
  );
}
