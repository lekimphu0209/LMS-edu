import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ProfilePage } from '@/features/auth/pages/ProfilePage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { UsersPage } from '@/features/admin/pages/UsersPage';
import { StatisticsPage } from '@/features/admin/pages/StatisticsPage';
import { SubmissionsPage } from '@/features/submissions/pages/SubmissionsPage';
import { FigmaTeacherLayout } from '@/features/teacher/shared/layouts/TeacherLayout';
import {
  ClassesPage,
  ClassDetailPage,
  QuestionBankPage,
  CourseBuilderPage,
  CurriculumPage,
  AssignmentManagerPage,
  CreateAssignmentPage,
  FeedbackPage,
} from '@/features/teacher/wrappers';
import { StudentLayout } from '@/features/student/shared/layouts/StudentLayout';
import StudentDashboard from '@/features/student/pages/StudentDashboard';
import StudentClassDetail from '@/features/student/pages/StudentClassDetail';
import StudentAssignments from '@/features/student/pages/StudentAssignments';
import StudentFeedback from '@/features/student/pages/StudentFeedback';
import Quiz from '@/features/student/pages/Quiz';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <ProtectedRoute>
                  <SubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <StatisticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
                  <FigmaTeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/classes/:id" element={<ClassDetailPage />} />
              <Route path="/curriculum" element={<CourseBuilderPage />} />
              <Route path="/questions" element={<QuestionBankPage />} />
              <Route path="/assignments" element={<AssignmentManagerPage />} />
              <Route path="/assignments/new" element={<CreateAssignmentPage />} />
              <Route path="/progress" element={<CurriculumPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
            </Route>
            <Route
              path="/student"
              element={<Navigate to="/student/classes" replace />}
            />
            <Route
              element={
                <ProtectedRoute roles={['STUDENT']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/student/classes" element={<StudentDashboard />} />
              <Route path="/student/classes/:id" element={<StudentClassDetail />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/feedback" element={<StudentFeedback />} />
            </Route>
            <Route
              path="/student/quiz"
              element={
                <ProtectedRoute roles={['STUDENT']}>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
