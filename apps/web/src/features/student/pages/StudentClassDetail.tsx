import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ClassStatsTab from '../components/ClassStatsTab';
import StartQuizConfirm from '../components/StartQuizConfirm';
import {
  getEnrolledClass,
  getCurriculum,
  getStudentAssignments,
  fmtDateTime,
  type StudentAssignment,
  type EnrolledClass,
  type CurriculumChapter,
} from '@/data/student';

export default function StudentClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationClass = location.state as EnrolledClass | undefined;

  const { data: cls, isLoading: loadingClass } = useQuery<EnrolledClass | undefined>({
    queryKey: ['myClass', id],
    queryFn: () => getEnrolledClass(id),
    initialData: locationClass,
  });
  const { data: curriculum = [], isLoading: loadingCurriculum } = useQuery<CurriculumChapter[]>({
    queryKey: ['curriculum', id],
    queryFn: () => getCurriculum(id),
    enabled: !!id,
  });
  const { data: classAssignments = [], isLoading: loadingAssignments } = useQuery<StudentAssignment[]>({
    queryKey: ['myClassAssignments', cls?.name],
    queryFn: () => getStudentAssignments(cls?.name),
    enabled: !!cls?.name,
  });

  const pendingAssignments = classAssignments.filter((a) => !a.done);
  const completedAssignments = classAssignments.filter((a) => a.done);
  const pendingUpcoming = pendingAssignments.filter((a) => !a.overdue);
  const pendingOverdue = pendingAssignments.filter((a) => a.overdue);
  const [hwFilter, setHwFilter] = useState<'upcoming' | 'overdue' | 'done'>('upcoming');
  const [tab, setTab] = useState('curriculum');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(curriculum.slice(0, 2).map((c) => c.id)),
  );

  if (loadingClass || loadingCurriculum || loadingAssignments) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Đang tải...
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="page-container" style={{ paddingTop: 20, color: '#6B7280' }}>
        Không tìm thấy lớp học.
      </div>
    );
  }

  const toggleChapter = (chapterId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const [confirmA, setConfirmA] = useState<StudentAssignment | null>(null);

  // Bấm Bắt đầu → mở popup xác nhận tại chỗ (giống trang chi tiết), không chuyển trang ngay
  const onStartQuiz = (a: StudentAssignment) => setConfirmA(a);

  const confirmStart = (a: StudentAssignment) => {
    setConfirmA(null);
    navigate(`/student/assignments/${a.id}/quiz`, { state: { startNow: true } });
  };

  // Card ngang — đồng bộ style với trang "Bài tập của tôi"
  const renderHwCard = (a: StudentAssignment) => {
    const accent = a.done
      ? '#22C55E'
      : a.overdue
        ? '#EF4444'
        : a.daysLeft <= 2
          ? '#F59E0B'
          : '#2563EB';
    return (
      <div
        key={a.id}
        className="card"
        onClick={() =>
          navigate(`/student/assignments/${a.id}`, {
            state: { from: 'class', classId: cls.id },
          })
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.10)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
        style={{
          padding: '18px 22px',
          borderLeft: `4px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          opacity: a.overdue ? 0.92 : 1,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
      >
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{a.title}</span>
            {a.overdue && !a.done && <span className="badge-danger">Đã quá hạn</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge-gray">{a.type}</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{a.questions} câu hỏi</span>
            {a.done && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                Nộp lúc: {a.submittedDate ? fmtDateTime(a.submittedDate) : '—'}
              </span>
            )}
          </div>
        </div>

        {/* Hạn nộp / trạng thái */}
        <div style={{ width: 170, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Hạn nộp</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            {a.due} {a.dueTime && `· ${a.dueTime}`}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: accent }}>
            {a.done
              ? '✓ Hoàn thành'
              : a.overdue
                ? `⏰ Đã quá hạn ${Math.abs(a.daysLeft)} ngày`
                : `⏰ Còn ${a.daysLeft} ngày`}
          </div>
        </div>

        {/* Action / điểm */}
        {a.done ? (
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 64 }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: (a.score ?? 0) >= 8 ? '#22C55E' : (a.score ?? 0) >= 6.5 ? '#F59E0B' : '#EF4444',
                lineHeight: 1,
              }}
            >
              {a.score ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>/{a.maxScore} điểm</div>
          </div>
        ) : a.overdue ? (
          <button
            disabled
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#F3F4F6',
              color: '#9CA3AF',
              cursor: 'not-allowed',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Đã quá hạn
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap' }}
            onClick={(e) => {
              e.stopPropagation();
              onStartQuiz(a);
            }}
          >
            Bắt đầu làm bài
          </button>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Lớp đã đăng ký</div>
        <h1 className="page-title">{cls.name}</h1>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span className="badge-info">{cls.subject}</span>
          <span style={{ fontSize: 13, color: '#6B7280' }}>GV: {cls.teacher}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: 18 }}>
        {[
          { id: 'curriculum', label: 'Giáo trình học tập' },
          { id: 'stats', label: 'Thống kê điểm số' },
          { id: 'homework', label: 'Bài tập về nhà' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Curriculum tab */}
      {tab === 'curriculum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {curriculum.map((chapter) => {
            const chDone = chapter.sections.filter((s) => s.done).length;
            const chTotal = chapter.sections.length;
            const chPct = Math.round((chDone / chTotal) * 100);
            const isOpen = expanded.has(chapter.id);
            return (
              <div key={chapter.id} className="card" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderBottom: isOpen ? '1px solid #F3F4F6' : 'none',
                  }}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: chapter.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#111827',
                        marginBottom: 5,
                      }}
                    >
                      {chapter.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 180, height: 5, background: '#E5E7EB', borderRadius: 99 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${chPct}%`,
                            background: chapter.color,
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {chDone}/{chTotal} mục
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: chPct === 100 ? '#22C55E' : chapter.color,
                        }}
                      >
                        {chPct}%
                      </span>
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {isOpen && (
                  <div>
                    {chapter.sections.map((sec, i) => (
                      <div
                        key={sec.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '13px 20px 13px 40px',
                          borderBottom: i < chapter.sections.length - 1 ? '1px solid #F9FAFB' : 'none',
                          background: sec.done ? '#FAFFF5' : 'white',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: sec.done ? '#22C55E' : '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {sec.done ? (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#D1D5DB' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: sec.done ? 600 : 400,
                              color: sec.done ? '#111827' : '#6B7280',
                            }}
                          >
                            {sec.title}
                          </div>
                          {sec.done && sec.timeMin > 0 && (
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                              Thời gian: {sec.timeMin} phút
                            </div>
                          )}
                        </div>
                        {sec.done && sec.score !== null ? (
                          <div
                            style={{
                              padding: '3px 12px',
                              borderRadius: 20,
                              background:
                                sec.score >= 8 ? '#F0FDF4' : sec.score >= 6.5 ? '#FFFBEB' : '#FEF2F2',
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              color: sec.score >= 8 ? '#22C55E' : sec.score >= 6.5 ? '#F59E0B' : '#EF4444',
                            }}
                          >
                            {sec.score.toFixed(1)}
                          </div>
                        ) : !sec.done ? (
                          <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>
                            Chưa học
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && <ClassStatsTab sections={curriculum.flatMap((c) => c.sections)} />}

      {/* Homework tab */}
      {tab === 'homework' && (
        <div>
          {/* Tab bar trạng thái — giống trang "Bài tập của tôi" */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: 18,
            }}
          >
            {(
              [
                { key: 'upcoming', label: 'Chưa làm', count: pendingUpcoming.length, dot: '#2563EB' },
                { key: 'overdue', label: 'Đã quá hạn', count: pendingOverdue.length, dot: '#EF4444' },
                { key: 'done', label: 'Hoàn thành', count: completedAssignments.length, dot: '#22C55E' },
              ] as { key: typeof hwFilter; label: string; count: number; dot: string }[]
            ).map((t) => {
              const active = hwFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setHwFilter(t.key)}
                  style={{
                    padding: '11px 18px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    color: active ? '#2563EB' : '#6B7280',
                    borderBottom: `2px solid ${active ? '#2563EB' : 'transparent'}`,
                    marginBottom: -1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                  }}
                >
                  <span
                    style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot, display: 'inline-block' }}
                  />
                  {t.label}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: 20,
                      background: active ? '#EFF6FF' : '#F3F4F6',
                      color: active ? '#2563EB' : '#6B7280',
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Danh sách theo filter — row card giống trang Bài tập */}
          {(() => {
            const list =
              hwFilter === 'upcoming'
                ? pendingUpcoming
                : hwFilter === 'overdue'
                  ? pendingOverdue
                  : completedAssignments;
            if (list.length === 0)
              return (
                <div className="card" style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: '#F0FDF4',
                      margin: '0 auto 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 4 }}>
                    {hwFilter === 'upcoming'
                      ? 'Không có bài tập nào chưa làm'
                      : hwFilter === 'overdue'
                        ? 'Không có bài tập nào đã quá hạn'
                        : 'Chưa có bài tập nào đã hoàn thành'}
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {hwFilter === 'done' ? 'Các bài đã nộp sẽ xuất hiện ở đây' : 'Bạn đang theo kịp tiến độ học tập'}
                  </div>
                </div>
              );
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.map(renderHwCard)}
              </div>
            );
          })()}
        </div>
      )}

      {/* Popup xác nhận bắt đầu — hủy thì ở lại trang */}
      {confirmA && (
        <StartQuizConfirm
          title={confirmA.title}
          questions={confirmA.questions}
          onCancel={() => setConfirmA(null)}
          onConfirm={() => confirmStart(confirmA)}
        />
      )}
    </div>
  );
}
