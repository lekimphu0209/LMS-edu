import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: ('ADMIN' | 'TEACHER' | 'STUDENT')[];
}

/**
 * Bọc route cần đăng nhập: chưa login → /login; có `roles` thì còn kiểm
 * user.role, sai quyền → /dashboard.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
