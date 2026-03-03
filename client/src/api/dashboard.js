import api from './client';

export const getSessionCharts = (sessionId) =>
    api.get(`/dashboard/sessions/${sessionId}/charts`);

export const shareDashboardToSlack = (sessionId, image, channel) =>
    api.post(`/dashboard/sessions/${sessionId}/share-slack`, { image, channel });
