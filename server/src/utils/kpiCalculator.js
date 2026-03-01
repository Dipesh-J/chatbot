export function computeSummary(rows, columns) {
  const colNames = columns.map((c) => c.name.toLowerCase());

  const findCol = (keywords) =>
    columns.find((c) => keywords.some((k) => c.name.toLowerCase().includes(k)));

  const revenueCol = findCol(['revenue', 'income', 'sales', 'earning']);
  const expenseCol = findCol(['expense', 'cost', 'spending', 'expenditure']);
  const dateCol = findCol(['date', 'month', 'period', 'time']);

  let totalRevenue = 0;
  let totalExpenses = 0;
  const monthlyMap = {};

  for (const row of rows) {
    const rev = revenueCol ? parseFloat(row[revenueCol.name]) || 0 : 0;
    const exp = expenseCol ? parseFloat(row[expenseCol.name]) || 0 : 0;
    totalRevenue += rev;
    totalExpenses += exp;

    let monthKey = 'Unknown';
    if (dateCol && row[dateCol.name]) {
      const d = new Date(row[dateCol.name]);
      if (!isNaN(d.getTime())) {
        monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        monthKey = String(row[dateCol.name]);
      }
    }

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { revenue: 0, expenses: 0 };
    }
    monthlyMap[monthKey].revenue += rev;
    monthlyMap[monthKey].expenses += exp;
  }

  const monthlyBreakdown = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      profit: Math.round((data.revenue - data.expenses) * 100) / 100,
    }));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    monthlyBreakdown,
  };
}

export function computeKPIs(summary) {
  const { totalRevenue, totalExpenses, netProfit, monthlyBreakdown } = summary;
  const months = monthlyBreakdown.length || 1;

  const avgMonthlyRevenue = totalRevenue / months;
  const avgMonthlyExpenses = totalExpenses / months;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const burnRate = avgMonthlyExpenses;
  const runway = avgMonthlyExpenses > 0 ? Math.round((totalRevenue - totalExpenses) / avgMonthlyExpenses) : Infinity;

  let growthRate = 0;
  if (monthlyBreakdown.length >= 2) {
    const first = monthlyBreakdown[0].revenue;
    const last = monthlyBreakdown[monthlyBreakdown.length - 1].revenue;
    growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    avgMonthlyRevenue: Math.round(avgMonthlyRevenue * 100) / 100,
    burnRate: Math.round(burnRate * 100) / 100,
    runway,
    growthRate: Math.round(growthRate * 100) / 100,
  };
}
