import api from './client';

export const getReports = () => api.get('/reports');

export const getReport = (id) => api.get(`/reports/${id}`);

export const shareToSlack = (id) => api.post(`/reports/${id}/share-slack`);

export const deleteReport = (id) => api.delete(`/reports/${id}`);
