import api from './client';

export const getDatasets = () => api.get('/csv/datasets');

export const uploadDataset = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/csv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteDataset = (id) => api.delete(`/csv/datasets/${id}`);
