import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FinancialData from '../../models/FinancialData.js';
import { computeKPIs } from '../../utils/kpiCalculator.js';

const generateStrategy = tool(
  async ({ timeframe, focus }, config) => {
    const sessionId = config.configurable?.sessionId;
    if (!sessionId) return 'Error: No session context available.';

    const dataset = await FinancialData.findOne({ sessionId, status: 'ready' })
      .sort({ createdAt: -1 })
      .lean();

    let context = 'No financial data available — generating general strategy.';
    if (dataset) {
      const kpis = computeKPIs(dataset.summary);
      context = `Based on data from "${dataset.fileName}":
- Total Revenue: $${kpis.totalRevenue.toLocaleString()}
- Total Expenses: $${kpis.totalExpenses.toLocaleString()}
- Net Profit: $${kpis.netProfit.toLocaleString()}
- Profit Margin: ${kpis.profitMargin}%
- Monthly Burn Rate: $${kpis.burnRate.toLocaleString()}
- Revenue Growth: ${kpis.growthRate}%`;
    }

    return JSON.stringify({
      context,
      timeframe: timeframe || '90-day',
      focus: focus || 'growth',
      instruction: `Generate a detailed ${timeframe || '90-day'} strategic plan focused on "${focus || 'growth'}". Include specific phases (30/60/90 days), action items with owners and deadlines, KPI targets, and risk mitigation. Use the financial context provided.`,
    });
  },
  {
    name: 'generate_strategy',
    description:
      'Generate a strategic business plan (30/60/90-day) with action items, KPI targets, and phases. Uses real financial data when available. Use when the user asks for a plan, strategy, roadmap, or growth plan.',
    schema: z.object({
      timeframe: z
        .string()
        .optional()
        .describe('Plan timeframe (e.g., "30-day", "60-day", "90-day"). Defaults to 90-day.'),
      focus: z
        .string()
        .optional()
        .describe('Strategic focus area (e.g., "growth", "cost reduction", "profitability")'),
    }),
  }
);

export default generateStrategy;
