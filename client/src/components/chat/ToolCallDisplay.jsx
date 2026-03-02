import { Database, BarChart2, FileText, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const TOOL_LABELS = {
    financial_analysis: { label: 'Querying your data...', icon: Database, color: 'text-blue-400' },
    create_visualization: { label: 'Creating a chart...', icon: BarChart2, color: 'text-purple-400' },
    generate_strategy: { label: 'Building your strategy...', icon: FileText, color: 'text-orange-400' },
    generate_report: { label: 'Generating report...', icon: FileText, color: 'text-green-400' },
    share_to_slack: { label: 'Sharing to Slack...', icon: Share2, color: 'text-pink-400' },
};

export function ToolCallDisplay({ toolCalls, isStreaming }) {
    if (!toolCalls?.length) return null;

    return (
        <div className="mb-3 space-y-2">
            {toolCalls.map((tc) => {
                const info = TOOL_LABELS[tc.toolName] || {
                    label: tc.toolName,
                    icon: Loader2,
                    color: 'text-muted-foreground',
                };
                const Icon = info.icon;
                const isDone = tc.status === 'done';

                return (
                    <div
                        key={tc.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900/60 border border-border/50 text-sm"
                    >
                        <div className={cn('flex-shrink-0', info.color)}>
                            {isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <Icon className={cn('w-4 h-4', !isDone && 'animate-spin')} />
                            )}
                        </div>
                        <span className={cn('text-xs', isDone ? 'text-muted-foreground' : 'text-foreground')}>
                            {isDone ? info.label.replace('...', ' ✓') : info.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
