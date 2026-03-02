import api from './client';

export const getSessions = () => api.get('/chat/sessions');

export const createSession = () => api.post('/chat/sessions');

export const getMessages = (sessionId) =>
    api.get(`/chat/sessions/${sessionId}/messages`);

export const deleteSession = (sessionId) =>
    api.delete(`/chat/sessions/${sessionId}`);

/**
 * Returns a native EventSource for SSE streaming.
 * The caller is responsible for closing it.
 */
export const sendMessageStream = (sessionId, content) => {
    const token = localStorage.getItem('bizcopilot_token');
    // Use fetch with streaming for SSE (EventSource doesn't support POST)
    return fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
    });
};
