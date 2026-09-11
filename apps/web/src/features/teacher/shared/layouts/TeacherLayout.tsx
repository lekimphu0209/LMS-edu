import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export function TeacherLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
