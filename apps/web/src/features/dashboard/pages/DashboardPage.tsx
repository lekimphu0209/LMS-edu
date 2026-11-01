import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, FileQuestion, ClipboardList, Pencil, MessageCircle,
  Users, UserPlus, ChevronRight, TrendingUp, TrendingDown, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

type SeriesKey = 'students' | 'teachers' | 'total';

type IntervalKey = 'day' | 'month' | 'year';

interface GrowthPoint {
  date: string;
  teachers: number;
  students: number;
  total: number;
}

interface AdminInsights {
  attention: {
    classesInactiveTeacher: number;
    classesNoStudents: number;
    unenrolledStudents: number;
    inactiveTeachers: number;
  };
  rankings: {
    topClasses: { name: string; subject: string; students: number }[];
    topTeachers: { name: string; classes: number }[];
  };
  subjects: { subject: string; count: number }[];
  activity: { newUsers7d: number; prevUsers7d: number; neverLoggedIn: number; staleUsers: number };
}

const seriesMeta: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'total', label: 'Tổng', color: '#7C3AED' },
  { key: 'students', label: 'Học sinh', color: '#2563EB' },
  { key: 'teachers', label: 'Giáo viên', color: '#22C55E' },
];

const PRESETS: { key: string; label: string }[] = [
  { key: 'custom', label: 'Tùy chọn' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '6m', label: '6 tháng' },
  { key: '12m', label: '12 tháng' },
  { key: 'ytd', label: 'Năm nay' },
  { key: 'all', label: 'Toàn bộ' },
];

const INTERVALS: { key: IntervalKey; label: string }[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const monthsAgo = (n: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, 1);
};

const formatNumber = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');
const formatValue = (v: string | number | undefined) => (v === undefined ? '—' : String(v));

interface LineChartProps {
  labels: string[];
  titles: string[];
  data: Record<SeriesKey, number[]>;
  active: Set<string>;
}

function LineChart({ labels, titles, data, active }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 640;
  const H = 200;
  const padL = 12;
  const padR = 40;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = labels.length;
  const labelStep = Math.max(1, Math.ceil(n / 12));
  const visible = seriesMeta.filter((s) => active.has(s.key));
  const allVals = visible.flatMap((s) => data[s.key]);
  const globalMin = allVals.length ? Math.min(...allVals) * 0.93 : 0;
  const globalMax = allVals.length ? Math.max(...allVals) * 1.04 : 1;
  const toX = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const toY = (v: number) => padT + innerH - ((v - globalMin) / (globalMax - globalMin)) * innerH;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => globalMin + t * (globalMax - globalMin));
  const paths = visible.map((s) => {
    const vals = data[s.key];
    const pts = vals.map((v, i) => ({ x: toX(i), y: toY(v), v }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaD =
      d +
      ` L${pts[pts.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${padL},${(padT + innerH).toFixed(1)} Z`;
    return { ...s, pts, d, areaD };
  });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {paths.map((p) => (
            <linearGradient key={p.key} id={`grad-${p.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={p.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {gridVals.map((v, i) => {
          const y = toY(v);
          const label = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString();
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={W - padR + 6} y={y + 4} fontSize="10" fill="#9CA3AF">
                {label}
              </text>
            </g>
          );
        })}
        {labels.map((m, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9CA3AF">
              {m}
            </text>
          ) : null,
        )}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={toX(i) - innerW / n / 2}
            y={padT}
            width={innerW / n}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
          />
        ))}
        {hovered !== null && (
          <line
            x1={toX(hovered)}
            x2={toX(hovered)}
            y1={padT}
            y2={padT + innerH}
            stroke="#E5E7EB"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}
        {paths.map((p) => (
          <g key={p.key}>
            <path d={p.areaD} fill={`url(#grad-${p.key})`} />
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {p.pts.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={hovered === i ? 5 : 3.5}
                fill="white"
                stroke={p.color}
                strokeWidth="2"
                className="transition-all"
              />
            ))}
          </g>
        ))}
      </svg>
      {hovered !== null && (
        <div
          className="absolute top-6 z-10 min-w-[140px] rounded-xl border border-gray-100 bg-white p-2.5 shadow-lg"
          style={{
            left: `calc(${((toX(hovered) - padL) / (W - padL - padR)) * 100}% + 12px)`,
            transform: hovered > n - 3 ? 'translateX(calc(-100% - 24px))' : undefined,
          }}
        >
          <div className="mb-2 text-xs font-bold text-[#374151]">{titles[hovered] ?? labels[hovered]}</div>
          {paths.map((p) => (
            <div key={p.key} className="mb-1 flex items-center justify-between gap-3 text-xs last:mb-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="text-[#6B7280]">{p.label}</span>
              </div>
              <span className="font-bold text-[#111827]">{p.pts[hovered].v.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function Donut({ slices, size = 104 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
      {total > 0 &&
        slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

function AdminDashboard() {
  const { data, isPending: overviewPending } = useQuery({
    queryKey: ['statistics', 'admin'],
    queryFn: async () => (await api.get('/statistics/admin')).data,
  });
  const { data: insights, isPending: insightsPending } = useQuery<AdminInsights>({
    queryKey: ['admin-insights'],
    queryFn: async () => (await api.get('/admin/stats/insights')).data,
  });
  const navigate = useNavigate();
  const today = toISODate(new Date());
  const [preset, setPreset] = useState('6m');
  const [from, setFrom] = useState(() => toISODate(monthsAgo(5)));
  const [to, setTo] = useState(today);
  const [active, setActive] = useState<Set<string>>(new Set(['students', 'teachers', 'total']));
  const [rankTab, setRankTab] = useState<'classes' | 'teachers'>('classes');

  // Gộp theo ngày/tháng/năm tự suy ra từ độ dài khoảng ngày.
  const interval: IntervalKey = useMemo(() => {
    if (!from || !to) return 'month';
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 'month';
    const diffDays = (end.getTime() - start.getTime()) / 86_400_000;
    return diffDays <= 62 ? 'day' : diffDays <= 31 * 24 ? 'month' : 'year';
  }, [from, to]);

  const { data: growth } = useQuery<{ data: GrowthPoint[] }>({
    queryKey: ['admin-growth', from, to, interval],
    queryFn: async () =>
      (
        await api.get('/admin/stats/growth', {
          params: {
            interval,
            from: from || undefined,
            to: to ? `${to}T23:59:59` : undefined,
          },
        })
      ).data,
  });

  const bucketMap = useMemo(
    () => new Map((growth?.data ?? []).map((p) => [p.date, p] as const)),
    [growth],
  );

  const { labels, titles, sData, rangeInvalid } = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const empty = {
      labels: [] as string[],
      titles: [] as string[],
      sData: { students: [] as number[], teachers: [] as number[], total: [] as number[] },
      rangeInvalid: false,
    };
    if (!from || !to) return empty;
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return { ...empty, rangeInvalid: true };
    }
    const keys: string[] = [];
    if (interval === 'day') {
      for (let d = new Date(start); d <= end && keys.length < 370; d.setDate(d.getDate() + 1)) {
        keys.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
      }
    } else if (interval === 'month') {
      for (
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        d <= end && keys.length < 60;
        d.setMonth(d.getMonth() + 1)
      ) {
        keys.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
      }
    } else {
      for (let y = start.getFullYear(); y <= end.getFullYear() && keys.length < 20; y++) {
        keys.push(String(y));
      }
    }
    const label = (k: string) =>
      interval === 'day' ? `${k.slice(8)}/${k.slice(5, 7)}` : interval === 'month' ? 'T' + Number(k.slice(5)) : k;
    const title = (k: string) =>
      interval === 'day'
        ? `Ngày ${k.slice(8)}/${k.slice(5, 7)}/${k.slice(0, 4)}`
        : interval === 'month'
          ? `Tháng ${Number(k.slice(5))}/${k.slice(0, 4)}`
          : `Năm ${k}`;
    return {
      labels: keys.map(label),
      titles: keys.map(title),
      sData: {
        students: keys.map((k) => bucketMap.get(k)?.students ?? 0),
        teachers: keys.map((k) => bucketMap.get(k)?.teachers ?? 0),
        total: keys.map((k) => bucketMap.get(k)?.total ?? 0),
      },
      rangeInvalid: false,
    };
  }, [from, to, interval, bucketMap]);

  const applyPreset = (p: string) => {
    setPreset(p);
    setTo(today);
    if (p === '7d') setFrom(toISODate(daysAgo(6)));
    else if (p === '30d') setFrom(toISODate(daysAgo(29)));
    else if (p === '6m') setFrom(toISODate(monthsAgo(5)));
    else if (p === '12m') setFrom(toISODate(monthsAgo(11)));
    else if (p === 'ytd') setFrom(`${new Date().getFullYear()}-01-01`);
    else if (p === 'all') setFrom('2020-01-01');
    // 'custom' chỉ đánh dấu — giữ nguyên from/to hiện tại.
  };

  const toggle = (key: string) =>
    setActive((prev) => {
      const n = new Set(prev);
      if (n.has(key) && n.size === 1) return prev;
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const pctOf = (a?: number, b?: number) => (b ? Math.round(((a ?? 0) / b) * 100) : 0);

  const kpis = [
    {
      label: 'Học sinh',
      value: data?.totalStudents,
      sub: `${formatNumber(insights?.attention.unenrolledStudents)} chưa ghi danh lớp`,
      icon: Users,
      color: '#2563EB',
      path: '/admin?role=STUDENT',
    },
    {
      label: 'Giáo viên',
      value: data?.totalTeachers,
      sub: `${formatNumber(insights?.attention.inactiveTeachers)} đang bị khóa`,
      icon: BookOpen,
      color: '#16A34A',
      path: '/admin?role=TEACHER',
    },
    {
      label: 'Lớp học',
      value: data?.totalClasses,
      sub: `${formatNumber(data?.activeClasses)} đang mở · ${formatNumber(data?.inactiveClasses)} đã đóng`,
      icon: GraduationCap,
      color: '#D97706',
      path: '/admin/classes',
    },
    {
      label: 'Tài khoản mới · 7 ngày',
      value: insights?.activity.newUsers7d,
      sub: `Kỳ trước: ${formatNumber(insights?.activity.prevUsers7d)}`,
      icon: UserPlus,
      color: '#7C3AED',
      path: '',
      delta: insights ? insights.activity.newUsers7d - insights.activity.prevUsers7d : undefined,
    },
  ];

  const roleSlices: DonutSlice[] = [
    { label: 'Học sinh', value: data?.totalStudents ?? 0, color: '#2563EB' },
    { label: 'Giáo viên', value: data?.totalTeachers ?? 0, color: '#22C55E' },
    { label: 'Quản trị', value: data?.totalAdmins ?? 0, color: '#7C3AED' },
  ];

  const activeClassPct = pctOf(data?.activeClasses, data?.totalClasses);
  const avgPerClass = data?.activeClasses
    ? ((data?.totalEnrolledStudents ?? 0) / data.activeClasses).toFixed(1)
    : '—';

  const attentionRows = [
    {
      label: 'Lớp có giáo viên bị khóa',
      hint: 'Cần phân công lại giáo viên',
      value: insights?.attention.classesInactiveTeacher ?? 0,
      path: '/admin/classes',
    },
    {
      label: 'Lớp chưa có học sinh',
      hint: 'Ghi danh học sinh vào lớp',
      value: insights?.attention.classesNoStudents ?? 0,
      path: '/admin/classes',
    },
    {
      label: 'Học sinh chưa vào lớp',
      hint: 'Tài khoản đang hoạt động, chưa ghi danh',
      value: insights?.attention.unenrolledStudents ?? 0,
      path: '/admin?role=STUDENT',
    },
    {
      label: 'Giáo viên bị khóa',
      hint: 'Kiểm tra hoặc kích hoạt lại',
      value: insights?.attention.inactiveTeachers ?? 0,
      path: '/admin?role=TEACHER&status=INACTIVE',
    },
  ];
  const attentionTotal = attentionRows.reduce((s, r) => s + r.value, 0);
  const busy = overviewPending || insightsPending;
  const rankRows =
    rankTab === 'classes'
      ? (insights?.rankings.topClasses ?? []).map((c) => ({ name: c.name, sub: c.subject, value: c.students, unit: 'HS' }))
      : (insights?.rankings.topTeachers ?? []).map((t) => ({ name: t.name, sub: '', value: t.classes, unit: 'lớp' }));
  const maxRank = Math.max(1, ...rankRows.map((r) => r.value));
  const maxSubjectCount = Math.max(1, ...(insights?.subjects ?? []).map((s) => s.count));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
            {' · '}
            {overviewPending ? (
              <span className="text-[#D1D5DB]">đang tải số liệu…</span>
            ) : (
              <>{formatNumber(data?.totalUsers)} tài khoản · {formatNumber(data?.activeUsers)} đang hoạt động</>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const clickable = !!k.path;
          return (
            <div
              key={k.label}
              onClick={clickable ? () => navigate(k.path) : undefined}
              className={`card group flex items-start gap-3.5 p-4 ${
                clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: k.color + '14', color: k.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-[#6B7280]">{k.label}</span>
                  {clickable && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#6B7280]" />
                  )}
                </div>
                {busy ? (
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    <div className="h-6 w-16 animate-pulse rounded bg-[#F3F4F6]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[#F3F4F6]" />
                  </div>
                ) : (
                  <>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-extrabold leading-tight text-[#111827]">
                        {formatValue(k.value)}
                      </span>
                      {k.delta !== undefined && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            k.delta >= 0 ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                          }`}
                        >
                          {k.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {k.delta >= 0 ? '+' : ''}
                          {formatNumber(k.delta)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">{k.sub}</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#111827]">Tăng trưởng người dùng</h3>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {from && to
                  ? `${from.split('-').reverse().join('/')} → ${to.split('-').reverse().join('/')}`
                  : 'Tài khoản đăng ký'}
                {' · '}Gộp theo {INTERVALS.find((i) => i.key === interval)?.label.toLowerCase()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {seriesMeta.map((s) => {
                  const on = active.has(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => toggle(s.key)}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all"
                      style={{
                        borderColor: on ? s.color : '#E5E7EB',
                        background: on ? s.color + '15' : 'white',
                        color: on ? s.color : '#9CA3AF',
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: on ? s.color : '#D1D5DB' }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs font-medium text-[#374151]"
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  {PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]"
                  value={from}
                  max={to || today}
                  onChange={(e) => { setPreset('custom'); setFrom(e.target.value); }}
                />
                <span className="text-xs text-[#9CA3AF]">→</span>
                <input
                  type="date"
                  className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]"
                  value={to}
                  min={from || undefined}
                  max={today}
                  onChange={(e) => { setPreset('custom'); setTo(e.target.value); }}
                />
              </div>
            </div>
          </div>
          {rangeInvalid ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#9CA3AF]">
              Khoảng ngày không hợp lệ — ngày bắt đầu phải trước hoặc bằng ngày kết thúc
            </div>
          ) : labels.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#9CA3AF]">
              Hãy chọn khoảng thời gian để xem thống kê
            </div>
          ) : sData.total.every((v) => v === 0) ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#9CA3AF]">
              Chưa có người dùng mới trong khoảng thời gian này
            </div>
          ) : (
            <LineChart labels={labels} titles={titles} data={sData} active={active} />
          )}
      </div>

      <div className="card flex flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-[#111827]">Cần xử lý</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              insightsPending
                ? 'bg-[#F3F4F6] text-[#9CA3AF]'
                : attentionTotal
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#F0FDF4] text-[#16A34A]'
            }`}
          >
            {insightsPending ? '…' : attentionTotal ? `${formatNumber(attentionTotal)} mục` : 'Ổn định'}
          </span>
        </div>
        {insightsPending ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[46px] animate-pulse rounded-lg bg-[#F9FAFB]" />
            ))}
          </div>
        ) : (
        <div className="flex flex-col divide-y divide-[#F3F4F6]">
          {attentionRows.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => navigate(r.path)}
              className="group flex items-center gap-3 py-2.5 text-left"
            >
              {r.value ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
              )}
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-medium ${r.value ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                  {r.label}
                </div>
                <div className="truncate text-[11px] text-[#9CA3AF]">{r.hint}</div>
              </div>
              <span className={`text-sm font-bold ${r.value ? 'text-[#B45309]' : 'text-[#D1D5DB]'}`}>
                {formatNumber(r.value)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#6B7280]" />
            </button>
          ))}
        </div>
        )}
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[#F3F4F6] pt-3">
          <div className="rounded-lg bg-[#F9FAFB] px-3 py-2">
            <div className="text-[11px] text-[#9CA3AF]">Chưa từng đăng nhập</div>
            <div className="mt-0.5 text-sm font-bold text-[#111827]">
              {(insights?.activity.neverLoggedIn ?? -1) < 0 ? '—' : formatNumber(insights?.activity.neverLoggedIn)}
            </div>
          </div>
          <div className="rounded-lg bg-[#F9FAFB] px-3 py-2">
            <div className="text-[11px] text-[#9CA3AF]">Vắng mặt &gt; 30 ngày</div>
            <div className="mt-0.5 text-sm font-bold text-[#111827]">
              {(insights?.activity.staleUsers ?? -1) < 0 ? '—' : formatNumber(insights?.activity.staleUsers)}
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-[15px] font-bold text-[#111827]">Cơ cấu người dùng</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Donut slices={roleSlices} size={96} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-base font-extrabold leading-none text-[#111827]">
                  {formatValue(data?.totalUsers)}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">tài khoản</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {roleSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[#6B7280]">{s.label}</span>
                  </div>
                  {overviewPending ? (
                    <div className="h-3 w-10 animate-pulse rounded bg-[#F3F4F6]" />
                  ) : (
                    <span className="font-bold text-[#111827]">
                      {formatNumber(s.value)}
                      <span className="ml-1 font-normal text-[#9CA3AF]">{pctOf(s.value, data?.totalUsers)}%</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-[#F3F4F6] pt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Lớp đang mở</span>
              {overviewPending ? (
                <div className="h-3 w-16 animate-pulse rounded bg-[#F3F4F6]" />
              ) : (
                <span className="font-bold text-[#111827]">
                  {formatNumber(data?.activeClasses)}/{formatNumber(data?.totalClasses)}
                  <span className="ml-1 font-normal text-[#9CA3AF]">{activeClassPct}%</span>
                </span>
              )}
            </div>
            <div className="progress-bar-track h-1.5">
              <div className="progress-bar-fill" style={{ width: `${activeClassPct}%`, background: '#22C55E' }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#F9FAFB] px-3 py-2">
                <div className="text-[11px] text-[#9CA3AF]">Lượt ghi danh</div>
                <div className="mt-0.5 text-sm font-bold text-[#111827]">
                  {overviewPending ? <div className="h-4 w-10 animate-pulse rounded bg-[#E5E7EB]" /> : formatNumber(data?.totalEnrolledStudents)}
                </div>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] px-3 py-2">
                <div className="text-[11px] text-[#9CA3AF]">TB HS / lớp mở</div>
                <div className="mt-0.5 text-sm font-bold text-[#111827]">
                  {overviewPending ? <div className="h-4 w-10 animate-pulse rounded bg-[#E5E7EB]" /> : avgPerClass}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-[15px] font-bold text-[#111827]">Phân bố lớp theo môn</h3>
          <div className="flex flex-col gap-2.5">
            {insightsPending
              ? [0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-[#F9FAFB]" />
                ))
              : (insights?.subjects ?? []).map((s) => (
              <div key={s.subject}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="truncate text-[#6B7280]">{s.subject}</span>
                  <span className="font-bold text-[#111827]">{s.count}</span>
                </div>
                <div className="progress-bar-track h-1.5">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(s.count / maxSubjectCount) * 100}%`, background: '#2563EB' }}
                  />
                </div>
              </div>
            ))}
            {!insightsPending && !(insights?.subjects ?? []).length && (
              <p className="text-xs text-[#9CA3AF]">Chưa có lớp nào đang mở</p>
            )}
          </div>
          <p className="mt-4 text-[11px] text-[#9CA3AF]">Chỉ tính các lớp đang mở</p>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-bold text-[#111827]">Xếp hạng</h3>
            <div className="flex rounded-lg bg-[#F3F4F6] p-0.5">
              {([
                ['classes', 'Lớp đông'],
                ['teachers', 'Giáo viên'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRankTab(key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    rankTab === key ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#374151]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {insightsPending
              ? [0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-[#F9FAFB]" />
                ))
              : rankRows.map((r, i) => (
              <div key={`${r.name}-${i}`}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        i === 0 ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate text-[#374151]">{r.name}</span>
                    {r.sub && <span className="hidden truncate text-[11px] text-[#9CA3AF] sm:inline">{r.sub}</span>}
                  </span>
                  <span className="shrink-0 font-bold text-[#111827]">
                    {formatNumber(r.value)} <span className="font-normal text-[#9CA3AF]">{r.unit}</span>
                  </span>
                </div>
                <div className="progress-bar-track h-1">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(r.value / maxRank) * 100}%`, background: rankTab === 'classes' ? '#D97706' : '#16A34A' }}
                  />
                </div>
              </div>
            ))}
            {!insightsPending && !rankRows.length && <p className="text-xs text-[#9CA3AF]">Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useQuery({
    queryKey: ['statistics', 'teacher'],
    queryFn: async () => (await api.get('/statistics/teacher')).data,
  });
  const { data: classesRaw } = useQuery({
    queryKey: ['dashboard-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const { data: assignmentsRaw } = useQuery({
    queryKey: ['dashboard-assignments'],
    queryFn: async () => (await api.get('/assignments')).data,
  });
  const classes = Array.isArray(classesRaw) ? classesRaw : classesRaw?.data ?? [];
  const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.data ?? [];

  const statCards = [
    {
      label: 'Lớp đang dạy',
      value: stats?.totalClasses ?? classes.length,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    { label: 'Tổng học sinh', value: stats?.totalStudents, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Chờ chấm điểm', value: stats?.pendingSubmissions, color: '#F59E0B', bg: '#FFFBEB' },
    {
      label: 'Bài tập đang mở',
      value: stats?.totalAssignments ?? assignments.length,
      color: '#22C55E',
      bg: '#F0FDF4',
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Xin chào, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Bạn có {stats?.pendingSubmissions ?? 0} bài nộp chờ chấm điểm hôm nay
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="font-display text-[28px] font-extrabold" style={{ color: s.color }}>
              {formatValue(s.value)}
            </div>
            <div className="mt-1 text-sm text-[#6B7280]">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-4">Chức năng giáo viên</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Lớp của tôi', desc: 'Xem danh sách lớp và học sinh', icon: GraduationCap, color: '#2563EB', path: '/classes' },
            { title: 'Ngân hàng câu hỏi', desc: 'Quản lý câu hỏi trắc nghiệm', icon: FileQuestion, color: '#F59E0B', path: '/questions' },
            { title: 'Soạn bài', desc: 'Biên soạn chương và bài học', icon: Pencil, color: '#22C55E', path: '/curriculum' },
            { title: 'Giao bài tập', desc: 'Tạo bài tập và giao cho lớp', icon: ClipboardList, color: '#7C3AED', path: '/assignments' },
            { title: 'Giáo trình học sinh', desc: 'Theo dõi tiến độ học sinh', icon: BookOpen, color: '#14B8A6', path: '/progress' },
            { title: 'Góp ý từ học sinh', desc: 'Xem góp ý và phản hồi', icon: MessageCircle, color: '#EF4444', path: '/feedback' },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className="card cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate(a.path)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ background: a.color + '15', color: a.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-[#2563EB]">Mở →</span>
                </div>
                <div className="font-display text-base font-bold text-[#111827]">{a.title}</div>
                <div className="text-sm text-[#6B7280]">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ['statistics', 'student'],
    queryFn: async () => (await api.get('/statistics/student')).data,
  });
  const { data: classesRaw } = useQuery({
    queryKey: ['dashboard-student-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const classes = Array.isArray(classesRaw) ? classesRaw : classesRaw?.data ?? [];

  const statCards = [
    {
      label: 'Lớp đã đăng ký',
      value: stats?.totalClasses ?? classes.length,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    { label: 'Bài tập chờ nộp', value: stats?.pendingAssignments, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Điểm trung bình', value: stats?.averageScore, color: '#22C55E', bg: '#F0FDF4' },
    {
      label: 'Tiến độ tổng',
      value: stats?.overallProgress ? `${stats.overallProgress}%` : '—',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Xin chào, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Bạn có {stats?.pendingAssignments ?? 0} bài tập cần hoàn thành. Cố lên nhé!
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: s.bg }}>
              <span className="font-display text-xl font-extrabold" style={{ color: s.color }}>
                {formatValue(s.value).slice(0, 3)}
              </span>
            </div>
            <div>
              <div className="font-display text-xl font-extrabold" style={{ color: s.color }}>
                {formatValue(s.value)}
              </div>
              <div className="text-xs text-[#6B7280]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-4">Lớp học của tôi</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.slice(0, 4).map((cls: any) => (
            <div
              key={cls.id}
              className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0FDF4] text-xl font-extrabold text-[#22C55E] font-display">
                  {cls.name?.[0] ?? 'L'}
                </div>
                <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">
                  0 bài tập
                </span>
              </div>
              <div className="font-display text-base font-bold text-[#111827]">{cls.name}</div>
              <div className="mb-4 text-xs text-[#6B7280]">GV: {cls.teacher?.fullName ?? '—'}</div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-[#6B7280]">
                  <span>Tiến độ</span>
                  <span className="font-semibold text-[#22C55E]">{stats?.overallProgress ?? 0}%</span>
                </div>
                <div className="progress-bar-track h-1.5">
                  <div className="progress-bar-fill bg-[#22C55E]" style={{ width: `${stats?.overallProgress ?? 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-10">Đang tải...</div>
      </DashboardLayout>
    );
  }
  if (user.role === 'STUDENT') {
    return <Navigate to="/student/classes" replace />;
  }
  return (
    <DashboardLayout>
      {user.role === 'ADMIN' ? <AdminDashboard /> : <TeacherDashboard />}
    </DashboardLayout>
  );
}
