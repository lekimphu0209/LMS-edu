import { useEffect, useState } from 'react';

/** Trả về giá trị sau `delay` ms — dùng cho ô tìm kiếm tránh gọi API mỗi phím. */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
