import { FileSpreadsheet, Trash2 } from 'lucide-react';

export default function DataSourceList({ datasets, onDelete }) {
  if (datasets.length === 0) return null;

  return (
    <div className="space-y-1">
      {datasets.map((ds) => (
        <div key={ds._id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 group">
          <FileSpreadsheet size={14} className="text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{ds.fileName}</p>
            <p className="text-xs text-gray-400">{ds.rowCount} rows</p>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(ds._id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
