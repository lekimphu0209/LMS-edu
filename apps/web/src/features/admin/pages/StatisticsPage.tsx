import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const statLabels: Record<string, string> = {
  totalUsers: 'Tổng người dùng',
  totalStudents: 'Tổng học sinh',
  totalTeachers: 'Tổng giáo viên',
  totalClasses: 'Tổng lớp học',
  totalCurricula: 'Tổng giáo trình',
  totalQuestions: 'Tổng câu hỏi',
  totalAssignments: 'Tổng bài tập',
  totalSubmissions: 'Tổng bài nộp',
  activeUsers: 'Người dùng hoạt động',
  activeClasses: 'Lớp học hoạt động',
  gradedSubmissions: 'Bài đã chấm',
  pendingSubmissions: 'Bài chờ chấm',
  averageScore: 'Điểm trung bình',
  completionRate: 'Tỷ lệ hoàn thành',
  totalLessons: 'Tổng bài học',
  totalChapters: 'Tổng chương',
  myClasses: 'Lớp của tôi',
  myAssignments: 'Bài tập của tôi',
  mySubmissions: 'Bài nộp của tôi',
  myProgress: 'Tiến độ học tập',
  recentSubmissions: 'Bài nộp gần đây',
  topStudents: 'Học sinh xuất sắc',
  classPerformance: 'Hiệu suất lớp',
};

function formatLabel(key: string): string {
  return statLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export function StatisticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['statistics-page', user?.role],
    queryFn: async () => {
      const endpoint =
        user?.role === 'ADMIN' ? '/admin/stats/overview' :
        user?.role === 'TEACHER' ? '/statistics/teacher' :
        '/statistics/student';
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Thống kê</h1>
          <p className="text-muted-foreground">Tổng quan và phân tích dữ liệu</p>
        </div>

        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
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
                            <div key={idx} className="flex items-center justify-between rounded-md border p-2">
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
        )}
      </div>
    </DashboardLayout>
  );
}
