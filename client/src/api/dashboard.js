import api from './client.js';

export const getCharts = (sessionId) => api.get(`/dashboard/sessions/${sessionId}/charts`);
