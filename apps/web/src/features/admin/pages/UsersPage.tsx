import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Key, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Đã khóa',
};

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

interface PaginatedUsers {
  data: UserRow[];
  total: number;
  page: number;
  limit: number;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserRow | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [search, setSearch] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const filterRole = searchParams.get('role') || '';
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

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['admin-users', filterRole, filterStatus, debouncedSearch, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get<PaginatedUsers>('/admin/users', { params });
      return data;
    },
  });

  const users = paginated?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((paginated?.total ?? 0) / PAGE_SIZE));

  const createMutation = useMutation({
    mutationFn: async (dto: { fullName: string; email: string; role: string; password?: string }) => {
      const { data } = await api.post('/admin/users', dto);
      return data as { temporaryPassword?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
      } else {
        toast.success('Đã tạo người dùng.');
      }
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không tạo được người dùng.')),
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: { id: string; fullName: string; email: string; role: string }) => {
      const { data } = await api.patch(`/admin/users/${dto.id}`, { fullName: dto.fullName, email: dto.email, role: dto.role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
      toast.success('Đã lưu thay đổi người dùng.');
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không lưu được người dùng.')),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      await api.patch(`/admin/users/${id}/status`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmToggle(null);
      toast.success(
        variables.status === 'INACTIVE' ? 'Đã khóa tài khoản.' : 'Đã kích hoạt lại tài khoản.',
      );
    },
    onError: (e: unknown) => {
      setConfirmToggle(null);
      toast.error(getErrorMessage(e, 'Không đổi được trạng thái.'));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword?: string }) => {
      const body: Record<string, string> = {};
      if (newPassword) body.newPassword = newPassword;
      const { data } = await api.post(`/admin/users/${id}/reset-password`, body);
      return data as { temporaryPassword?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setResetId(null);
      setNewPassword('');
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
      } else {
        toast.success('Đã đặt lại mật khẩu.');
      }
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Không đặt lại được mật khẩu.')),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFullName('');
    setEmail('');
    setRole('STUDENT');
    setPassword('');
    setTempPassword(null);
  };

  const startEdit = (u: UserRow) => {
    setEditing(u);
    setShowForm(true);
    setFullName(u.fullName);
    setEmail(u.email);
    setRole(u.role);
  };

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();
  const formDirty = editing
    ? trimmedName !== editing.fullName || trimmedEmail !== editing.email || role !== editing.role
    : true;
  const passwordInvalid = !editing && password.length > 0 && password.length < 6;
  const formInvalid =
    !trimmedName ||
    !trimmedEmail ||
    passwordInvalid ||
    (!editing && role !== 'ADMIN' && !password) ||
    (!!editing && !formDirty);

  const handleSubmit = () => {
    if (formInvalid) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, fullName: trimmedName, email: trimmedEmail, role });
    } else {
      const dto: { fullName: string; email: string; role: string; password?: string } = {
        fullName: trimmedName,
        email: trimmedEmail,
        role,
      };
      if (password) dto.password = password;
      createMutation.mutate(dto);
    }
  };

  // Trang /admin không lọc vai trò đã bị bỏ — luôn vào danh sách cụ thể.
  if (!filterRole) {
    return <Navigate to="/admin?role=STUDENT" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{roleLabels[filterRole] ?? 'Người dùng'}</h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản {(roleLabels[filterRole] ?? 'người dùng').toLowerCase()}
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setFullName(''); setEmail(''); setRole('STUDENT'); setPassword(''); setTempPassword(null); setShowForm(true); }}>
            Thêm người dùng
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterRole}
            onChange={(e) => { setParam('page', '1'); setParam('role', e.target.value); }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
          </select>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => { setParam('page', '1'); setParam('status', e.target.value); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
          <Input
            className="w-64"
            placeholder="Tìm theo tên hoặc email"
            value={search}
            onChange={(e) => { setParam('page', '1'); setSearch(e.target.value); }}
          />
        </div>

        <Dialog
          open={showForm}
          onClose={resetForm}
          title={editing ? 'Sửa người dùng' : 'Tạo người dùng mới'}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và tên</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STUDENT">Học sinh</option>
                <option value="TEACHER">Giáo viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>
            {!editing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mật khẩu {role === 'ADMIN' ? '(tự động nếu để trống)' : '(bắt buộc, tối thiểu 6 ký tự)'}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'Để trống để tự động tạo' : 'Nhập mật khẩu'}
                />
                {passwordInvalid && (
                  <p className="text-xs text-destructive">Mật khẩu phải có ít nhất 6 ký tự.</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formInvalid || createMutation.isPending || updateMutation.isPending}
            >
              {editing
                ? (updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')
                : (createMutation.isPending ? 'Đang tạo...' : 'Tạo mới')}
            </Button>
          </div>
        </Dialog>

        <Dialog
          open={!!resetId}
          onClose={() => { setResetId(null); setNewPassword(''); }}
          title="Đặt lại mật khẩu"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Mật khẩu mới (để trống để tự động tạo)</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-destructive">Mật khẩu phải có ít nhất 6 ký tự.</p>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setResetId(null); setNewPassword(''); }}>Hủy</Button>
            <Button
              onClick={() => resetPasswordMutation.mutate({ id: resetId!, newPassword: newPassword || undefined })}
              disabled={resetPasswordMutation.isPending || (newPassword.length > 0 && newPassword.length < 6)}
            >
              {resetPasswordMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        </Dialog>

        <Dialog
          open={!!tempPassword}
          onClose={() => setTempPassword(null)}
          title="Mật khẩu tạm"
        >
          <p className="font-mono text-primary">{tempPassword}</p>
          <p className="text-sm text-muted-foreground">Hãy ghi lại — mật khẩu này chỉ hiển thị một lần.</p>
          <Button className="mt-4" variant="outline" onClick={() => setTempPassword(null)}>Đóng</Button>
        </Dialog>

        <ConfirmDialog
          open={!!confirmToggle}
          onClose={() => setConfirmToggle(null)}
          title={confirmToggle?.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt lại tài khoản'}
          message={
            confirmToggle?.status === 'ACTIVE' ? (
              <>Tài khoản <b>{confirmToggle?.fullName}</b> ({confirmToggle?.email}) sẽ không thể đăng nhập cho tới khi được mở lại. Bạn chắc chắn?</>
            ) : (
              <>Kích hoạt lại tài khoản <b>{confirmToggle?.fullName}</b> ({confirmToggle?.email})?</>
            )
          }
          confirmLabel={confirmToggle?.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt'}
          danger={confirmToggle?.status === 'ACTIVE'}
          loading={toggleStatusMutation.isPending}
          onConfirm={() => {
            if (!confirmToggle) return;
            toggleStatusMutation.mutate({
              id: confirmToggle.id,
              status: confirmToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            });
          }}
        />

        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="w-[18%] p-3 text-left font-medium">Họ tên</th>
                  <th className="w-[30%] p-3 text-left font-medium">Email</th>
                  <th className="w-[120px] p-3 text-left font-medium">Vai trò</th>
                  <th className="w-[120px] p-3 text-left font-medium">Trạng thái</th>
                  <th className="w-[260px] p-3 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3 truncate">{u.fullName}</td>
                    <td className="p-3 text-muted-foreground truncate">{u.email}</td>
                    <td className="p-3"><Badge variant="outline" className="whitespace-nowrap">{roleLabels[u.role] || u.role}</Badge></td>
                    <td className="p-3">
                      <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'} className="whitespace-nowrap min-w-[80px]">
                        {statusLabels[u.status] || u.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {u.role === 'ADMIN' && (
                          <Button size="sm" variant="outline" className="min-w-[80px]" onClick={() => startEdit(u)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Sửa
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-w-[110px]"
                          onClick={() => setResetId(u.id)}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Đặt lại MK
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`min-w-[120px] ${u.status === 'ACTIVE' ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'}`}
                          onClick={() => setConfirmToggle(u)}
                        >
                          {u.status === 'ACTIVE' ? (
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
            {paginated && paginated.total > 0 && (
              <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground">
                <span>{paginated.total} người dùng · Trang {page}/{totalPages}</span>
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
        )}
      </div>
    </DashboardLayout>
  );
}
