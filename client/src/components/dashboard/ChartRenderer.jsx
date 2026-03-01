import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export default function ChartRenderer({ type, config }) {
  const { data, xKey, yKeys, colors } = config;
  const chartColors = colors || yKeys.map((_, i) => COLORS[i % COLORS.length]);

  if (type === 'pie') {
    const pieData = yKeys[0]
      ? data.map((d) => ({ name: d[xKey], value: d[yKeys[0]] }))
      : data;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={chartColors[i]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stroke={chartColors[i]} fill={chartColors[i]} fillOpacity={0.2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar chart
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={chartColors[i]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
