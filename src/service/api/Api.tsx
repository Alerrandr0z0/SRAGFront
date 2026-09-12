import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const baseUrl = import.meta.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: baseUrl,
  timeout: 600000, // 10 minutos (upload de planilhas de 1GB)
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
function redirectToLoginOnExpiry() {
  if (window.location.pathname.startsWith('/auth/')) return;
  try {
    sessionStorage.setItem('postLoginRedirect', window.location.pathname + window.location.search);
  } catch {
    // sessionStorage pode estar indisponivel (modo privativo).
  }

  window.location.href = '/auth/login?sessao=expirada';
}

function clearSessionStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('userCpf');
  localStorage.removeItem('userRole');
  localStorage.removeItem('yearSelected');
  localStorage.removeItem('dashboardScopeSelected');
}

function failSession(refreshError: unknown) {
  console.error('Token refresh failed:', refreshError);
  processQueue(refreshError, null);
  clearSessionStorage();
  redirectToLoginOnExpiry();
  return Promise.reject(refreshError);
}

async function refreshSession(originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }) {
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${baseUrl}/auth/refreshToken`, {
      token: refreshToken,
    });

    const { jwtToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    if (!newAccessToken) {
      throw new Error('Invalid token response');
    }

    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('token', newRefreshToken);
    }

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }

    processQueue(null, newAccessToken);

    return axios(originalRequest);
  } catch (refreshError) {
    return failSession(refreshError);
  } finally {
    isRefreshing = false;
  }
}

function enqueueRefresh(originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  })
    .then((token) => {
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      return axios(originalRequest);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function logHttpError(error: AxiosError) {
  if (error.response?.status === 403) {
    console.error('Access forbidden - insufficient permissions');
  } else if (error.response && error.response.status >= 500) {
    console.error('Server error:', error.response.status);
  } else if (error.code === 'ECONNABORTED') {
    console.error('Request timeout');
  }
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) return enqueueRefresh(originalRequest);
      return refreshSession(originalRequest);
    }

    logHttpError(error);
    return Promise.reject(error);
  },
);

export default api;

function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function getApiData<T>(uri: string): Promise<T> {
  const response = await api.get(uri);
  return unwrapApiData(response.data);
}
