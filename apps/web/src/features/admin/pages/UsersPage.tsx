import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Key, UserX, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
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

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['admin-users', filterRole, filterStatus, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const { data } = await api.get<PaginatedUsers>('/admin/users', { params });
      return data;
    },
  });

  const users = paginated?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: { fullName: string; email: string; role: string; password?: string }) => {
      const { data } = await api.post('/admin/users', dto);
      return data as { temporaryPassword?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
      if (data.temporaryPassword) setTempPassword(data.temporaryPassword);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: { id: string; fullName: string; email: string; role: string }) => {
      const { data } = await api.patch(`/admin/users/${dto.id}`, { fullName: dto.fullName, email: dto.email, role: dto.role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      await api.patch(`/admin/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
      if (data.temporaryPassword) setTempPassword(data.temporaryPassword);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFullName('');
    setEmail('');
    setRole('STUDENT');
    setPassword('');
    setTempPassword(null);
  };

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setShowForm(true);
    setFullName(u.fullName);
    setEmail(u.email);
    setRole(u.role);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, fullName, email, role });
    } else {
      const dto: { fullName: string; email: string; role: string; password?: string } = { fullName, email, role };
      if (password) dto.password = password;
      createMutation.mutate(dto);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Người dùng</h1>
            <p className="text-muted-foreground">Quản lý tất cả người dùng</p>
          </div>
          <Button onClick={() => { setEditingId(null); setFullName(''); setEmail(''); setRole('STUDENT'); setPassword(''); setTempPassword(null); setShowForm(true); }}>
            Thêm người dùng
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterRole}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('role', e.target.value);
              else next.delete('role');
              setSearchParams(next);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
          </select>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('status', e.target.value);
              else next.delete('status');
              setSearchParams(next);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
          <Input
            className="w-64"
            placeholder="Tìm theo tên hoặc email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog
          open={showForm}
          onClose={resetForm}
          title={editingId ? 'Sửa người dùng' : 'Tạo người dùng mới'}
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
            {!editingId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mật khẩu {role === 'ADMIN' ? '(tự động nếu để trống)' : '(bắt buộc)'}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'Để trống để tự động tạo' : 'Nhập mật khẩu'}
                />
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!fullName || !email || (!editingId && role !== 'ADMIN' && !password) || createMutation.isPending || updateMutation.isPending}
          >
            {editingId
              ? (updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')
              : (createMutation.isPending ? 'Đang tạo...' : 'Tạo mới')}
          </Button>
        </Dialog>

        <Dialog
          open={!!resetId}
          onClose={() => { setResetId(null); setNewPassword(''); }}
          title="Đặt lại mật khẩu"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Mật khẩu mới (để trống để tự động tạo)</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => resetPasswordMutation.mutate({ id: resetId!, newPassword })}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </Button>
            <Button variant="outline" onClick={() => { setResetId(null); setNewPassword(''); }}>Hủy</Button>
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
                          onClick={() => toggleStatusMutation.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
