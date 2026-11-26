import { ReactNode } from 'react';
import { Dialog } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Nội dung mô tả thao tác (ví dụ tên đối tượng sẽ bị khóa/xóa). */
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = nút xác nhận màu đỏ (thao tác khóa/xóa). */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? () => {} : onClose} title={title} className="max-w-md">
      {message && <p className="mb-5 text-sm text-muted-foreground">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={loading} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'destructive' : 'default'} disabled={loading} onClick={onConfirm}>
          {loading ? 'Đang xử lý...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
