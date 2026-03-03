import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bizcopilot_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup');
        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('bizcopilot_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
