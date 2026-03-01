import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FinancialData from '../../models/FinancialData.js';
import { computeKPIs } from '../../utils/kpiCalculator.js';

const financialAnalysis = tool(
  async ({ query, datasetId }, config) => {
    const userId = config.configurable?.userId;
    if (!userId) return 'Error: No user context available.';

    const filter = { userId, status: 'ready' };
    if (datasetId) filter._id = datasetId;

    const datasets = await FinancialData.find(filter).lean();
    if (datasets.length === 0) {
      return 'No financial data found. Please upload a CSV file first.';
    }

    const results = datasets.map((ds) => {
      const kpis = computeKPIs(ds.summary);
      return {
        fileName: ds.fileName,
        rowCount: ds.rowCount,
        columns: ds.columns.map((c) => c.name),
        kpis,
        monthlyBreakdown: ds.summary.monthlyBreakdown,
      };
    });

    return JSON.stringify(results, null, 2);
  },
  {
    name: 'financial_analysis',
    description:
      'Analyze uploaded financial CSV data. Returns KPIs like total revenue, expenses, net profit, profit margin, burn rate, growth rate, and monthly breakdowns. Use this whenever the user asks about their financial data, numbers, or metrics.',
    schema: z.object({
      query: z.string().describe('The financial question or analysis request'),
      datasetId: z.string().optional().describe('Specific dataset ID to analyze, or omit for all datasets'),
    }),
  }
);

export default financialAnalysis;
