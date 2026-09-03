import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const baseUrl = process.env.REACT_APP_API_URL ?? "";

// Create axios instance
const api = axios.create({
    baseURL: baseUrl,
    timeout: 600000, // 10 second timeout
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
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
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Check if error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // If we're already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("token");
                
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${baseUrl}/auth/refreshToken`, {
                    token: refreshToken
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
                console.error('Token refresh failed:', refreshError);
                
                processQueue(refreshError, null);
                
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userName");
                localStorage.removeItem("userCpf");
                localStorage.removeItem("userRole");
                localStorage.removeItem("yearSelected");
                localStorage.removeItem("agravoSelected");
                localStorage.removeItem("dashboardScopeSelected");
                
                if (!window.location.pathname.startsWith('/auth/')) {
                    // Guarda o destino e sinaliza o motivo do retorno. Sem isso o
                    // usuario e devolvido a tela de login sem explicacao nenhuma,
                    // o que e indistinguivel de "o login nao funcionou".
                    try {
                        sessionStorage.setItem(
                            'postLoginRedirect',
                            window.location.pathname + window.location.search
                        );
                    } catch {
                        // sessionStorage pode estar indisponivel (modo privativo).
                    }

                    window.location.href = '/auth/login?sessao=expirada';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle other errors
        if (error.response?.status === 403) {
            console.error('Access forbidden - insufficient permissions');
        } else if (error.response && error.response.status >= 500) {
            console.error('Server error:', error.response.status);
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout');
        }

        return Promise.reject(error);
    }
);

export default api;
