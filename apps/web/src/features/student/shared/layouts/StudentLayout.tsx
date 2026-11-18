import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

/** Layout khu học sinh: DashboardLayout chung + <Outlet /> render route con. */
export function StudentLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
