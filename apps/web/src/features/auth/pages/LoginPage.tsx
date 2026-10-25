import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.tokens, res.data.user);
      navigate(res.data.user.role === 'STUDENT' ? '/student/classes' : '/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left illustration panel */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2563EB] to-[#3b82f6] p-10 lg:flex">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-[30%] -left-10 h-48 w-48 rounded-full bg-white/5" />

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="white" />
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="white" opacity="0.7" />
            </svg>
          </div>
          <span className="font-display text-2xl font-extrabold text-white">EduConnect</span>
        </div>

        <div className="w-full max-w-sm [@media(max-height:640px)]:hidden">
          <IllustrationEdu />
        </div>

        <div className="mt-8 text-center">
          <h2 className="font-display text-xl font-bold leading-tight text-white">
            Nền tảng học tập
            <br />
            thông minh & kết nối
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            Quản lý lớp học, bài tập và tiến độ học tập của học sinh một cách hiệu quả.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full justify-center overflow-y-auto p-6 lg:w-[480px] lg:p-12">
        <form onSubmit={handleSubmit(onSubmit)} className="my-auto w-full max-w-[380px]">
          <h1 className="font-display text-2xl font-extrabold text-[#111827]">Xin chào!</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Đăng nhập vào tài khoản của bạn</p>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#374151]">Email / Tên đăng nhập</label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="h-11 rounded-lg border-[#E5E7EB] px-4 text-sm focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/10"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#374151]">Mật khẩu</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="h-11 rounded-lg border-[#E5E7EB] px-4 text-sm focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/10"
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="text-right">
              <a href="#" className="text-sm font-medium text-[#2563EB] hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-[#2563EB] text-sm font-semibold hover:bg-[#1d4ed8]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </div>

          <div className="mt-6 border-t border-[#F3F4F6] pt-4">
            <p className="mb-2 text-xs font-medium text-[#9CA3AF]">Tài khoản demo</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { email: 'admin@educonnect.local', pass: 'Admin@123', label: 'Admin' },
                { email: 'teacher@educonnect.local', pass: 'Teacher@123', label: 'Giáo viên' },
                { email: 'student@educonnect.local', pass: 'Student@123', label: 'Học sinh' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setValue('email', d.email);
                    setValue('password', d.pass);
                  }}
                  className="rounded-md border border-[#E5E7EB] px-2 py-1.5 text-xs font-medium text-[#374151] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-[#9CA3AF]">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="text-[#2563EB]">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" className="text-[#2563EB]">
              Chính sách bảo mật
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}

function IllustrationEdu() {
  return (
    <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect x="60" y="220" width="300" height="12" rx="6" fill="rgba(255,255,255,0.15)" />
      <rect x="140" y="120" width="140" height="100" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <rect x="148" y="128" width="124" height="78" rx="6" fill="rgba(255,255,255,0.1)" />
      <rect x="158" y="138" width="60" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
      <rect x="158" y="150" width="40" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="158" y="162" width="50" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="158" y="174" width="35" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="202" y="220" width="16" height="16" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="188" y="234" width="44" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="80" y="180" width="48" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
      <rect x="80" y="164" width="48" height="18" rx="4" fill="rgba(255,255,255,0.2)" />
      <rect x="80" y="148" width="48" height="18" rx="4" fill="rgba(167,139,250,0.5)" />
      <rect x="292" y="180" width="48" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
      <rect x="292" y="165" width="48" height="17" rx="4" fill="rgba(103,232,249,0.4)" />
      <rect x="110" y="120" width="8" height="60" rx="4" fill="rgba(255,255,255,0.4)" transform="rotate(-15 110 120)" />
      <circle cx="100" cy="80" r="4" fill="rgba(255,255,255,0.6)" />
      <circle cx="320" cy="100" r="3" fill="rgba(255,255,255,0.5)" />
      <circle cx="80" cy="140" r="2" fill="rgba(255,255,255,0.4)" />
      <circle cx="340" cy="160" r="2.5" fill="rgba(255,255,255,0.4)" />
      <ellipse cx="210" cy="60" rx="36" ry="8" fill="rgba(255,255,255,0.25)" />
      <rect x="194" y="44" width="32" height="18" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="194" y="40" width="32" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
      <line x1="228" y1="44" x2="244" y2="58" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <circle cx="244" cy="62" r="4" fill="rgba(255,213,0,0.7)" />
    </svg>
  );
}
