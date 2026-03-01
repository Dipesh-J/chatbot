import { useState, useCallback } from 'react';
import { uploadCSV, getDatasets, deleteDataset } from '../api/csv';
import toast from 'react-hot-toast';

export function useCSVUpload() {
  const [datasets, setDatasets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const loadDatasets = useCallback(async () => {
    const res = await getDatasets();
    setDatasets(res.data.datasets);
  }, []);

  const upload = useCallback(async (file) => {
    setUploading(true);
    try {
      const res = await uploadCSV(file);
      setUploadResult(res.data);
      setDatasets((prev) => [res.data, ...prev]);
      toast.success(`"${file.name}" uploaded successfully!`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const removeDataset = useCallback(async (id) => {
    await deleteDataset(id);
    setDatasets((prev) => prev.filter((d) => d._id !== id));
    toast.success('Dataset deleted');
  }, []);

  return { datasets, uploading, uploadResult, loadDatasets, upload, removeDataset, setUploadResult };
}
