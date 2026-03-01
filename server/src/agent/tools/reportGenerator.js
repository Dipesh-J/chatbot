import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FinancialData from '../../models/FinancialData.js';
import Report from '../../models/Report.js';
import { computeKPIs } from '../../utils/kpiCalculator.js';

const generateReport = tool(
  async ({ title, type }, config) => {
    const userId = config.configurable?.userId;
    const sessionId = config.configurable?.sessionId;
    if (!userId) return 'Error: No user context available.';

    const dataset = await FinancialData.findOne({ userId, status: 'ready' })
      .sort({ createdAt: -1 })
      .lean();

    if (!dataset) return 'No financial data available. Please upload a CSV file first.';

    const kpis = computeKPIs(dataset.summary);
    const breakdown = dataset.summary.monthlyBreakdown;

    const reportContent = `# ${title || 'Business Summary Report'}

## Overview
- **Data Source:** ${dataset.fileName}
- **Period:** ${breakdown[0]?.month || 'N/A'} to ${breakdown[breakdown.length - 1]?.month || 'N/A'}
- **Total Rows:** ${dataset.rowCount}

## Key Metrics
| Metric | Value |
|--------|-------|
| Total Revenue | $${kpis.totalRevenue.toLocaleString()} |
| Total Expenses | $${kpis.totalExpenses.toLocaleString()} |
| Net Profit | $${kpis.netProfit.toLocaleString()} |
| Profit Margin | ${kpis.profitMargin}% |
| Avg Monthly Revenue | $${kpis.avgMonthlyRevenue.toLocaleString()} |
| Monthly Burn Rate | $${kpis.burnRate.toLocaleString()} |
| Revenue Growth | ${kpis.growthRate}% |

## Monthly Breakdown
| Month | Revenue | Expenses | Profit |
|-------|---------|----------|--------|
${breakdown.map((m) => `| ${m.month} | $${m.revenue.toLocaleString()} | $${m.expenses.toLocaleString()} | $${m.profit.toLocaleString()} |`).join('\n')}

## Highlights
${kpis.netProfit > 0 ? '- Business is profitable' : '- Business is operating at a loss'}
${kpis.growthRate > 0 ? `- Revenue growing at ${kpis.growthRate}%` : `- Revenue declining at ${kpis.growthRate}%`}
${kpis.profitMargin > 20 ? '- Healthy profit margin above 20%' : '- Profit margin needs improvement'}
`;

    const highlights = [
      kpis.netProfit > 0 ? 'Profitable' : 'Operating at a loss',
      `${kpis.growthRate > 0 ? '+' : ''}${kpis.growthRate}% revenue growth`,
      `${kpis.profitMargin}% profit margin`,
    ];

    const report = await Report.create({
      userId,
      sessionId,
      title: title || 'Business Summary Report',
      type: type || 'summary',
      content: reportContent,
      highlights,
    });

    return JSON.stringify({
      success: true,
      reportId: report._id,
      title: report.title,
      message: `Report "${report.title}" generated and saved successfully.`,
    });
  },
  {
    name: 'generate_report',
    description:
      'Generate and save a formatted business report (summary, analysis, or strategy). Creates a markdown report with key metrics, monthly breakdown, and highlights. Use when the user asks to "generate a report", "create a summary", or "write up" their data.',
    schema: z.object({
      title: z.string().optional().describe('Report title'),
      type: z.enum(['summary', 'strategy', 'analysis']).optional().describe('Report type'),
    }),
  }
);

export default generateReport;
