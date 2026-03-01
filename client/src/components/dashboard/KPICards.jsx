import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

export default function KPICards({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: 'Total Revenue', value: summary.totalRevenue, icon: DollarSign, color: 'blue' },
    { label: 'Total Expenses', value: summary.totalExpenses, icon: TrendingDown, color: 'red' },
    { label: 'Net Profit', value: summary.netProfit, icon: TrendingUp, color: summary.netProfit >= 0 ? 'green' : 'red' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`${colorMap[card.color]} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} />
              <span className="text-xs font-medium">{card.label}</span>
            </div>
            <p className="text-lg font-bold">${card.value?.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
