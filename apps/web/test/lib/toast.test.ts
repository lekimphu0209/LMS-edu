import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast, toastStore } from '../../src/lib/toast';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Xóa toast còn lại từ test trước.
    toastStore.getSnapshot().forEach((t) => toast.dismiss(t.id));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast and notifies subscribers', () => {
    const listener = vi.fn();
    const unsub = toastStore.subscribe(listener);

    toast.success('Xong');
    expect(toastStore.getSnapshot()).toHaveLength(1);
    expect(toastStore.getSnapshot()[0]).toMatchObject({ type: 'success', message: 'Xong' });
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('supports error type', () => {
    toast.error('Lỗi rồi');
    expect(toastStore.getSnapshot()[0].type).toBe('error');
  });

  it('dismiss removes the toast', () => {
    const id = toast.success('Tạm', 0);
    toast.dismiss(id);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });

  it('auto-dismisses after duration', () => {
    toast.success('Tự ẩn', 3000);
    expect(toastStore.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(3100);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });

  it('keeps toast when duration is 0', () => {
    toast.success('Giữ lại', 0);
    vi.advanceTimersByTime(60_000);
    expect(toastStore.getSnapshot()).toHaveLength(1);
  });

  it('assigns unique ids across toasts', () => {
    const a = toast.success('a', 0);
    const b = toast.success('b', 0);
    expect(a).not.toBe(b);
    expect(toastStore.getSnapshot().map((t) => t.id)).toEqual([a, b]);
  });
});
