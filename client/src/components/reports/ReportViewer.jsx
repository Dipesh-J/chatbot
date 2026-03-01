import ReactMarkdown from 'react-markdown';
import ShareToSlackButton from './ShareToSlackButton';

export default function ReportViewer({ report }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {new Date(report.createdAt).toLocaleDateString()} · {report.type}
        </p>
        <ShareToSlackButton reportId={report._id} shared={report.sharedToSlack} />
      </div>

      <div className="prose prose-sm prose-invert max-w-none">
        <ReactMarkdown>{report.content}</ReactMarkdown>
      </div>
    </div>
  );
}
