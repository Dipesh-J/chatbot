import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FinancialData from '../../models/FinancialData.js';
import { computeKPIs } from '../../utils/kpiCalculator.js';
import { buildChartConfig } from '../../utils/chartTemplates.js';

const createDashboard = tool(
  async ({ datasetId }, config) => {
    const sessionId = config.configurable?.sessionId;
    if (!sessionId) return 'Error: No session context available.';

    const filter = { sessionId, status: 'ready' };
    if (datasetId) filter._id = datasetId;

    const dataset = await FinancialData.findOne(filter).lean();
    if (!dataset) return 'No financial data found. Please upload a CSV file first.';

    const breakdown = dataset.summary?.monthlyBreakdown;
    if (!breakdown || breakdown.length === 0) {
      return 'No monthly breakdown available to build a dashboard.';
    }

    // Compute KPIs
    const kpis = computeKPIs(dataset.summary);

    // Build KPI card
    const kpiCard = {
      id: `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'kpi',
      title: 'Key Metrics',
      config: { kpis },
      createdAt: new Date(),
    };

    // Build 4 charts
    const barChart = buildChartConfig({
      type: 'bar',
      title: 'Revenue vs Expenses by Month',
      data: breakdown,
      xKey: 'month',
      yKeys: ['revenue', 'expenses'],
    });

    const lineChart = buildChartConfig({
      type: 'line',
      title: 'Profit Trend Over Time',
      data: breakdown,
      xKey: 'month',
      yKeys: ['profit'],
    });

    const areaChart = buildChartConfig({
      type: 'area',
      title: 'Revenue Growth Over Time',
      data: breakdown,
      xKey: 'month',
      yKeys: ['revenue'],
    });

    // Pie chart: aggregated revenue vs expenses
    const pieData = [
      { name: 'Revenue', value: dataset.summary.totalRevenue },
      { name: 'Expenses', value: dataset.summary.totalExpenses },
    ];
    const pieChart = buildChartConfig({
      type: 'pie',
      title: 'Total Revenue vs Expenses',
      data: pieData,
      xKey: 'name',
      yKeys: ['value'],
    });

    const charts = [barChart, lineChart, areaChart, pieChart];

    return JSON.stringify({
      success: true,
      kpiCard,
      charts,
      message: `Dashboard created with KPI metrics and 4 charts: Revenue vs Expenses (bar), Profit Trend (line), Revenue Growth (area), and Revenue vs Expenses distribution (pie).`,
    });
  },
  {
    name: 'create_dashboard',
    description:
      'Create a complete dashboard with KPI metrics and multiple charts from financial data. Generates a KPI summary card plus bar, line, area, and pie charts. Use when the user asks to "build a dashboard", "create a dashboard", or wants a complete overview of their data.',
    schema: z.object({
      datasetId: z.string().optional().describe('Specific dataset ID, or omit for latest'),
    }),
  }
);

export default createDashboard;
