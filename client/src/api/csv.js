import api from './client';

export const getDatasets = (sessionId) => api.get('/csv/datasets', { params: { sessionId } });

export const uploadDataset = (file, sessionId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    return api.post('/csv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteDataset = (id) => api.delete(`/csv/datasets/${id}`);
