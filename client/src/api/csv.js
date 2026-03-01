import api from './client.js';

export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/csv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDatasets = () => api.get('/csv/datasets');
export const getDataset = (id) => api.get(`/csv/datasets/${id}`);
export const deleteDataset = (id) => api.delete(`/csv/datasets/${id}`);
