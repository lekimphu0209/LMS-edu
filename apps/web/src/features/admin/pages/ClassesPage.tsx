import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Users, GraduationCap, Plus, Eye, X, UserX, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';

const SUBJECTS = [
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Lịch sử',
  'Địa lý',
  'Tiếng Anh',
  'Tin học',
  'Công nghệ',
  'Giáo dục công dân',
  'Thể dục',
  'Âm nhạc',
  'Mỹ thuật',
];

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  teacher: { id: string; fullName: string; email: string } | null;
  _count?: { students: number };
  stats?: { totalStudents: number };
  status: string;
}

interface ClassDetailStudent {
  id: string;
  status: string;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ClassDetail extends ClassRow {
  students: ClassDetailStudent[];
}

export function ClassesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ClassRow[]; total: number }>('/admin/classes', { params: { limit: '100' } });
      return data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['admin-users', 'TEACHER'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserRow[] }>('/admin/users', { params: { role: 'TEACHER', status: 'ACTIVE', limit: '100' } });
      return data.data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['admin-users', 'STUDENT'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserRow[] }>('/admin/users', { params: { role: 'STUDENT', status: 'ACTIVE', limit: '100' } });
      return data.data;
    },
  });

  const { data: detailClass } = useQuery({
    queryKey: ['admin-class-detail', detailId],
    queryFn: async () => {
      if (!detailId) return null;
      const { data } = await api.get<ClassDetail>(`/admin/classes/${detailId}`);
      return data;
    },
    enabled: !!detailId,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: { name: string; subject: string; teacherId: string; studentIds: string[] }) => {
      const { data } = await api.post('/admin/classes', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      resetForm();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const { data } = await api.patch(`/admin/classes/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin-class-detail', detailId] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setName('');
    setSubject('');
    setTeacherId('');
    setStudentIds([]);
    setStudentSearch('');
    setTeacherSearch('');
  };

  const filteredStudents = (students ?? []).filter((s) =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredTeachers = (teachers ?? []).filter((t) =>
    t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const toggleStudent = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    if (!name || !subject || !teacherId) return;
    createMutation.mutate({ name, subject, teacherId, studentIds });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lớp học</h1>
            <p className="text-muted-foreground">Quản lý tất cả lớp học</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm lớp học
          </Button>
        </div>

        <Dialog
          open={showForm}
          onClose={resetForm}
          title="Thêm lớp học mới"
          className="max-w-3xl"
        >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên lớp</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Toán 10A" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Môn học</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Chọn giáo viên
                </label>
                <div className="rounded-md border">
                  <div className="p-2 border-b bg-muted/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Tìm giáo viên..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredTeachers.map((t) => (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name="teacherId"
                          value={t.id}
                          checked={teacherId === t.id}
                          onChange={() => setTeacherId(t.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="text-sm font-medium">{t.fullName}</div>
                          <div className="text-xs text-muted-foreground">{t.email}</div>
                        </div>
                      </label>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy giáo viên</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Chọn học sinh
                  {studentIds.length > 0 && (
                    <Badge variant="secondary">Đã chọn {studentIds.length}</Badge>
                  )}
                </label>
                <div className="rounded-md border">
                  <div className="p-2 border-b bg-muted/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Tìm học sinh..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={studentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="text-sm font-medium">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </label>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy học sinh</div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!name || !subject || !teacherId || createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo lớp'}
              </Button>
        </Dialog>

        <div className="rounded-md border">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="w-[18%] p-3 text-left font-medium">Tên lớp</th>
                <th className="w-[18%] p-3 text-left font-medium">Môn học</th>
                <th className="w-[20%] p-3 text-left font-medium">Giáo viên</th>
                <th className="w-[100px] p-3 text-left font-medium">Số HS</th>
                <th className="w-[120px] p-3 text-left font-medium">Trạng thái</th>
                <th className="w-[220px] p-3 text-left font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(classes?.data ?? []).map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-3 font-medium truncate">{c.name}</td>
                  <td className="p-3 text-muted-foreground truncate">{c.subject}</td>
                  <td className="p-3 truncate">{c.teacher?.fullName || '-'}</td>
                  <td className="p-3">{c.stats?.totalStudents ?? c._count?.students ?? 0}</td>
                  <td className="p-3">
                    <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'} className="whitespace-nowrap min-w-[80px]">
                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-w-[90px]"
                        onClick={() => setDetailId(c.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`min-w-[120px] ${c.status === 'ACTIVE' ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'}`}
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: c.id,
                            status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                      >
                        {c.status === 'ACTIVE' ? (
                          <><UserX className="h-4 w-4 mr-1" /> Khóa</>
                        ) : (
                          <><UserCheck className="h-4 w-4 mr-1" /> Kích hoạt</>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog
          open={!!detailId && !!detailClass}
          onClose={() => setDetailId(null)}
          title={detailClass ? `Chi tiết lớp: ${detailClass.name}` : 'Chi tiết lớp'}
          className="max-w-3xl"
        >
          {detailClass ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Giáo viên phụ trách</h3>
                <div className="rounded-md border p-3">
                  {detailClass.teacher ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{detailClass.teacher.fullName}</span>
                      <span className="text-xs text-muted-foreground">{detailClass.teacher.email}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa có giáo viên</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Danh sách học sinh ({detailClass.students?.length ?? 0})
                </h3>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">Họ tên</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailClass.students ?? []).map((cs) => (
                        <tr key={cs.id} className="border-b">
                          <td className="p-3">{cs.student.fullName}</td>
                          <td className="p-3 text-muted-foreground">{cs.student.email}</td>
                          <td className="p-3">
                            <Badge variant={cs.status === 'ENROLLED' ? 'default' : 'secondary'}>
                              {cs.status === 'ENROLLED' ? 'Đang học' : cs.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {!(detailClass.students?.length ?? 0) && (
                        <tr>
                          <td className="p-4 text-center text-sm text-muted-foreground" colSpan={3}>
                            Chưa có học sinh trong lớp này
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
