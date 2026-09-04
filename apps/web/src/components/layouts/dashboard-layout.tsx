import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FileQuestion, ClipboardList,
  BarChart3, LogOut, Menu, X, ChevronDown, TrendingUp, UserCircle, Pencil, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roleNavItems: Record<string, { label: string; icon: typeof LayoutDashboard; path: string }[]> = {
  ADMIN: [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Học sinh', icon: Users, path: '/users?role=STUDENT' },
    { label: 'Giáo viên', icon: Users, path: '/users?role=TEACHER' },
    { label: 'Lớp học', icon: GraduationCap, path: '/classes' },
  ],
  TEACHER: [
    { label: 'Lớp của tôi', icon: GraduationCap, path: '/classes' },
    { label: 'Ngân hàng câu hỏi', icon: FileQuestion, path: '/questions' },
    { label: 'Soạn bài', icon: Pencil, path: '/curriculum' },
    { label: 'Giao bài tập', icon: ClipboardList, path: '/assignments' },
    { label: 'Giáo trình học sinh', icon: BookOpen, path: '/progress' },
    { label: 'Góp ý từ học sinh', icon: MessageCircle, path: '/feedback' },
  ],
  STUDENT: [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Lớp học', icon: GraduationCap, path: '/classes' },
    { label: 'Bài tập', icon: ClipboardList, path: '/assignments' },
    { label: 'Bài nộp', icon: Pencil, path: '/submissions' },
    { label: 'Tiến độ', icon: TrendingUp, path: '/progress' },
  ],
};

const roleConfig: Record<string, { title: string; accent: string; light: string; text: string }> = {
  ADMIN: { title: 'Admin', accent: 'bg-[#7C3AED]', light: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]' },
  TEACHER: { title: 'Teacher', accent: 'bg-[#2563EB]', light: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
  STUDENT: { title: 'Student', accent: 'bg-[#22C55E]', light: 'bg-[#F0FDF4]', text: 'text-[#22C55E]' },
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user ? roleNavItems[user.role] || [] : [];
  const config = user ? roleConfig[user.role] : roleConfig.STUDENT;

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header — fixed top */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2563EB] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display hidden text-lg font-extrabold text-[#111827] xl:inline">
              EduConnect
            </span>
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = `${location.pathname}${location.search}` === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'bg-[#EFF6FF] font-semibold text-[#2563EB]'
                      : 'text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]',
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: role + user */}
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                'hidden rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide sm:inline-block',
                config.light,
                config.text,
              )}
            >
              {config.title}
            </span>

            {/* Mobile menu button */}
            <button
              className="flex items-center justify-center rounded-md p-2 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* User profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-2.5 py-1.5 text-sm transition-colors hover:bg-[#F9FAFB]"
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white',
                    config.accent,
                  )}
                >
                  {initials}
                </div>
                <span className="hidden max-w-[120px] truncate whitespace-nowrap font-medium text-[#374151] xl:inline-block">
                  {user?.fullName}
                </span>
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                    <div className="mb-1 border-b px-3 py-2">
                      <p className="text-sm font-medium text-[#111827]">{user?.fullName}</p>
                      <p className="text-xs text-[#6B7280]">{user?.email}</p>
                      <span
                        className={cn(
                          'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white',
                          config.accent,
                        )}
                      >
                        {roleLabels[user?.role || ''] || user?.role}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                    >
                      <UserCircle className="h-4 w-4 text-[#6B7280]" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white lg:hidden">
            <div className="px-4 pt-3">
              <span
                className={cn(
                  'inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white',
                  config.accent,
                )}
              >
                {config.title}
              </span>
            </div>
            <nav className="space-y-1 px-4 py-3">
              {navItems.map((item) => {
                const isActive = `${location.pathname}${location.search}` === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#EFF6FF] font-semibold text-[#2563EB]'
                        : 'text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-2 border-t pt-2">
                <div className="mb-2 px-3">
                  <p className="text-sm font-medium text-[#111827]">{user?.fullName}</p>
                  <p className="text-xs text-[#6B7280]">{roleLabels[user?.role || ''] || user?.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1440px] p-6 lg:p-10">{children}</main>
    </div>
  );
}
