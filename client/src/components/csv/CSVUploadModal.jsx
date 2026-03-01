import { useDropzone } from 'react-dropzone';
import { X, Upload } from 'lucide-react';
import { useCSVUpload } from '../../hooks/useCSVUpload';
import CSVPreview from './CSVPreview';
import toast from 'react-hot-toast';

export default function CSVUploadModal({ onClose }) {
  const { upload, uploading, uploadResult, setUploadResult } = useCSVUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: async (accepted) => {
      if (accepted.length > 0) await upload(accepted[0]);
    },
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors?.[0]?.message || 'Invalid file';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload Financial Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {uploadResult ? (
          <CSVPreview data={uploadResult} onDone={onClose} />
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Processing your CSV...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag & drop a CSV file, or <span className="text-primary-600">click to browse</span>
                </p>
                <p className="text-xs text-gray-400">Max 10MB, up to 10,000 rows</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
