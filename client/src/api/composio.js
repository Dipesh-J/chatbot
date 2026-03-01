import api from './client.js';

export const getComposioStatus = () => api.get('/composio/status');
export const connectSlack = () => api.post('/composio/connect/slack');
