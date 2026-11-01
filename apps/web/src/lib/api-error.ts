/**
 * Lấy thông báo lỗi thân thiện từ response của NestJS/axios.
 * message của backend có thể là string hoặc mảng (class-validator).
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  const message = data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const joined = message.filter((m): m is string => typeof m === 'string').join(', ');
    if (joined) return joined;
  }
  const raw = (error as { message?: string })?.message;
  // Bỏ qua các message generic của axios ("Network Error", "Request failed with status code ...").
  if (raw && !/^(Network Error|Request failed|timeout)/i.test(raw)) return raw;
  return fallback;
}
