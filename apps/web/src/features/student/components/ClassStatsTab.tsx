import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Flame,
  LineChart as LineChartIcon,
  Target,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurriculumSection } from '@/data/student';

// ── Time helpers ──────────────────────────────────────────────────

const DAY = 86400000;

const RANGES = [
  { id: '7d', label: '7 ngày', days: 7 },
  { id: '30d', label: '30 ngày', days: 30 },
  { id: '90d', label: '3 tháng', days: 90 },
  { id: 'all', label: 'Toàn bộ thời gian', days: 0 },
  { id: 'custom', label: 'Tùy chỉnh', days: 0 },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

const CHART_KINDS = [
  { id: 'bar', label: 'Cột', Icon: BarChart3 },
  { id: 'line', label: 'Đường', Icon: LineChartIcon },
] as const;

type ChartKind = (typeof CHART_KINDS)[number]['id'];
type Metric = 'score' | 'time';
type Gran = 'day' | 'week' | 'month';
type Win = { start: number | null; end: number | null };

const ts = (s: CurriculumSection) => (s.completedAt ? new Date(s.completedAt).getTime() : null);

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(t: number, n: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

function startOfWeek(t: number) {
  const d = new Date(startOfDay(t));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

function startOfMonth(t: number) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const pad = (n: number) => String(n).padStart(2, '0');

function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDM(t: number) {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function fmtDMY(t: number) {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${min}p`;
  return m ? `${h}h ${m}p` : `${h}h`;
}

function getWindow(range: RangeId, from: string, to: string, now: number): Win {
  if (range === 'all') return { start: null, end: null };
  if (range === 'custom') {
    return {
      start: from ? new Date(`${from}T00:00:00`).getTime() : null,
      end: to ? new Date(`${to}T23:59:59.999`).getTime() : null,
    };
  }
  const days = RANGES.find((r) => r.id === range)?.days ?? 0;
  return { start: addDays(startOfDay(now), -(days - 1)), end: now };
}

function prevWindow(w: Win): Win | null {
  if (w.start === null || w.end === null) return null;
  const len = w.end - w.start;
  return { start: w.start - len - 1, end: w.start - 1 };
}

function inWindow(s: CurriculumSection, w: Win) {
  if (w.start === null && w.end === null) return true;
  const t = ts(s);
  if (t === null) return false;
  return (w.start === null || t >= w.start) && (w.end === null || t <= w.end);
}

function summarize(items: CurriculumSection[]) {
  const scored = items.filter((s) => s.score !== null);
  const avg = scored.length ? scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length : null;
  const time = items.reduce((a, s) => a + (s.timeMin ?? 0), 0);
  return { count: items.length, scored, avg, time };
}

export interface Bucket {
  key: string;
  label: string;
  fullLabel: string;
  count: number;
  avg: number | null;
  time: number;
}

function buildBuckets(items: CurriculumSection[], w: Win, now: number): { gran: Gran; buckets: Bucket[] } {
  const times = items.map(ts).filter((t): t is number => t !== null);
  if (!times.length && (w.start === null || w.end === null)) return { gran: 'day', buckets: [] };
  const end = w.end ?? Math.max(now, ...times);
  const start = w.start ?? (times.length ? Math.min(...times) : addDays(end, -30));
  const span = (end - start) / DAY;
  const gran: Gran = span <= 31 ? 'day' : span <= 140 ? 'week' : 'month';
  const floor = gran === 'day' ? startOfDay : gran === 'week' ? startOfWeek : startOfMonth;
  const next = (t: number) => {
    if (gran === 'day') return addDays(t, 1);
    if (gran === 'week') return addDays(t, 7);
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  };

  const buckets: Bucket[] = [];
  for (let cur = floor(start); cur <= end && buckets.length < 60; cur = next(cur)) {
    const nx = next(cur);
    const inB = items.filter((s) => {
      const t = ts(s);
      return t !== null && t >= cur && t < nx;
    });
    const sc = inB.filter((s) => s.score !== null);
    const d = new Date(cur);
    buckets.push({
      key: String(cur),
      label: gran === 'month' ? `Th${d.getMonth() + 1}` : fmtDM(cur),
      fullLabel:
        gran === 'day'
          ? fmtDMY(cur)
          : gran === 'week'
            ? `Tuần ${fmtDM(cur)} – ${fmtDM(addDays(nx, -1))}`
            : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
      count: inB.length,
      avg: sc.length ? sc.reduce((a, s) => a + (s.score ?? 0), 0) / sc.length : null,
      time: inB.reduce((a, s) => a + (s.timeMin ?? 0), 0),
    });
  }
  return { gran, buckets };
}

function activityByDay(items: CurriculumSection[]) {
  const map = new Map<string, { min: number; count: number }>();
  items.forEach((s) => {
    const t = ts(s);
    if (t === null) return;
    const k = dayKey(t);
    const v = map.get(k) ?? { min: 0, count: 0 };
    v.min += s.timeMin ?? 0;
    v.count += 1;
    map.set(k, v);
  });
  return map;
}

function streaks(activity: Map<string, unknown>, now: number) {
  let current = 0;
  let cursor = startOfDay(now);
  if (!activity.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (activity.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const days = [...activity.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  days.forEach((k) => {
    const t = new Date(`${k}T00:00:00`).getTime();
    run = prev !== null && dayKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  });
  return { current, best };
}

export function scoreBandColor(score: number) {
  return score >= 8 ? '#22C55E' : score >= 6.5 ? '#F59E0B' : '#EF4444';
}

type Delta = { text: string; dir: 'up' | 'down' | 'flat'; good: boolean } | null;

function mkDelta(cur: number | null, prev: number | null, fmt: (v: number) => string, upIsGood = true): Delta {
  if (cur === null || prev === null) return null;
  if (prev === 0 && cur > 0) return { text: 'Mới', dir: 'up', good: upIsGood };
  const diff = cur - prev;
  if (Math.abs(diff) < 1e-9) return { text: '0', dir: 'flat', good: true };
  const dir = diff > 0 ? 'up' : 'down';
  return { text: `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}`, dir, good: (diff > 0) === upIsGood };
}

// ── Main ──────────────────────────────────────────────────────────

export default function ClassStatsTab({ sections }: { sections: CurriculumSection[] }) {
  const [range, setRange] = useState<RangeId>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [chartKind, setChartKind] = useState<ChartKind>('bar');
  const [metric, setMetric] = useState<Metric>('score');

  const now = Date.now();
  const done = sections.filter((s) => s.done);
  const progressPct = sections.length ? Math.round((done.length / sections.length) * 100) : 0;

  const win = getWindow(range, customFrom, customTo, now);
  const prevWin = prevWindow(win);
  const cur = summarize(done.filter((s) => inWindow(s, win)));
  const prev = prevWin ? summarize(done.filter((s) => inWindow(s, prevWin))) : null;
  const curItems = done.filter((s) => inWindow(s, win));
  const { gran, buckets } = buildBuckets(curItems, win, now);
  const activity = activityByDay(done);
  const streak = streaks(activity, now);

  const granLabel = gran === 'day' ? 'ngày' : gran === 'week' ? 'tuần' : 'tháng';
  const kpis: KpiProps[] = [
    {
      label: 'Điểm trung bình',
      value: cur.avg !== null ? cur.avg.toFixed(1) : '—',
      unit: cur.avg !== null ? '/10' : '',
      color: '#2563EB',
      icon: Target,
      delta: mkDelta(cur.avg, prev?.avg ?? null, (v) => v.toFixed(1)),
    },
    {
      label: 'Bài hoàn thành',
      value: String(cur.count),
      unit: 'bài',
      note:
        cur.count > cur.scored.length ? `${cur.count - cur.scored.length} chưa chấm` : undefined,
      color: '#22C55E',
      icon: CheckCircle2,
      delta: mkDelta(cur.count, prev?.count ?? null, (v) => String(v)),
    },
    {
      label: 'Thời gian học',
      value: fmtDuration(cur.time),
      unit: '',
      note: cur.count ? `Trung bình ${Math.round(cur.time / cur.count)}p mỗi bài` : undefined,
      color: '#7C3AED',
      icon: Clock3,
      delta: mkDelta(cur.time, prev?.time ?? null, fmtDuration),
    },
    {
      label: 'Ngày học liên tiếp',
      value: String(streak.current),
      unit: 'ngày',
      color: '#F97316',
      icon: Flame,
      delta: null,
      note: streak.best > streak.current ? `Kỷ lục ${streak.best}` : undefined,
    },
  ];

  const bands = [
    { name: 'Giỏi', range: '≥ 8', color: '#22C55E', value: cur.scored.filter((s) => (s.score ?? 0) >= 8).length },
    {
      name: 'Khá',
      range: '6.5 – 8',
      color: '#F59E0B',
      value: cur.scored.filter((s) => (s.score ?? 0) >= 6.5 && (s.score ?? 0) < 8).length,
    },
    { name: 'Yếu', range: '< 6.5', color: '#EF4444', value: cur.scored.filter((s) => (s.score ?? 0) < 6.5).length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Thanh công cụ: tiến độ (toàn khóa) + bộ lọc thời gian */}
      <div
        className="card"
        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#111827' }}>
          <BookOpen size={16} color="#2563EB" strokeWidth={2.2} />
          Tiến độ giáo trình
        </span>
        <div style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3B82F6, #22C55E)',
                borderRadius: 99,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>
            <b style={{ color: '#111827' }}>{progressPct}%</b> · {done.length}/{sections.length} mục
          </span>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <RangePicker
            range={range}
            from={customFrom}
            to={customTo}
            onChange={(r, f = '', t = '') => {
              setRange(r);
              if (r === 'custom') {
                setCustomFrom(f);
                setCustomTo(t);
              }
            }}
          />
        </span>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Xu hướng */}
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Xu hướng
            </h3>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>Theo {granLabel}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Segmented
              options={[
                { id: 'score', label: 'Điểm số', Icon: Target },
                { id: 'time', label: 'Thời gian', Icon: Clock3 },
              ]}
              value={metric}
              onChange={(v) => setMetric(v as Metric)}
            />
            <Segmented
              options={CHART_KINDS.map((k) => ({ id: k.id, label: k.label, Icon: k.Icon }))}
              value={chartKind}
              onChange={(v) => setChartKind(v as ChartKind)}
              subtle
            />
          </div>
        </div>
        <TrendChart
          buckets={buckets}
          metric={metric}
          kind={chartKind}
          avgScore={cur.avg}
          granLabel={granLabel}
        />
      </div>

      {/* Heatmap + phân bố */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              Hoạt động học tập
            </h3>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{HEATMAP_WEEKS} tuần gần nhất</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Heatmap activity={activity} now={now} />
          </div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              Phân bố điểm
            </h3>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>Theo bài đã chấm</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%' }}>
              <Distribution bands={bands} total={cur.scored.length} />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="card" style={{ padding: 24 }}>
        <h3 className="section-title" style={{ margin: '0 0 14px' }}>
          Danh sách bài
        </h3>
        <DetailTable items={curItems} />
      </div>
    </div>
  );
}

// ── UI primitives ─────────────────────────────────────────────────

const inputStyle = {
  fontSize: 11.5,
  fontWeight: 500,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  color: '#374151',
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FFFFFF',
} as const;

const tooltipBox = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 12,
  color: '#374151',
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
} as const;

function Segmented({
  options,
  value,
  onChange,
  subtle,
}: {
  options: { id: string; label: string; Icon?: LucideIcon }[];
  value: string;
  onChange: (v: string) => void;
  subtle?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 10, padding: 3 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? (subtle ? '#FFFFFF' : '#2563EB') : 'transparent',
              color: active ? (subtle ? '#111827' : '#FFFFFF') : '#6B7280',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {o.Icon && <o.Icon size={14} strokeWidth={2.2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Range picker (segmented: every option visible) ────────────────

function RangePicker({
  range,
  from,
  to,
  onChange,
}: {
  range: RangeId;
  from: string;
  to: string;
  onChange: (r: RangeId, from?: string, to?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(from);
    setDraftTo(to);
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, from, to]);

  const pill = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    border: 'none',
    borderRadius: 8,
    background: active ? '#FFFFFF' : 'transparent',
    color: active ? '#111827' : '#6B7280',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          gap: 2,
          background: '#F3F4F6',
          borderRadius: 10,
          padding: 3,
          overflowX: 'auto',
        }}
      >
        {RANGES.filter((r) => r.id !== 'custom').map((r) => (
          <button
            key={r.id}
            aria-pressed={range === r.id}
            onClick={() => {
              onChange(r.id);
              setOpen(false);
            }}
            style={pill(range === r.id)}
          >
            {r.id === 'all' ? 'Toàn bộ' : r.label}
          </button>
        ))}
        <button
          aria-pressed={range === 'custom'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={pill(range === 'custom')}
        >
          <Calendar size={13} strokeWidth={2.2} />
          Tùy chỉnh
        </button>
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 30,
            width: 220,
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            padding: 6,
          }}
        >
          <div style={{ padding: '6px 10px 8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                fontWeight: 700,
                color: range === 'custom' ? '#1D4ED8' : '#6B7280',
                marginBottom: 8,
              }}
            >
              Tùy chỉnh
              {range === 'custom' && <Check size={15} strokeWidth={2.6} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <label style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', flexDirection: 'column', gap: 4 }}>
                Từ ngày
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo || undefined}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', flexDirection: 'column', gap: 4 }}>
                Đến ngày
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(e) => setDraftTo(e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </label>
            </div>
            <button
              disabled={!draftFrom && !draftTo}
              onClick={() => {
                onChange('custom', draftFrom, draftTo);
                setOpen(false);
              }}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '8px 0',
                border: 'none',
                borderRadius: 8,
                background: !draftFrom && !draftTo ? '#E5E7EB' : '#2563EB',
                color: !draftFrom && !draftTo ? '#9CA3AF' : '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: !draftFrom && !draftTo ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI ───────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: LucideIcon;
  delta: Delta;
  note?: string;
}

function KpiCard({ label, value, unit, color, icon: Icon, delta, note }: KpiProps) {
  const deltaColor = !delta || delta.dir === 'flat' ? '#6B7280' : delta.good ? '#16A34A' : '#DC2626';
  const deltaBg = !delta || delta.dir === 'flat' ? '#F3F4F6' : delta.good ? '#F0FDF4' : '#FEF2F2';
  return (
    <div
      className="card"
      style={{
        padding: '18px 20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            color: '#6B7280',
            minWidth: 0,
          }}
        >
          <Icon size={15} color={color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
          <span
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </span>
        {delta && (
          <span
            title="So với kỳ trước"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '3px 8px',
              borderRadius: 99,
              background: deltaBg,
              color: deltaColor,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {delta.dir === 'up' && <ArrowUp size={12} strokeWidth={2.6} />}
            {delta.dir === 'down' && <ArrowDown size={12} strokeWidth={2.6} />}
            {delta.text}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <b
          style={{
            fontSize: 24,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontVariantNumeric: 'tabular-nums',
            color,
            lineHeight: 1.1,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </b>
        {unit && (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: '#9CA3AF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, minHeight: 15, marginTop: -4 }}>
        {note}
      </div>
    </div>
  );
}

// ── Trend chart (Canvas / Khan Academy style) ─────────────────────

function TrendTooltip({ active, payload, metric }: { active?: boolean; payload?: any[]; metric: Metric }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload as Bucket;
  return (
    <div style={tooltipBox}>
      <b style={{ color: '#111827' }}>{b.fullLabel}</b>
      {metric === 'score' ? (
        <>
          <span>
            Điểm TB: <b>{b.avg !== null ? b.avg.toFixed(1) : '—'}</b>
          </span>
        </>
      ) : (
        <span>
          Thời gian: <b style={{ color: '#7C3AED' }}>{fmtDuration(b.time)}</b>
        </span>
      )}
      <span style={{ color: '#9CA3AF' }}>{b.count} bài</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6B7280' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function TrendChart({
  buckets,
  metric,
  kind,
  avgScore,
  granLabel,
}: {
  buckets: Bucket[];
  metric: Metric;
  kind: ChartKind;
  avgScore: number | null;
  granLabel: string;
}) {
  const data = buckets.filter((b) => b.count > 0);
  if (!data.length) {
    return (
      <div
        style={{
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          color: '#9CA3AF',
        }}
      >
        Chưa có hoạt động trong khoảng thời gian này.
      </div>
    );
  }
  const active = data.filter((b) => b.time > 0);
  const avgTime = active.length ? Math.round(active.reduce((a, b) => a + b.time, 0) / active.length) : 0;
  const showLabels = data.length <= 16;
  const isScore = metric === 'score';
  const refValue = isScore ? avgScore : avgTime || null;
  const refLabel = isScore ? `TB ${avgScore?.toFixed(1)}` : `TB ${avgTime}p/${granLabel}`;

  return (
    <>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isScore ? '#3B82F6' : '#7C3AED'} stopOpacity={0.22} />
                <stop offset="100%" stopColor={isScore ? '#3B82F6' : '#7C3AED'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis
              domain={isScore ? [0, 10] : [0, 'auto']}
              ticks={isScore ? [0, 2, 4, 6, 8, 10] : undefined}
              tick={{ fontSize: 10.5, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={
                isScore
                  ? undefined
                  : (v: number) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}p`)
              }
            />
            <Tooltip content={<TrendTooltip metric={metric} />} cursor={{ fill: '#F9FAFB' }} />
            {refValue !== null && (
              <ReferenceLine
                y={refValue}
                stroke="#94A3B8"
                strokeDasharray="5 4"
                label={{ value: refLabel, position: 'insideTopRight', fontSize: 10.5, fontWeight: 700, fill: '#64748B' }}
              />
            )}
            {kind === 'bar' ? (
              <Bar
                dataKey={isScore ? 'avg' : 'time'}
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
                fill="#7C3AED"
                isAnimationActive={false}
              >
                {isScore &&
                  data.map((b) => <Cell key={b.key} fill={b.avg !== null ? scoreBandColor(b.avg) : '#E5E7EB'} />)}
                {showLabels && (
                  <LabelList
                    dataKey={isScore ? 'avg' : 'time'}
                    position="top"
                    formatter={(v: any) =>
                      v === null || v === undefined || v === 0 ? '' : isScore ? Number(v).toFixed(1) : `${v}p`
                    }
                    style={{ fontSize: 10.5, fontWeight: 700, fill: '#374151' }}
                  />
                )}
              </Bar>
            ) : (
              <Area
                type="monotone"
                dataKey={isScore ? 'avg' : 'time'}
                stroke={isScore ? '#3B82F6' : '#7C3AED'}
                strokeWidth={2.2}
                fill="url(#trend-area)"
                connectNulls
                dot={{ r: 3.5, strokeWidth: 0, fill: isScore ? '#3B82F6' : '#7C3AED' }}
                activeDot={{ r: 5.5 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {isScore && kind === 'bar' && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <LegendDot color="#22C55E" label="Giỏi ≥ 8" />
          <LegendDot color="#F59E0B" label="Khá 6.5–8" />
          <LegendDot color="#EF4444" label="Yếu < 6.5" />
        </div>
      )}
    </>
  );
}

// ── Heatmap (GitHub contributions style) ──────────────────────────

const HEATMAP_WEEKS = 20;
const CELL = 13;
const GAP = 3;
const HEAT_COLORS = ['#F3F4F6', '#DDD6FE', '#C4B5FD', '#A78BFA', '#7C3AED'];
const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function heatLevel(min: number) {
  if (min <= 0) return 0;
  if (min <= 20) return 1;
  if (min <= 40) return 2;
  if (min <= 60) return 3;
  return 4;
}

function Heatmap({ activity, now }: { activity: Map<string, { min: number; count: number }>; now: number }) {
  const today = startOfDay(now);
  const gridStart = addDays(startOfWeek(today), -(HEATMAP_WEEKS - 1) * 7);
  const cols = Array.from({ length: HEATMAP_WEEKS }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => addDays(gridStart, c * 7 + r)),
  );
  const monthLabels = cols.map((col, c) => {
    const m = new Date(col[0]).getMonth();
    const prevM = c > 0 ? new Date(cols[c - 1][0]).getMonth() : -1;
    return m !== prevM ? `Th${m + 1}` : '';
  });
  const width = HEATMAP_WEEKS * (CELL + GAP);

  return (
    <div style={{ width: 'fit-content', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `14px repeat(7, ${CELL}px)`,
            rowGap: GAP,
            fontSize: 9.5,
            color: '#9CA3AF',
          }}
        >
          <span />
          {['T2', '', 'T4', '', 'T6', '', 'CN'].map((d, i) => (
            <span key={i} style={{ lineHeight: `${CELL}px` }}>
              {d}
            </span>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ position: 'relative', height: 14, width, fontSize: 9.5, color: '#9CA3AF' }}>
            {monthLabels.map(
              (l, c) =>
                l && (
                  <span key={c} style={{ position: 'absolute', left: c * (CELL + GAP) }}>
                    {l}
                  </span>
                ),
            )}
          </div>
          <div style={{ display: 'flex', gap: GAP, marginTop: GAP }}>
            {cols.map((col, c) => (
              <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {col.map((t, r) => {
                  if (t > today) return <div key={r} style={{ width: CELL, height: CELL }} />;
                  const a = activity.get(dayKey(t));
                  const lv = heatLevel(a?.min ?? 0);
                  return (
                    <div
                      key={r}
                      title={`${WEEKDAYS[r]}, ${fmtDMY(t)}: ${a ? `${a.min} phút · ${a.count} bài` : 'không có hoạt động'}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: HEAT_COLORS[lv],
                        outline: t === today ? '1.5px solid #111827' : 'none',
                        outlineOffset: 1,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          marginTop: 12,
          fontSize: 10.5,
          color: '#9CA3AF',
        }}
      >
        Ít
        {HEAT_COLORS.map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
        ))}
        Nhiều
      </div>
    </div>
  );
}

// ── Distribution ──────────────────────────────────────────────────

function Distribution({
  bands,
  total,
}: {
  bands: { name: string; range: string; color: string; value: number }[];
  total: number;
}) {
  if (!total) {
    return (
      <div
        style={{
          height: 168,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          color: '#9CA3AF',
        }}
      >
        Chưa có bài nào được chấm trong khoảng thời gian này.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 168, height: 168, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={bands.filter((b) => b.value > 0)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={3}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={false}
            >
              {bands
                .filter((b) => b.value > 0)
                .map((b) => (
                  <Cell key={b.name} fill={b.color} />
                ))}
            </Pie>
            <Tooltip
              formatter={(v: any, name: any) => [`${v} bài`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <b
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontVariantNumeric: 'tabular-nums',
              color: '#111827',
              lineHeight: 1.1,
            }}
          >
            {total}
          </b>
          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500 }}>bài đã chấm</span>
        </div>
      </div>
      <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bands.map((b) => {
          const pct = Math.round((b.value / total) * 100);
          return (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3.5, background: b.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13 }}>
                <b style={{ color: '#111827' }}>{b.name}</b>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}> {b.range}</span>
              </span>
              <span style={{ fontSize: 12.5, color: '#6B7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                <b style={{ color: '#111827' }}>{b.value}</b> · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail table (Linear / Canvas Gradebook style) ────────────────

type SortKey = 'title' | 'date' | 'score' | 'time';
const PAGE_ROWS = 8;
const TABLE_COLS = '44px minmax(160px, 1fr) 120px 180px 90px';

function DetailTable({ items }: { items: CurriculumSection[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
  const [showAll, setShowAll] = useState(false);

  if (!items.length) {
    return (
      <div
        style={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          color: '#9CA3AF',
        }}
      >
        Chưa có bài nào trong khoảng thời gian này.
      </div>
    );
  }

  const val = (s: CurriculumSection): number | string => {
    if (sort.key === 'title') return s.title;
    if (sort.key === 'date') return ts(s) ?? 0;
    if (sort.key === 'score') return s.score ?? -1;
    return s.timeMin ?? 0;
  };
  const sorted = items.slice().sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    const cmp = typeof va === 'string' ? va.localeCompare(String(vb), 'vi') : va - (vb as number);
    return sort.dir === 'asc' ? cmp : -cmp;
  });
  const rows = showAll ? sorted : sorted.slice(0, PAGE_ROWS);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'title' ? 'asc' : 'desc' }));

  const Header = ({ k, label, align = 'left' }: { k: SortKey; label: string; align?: 'left' | 'right' }) => (
    <button
      onClick={() => toggle(k)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: 3,
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        color: sort.key === k ? '#111827' : 'inherit',
      }}
    >
      {label}
      {sort.key === k && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
    </button>
  );

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 600 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: TABLE_COLS,
              gap: 12,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 700,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            <span>#</span>
            <Header k="title" label="Bài" />
            <Header k="date" label="Hoàn thành" />
            <Header k="score" label="Điểm" />
            <span style={{ textAlign: 'right' }}>
              <Header k="time" label="Thời gian" align="right" />
            </span>
          </div>
          {rows.map((s, i) => {
            const t = ts(s);
            return (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: TABLE_COLS,
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 12px',
                  fontSize: 13,
                  borderBottom: '1px solid #F9FAFB',
                }}
              >
                <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>{i + 1}</span>
                <span
                  title={s.title}
                  style={{
                    color: '#111827',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.title}
                </span>
                <span style={{ color: '#6B7280', fontSize: 12.5 }}>{t ? fmtDMY(t) : '—'}</span>
                {s.score !== null ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <b
                      style={{
                        width: 30,
                        color: scoreBandColor(s.score),
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {s.score.toFixed(1)}
                    </b>
                    <span style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <span
                        style={{
                          display: 'block',
                          width: `${s.score * 10}%`,
                          height: '100%',
                          background: scoreBandColor(s.score),
                          borderRadius: 99,
                        }}
                      />
                    </span>
                  </span>
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>Chưa chấm</span>
                )}
                <span style={{ textAlign: 'right', color: '#374151', fontWeight: 600 }}>
                  {s.timeMin ? fmtDuration(s.timeMin) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {sorted.length > PAGE_ROWS && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={() => setShowAll((v) => !v)}
            style={{
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#2563EB',
              cursor: 'pointer',
            }}
          >
            {showAll ? 'Thu gọn' : `Xem tất cả (${sorted.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
