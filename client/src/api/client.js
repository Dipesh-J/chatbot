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
        if (error.response?.status === 401) {
            localStorage.removeItem('bizcopilot_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
