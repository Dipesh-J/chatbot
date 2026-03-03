import McpTool from '../models/McpTool.js';
import Connector from '../models/Connector.js';
import { decrypt } from '../utils/encryption.js';
import { createKnexClient } from '../utils/knexConnector.js';
import { readRange } from '../utils/googleSheetsConnector.js';

function columnLetter(n) {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s || 'Z';
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

export async function suggestTools(connectorId, userId) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });
  if (!connector.dbSchema?.tables?.length) {
    throw Object.assign(new Error('Schema not introspected yet. Run introspect first.'), { status: 400 });
  }

  const isSheets = connector.type === 'google_sheets';
  const suggestions = [];

  for (const table of connector.dbSchema.tables) {
    if (isSheets) {
      const lastCol = columnLetter(table.columns.length || 26);
      const spreadsheetId = connector.dbSchema.spreadsheetId;
      suggestions.push({
        name: `read_${sanitizeName(table.name)}`,
        description: `Read all data from ${table.name}`,
        config: { query: `'${table.name}'!A:${lastCol}`, spreadsheetId, parameters: [] },
      });
      suggestions.push({
        name: `read_${sanitizeName(table.name)}_range`,
        description: `Read a specific range from ${table.name}`,
        config: {
          query: `'${table.name}'!A:${lastCol}`,
          spreadsheetId,
          parameters: [
            { name: 'range', type: 'string', description: `Sheet range e.g. '${table.name}'!A1:${lastCol}50`, required: false },
          ],
        },
      });
      continue;
    }

    // list_{table}
    suggestions.push({
      name: `list_${table.name}`,
      description: `List rows from ${table.name} (limit 100)`,
      config: { query: `SELECT * FROM "${table.name}" LIMIT 100`, parameters: [] },
    });

    // count_{table}
    suggestions.push({
      name: `count_${table.name}`,
      description: `Count total rows in ${table.name}`,
      config: { query: `SELECT COUNT(*) as total FROM "${table.name}"`, parameters: [] },
    });

    // sum for numeric columns
    const numericCols = table.columns.filter((c) =>
      ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision', 'float', 'int', 'smallint', 'tinyint', 'mediumint'].includes(
        c.dataType?.toLowerCase()
      )
    );
    for (const col of numericCols) {
      if (col.isPrimaryKey) continue;
      suggestions.push({
        name: `sum_${table.name}_${col.name}`,
        description: `Sum of ${col.name} in ${table.name}`,
        config: { query: `SELECT SUM("${col.name}") as total FROM "${table.name}"`, parameters: [] },
      });
    }

    // date range queries for date columns
    const dateCols = table.columns.filter((c) =>
      ['date', 'timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone', 'datetime'].includes(
        c.dataType?.toLowerCase()
      )
    );
    for (const col of dateCols) {
      suggestions.push({
        name: `${table.name}_by_date_range`,
        description: `Query ${table.name} by ${col.name} date range`,
        config: {
          query: `SELECT * FROM "${table.name}" WHERE "${col.name}" BETWEEN $1 AND $2 LIMIT 100`,
          parameters: [
            { name: 'start_date', type: 'date', description: 'Start date (YYYY-MM-DD)', required: true },
            { name: 'end_date', type: 'date', description: 'End date (YYYY-MM-DD)', required: true },
          ],
        },
      });
      break; // only one date range query per table
    }
  }

  return suggestions;
}

export async function createTool(userId, connectorId, toolDef) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  const toolConfig = {
    query: toolDef.config.query,
    parameters: toolDef.config.parameters || [],
  };
  if (toolDef.config.spreadsheetId) {
    toolConfig.spreadsheetId = toolDef.config.spreadsheetId;
  }

  const tool = await McpTool.create({
    userId,
    connectorId,
    name: toolDef.name,
    description: toolDef.description,
    type: toolDef.type || 'sql_query',
    config: toolConfig,
  });

  return tool;
}

export async function testToolQuery(toolId, userId) {
  const tool = await McpTool.findOne({ _id: toolId, userId });
  if (!tool) throw Object.assign(new Error('Tool not found'), { status: 404 });

  const connector = await Connector.findOne({ _id: tool.connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  const config = decrypt(connector.config);

  if (connector.type === 'google_sheets') {
    try {
      const sheetsConfig = { ...config, spreadsheetId: tool.config.spreadsheetId };
      const result = await readRange(sheetsConfig, tool.config.query);
      return {
        success: true,
        rowCount: result.rows.length,
        data: result.rows.slice(0, 10),
        truncated: result.rows.length > 10,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  const db = createKnexClient(connector.type, config);

  try {
    const result = await db.raw(tool.config.query);
    const rows = connector.type === 'postgresql' ? result.rows : result[0];
    return {
      success: true,
      rowCount: rows.length,
      data: rows.slice(0, 10),
      truncated: rows.length > 10,
    };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await db.destroy();
  }
}

export async function getUserTools(userId) {
  return McpTool.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getToolsByConnector(connectorId, userId) {
  return McpTool.find({ connectorId, userId }).sort({ createdAt: -1 }).lean();
}

export async function updateTool(toolId, userId, updates) {
  const tool = await McpTool.findOne({ _id: toolId, userId });
  if (!tool) throw Object.assign(new Error('Tool not found'), { status: 404 });

  if (updates.name) tool.name = updates.name;
  if (updates.description) tool.description = updates.description;
  if (updates.config) tool.config = updates.config;
  await tool.save();

  return tool;
}

export async function toggleTool(toolId, userId, enabled) {
  const tool = await McpTool.findOne({ _id: toolId, userId });
  if (!tool) throw Object.assign(new Error('Tool not found'), { status: 404 });

  tool.enabled = enabled;
  await tool.save();

  return tool;
}

export async function deleteTool(toolId, userId) {
  const tool = await McpTool.findOneAndDelete({ _id: toolId, userId });
  if (!tool) throw Object.assign(new Error('Tool not found'), { status: 404 });
  return { message: 'Tool deleted' };
}

export async function deleteToolsByConnector(connectorId) {
  await McpTool.deleteMany({ connectorId });
}
