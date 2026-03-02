import fs from 'fs';
import Papa from 'papaparse';
import FinancialData from '../models/FinancialData.js';
import { validateCSV, inferColumnTypes } from '../utils/csvValidator.js';
import { computeSummary } from '../utils/kpiCalculator.js';

export async function processCSV(filePath, fileName, userId, sessionId) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const validation = validateCSV(parsed);
  if (!validation.valid) {
    fs.unlinkSync(filePath);
    throw Object.assign(new Error(validation.errors.join('; ')), { status: 400 });
  }

  const columns = inferColumnTypes(parsed.data, parsed.meta.fields);
  const rows = parsed.data;
  const summary = computeSummary(rows, columns);

  let dateRange = {};
  const dateCol = columns.find((c) => c.type === 'date');
  if (dateCol) {
    const dates = rows.map((r) => new Date(r[dateCol.name])).filter((d) => !isNaN(d.getTime())).sort((a, b) => a - b);
    if (dates.length > 0) {
      dateRange = { start: dates[0], end: dates[dates.length - 1] };
    }
  }

  const financialData = await FinancialData.create({
    userId,
    sessionId,
    fileName,
    columns,
    rowCount: rows.length,
    dateRange,
    rows,
    summary,
    status: 'ready',
  });

  // Clean up uploaded file
  fs.unlinkSync(filePath);

  return financialData;
}
