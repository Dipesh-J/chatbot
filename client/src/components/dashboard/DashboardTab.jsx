import { BarChart2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ChartCard } from './ChartCard';
import { ScrollArea } from '../ui/scroll-area';

export function DashboardTab() {
    const { charts, activeSessionId } = useDashboard();

    if (!activeSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                    <BarChart2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Start a chat to see charts here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0 px-6 py-4 border-b border-border">
                <div className="max-w-4xl mx-auto flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Dashboard
                    </h2>
                    {charts.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">{charts.length} chart{charts.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    {charts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <BarChart2 className="w-12 h-12 text-muted-foreground/20 mb-3" />
                            <p className="text-sm text-muted-foreground mb-1">No charts yet</p>
                            <p className="text-xs text-muted-foreground/60">
                                Ask BizCopilot to create a visualization and it'll appear here in real time.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {charts.map((chart) => (
                                <ChartCard key={chart.id} chart={chart} />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
