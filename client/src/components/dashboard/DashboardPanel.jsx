import { BarChart2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ChartCard } from './ChartCard';
import { KpiCard } from './KpiCard';
import { ScrollArea } from '../ui/scroll-area';

export function DashboardPanel() {
    const { charts, activeSessionId } = useDashboard();

    const kpiCards = charts.filter((c) => c.type === 'kpi');
    const chartCards = charts.filter((c) => c.type !== 'kpi');

    if (!activeSessionId) {
        return (
            <div className="w-80 shrink-0 border-l border-border bg-zinc-950/50 flex items-center justify-center p-6">
                <div className="text-center">
                    <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Start a chat to see charts here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 shrink-0 border-l border-border bg-zinc-950/50 flex flex-col">
            <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Dashboard</span>
                    {charts.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">{charts.length} item{charts.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {charts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <BarChart2 className="w-10 h-10 text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">No charts yet</p>
                        <p className="text-xs text-muted-foreground/60">
                            Ask BizCopilot to create a visualization and it'll appear here in real time.
                        </p>
                    </div>
                ) : (
                    <div className="p-3 space-y-3">
                        {kpiCards.map((card) => (
                            <KpiCard key={card.id} chart={card} />
                        ))}
                        {chartCards.map((chart) => (
                            <ChartCard key={chart.id} chart={chart} />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
