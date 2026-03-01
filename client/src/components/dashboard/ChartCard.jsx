import ChartRenderer from './ChartRenderer';

export default function ChartCard({ chart }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{chart.title}</h3>
      <div className="h-64">
        <ChartRenderer type={chart.type} config={chart.config} />
      </div>
    </div>
  );
}
