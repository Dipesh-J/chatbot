import api from './client';

export const getSessionCharts = (sessionId) =>
    api.get(`/dashboard/sessions/${sessionId}/charts`);
