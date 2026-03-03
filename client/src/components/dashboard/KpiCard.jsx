import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, Clock } from 'lucide-react';

const KPI_CONFIG = {
    totalRevenue: { label: 'Total Revenue', format: 'currency', icon: DollarSign },
    totalExpenses: { label: 'Total Expenses', format: 'currency', icon: DollarSign },
    netProfit: { label: 'Net Profit', format: 'currency', icon: DollarSign },
    profitMargin: { label: 'Profit Margin', format: 'percent', icon: Percent },
    avgMonthlyRevenue: { label: 'Avg Monthly Revenue', format: 'currency', icon: Activity },
    burnRate: { label: 'Burn Rate', format: 'currency', icon: TrendingDown },
    growthRate: { label: 'Growth Rate', format: 'percent', icon: TrendingUp },
    runway: { label: 'Runway', format: 'months', icon: Clock },
};

function formatValue(value, format) {
    if (value === Infinity) return '∞';
    if (format === 'currency') {
        const abs = Math.abs(value);
        const formatted = abs >= 1000000
            ? `$${(abs / 1000000).toFixed(1)}M`
            : abs >= 1000
                ? `$${(abs / 1000).toFixed(1)}K`
                : `$${abs.toLocaleString()}`;
        return value < 0 ? `-${formatted}` : formatted;
    }
    if (format === 'percent') return `${value.toFixed(1)}%`;
    if (format === 'months') return `${value} mo`;
    return String(value);
}

function getColor(key, value) {
    if (['netProfit', 'profitMargin', 'growthRate'].includes(key)) {
        return value >= 0 ? 'text-emerald-400' : 'text-red-400';
    }
    if (key === 'burnRate') return 'text-amber-400';
    return 'text-blue-400';
}

export function KpiCard({ chart }) {
    const kpis = chart.config?.kpis;
    if (!kpis) return null;

    const entries = Object.entries(KPI_CONFIG).filter(([key]) => kpis[key] !== undefined);

    return (
        <div className="bg-zinc-900/60 border border-border rounded-xl p-4 animate-fade-in-up">
            <h3 className="text-sm font-medium text-foreground mb-3">{chart.title || 'Key Metrics'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {entries.map(([key, cfg]) => {
                    const value = kpis[key];
                    const Icon = cfg.icon;
                    const color = getColor(key, value);
                    return (
                        <div key={key} className="bg-zinc-800/50 border border-border/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${color}`} />
                                <span className="text-xs text-muted-foreground truncate">{cfg.label}</span>
                            </div>
                            <p className={`text-lg font-semibold ${color}`}>
                                {formatValue(value, cfg.format)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
