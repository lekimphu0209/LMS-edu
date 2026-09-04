import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [searchParams] = useSearchParams();
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filterRole, filterStatus],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/users', { params });
      return data as UserRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: { fullName: string; email: string; password: string; role: string }) => {
      const { data } = await api.post('/users', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: { id: string; fullName: string; email: string; role: string }) => {
      const { data } = await api.patch(`/users/${dto.id}`, { fullName: dto.fullName, email: dto.email, role: dto.role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      if (activate) {
        await api.patch(`/users/${id}/activate`);
      } else {
        await api.patch(`/users/${id}/deactivate`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      await api.post(`/users/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setResetId(null);
      setNewPassword('');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('STUDENT');
  };

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setShowForm(true);
    setFullName(u.fullName);
    setEmail(u.email);
    setRole(u.role);
    setPassword('');
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, fullName, email, role });
    } else {
      createMutation.mutate({ fullName, email, password, role });
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
          <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? 'Hủy' : 'Thêm người dùng'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
          </select>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle>{editingId ? 'Sửa người dùng' : 'Tạo người dùng mới'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ và tên</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mật khẩu</label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                )}
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
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!fullName || !email || (!editingId && !password) || createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? (updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')
                  : (createMutation.isPending ? 'Đang tạo...' : 'Tạo mới')}
              </Button>
            </CardContent>
          </Card>
        )}

        {resetId && (
          <Card>
            <CardHeader><CardTitle>Đặt lại mật khẩu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => resetPasswordMutation.mutate({ id: resetId, newPassword })}
                  disabled={!newPassword || resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </Button>
                <Button variant="outline" onClick={() => { setResetId(null); setNewPassword(''); }}>Hủy</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Họ tên</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Vai trò</th>
                  <th className="p-3 text-left font-medium">Trạng thái</th>
                  <th className="p-3 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.fullName}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3"><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></td>
                    <td className="p-3">
                      <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {statusLabels[u.status] || u.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(u)}>Sửa</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setResetId(u.id)}
                        >
                          Đặt lại MK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={u.status === 'ACTIVE' ? 'text-destructive' : 'text-primary'}
                          onClick={() => toggleStatusMutation.mutate({ id: u.id, activate: u.status !== 'ACTIVE' })}
                        >
                          {u.status === 'ACTIVE' ? 'Khóa' : 'Kích hoạt'}
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
