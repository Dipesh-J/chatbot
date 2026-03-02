import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FinancialData from '../../models/FinancialData.js';
import { buildChartConfig } from '../../utils/chartTemplates.js';

const createVisualization = tool(
  async ({ chartType, title, metrics, datasetId }, config) => {
    const sessionId = config.configurable?.sessionId;
    if (!sessionId) return 'Error: No session context available.';

    const filter = { sessionId, status: 'ready' };
    if (datasetId) filter._id = datasetId;

    const dataset = await FinancialData.findOne(filter).lean();
    if (!dataset) return 'No financial data found. Please upload a CSV file first.';

    const breakdown = dataset.summary.monthlyBreakdown;
    if (!breakdown || breakdown.length === 0) {
      return 'No monthly breakdown available to visualize.';
    }

    const breakdownKeys = Object.keys(breakdown[0]).filter((k) => k !== 'month' && k !== '_id');
    const requestedKeys = metrics || ['revenue', 'expenses', 'profit'];

    // Case-insensitive matching: agent may pass "Revenue" but keys are "revenue"
    const validKeys = requestedKeys
      .map((k) => breakdownKeys.find((bk) => bk.toLowerCase() === k.toLowerCase()) || k)
      .filter((k) => breakdown[0]?.[k] !== undefined);

    if (validKeys.length === 0) {
      return `No valid metrics found. Available: ${breakdownKeys.join(', ')}`;
    }

    const chart = buildChartConfig({
      type: chartType,
      title: title || `${validKeys.join(' & ')} by month`,
      data: breakdown,
      xKey: 'month',
      yKeys: validKeys,
    });

    return JSON.stringify({
      success: true,
      chart,
      message: `Created ${chartType} chart: "${chart.title}"`,
    });
  },
  {
    name: 'create_visualization',
    description:
      'Create a Recharts-compatible chart from financial data. Generates bar, line, pie, or area charts that appear on the user\'s dashboard in real-time. Use when the user asks to "show", "chart", "graph", "visualize", or "plot" their data.',
    schema: z.object({
      chartType: z.enum(['bar', 'line', 'pie', 'area']).describe('Type of chart to create'),
      title: z.string().optional().describe('Chart title'),
      metrics: z
        .array(z.string())
        .optional()
        .describe('Which metrics to show (e.g., ["revenue", "expenses"]). Defaults to all available.'),
      datasetId: z.string().optional().describe('Specific dataset ID, or omit for latest'),
    }),
  }
);

export default createVisualization;
