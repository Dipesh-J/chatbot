import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { decrypt, encrypt } from '../../utils/encryption.js';
import { createKnexClient } from '../../utils/knexConnector.js';
import { readRange, refreshAccessToken } from '../../utils/googleSheetsConnector.js';
import Connector from '../../models/Connector.js';

const MAX_ROWS = 50;

const zodTypeMap = {
  string: z.string(),
  number: z.number(),
  date: z.string().describe('Date in YYYY-MM-DD format'),
};

export function buildDynamicTool(mcpTool, connector) {
  // Build Zod schema from parameters
  const schemaFields = {};
  if (mcpTool.config.parameters?.length) {
    for (const param of mcpTool.config.parameters) {
      let field = zodTypeMap[param.type] || z.string();
      field = field.describe(param.description || param.name);
      if (!param.required) field = field.optional();
      schemaFields[param.name] = field;
    }
  }

  // If no params, use a dummy field so the tool is callable
  const schema = Object.keys(schemaFields).length > 0
    ? z.object(schemaFields)
    : z.object({ _unused: z.string().optional().describe('No parameters needed') });

  return tool(
    async (input) => {
      try {
        if (connector.type === 'google_sheets') {
          return await executeSheetsQuery(input, mcpTool, connector);
        }

        const config = decrypt(connector.config);
        const db = createKnexClient(connector.type, config);

        try {
          const bindings = [];
          if (mcpTool.config.parameters?.length) {
            for (const param of mcpTool.config.parameters) {
              if (input[param.name] !== undefined) {
                bindings.push(input[param.name]);
              }
            }
          }

          const result = await db.raw(mcpTool.config.query, bindings);
          const rows = connector.type === 'postgresql' ? result.rows : result[0];

          const truncated = rows.length > MAX_ROWS;
          const data = rows.slice(0, MAX_ROWS);

          return JSON.stringify({
            success: true,
            rowCount: rows.length,
            data,
            truncated,
          });
        } finally {
          await db.destroy();
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message,
        });
      }
    },
    {
      name: mcpTool.name,
      description: mcpTool.description,
      schema,
    }
  );
}

async function executeSheetsQuery(input, mcpTool, connector) {
  const range = input.range || mcpTool.config.query;
  let config = { ...decrypt(connector.config), spreadsheetId: mcpTool.config.spreadsheetId };

  try {
    const result = await readRange(config, range);
    const truncated = result.rows.length > MAX_ROWS;
    return JSON.stringify({
      success: true,
      rowCount: result.rows.length,
      data: result.rows.slice(0, MAX_ROWS),
      truncated,
    });
  } catch (error) {
    // On 401, try refreshing the token once
    if (error.code === 401 || error.message?.includes('401')) {
      try {
        const refreshed = await refreshAccessToken(config);
        config = { ...config, accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };

        // Persist refreshed tokens
        const connectorDoc = await Connector.findById(connector._id);
        if (connectorDoc) {
          connectorDoc.config = encrypt(config);
          await connectorDoc.save();
        }

        const result = await readRange(config, range);
        const truncated = result.rows.length > MAX_ROWS;
        return JSON.stringify({
          success: true,
          rowCount: result.rows.length,
          data: result.rows.slice(0, MAX_ROWS),
          truncated,
        });
      } catch (retryError) {
        return JSON.stringify({ success: false, error: retryError.message });
      }
    }
    return JSON.stringify({ success: false, error: error.message });
  }
}
