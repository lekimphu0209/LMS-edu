import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp class Tailwind: clsx hợp nhất điều kiện + twMerge lọc class trùng/xung đột. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
