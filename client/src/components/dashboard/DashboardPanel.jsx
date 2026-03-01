import { useDashboard } from '../../context/DashboardContext';
import ChartCard from './ChartCard';
import { BarChart3 } from 'lucide-react';

export default function DashboardPanel() {
  const { charts } = useDashboard();

  if (charts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Charts will appear here when you ask for visualizations</p>
          <p className="text-xs mt-1">Try: "Show revenue by month as a bar chart"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {charts.map((chart) => (
        <ChartCard key={chart.id} chart={chart} />
      ))}
    </div>
  );
}
