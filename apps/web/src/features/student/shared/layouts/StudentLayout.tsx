import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export function StudentLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
