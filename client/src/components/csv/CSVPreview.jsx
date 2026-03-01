import { CheckCircle, FileSpreadsheet } from 'lucide-react';

export default function CSVPreview({ data, onDone }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
        <CheckCircle size={20} className="text-green-600" />
        <div>
          <p className="font-medium text-green-800">{data.fileName}</p>
          <p className="text-sm text-green-600">{data.rowCount} rows, {data.columns.length} columns</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Columns</h3>
        <div className="flex flex-wrap gap-1.5">
          {data.columns.map((col) => (
            <span
              key={col.name}
              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
            >
              {col.name} <span className="text-gray-400">({col.type})</span>
            </span>
          ))}
        </div>
      </div>

      {data.summary && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Summary</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600">Revenue</p>
              <p className="text-sm font-semibold text-blue-800">${data.summary.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-red-600">Expenses</p>
              <p className="text-sm font-semibold text-red-800">${data.summary.totalExpenses?.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600">Net Profit</p>
              <p className="text-sm font-semibold text-green-800">${data.summary.netProfit?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={onDone} className="btn-primary w-full">
        Done
      </button>
    </div>
  );
}
