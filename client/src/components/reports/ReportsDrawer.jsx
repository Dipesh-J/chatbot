import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getReports } from '../../api/reports';
import ReportCard from './ReportCard';
import ReportViewer from './ReportViewer';

export default function ReportsDrawer({ onClose }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReports()
      .then((res) => setReports(res.data.reports))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-full max-w-md bg-surface/95 backdrop-blur-xl shadow-xl border-l border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
          <h2 className="font-semibold text-white">
            {selectedReport ? selectedReport.title : 'Reports'}
          </h2>
          <button onClick={selectedReport ? () => setSelectedReport(null) : onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedReport ? (
            <ReportViewer report={selectedReport} />
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-8">
              No reports yet. Ask BizCopilot to generate one!
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <ReportCard key={r._id} report={r} onClick={() => setSelectedReport(r)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
