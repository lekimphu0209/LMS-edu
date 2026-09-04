import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, BarChart3, BookOpen, Shield, FileQuestion, ClipboardList, Pencil, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

type SeriesKey = 'students' | 'teachers' | 'classes';

const allMonths = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const allData: Record<SeriesKey, number[]> = {
  students: [940, 980, 1020, 1055, 1090, 1130, 1170, 1215, 1248, 1280, 1310, 1340],
  teachers: [68, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92],
  classes: [88, 95, 99, 104, 108, 113, 118, 121, 124, 128, 132, 136],
};

const seriesMeta: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'students', label: 'Học sinh', color: '#2563EB' },
  { key: 'teachers', label: 'Giáo viên', color: '#22C55E' },
  { key: 'classes', label: 'Lớp học', color: '#F59E0B' },
];

const formatNumber = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');
const formatValue = (v: string | number | undefined) => (v === undefined ? '—' : String(v));

interface LineChartProps {
  months: string[];
  data: Record<SeriesKey, number[]>;
  active: Set<string>;
}

function LineChart({ months, data, active }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 700;
  const H = 240;
  const padL = 12;
  const padR = 40;
  const padT = 20;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = months.length;
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
        {months.map((m, i) => (
          <text key={m} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9CA3AF">
            {m}
          </text>
        ))}
        {months.map((_, i) => (
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
          <div className="mb-2 text-xs font-bold text-[#374151]">{months[hovered]} / 2026</div>
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

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['statistics', 'admin'],
    queryFn: async () => (await api.get('/statistics/admin')).data,
  });
  const [range, setRange] = useState(8);
  const [active, setActive] = useState<Set<string>>(new Set(['students', 'teachers', 'classes']));
  const months = useMemo(() => allMonths.slice(0, range), [range]);
  const sData = useMemo(
    () => ({
      students: allData.students.slice(0, range),
      teachers: allData.teachers.slice(0, range),
      classes: allData.classes.slice(0, range),
    }),
    [range],
  );
  const toggle = (key: string) =>
    setActive((prev) => {
      const n = new Set(prev);
      if (n.has(key) && n.size === 1) return prev;
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const statCards = [
    {
      label: 'Tổng học sinh',
      value: data?.totalStudents,
      change: '+32 tháng này',
      icon: Users,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      label: 'Tổng giáo viên',
      value: data?.totalTeachers,
      change: '+4 tháng này',
      icon: Users,
      color: '#22C55E',
      bg: '#F0FDF4',
    },
    {
      label: 'Tổng lớp học',
      value: data?.totalClasses,
      change: 'đang hoạt động',
      icon: GraduationCap,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      label: 'Tỉ lệ hoàn thành TB',
      value: data?.completionRate,
      change: '+3.2% so với tháng trước',
      icon: BarChart3,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  const summary = [
    {
      title: 'Quản trị viên',
      color: '#7C3AED',
      icon: Shield,
      items: [
        { label: 'Quản lý lớp học', value: `${formatNumber(data?.totalClasses)} lớp` },
        { label: 'Quản lý giáo viên', value: `${formatNumber(data?.totalTeachers)} người` },
        { label: 'Quản lý học sinh', value: `${formatNumber(data?.totalStudents)} người` },
      ],
    },
    {
      title: 'Giáo viên',
      color: '#2563EB',
      icon: BookOpen,
      items: [
        { label: 'Đang dạy', value: `${formatNumber(data?.totalTeachers)} giáo viên` },
        { label: 'Tổng bài tập đã giao', value: `${formatNumber(data?.totalAssignments)} bài` },
        { label: 'Bài chờ chấm điểm', value: `${formatNumber(data?.pendingSubmissions)} bài` },
      ],
    },
    {
      title: 'Học sinh',
      color: '#22C55E',
      icon: Users,
      items: [
        { label: 'Đang học', value: `${formatNumber(data?.totalStudents)} học sinh` },
        { label: 'Bài tập chờ nộp', value: `${formatNumber(data?.pendingAssignments)} bài` },
        { label: 'Tỉ lệ hoàn thành TB', value: `${data?.completionRate ?? '—'}` },
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Chào mừng trở lại! Hôm nay là{' '}
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="stat-card relative overflow-hidden">
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: c.bg, color: c.color }}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-gray-100 bg-[#F9FAFB] px-2 py-0.5 text-[11px] text-[#6B7280]">
                ↑ Tháng này
              </span>
            </div>
            <div className="font-display text-[30px] font-extrabold leading-none text-[#111827]">
              {formatValue(c.value)}
            </div>
            <div className="mt-1 text-sm text-[#6B7280]">{c.label}</div>
            <div className="mt-2 text-xs font-medium" style={{ color: c.color }}>
              {c.change}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="section-title">Thống kê tăng trưởng hệ thống</h3>
            <p className="text-xs text-[#9CA3AF]">Số liệu theo tháng trong năm 2026</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {seriesMeta.map((s) => {
              const on = active.has(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
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
            <div className="flex rounded-[10px] bg-[#F3F4F6] p-1">
              {[3, 6, 12].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    range === r
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#9CA3AF] hover:text-[#374151]'
                  }`}
                >
                  {r === 3 ? '3 tháng' : r === 6 ? '6 tháng' : '12 tháng'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <LineChart months={months} data={sData} active={active} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="card p-6" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="mb-4 flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                  style={{ background: s.color + '15', color: s.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-[15px] font-bold text-[#111827]">{s.title}</div>
                  <div className="text-xs text-[#9CA3AF]">Tóm tắt</div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {s.items.map((i) => (
                  <div key={i.label} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-3 py-2">
                    <span className="text-xs text-[#374151]">{i.label}</span>
                    <span className="text-xs font-bold text-[#111827]">{i.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
    queryKey: ['teacher-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const { data: assignmentsRaw } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: async () => (await api.get('/assignments')).data,
  });
  const classes = Array.isArray(classesRaw) ? classesRaw : [];
  const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : [];

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
        <h1 className="page-title">Xin chào, {user?.fullName}! 👋</h1>
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
            { title: 'Góp ý từ học sinh', desc: 'Xem bài nộp và đánh giá', icon: MessageCircle, color: '#EF4444', path: '/submissions' },
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Lớp học của tôi</h2>
            <button className="btn-ghost py-1.5 text-xs" onClick={() => navigate('/classes')}>
              Xem tất cả →
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.slice(0, 4).map((cls: any) => (
              <div
                key={cls.id}
                className="card cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-lg font-extrabold text-[#2563EB] font-display">
                    {cls.name?.[0] ?? 'L'}
                  </div>
                  <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">
                    0 chờ chấm
                  </span>
                </div>
                <div className="font-display text-base font-bold text-[#111827]">{cls.name}</div>
                <div className="text-sm text-[#6B7280]">{cls.subject || 'Môn học'}</div>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-[#6B7280]">
                  <Users className="h-4 w-4" /> {cls._count?.students ?? cls.students ?? 0} học sinh
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Bài tập gần đây</h2>
            <button className="btn-ghost py-1.5 text-xs" onClick={() => navigate('/assignments')}>
              Tất cả
            </button>
          </div>
          <div className="card overflow-hidden">
            {assignments.slice(0, 3).map((a: any, i: number) => (
              <div
                key={a.id ?? i}
                className={`p-5 ${i < 2 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="mb-1.5 flex justify-between">
                  <div className="text-sm font-semibold text-[#111827]">{a.title}</div>
                  <span className="text-xs text-[#6B7280]">
                    {a.assignedTo?.length ?? 0}/{a.assignedTo?.length ?? 0}
                  </span>
                </div>
                <div className="mb-3 text-xs text-[#6B7280]">
                  {a.class?.name ?? ''} · Hạn:{' '}
                  {a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '—'}
                </div>
                <div className="progress-bar-track h-1.5">
                  <div className="progress-bar-fill" style={{ width: '0%' }} />
                </div>
                <div className="mt-1 text-[11px] text-[#9CA3AF]">0% đã nộp</div>
              </div>
            ))}
            <div className="p-5">
              <button className="btn-primary w-full py-2.5 text-xs" onClick={() => navigate('/assignments')}>
                + Giao bài tập mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useQuery({
    queryKey: ['statistics', 'student'],
    queryFn: async () => (await api.get('/statistics/student')).data,
  });
  const { data: classesRaw } = useQuery({
    queryKey: ['student-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const classes = Array.isArray(classesRaw) ? classesRaw : [];

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
        <h1 className="page-title">Xin chào, {user?.fullName}! 🎓</h1>
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
              className="card cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => navigate(`/classes/${cls.id}`)}
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
  return (
    <DashboardLayout>
      {user.role === 'ADMIN' ? <AdminDashboard /> : user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />}
    </DashboardLayout>
  );
}
