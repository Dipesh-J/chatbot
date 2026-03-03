import api from './client';

export const getComposioStatus = () => api.get('/composio/status');

export const connectSlack = () => api.post('/composio/connect/slack');

export const disconnectSlack = () => api.delete('/composio/slack');

export const getSlackChannels = () => api.get('/composio/slack/channels');

export const getSlackUsers = () => api.get('/composio/slack/users');

export const getSlackDMs = () => api.get('/composio/slack/dms');

