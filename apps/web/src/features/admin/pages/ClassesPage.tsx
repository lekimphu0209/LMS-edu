import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Users, GraduationCap, Plus, Eye, X, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const [enrollIds, setEnrollIds] = useState<string[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [confirmToggleClass, setConfirmToggleClass] = useState<ClassRow | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<ClassDetailStudent | null>(null);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const filterSubject = searchParams.get('subject') || '';
  const filterStatus = searchParams.get('status') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const debouncedSearch = useDebouncedValue(search, 350);
  const PAGE_SIZE = 15;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const { data: classes } = useQuery({
    queryKey: ['admin-classes', debouncedSearch, filterSubject, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterSubject) params.subject = filterSubject;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get<{ data: ClassRow[]; total: number }>('/admin/classes', { params });
      return data;
    },
  });

  const totalPages = Math.max(1, Math.ceil((classes?.total ?? 0) / PAGE_SIZE));

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

  // Đồng bộ form sửa khi chi tiết lớp được tải (chạy lại khi mở lớp khác).
  useEffect(() => {
    if (detailClass) {
      setEditName(detailClass.name);
      setEditSubject(detailClass.subject);
      setEditTeacher(detailClass.teacher?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailClass?.id]);

  const createMutation = useMutation({
    mutationFn: async (dto: { name: string; subject: string; teacherId: string; studentIds: string[] }) => {
      const { data } = await api.post('/admin/classes', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      resetForm();
      toast.success('Đã tạo lớp học.');
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không tạo được lớp học.')),
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: { id: string; name: string; subject: string; teacherId: string }) => {
      const { data } = await api.patch(`/admin/classes/${dto.id}`, { name: dto.name, subject: dto.subject, teacherId: dto.teacherId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin-class-detail', detailId] });
      toast.success('Đã lưu thông tin lớp học.');
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không lưu được lớp học.')),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const { data } = await api.patch(`/admin/classes/${id}/status`, { status });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin-class-detail', detailId] });
      setConfirmToggleClass(null);
      toast.success(variables.status === 'INACTIVE' ? 'Đã đóng lớp học.' : 'Đã mở lại lớp học.');
    },
    onError: (e: unknown) => {
      setConfirmToggleClass(null);
      toast.error(getErrorMessage(e, 'Không đổi được trạng thái lớp.'));
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post(`/admin/classes/${detailId}/students`, { studentIds: ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class-detail', detailId] });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setEnrollIds([]);
      setEnrollSearch('');
      toast.success('Đã thêm học sinh vào lớp.');
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không thêm được học sinh.')),
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.delete(`/admin/classes/${detailId}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class-detail', detailId] });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setConfirmRemove(null);
      toast.success('Đã xóa học sinh khỏi lớp.');
    },
    onError: (e: unknown) => {
      setConfirmRemove(null);
      toast.error(getErrorMessage(e, 'Không xóa được học sinh.'));
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

  const enrolledIds = new Set(
    (detailClass?.students ?? [])
      .filter((cs) => cs.status === 'ENROLLED')
      .map((cs) => cs.student.id),
  );
  const addableStudents = (students ?? []).filter(
    (s) =>
      !enrolledIds.has(s.id) &&
      (s.fullName.toLowerCase().includes(enrollSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(enrollSearch.toLowerCase())),
  );

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

  const trimmedClassName = name.trim();
  const trimmedEditName = editName.trim();
  const detailDirty = detailClass
    ? trimmedEditName !== detailClass.name ||
      editSubject !== detailClass.subject ||
      editTeacher !== (detailClass.teacher?.id ?? '')
    : false;

  const handleSubmit = () => {
    if (!trimmedClassName || !subject || !teacherId) return;
    createMutation.mutate({ name: trimmedClassName, subject, teacherId, studentIds });
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!trimmedClassName || !subject || !teacherId || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo lớp'}
                </Button>
              </div>
        </Dialog>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Input
            className="w-64"
            placeholder="Tìm theo tên lớp, môn, giáo viên"
            value={search}
            onChange={(e) => { setParam('page', '1'); setSearch(e.target.value); }}
          />
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterSubject}
            onChange={(e) => { setParam('page', '1'); setParam('subject', e.target.value); }}
          >
            <option value="">Tất cả môn học</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => { setParam('page', '1'); setParam('status', e.target.value); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Đã đóng</option>
          </select>
        </div>

        <div className="rounded-md border">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="w-[18%] p-3 text-left font-medium">Tên lớp</th>
                <th className="w-[18%] p-3 text-left font-medium">Môn học</th>
                <th className="w-[18%] p-3 text-left font-medium">Giáo viên</th>
                <th className="w-[80px] p-3 text-left font-medium">Số HS</th>
                <th className="w-[110px] p-3 text-left font-medium">Trạng thái</th>
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
                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Đã đóng'}
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
                        onClick={() => setConfirmToggleClass(c)}
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
          {classes && classes.total > 0 && (
            <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground">
              <span>{classes.total} lớp học · Trang {page}/{totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={!!detailId && !!detailClass}
          onClose={() => { setDetailId(null); setEnrollIds([]); setEnrollSearch(''); }}
          title={detailClass ? `Chi tiết lớp: ${detailClass.name}` : 'Chi tiết lớp'}
          className="max-w-3xl"
        >
          {detailClass ? (
            <div className="space-y-5">
              <div className="rounded-lg border p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold">Thông tin lớp học</h3>
                  <Badge variant={detailClass.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {detailClass.status === 'ACTIVE' ? 'Hoạt động' : 'Đã đóng'}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tên lớp</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Môn học</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Giáo viên phụ trách</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editTeacher}
                      onChange={(e) => setEditTeacher(e.target.value)}
                    >
                      <option value="">— Chọn giáo viên —</option>
                      {(teachers ?? []).map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    disabled={
                      !trimmedEditName ||
                      !editSubject ||
                      !editTeacher ||
                      !detailDirty ||
                      updateMutation.isPending
                    }
                    onClick={() =>
                      updateMutation.mutate({
                        id: detailClass.id,
                        name: trimmedEditName,
                        subject: editSubject,
                        teacherId: editTeacher,
                      })
                    }
                  >
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-5">
                <h3 className="mb-4 text-[15px] font-bold">
                  Danh sách học sinh ({detailClass.students?.length ?? 0})
                </h3>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">Họ tên</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Trạng thái</th>
                        <th className="w-[70px] p-3 text-left font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailClass.students ?? []).map((cs) => (
                        <tr key={cs.id} className="border-b">
                          <td className="p-3">{cs.student.fullName}</td>
                          <td className="p-3 text-muted-foreground">{cs.student.email}</td>
                          <td className="p-3">
                            <Badge variant={cs.status === 'ENROLLED' ? 'default' : 'secondary'}>
                              {cs.status === 'ENROLLED' ? 'Đang học' : 'Đã xóa'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {cs.status === 'ENROLLED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Xóa khỏi lớp"
                                disabled={removeStudentMutation.isPending}
                                onClick={() => setConfirmRemove(cs)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!(detailClass.students?.length ?? 0) && (
                        <tr>
                          <td className="p-4 text-center text-sm text-muted-foreground" colSpan={4}>
                            Chưa có học sinh trong lớp này
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border p-5">
                <h3 className="mb-4 text-[15px] font-bold">
                  Thêm học sinh vào lớp
                  {enrollIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">Đã chọn {enrollIds.length}</Badge>
                  )}
                </h3>
                <div className="rounded-md border">
                  <div className="p-2 border-b bg-muted/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Tìm học sinh theo tên hoặc email..."
                        value={enrollSearch}
                        onChange={(e) => setEnrollSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {addableStudents.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-3 border-b p-2.5 last:border-b-0 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={enrollIds.includes(s.id)}
                          onChange={() =>
                            setEnrollIds((prev) =>
                              prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                            )
                          }
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="text-sm font-medium">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </label>
                    ))}
                    {addableStudents.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Không có học sinh nào để thêm
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  disabled={enrollIds.length === 0 || enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate(enrollIds)}
                >
                  {enrollMutation.isPending
                    ? 'Đang thêm...'
                    : `Thêm học sinh${enrollIds.length > 0 ? ` (${enrollIds.length})` : ''}`}
                </Button>
              </div>
            </div>
          ) : null}
        </Dialog>

        <ConfirmDialog
          open={!!confirmToggleClass}
          onClose={() => setConfirmToggleClass(null)}
          title={confirmToggleClass?.status === 'ACTIVE' ? 'Khóa lớp học' : 'Kích hoạt lại lớp học'}
          message={
            confirmToggleClass?.status === 'ACTIVE' ? (
              <>Lớp <b>{confirmToggleClass?.name}</b> sẽ bị đóng — học sinh và giáo viên không thao tác được cho tới khi mở lại. Bạn chắc chắn?</>
            ) : (
              <>Kích hoạt lại lớp <b>{confirmToggleClass?.name}</b>?</>
            )
          }
          confirmLabel={confirmToggleClass?.status === 'ACTIVE' ? 'Khóa lớp' : 'Kích hoạt'}
          danger={confirmToggleClass?.status === 'ACTIVE'}
          loading={toggleStatusMutation.isPending}
          onConfirm={() => {
            if (!confirmToggleClass) return;
            toggleStatusMutation.mutate({
              id: confirmToggleClass.id,
              status: confirmToggleClass.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            });
          }}
        />

        <ConfirmDialog
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title="Xóa học sinh khỏi lớp"
          message={
            <>Xóa học sinh <b>{confirmRemove?.student.fullName}</b> ({confirmRemove?.student.email}) khỏi lớp <b>{detailClass?.name}</b>?</>
          }
          confirmLabel="Xóa khỏi lớp"
          danger
          loading={removeStudentMutation.isPending}
          onConfirm={() => {
            if (!confirmRemove) return;
            removeStudentMutation.mutate(confirmRemove.student.id);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
