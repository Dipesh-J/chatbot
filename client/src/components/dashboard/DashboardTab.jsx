import { useRef, useState } from 'react';
import { BarChart2, Share2, Loader2, Check } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ChartCard } from './ChartCard';
import { KpiCard } from './KpiCard';
import { ScrollArea } from '../ui/scroll-area';
import { shareDashboardToSlack } from '../../api/dashboard';
import toast from 'react-hot-toast';

export function DashboardTab() {
    const { charts, activeSessionId } = useDashboard();
    const dashboardRef = useRef(null);
    const [sharing, setSharing] = useState(false);
    const [shared, setShared] = useState(false);

    const kpiCards = charts.filter((c) => c.type === 'kpi');
    const chartCards = charts.filter((c) => c.type !== 'kpi');

    const handleShareToSlack = async () => {
        if (!dashboardRef.current || !activeSessionId) return;
        setSharing(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(dashboardRef.current, {
                backgroundColor: '#09090b',
                scale: 2,
            });
            const image = canvas.toDataURL('image/png');
            await shareDashboardToSlack(activeSessionId, image);
            setShared(true);
            setTimeout(() => setShared(false), 3000);
        } catch (err) {
            console.error('Failed to share dashboard:', err);
            toast.error(err.response?.data?.error || err.message || 'Failed to share dashboard to Slack');
        } finally {
            setSharing(false);
        }
    };

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
                        <>
                            {/* Header with share button */}
                            {charts.length > 0 && (
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">Dashboard</span>
                                        <span className="text-xs text-muted-foreground">
                                            {charts.length} item{charts.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleShareToSlack}
                                        disabled={sharing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-border hover:bg-zinc-700 text-foreground transition-all disabled:opacity-50"
                                    >
                                        {sharing ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : shared ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Share2 className="w-3.5 h-3.5" />
                                        )}
                                        {sharing ? 'Sharing...' : shared ? 'Shared!' : 'Share to Slack'}
                                    </button>
                                </div>
                            )}

                            <div ref={dashboardRef}>
                                {/* KPI cards at top — full width */}
                                {kpiCards.map((card) => (
                                    <div key={card.id} className="mb-4">
                                        <KpiCard chart={card} />
                                    </div>
                                ))}

                                {/* Charts in 2-col grid */}
                                {chartCards.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {chartCards.map((chart) => (
                                            <ChartCard key={chart.id} chart={chart} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
