import { CheckCircle2, XCircle, X } from 'lucide-react';
import { toast, useToasts } from '@/lib/toast';
import { cn } from '@/lib/utils';

const styles: Record<string, { bar: string; icon: typeof CheckCircle2 }> = {
  success: { bar: 'bg-green-600 text-white', icon: CheckCircle2 },
  error: { bar: 'bg-red-600 text-white', icon: XCircle },
};

export function Toaster() {
  const items = useToasts();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((t) => {
        const Icon = styles[t.type].icon;
        return (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg px-3.5 py-3 shadow-lg',
              styles[t.type].bar,
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              className="mt-0.5 shrink-0 opacity-70 transition-opacity hover:opacity-100"
              onClick={() => toast.dismiss(t.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
