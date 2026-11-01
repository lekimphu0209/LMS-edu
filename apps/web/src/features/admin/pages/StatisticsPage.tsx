import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  UserCheck,
  FileCheck,
  School,
  Activity,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Overview {
  totalUsers: number;
  totalClasses: number;
  totalQuestions: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalEnrolledStudents: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  activeClasses: number;
  inactiveClasses: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  completionRate: number;
  usersByRole: { role: string; _count: number }[];
  submissionsByStatus: { status: string; _count: number }[];
}

interface GrowthPoint {
  date: string;
  teachers: number;
  students: number;
  total: number;
}

const PERIODS = [
  { days: 7, label: '7 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
  { days: 365, label: '1 năm' },
  { days: null, label: 'Tất cả' },
] as const;

const roleMeta: Record<string, { label: string; color: string }> = {
  STUDENT: { label: 'Học sinh', color: '#2563EB' },
  TEACHER: { label: 'Giáo viên', color: '#7C3AED' },
  ADMIN: { label: 'Quản trị viên', color: '#475569' },
};

const submissionMeta: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'Đang làm', color: '#94A3B8' },
  SUBMITTED: { label: 'Đã nộp', color: '#2563EB' },
  LATE: { label: 'Nộp trễ', color: '#F59E0B' },
  GRADED: { label: 'Đã chấm', color: '#16A34A' },
};

const statLabels: Record<string, string> = {
  totalUsers: 'Tổng người dùng',
  totalClasses: 'Tổng lớp học',
  totalQuestions: 'Tổng câu hỏi',
  totalAssignments: 'Tổng bài tập',
  totalSubmissions: 'Tổng bài nộp',
  totalEnrolledStudents: 'Lượt ghi danh',
  totalStudents: 'Học sinh',
  totalTeachers: 'Giáo viên',
  totalAdmins: 'Quản trị viên',
  activeUsers: 'Người dùng hoạt động',
  inactiveUsers: 'Người dùng bị khóa',
  activeClasses: 'Lớp đang mở',
  inactiveClasses: 'Lớp đã đóng',
  gradedSubmissions: 'Bài đã chấm',
  pendingSubmissions: 'Bài chờ chấm',
  completionRate: 'Tỷ lệ đã chấm (%)',
};

function formatLabel(key: string): string {
  return statLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/* ── Hàng số liệu trong card tóm tắt: label trái, giá trị phải ── */
function MetricRow({
  label,
  value,
  unit,
  color = '#111827',
}: {
  label: string;
  value: number | string;
  unit: string;
  color?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-muted pb-2 last:border-0 last:pb-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="whitespace-nowrap">
        <span className="font-display text-lg font-extrabold" style={{ color }}>
          {value}
        </span>{' '}
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

/* ── Card nhóm tóm tắt: tiêu đề + caption "Tóm tắt" ───────────── */
function SummaryCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon size={16} className="text-muted-foreground" />
          {title}
          <span className="ml-auto text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
            Tóm tắt
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">{children}</CardContent>
    </Card>
  );
}

/* ── Donut SVG + legend ────────────────────────────────────────── */
function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string | number;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 54;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width={128} height={128} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
          <g transform="rotate(-90 60 60)">
            {segments.map((s) => {
              const len = total > 0 ? (s.value / total) * circ : 0;
              const el = (
                <circle
                  key={s.label}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += len;
              return el;
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-extrabold leading-none">{centerValue}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="ml-auto whitespace-nowrap font-semibold">
                {s.value}
                <span className="ml-1 font-normal text-muted-foreground">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Hàng tỷ lệ: label + track + số đếm ───────────────────────── */
function RatioRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {count}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [days, setDays] = useState<number | null>(null);

  const from = days ? new Date(Date.now() - days * 86400000).toISOString() : undefined;
  const interval = !days || days > 180 ? 'month' : days > 31 ? 'week' : 'day';
  const periodLabel = PERIODS.find((p) => p.days === days)?.label ?? 'Tất cả';

  const { data, isLoading } = useQuery<Overview | Record<string, unknown>>({
    queryKey: ['statistics-page', user?.role, days],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (isAdmin && from) params.from = from;
      const endpoint = isAdmin
        ? '/admin/stats/overview'
        : user?.role === 'TEACHER'
          ? '/statistics/teacher'
          : '/statistics/student';
      const { data } = await api.get(endpoint, { params });
      return data;
    },
    enabled: !!user,
  });

  const { data: growth } = useQuery<{ data: GrowthPoint[] }>({
    queryKey: ['admin-stats-growth', days],
    queryFn: async () => {
      const params: Record<string, string> = { interval };
      if (from) params.from = from;
      const { data } = await api.get('/admin/stats/growth', { params });
      return data;
    },
    enabled: isAdmin,
  });

  const o = isAdmin ? (data as Overview | undefined) : undefined;
  const growthPoints = growth?.data ?? [];
  const growthMax = Math.max(1, ...growthPoints.map((p) => p.total));

  const fmtBucket = (date: string) =>
    date.length === 7 ? `T${Number(date.slice(5))}` : `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  const fmtBucketTitle = (date: string) =>
    date.length === 7
      ? `Tháng ${date.slice(5)}/${date.slice(0, 4)}`
      : `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + bộ lọc thời gian */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Thống kê hệ thống</h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan và phân tích dữ liệu EduConnect
              {isAdmin && ` · Hiển thị: ${periodLabel}`}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDays(p.days)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === p.days
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : !o ? (
          /* Fallback: vai trò khác admin — lưới thẻ generic */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data &&
              Object.entries(data).map(([key, value]) => {
                if (Array.isArray(value)) {
                  return (
                    <Card key={key} className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {formatLabel(key)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {value.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-md border p-2"
                            >
                              {Object.entries(item).map(([k, v]) => (
                                <span key={k} className="text-sm">
                                  <span className="font-medium">{formatLabel(k)}:</span> {String(v)}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {formatLabel(key)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{String(value)}</p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <>
            {/* Tóm tắt 3 nhóm */}
            <div className="grid gap-4 lg:grid-cols-3">
              <SummaryCard icon={Users} title="Người dùng">
                <MetricRow label="Tổng người dùng" value={o.totalUsers} unit="người" />
                <MetricRow
                  label="Đang hoạt động"
                  value={o.activeUsers}
                  unit="người"
                  color="#16A34A"
                />
                <MetricRow label="Đã bị khóa" value={o.inactiveUsers} unit="người" color="#DC2626" />
              </SummaryCard>

              <SummaryCard icon={GraduationCap} title="Giáo viên">
                <MetricRow label="Tổng giáo viên" value={o.totalTeachers} unit="người" />
                <MetricRow
                  label="Tổng bài tập đã giao"
                  value={o.totalAssignments}
                  unit="bài"
                  color="#7C3AED"
                />
                <MetricRow
                  label="Bài chờ chấm điểm"
                  value={o.pendingSubmissions}
                  unit="bài"
                  color={o.pendingSubmissions > 0 ? '#F59E0B' : '#16A34A'}
                />
              </SummaryCard>

              <SummaryCard icon={School} title="Học sinh & Lớp học">
                <MetricRow label="Tổng học sinh" value={o.totalStudents} unit="học sinh" />
                <MetricRow
                  label="HS đã ghi danh"
                  value={o.totalEnrolledStudents}
                  unit="học sinh"
                  color="#2563EB"
                />
                <MetricRow
                  label="Tỉ lệ hoàn thành TB"
                  value={o.completionRate}
                  unit="%"
                  color="#16A34A"
                />
              </SummaryCard>
            </div>

            {/* Biểu đồ */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <PieChart size={16} className="text-muted-foreground" />
                    Người dùng theo vai trò
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Donut
                    centerValue={o.totalUsers}
                    centerLabel="người dùng"
                    segments={(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => ({
                      label: roleMeta[r].label,
                      value: o.usersByRole.find((g) => g.role === r)?._count ?? 0,
                      color: roleMeta[r].color,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileCheck size={16} className="text-muted-foreground" />
                    Bài nộp theo trạng thái
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Donut
                    centerValue={`${o.completionRate}%`}
                    centerLabel="đã chấm"
                    segments={(['GRADED', 'SUBMITTED', 'LATE', 'IN_PROGRESS'] as const).map((s) => ({
                      label: submissionMeta[s].label,
                      value: o.submissionsByStatus.find((g) => g.status === s)?._count ?? 0,
                      color: submissionMeta[s].color,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Activity size={16} className="text-muted-foreground" />
                    Trạng thái hoạt động
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <RatioRow
                    label="Lớp đang mở"
                    count={o.activeClasses}
                    total={o.totalClasses}
                    color="#7C3AED"
                  />
                  <RatioRow
                    label="Người dùng hoạt động"
                    count={o.activeUsers}
                    total={o.totalUsers}
                    color="#2563EB"
                  />
                  <RatioRow
                    label="Bài nộp đã chấm"
                    count={o.gradedSubmissions}
                    total={o.totalSubmissions}
                    color="#16A34A"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Tăng trưởng người dùng theo kỳ lọc */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp size={16} className="text-muted-foreground" />
                  Người dùng mới
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {periodLabel} · theo {interval === 'day' ? 'ngày' : interval === 'week' ? 'tuần' : 'tháng'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {growthPoints.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có dữ liệu tăng trưởng trong khoảng này
                  </p>
                ) : (
                  <>
                    <div className="flex h-44 items-end gap-1.5">
                      {growthPoints.map((p) => (
                        <div
                          key={p.date}
                          className="group flex flex-1 flex-col items-center justify-end gap-1"
                          title={`${fmtBucketTitle(p.date)}: ${p.total} người mới (${p.students} HS · ${p.teachers} GV)`}
                        >
                          <span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            {p.total}
                          </span>
                          <div
                            className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md"
                            style={{ height: `${Math.max(4, (p.total / growthMax) * 100)}%` }}
                          >
                            <div
                              className="w-full bg-blue-500"
                              style={{ height: `${p.total ? (p.students / p.total) * 100 : 0}%` }}
                            />
                            <div
                              className="w-full bg-violet-400"
                              style={{ height: `${p.total ? (p.teachers / p.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {fmtBucket(p.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-blue-500" /> Học sinh
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-violet-400" /> Giáo viên
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
