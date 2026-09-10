import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getEnrolledClass,
  getCurriculum,
  getStudentAssignments,
  type CurriculumSection,
  type StudentAssignment,
} from '@/data/student';

export default function StudentClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cls =
    getEnrolledClass(id) ??
    (location.state as any) ?? {
      id: Number(id),
      name: 'Lớp học',
      teacher: '',
      subject: '',
    };
  const curriculum = getCurriculum(cls.id);
  const classAssignments = getStudentAssignments(cls.name);
  const pendingAssignments = classAssignments.filter((a) => !a.done);
  const completedAssignments = classAssignments.filter((a) => a.done);
  const [tab, setTab] = useState('curriculum');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(curriculum.slice(0, 2).map((c) => c.id)),
  );

  const toggleChapter = (chapterId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const onStartQuiz = (a: StudentAssignment) => {
    navigate('/student/quiz', { state: { classId: cls.id, assignmentId: a.id } });
  };

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
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
      <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}>
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
      {tab === 'stats' && (
        <StatsTab sections={curriculum.flatMap((c) => c.sections).filter((s) => s.done)} />
      )}

      {/* Homework tab */}
      {tab === 'homework' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Pending */}
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              Chưa hoàn thành ({pendingAssignments.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    padding: 20,
                    borderLeft: `4px solid ${a.daysLeft <= 2 ? '#EF4444' : '#F59E0B'}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#111827',
                      marginBottom: 6,
                    }}
                  >
                    {a.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="badge-info" style={{ fontSize: 11 }}>
                      {a.type}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{a.questions} câu hỏi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Hạn nộp: {a.due}</div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          marginTop: 2,
                          color: a.daysLeft <= 2 ? '#EF4444' : '#F59E0B',
                        }}
                      >
                        ⏰ {a.overdue ? `Quá hạn ${Math.abs(a.daysLeft)} ngày` : `Còn ${a.daysLeft} ngày`}
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                      onClick={() => onStartQuiz(a)}
                    >
                      Bắt đầu làm bài
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed */}
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
              Đã hoàn thành ({completedAssignments.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {completedAssignments.map((a) => (
                <div key={a.id} className="card" style={{ padding: 20, borderLeft: '4px solid #22C55E' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Nộp lúc: {a.submittedDate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: (a.score ?? 0) >= 8 ? '#22C55E' : (a.score ?? 0) >= 6.5 ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {a.score ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>/{a.maxScore}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsTab({ sections }: { sections: CurriculumSection[] }) {
  const scored = sections.filter((s) => s.score !== null);
  const totalTimeMin = sections.reduce((a, s) => a + s.timeMin, 0);
  const avgScore = scored.length
    ? scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length
    : 0;
  const scoreData = [
    { label: 'Điểm TB', value: avgScore.toFixed(1), color: '#2563EB', sub: `${scored.length} bài được chấm` },
    { label: 'Điểm cao nhất', value: scored.length ? Math.max(...scored.map((s) => s.score ?? 0)).toFixed(1) : '—', color: '#22C55E', sub: 'Điểm tốt nhất' },
    { label: 'Điểm thấp nhất', value: scored.length ? Math.min(...scored.map((s) => s.score ?? 0)).toFixed(1) : '—', color: '#F59E0B', sub: 'Cần cải thiện' },
    { label: 'Tổng thời gian', value: `${Math.floor(totalTimeMin / 60)}h${totalTimeMin % 60}p`, color: '#7C3AED', sub: 'Đã học' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Score stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {scoreData.map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ padding: '18px 20px', borderTop: `3px solid ${stat.color}` }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Score column chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>
            Điểm từng mục đã hoàn thành
          </h3>
          <ScoreChart items={scored} />
        </div>

        {/* Time column chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>
            Thời gian làm bài (phút)
          </h3>
          <TimeChart items={sections.filter((s) => s.timeMin > 0)} totalTimeMin={totalTimeMin} />
        </div>
      </div>
    </div>
  );
}

function ScoreChart({ items }: { items: CurriculumSection[] }) {
  const maxH = 150;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: maxH + 28,
          paddingBottom: 28,
          position: 'relative',
        }}
      >
        {/* Y gridlines */}
        {[0, 5, 10].map((v) => (
          <div
            key={v}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${(v / 10) * maxH + 28}px`,
              borderTop: '1px dashed #F3F4F6',
              pointerEvents: 'none',
            }}
          >
            <span style={{ position: 'absolute', left: -2, top: -8, fontSize: 10, color: '#D1D5DB' }}>
              {v}
            </span>
          </div>
        ))}
        {items.map((sec) => {
          const sc = sec.score ?? 0;
          const color = sc >= 8 ? '#22C55E' : sc >= 6.5 ? '#F59E0B' : '#EF4444';
          const h = (sc / 10) * maxH;
          return (
            <div
              key={sec.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {sc.toFixed(1)}
              </span>
              <div
                style={{
                  width: '100%',
                  height: h,
                  background: color,
                  borderRadius: '6px 6px 0 0',
                  opacity: 0.88,
                  transition: 'height 0.4s',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: '#9CA3AF',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  maxWidth: 52,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {sec.title.split(' ').slice(-2).join(' ')}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
        {[
          { c: '#22C55E', l: 'Giỏi (≥8)' },
          { c: '#F59E0B', l: 'Khá (6.5–8)' },
          { c: '#EF4444', l: 'Yếu (<6.5)' },
        ].map((x) => (
          <div
            key={x.l}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} /> {x.l}
          </div>
        ))}
      </div>
    </>
  );
}

function TimeChart({ items, totalTimeMin }: { items: CurriculumSection[]; totalTimeMin: number }) {
  const maxVal = Math.max(...items.map((s) => s.timeMin), 1);
  const maxH = 150;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: maxH + 28,
          paddingBottom: 28,
          position: 'relative',
        }}
      >
        {items.map((sec) => {
          const h = (sec.timeMin / maxVal) * maxH;
          return (
            <div
              key={sec.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#7C3AED',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {sec.timeMin}p
              </span>
              <div
                style={{
                  width: '100%',
                  height: h,
                  background: '#7C3AED',
                  borderRadius: '6px 6px 0 0',
                  opacity: 0.82,
                  transition: 'height 0.4s',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: '#9CA3AF',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  maxWidth: 52,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {sec.title.split(' ').slice(-2).join(' ')}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          padding: '12px 16px',
          background: '#F5F3FF',
          borderRadius: 10,
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 12, color: '#6B7280' }}>Tổng thời gian đã học</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#7C3AED',
            marginTop: 2,
          }}
        >
          {Math.floor(totalTimeMin / 60)} giờ {totalTimeMin % 60} phút
        </div>
      </div>
    </>
  );
}
