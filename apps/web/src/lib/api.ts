import axios from 'axios';

// Always use the same-origin /api path; local dev proxies it in vite.config.ts
// and Vercel proxies it via vercel.json rewrites. VITE_API_URL only overrides
// when explicitly set to a non-empty value.
const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL =
  typeof rawApiUrl === 'string' && rawApiUrl.trim() !== ''
    ? rawApiUrl.trim().replace(/^["']|["']$/g, '')
    : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Direct request timing log — open DevTools console to evaluate API speed.
// Format: [API] GET /students/me/classes → 200 (143ms)
const logRequestTime = (config: any, status: number | string) => {
  const start = config?.metadata?.start;
  const ms = typeof start === 'number' ? Math.round(performance.now() - start) : -1;
  const method = (config?.method || 'GET').toUpperCase();
  // eslint-disable-next-line no-console
  console.debug(`[API] ${method} ${config?.url} → ${status} (${ms}ms)`);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  (config as any).metadata = { start: performance.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    logRequestTime(response.config, response.status);
    return response;
  },
  async (error) => {
    logRequestTime(error.config, error.response?.status ?? 'ERR');
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
