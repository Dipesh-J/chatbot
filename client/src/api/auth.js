import api from './client';

export const signup = (data) => api.post('/auth/signup', data);

export const login = (data) => api.post('/auth/login', data);

export const getMe = () => api.get('/auth/me');

export const updateMe = (data) => api.patch('/auth/me', data);
