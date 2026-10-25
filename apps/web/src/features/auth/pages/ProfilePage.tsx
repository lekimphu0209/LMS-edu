import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
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

export function ProfilePage() {
  const { user } = useAuth();
  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (dto: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/auth/change-password', dto);
      return data;
    },
    onSuccess: () => {
      setSuccess('Đổi mật khẩu thành công!');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
      setSuccess('');
    },
  });

  const handleChangePassword = () => {
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">Xem thông tin và đổi mật khẩu</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Profile info */}
          <Card>
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2563EB] text-2xl font-bold text-white">
                {initials}
              </div>
              <div className="mt-3 text-base font-semibold">{user?.fullName}</div>
              <div className="mt-0.5 break-all text-sm text-muted-foreground">{user?.email}</div>
              <Badge variant="outline" className="mt-3">{roleLabels[user?.role || ''] || user?.role}</Badge>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Đổi mật khẩu</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mật khẩu mới</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
