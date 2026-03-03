import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Share2, Maximize2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-800 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className="font-medium">
                    {entry.name}: {typeof entry.value === 'number' ? `$${entry.value.toLocaleString()}` : entry.value}
                </p>
            ))}
        </div>
    );
};

function renderChart(type, config) {
    if (type === 'kpi') return null;
    const { data, xKey, yKeys = [], colors = COLORS } = config;

    if (!data?.length) return <p className="text-muted-foreground text-xs text-center pt-4">No data</p>;

    const commonProps = {
        data,
        margin: { top: 5, right: 10, left: 0, bottom: 5 },
    };

    if (type === 'pie') {
        const key = yKeys[0] || Object.keys(data[0] || {}).find((k) => k !== xKey);
        return (
            <PieChart>
                <Pie data={data} dataKey={key} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label>
                    {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
            </PieChart>
        );
    }

    const ChartComponent = type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart;

    return (
        <ChartComponent {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {yKeys.map((key, i) => {
                const color = colors[i % colors.length];
                if (type === 'bar') return <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} />;
                if (type === 'line') return <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />;
                return <Area key={key} type="monotone" dataKey={key} stroke={color} fill={`${color}20`} strokeWidth={2} />;
            })}
        </ChartComponent>
    );
}

export function ChartCard({ chart, onShareSlack }) {
    return (
        <div className="bg-zinc-900/60 border border-border rounded-xl p-4 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground truncate">{chart.title || 'Chart'}</h3>
                <div className="flex items-center gap-1">
                    {onShareSlack && (
                        <button
                            onClick={() => onShareSlack(chart)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all"
                            title="Share to Slack"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart(chart.type, chart.config || {})}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
