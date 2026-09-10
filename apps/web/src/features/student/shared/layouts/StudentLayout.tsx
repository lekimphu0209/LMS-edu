import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/auth-context';

const routeToPage: Record<string, string> = {
  '/student/classes': 'student-classes',
  '/student/assignments': 'student-assignments',
  '/student/feedback': 'student-feedback',
};

const pageToRoute: Record<string, string> = {
  'student-classes': '/student/classes',
  'student-assignments': '/student/assignments',
  'student-feedback': '/student/feedback',
};

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activePath =
    Object.keys(routeToPage).find((p) => {
      if (p === '/student/classes') {
        return location.pathname === '/student/classes' || location.pathname.startsWith('/student/classes/');
      }
      return location.pathname === p;
    }) || '/student/classes';

  const currentPage = routeToPage[activePath] || 'student-classes';

  const onNavigate = (page: string) => {
    const base = pageToRoute[page];
    if (!base) return;
    navigate(base);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Header
        role="student"
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={logout}
        userName={user?.fullName || ''}
      />
      <main style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
