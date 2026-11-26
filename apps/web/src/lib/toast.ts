import { useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const DEFAULT_DURATION = 4000;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function add(type: ToastType, message: string, duration = DEFAULT_DURATION) {
  const id = nextId++;
  items = [...items, { id, type, message }];
  emit();
  if (typeof setTimeout === 'function' && duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id: number) {
  if (!items.some((t) => t.id === id)) return;
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string, duration?: number) => add('success', message, duration),
  error: (message: string, duration?: number) => add('error', message, duration),
  dismiss,
};

export const toastStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => items,
};

/** Hook nội bộ cho Toaster. */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
}
