import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FileQuestion, ClipboardList,
  BarChart3, LogOut, Menu, X, ChevronDown, TrendingUp, UserCircle, PlusCircle,
  UserPlus, BookOpenCheck, Pencil, Library
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roleNavItems: Record<string, { label: string; icon: typeof LayoutDashboard; path: string }[]> = {
  ADMIN: [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Người dùng', icon: Users, path: '/users' },
    { label: 'Lớp học', icon: GraduationCap, path: '/classes' },
    { label: 'Giáo trình', icon: BookOpen, path: '/curriculum' },
    { label: 'Ngân hàng câu hỏi', icon: FileQuestion, path: '/questions' },
    { label: 'Bài tập', icon: ClipboardList, path: '/assignments' },
    { label: 'Thống kê', icon: BarChart3, path: '/statistics' },
    { label: 'Tiến độ', icon: TrendingUp, path: '/progress' },
    { label: 'Hồ sơ', icon: UserCircle, path: '/profile' },
  ],
  TEACHER: [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Lớp học', icon: GraduationCap, path: '/classes' },
    { label: 'Giáo trình', icon: BookOpen, path: '/curriculum' },
    { label: 'Ngân hàng câu hỏi', icon: FileQuestion, path: '/questions' },
    { label: 'Bài tập', icon: ClipboardList, path: '/assignments' },
    { label: 'Thống kê', icon: BarChart3, path: '/statistics' },
    { label: 'Tiến độ', icon: TrendingUp, path: '/progress' },
    { label: 'Hồ sơ', icon: UserCircle, path: '/profile' },
  ],
  STUDENT: [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Lớp học', icon: GraduationCap, path: '/classes' },
    { label: 'Bài tập', icon: ClipboardList, path: '/assignments' },
    { label: 'Bài nộp', icon: Pencil, path: '/submissions' },
    { label: 'Tiến độ', icon: TrendingUp, path: '/progress' },
    { label: 'Hồ sơ', icon: UserCircle, path: '/profile' },
  ],
};

const roleConfig: Record<string, { title: string; accent: string; quickActions: { label: string; path: string; icon: typeof PlusCircle }[] }> = {
  ADMIN: {
    title: 'Trang quản trị',
    accent: 'bg-rose-600',
    quickActions: [
      { label: 'Thêm người dùng', path: '/users', icon: UserPlus },
      { label: 'Thêm lớp học', path: '/classes', icon: GraduationCap },
      { label: 'Thêm giáo trình', path: '/curriculum', icon: Library },
    ],
  },
  TEACHER: {
    title: 'Trang giáo viên',
    accent: 'bg-blue-600',
    quickActions: [
      { label: 'Tạo câu hỏi', path: '/questions', icon: PlusCircle },
      { label: 'Tạo bài tập', path: '/assignments', icon: ClipboardList },
      { label: 'Xem bài nộp', path: '/submissions', icon: BookOpenCheck },
    ],
  },
  STUDENT: {
    title: 'Trang học sinh',
    accent: 'bg-emerald-600',
    quickActions: [
      { label: 'Làm bài tập', path: '/submissions', icon: Pencil },
      { label: 'Xem tiến độ', path: '/progress', icon: TrendingUp },
    ],
  },
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
      <header className={cn('sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80', `border-${config.accent.replace('bg-', '')}`)}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          {/* Logo — left */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground', config.accent)}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="hidden text-lg font-bold sm:inline">EduConnect</span>
            <Badge variant="secondary" className="hidden font-medium xl:inline-flex">
              {config.title}
            </Badge>
          </Link>

          {/* Nav — center (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions — right (desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Role-specific quick actions */}
            {config.quickActions.map((action) => (
              <Button
                key={action.path}
                size="sm"
                variant="outline"
                onClick={() => { navigate(action.path); }}
                className="gap-1"
              >
                <action.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{action.label}</span>
              </Button>
            ))}

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground', config.accent)}>
                  {initials}
                </div>
                <span className="hidden max-w-[140px] truncate font-medium lg:inline">{user?.fullName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-md border bg-popover p-1 shadow-md">
                    <div className="px-3 py-2 border-b mb-1">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium text-primary-foreground', config.accent)}>
                        {roleLabels[user?.role || ''] || user?.role}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <UserCircle className="h-4 w-4" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="flex items-center justify-center rounded-md p-2 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t md:hidden">
            <div className="px-4 pt-3">
              <Badge className={cn('text-primary-foreground', config.accent)}>
                {config.title}
              </Badge>
            </div>
            <nav className="space-y-1 px-4 py-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t pt-2 mt-2">
                <div className="mb-2 px-3">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user?.role || ''] || user?.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2"
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
      <main className="mx-auto max-w-7xl p-4 lg:p-6">{children}</main>
    </div>
  );
}
