import api from './client.js';

export const createSession = () => api.post('/chat/sessions');
export const getSessions = () => api.get('/chat/sessions');
export const deleteSession = (id) => api.delete(`/chat/sessions/${id}`);
export const getMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`);

export const sendMessage = async (sessionId, content, onEvent) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {}
      }
    }
  }
};
