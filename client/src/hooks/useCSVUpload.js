import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteDataset, getDatasets, uploadDataset } from '../api/csv';

export function useCSVUpload() {
    const [datasets, setDatasets] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const loadDatasets = useCallback(async (sessionId) => {
        if (!sessionId) return;
        try {
            const res = await getDatasets(sessionId);
            setDatasets(res.data.datasets || []);
        } catch {
            toast.error('Failed to load datasets');
        }
    }, []);

    const upload = useCallback(async (file, sessionId) => {
        if (!sessionId) {
            toast.error('No active chat session');
            return null;
        }
        setUploading(true);
        setUploadResult(null);
        try {
            const res = await uploadDataset(file, sessionId);
            const dataset = res.data;
            setDatasets((prev) => [dataset, ...prev]);
            setUploadResult(dataset);
            toast.success(`"${dataset.fileName}" uploaded successfully!`);
            return dataset;
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed';
            toast.error(msg);
            return null;
        } finally {
            setUploading(false);
        }
    }, []);

    const removeDataset = useCallback(async (id) => {
        try {
            await deleteDataset(id);
            setDatasets((prev) => prev.filter((d) => d._id !== id));
            toast.success('Dataset deleted');
        } catch {
            toast.error('Failed to delete dataset');
        }
    }, []);

    return { datasets, uploading, uploadResult, setUploadResult, loadDatasets, upload, removeDataset };
}
