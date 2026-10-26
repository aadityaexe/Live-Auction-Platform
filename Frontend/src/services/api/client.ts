import axios, { type InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Never retry on 4xx client errors (401 Unauthorized, 403 Forbidden, 404 Not Found, etc.)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    return axiosRetry.isNetworkOrIdempotentRequestError(error) && error.config?.method === 'get';
  },
});

let accessToken: string | null = (typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null);

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('accessToken', token);
    } else {
      sessionStorage.removeItem('accessToken');
    }
  }
};

export const getAccessToken = () => accessToken;

let onUnauthorizedCallback: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/register')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, config: original });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.accessToken;
        setAccessToken(newToken);

        refreshQueue.forEach(({ resolve, config }) => {
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${newToken}`);
          } else if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(config));
        });
        refreshQueue = [];

        if (original.headers && typeof original.headers.set === 'function') {
          original.headers.set('Authorization', `Bearer ${newToken}`);
        } else if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch (refreshErr) {
        setAccessToken(null);
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];

        onUnauthorizedCallback?.();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;