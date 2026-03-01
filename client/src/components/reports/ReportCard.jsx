import { FileText, Slack } from 'lucide-react';

export default function ReportCard({ report, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-start gap-3">
        <FileText size={18} className="text-primary-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate text-white">{report.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(report.createdAt).toLocaleDateString()} · {report.type}
          </p>
          {report.highlights?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {report.highlights.map((h, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
        {report.sharedToSlack && <Slack size={14} className="text-green-500 flex-shrink-0" />}
      </div>
    </div>
  );
}
