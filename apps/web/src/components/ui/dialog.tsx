import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

function getScrollbarWidth() {
  if (typeof document === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export function Dialog({ open, onClose, title, children, className = '' }: DialogProps) {
  useEffect(() => {
    if (open) {
      const paddingRight = getScrollbarWidth();
      if (paddingRight > 0) {
        document.body.style.paddingRight = `${paddingRight}px`;
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6 shadow-2xl ${className}`}
      >
        <div className="mb-4 flex items-start justify-between">
          {title ? <h2 className="text-xl font-semibold">{title}</h2> : <div />}
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
