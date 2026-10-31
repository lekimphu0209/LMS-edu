import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

type Crumb = { label: string; path: string };

const staticLabels: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/admin': 'Người dùng',
  '/admin/classes': 'Lớp học',
  '/submissions': 'Bài nộp',
  '/statistics': 'Thống kê',
  '/classes': 'Lớp của tôi',
  '/curriculum': 'Soạn bài',
  '/questions': 'Ngân hàng câu hỏi',
  '/assignments': 'Giao bài tập',
  '/assignments/new': 'Tạo bài tập',
  '/progress': 'Giáo trình học sinh',
  '/feedback': 'Góp ý từ học sinh',
  '/student/classes': 'Lớp học',
  '/student/assignments': 'Bài tập',
  '/student/feedback': 'Góp ý',
  '/profile': 'Hồ sơ cá nhân',
};

const adminRoleLabels: Record<string, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
};

function labelFor(path: string, search: string): string | null {
  if (path === '/admin') {
    const role = new URLSearchParams(search).get('role') ?? '';
    return adminRoleLabels[role] ?? staticLabels[path];
  }
  if (staticLabels[path]) return staticLabels[path];
  if (/^\/(student\/)?classes\/[^/]+$/.test(path)) return 'Chi tiết lớp';
  if (/^\/curriculum\/[^/]+$/.test(path)) return 'Chi tiết đề cương';
  if (/^\/assignments\/[^/]+$/.test(path)) return 'Chi tiết bài tập';
  return null;
}

export function PageBreadcrumb({ homePath }: { homePath: string }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  if (pathname === homePath || pathname === '/profile') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  segments.forEach((_, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    if (path === homePath) return;
    const isLast = i === segments.length - 1;
    const label = labelFor(path, isLast ? search : '');
    if (label) crumbs.push({ label, path: isLast ? path + search : path });
  });

  const parentPath = crumbs.length > 1 ? crumbs[crumbs.length - 2].path : homePath;

  const handleBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(parentPath);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#374151] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay về
      </button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-[#6B7280]">
        <Link to={homePath} className="flex items-center gap-1 hover:text-[#2563EB]">
          <Home className="h-3.5 w-3.5" />
          {staticLabels[homePath]}
        </Link>
        {crumbs.map((c, i) => (
          <Fragment key={c.path}>
            <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" />
            {i === crumbs.length - 1 ? (
              <span className="truncate font-semibold text-[#111827]">{c.label}</span>
            ) : (
              <Link to={c.path} className="hover:text-[#2563EB]">
                {c.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
