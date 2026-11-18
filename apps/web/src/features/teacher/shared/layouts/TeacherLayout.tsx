import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

/** Layout khu giáo viên/admin: DashboardLayout chung + <Outlet /> render route con. */
export function TeacherLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
