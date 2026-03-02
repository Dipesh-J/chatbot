import api from './client';

export const getComposioStatus = () => api.get('/composio/status');

export const connectSlack = () => api.post('/composio/connect/slack');
