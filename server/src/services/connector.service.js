import Connector from '../models/Connector.js';
import McpTool from '../models/McpTool.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { createKnexClient, prepareConfig, testConnection, introspectSchema } from '../utils/knexConnector.js';
import { testSheetsConnection, introspectSheets, extractSpreadsheetId } from '../utils/googleSheetsConnector.js';

export async function createConnector(userId, { type, name, config }) {
  const encryptedConfig = encrypt(config);
  const connector = await Connector.create({
    userId,
    type,
    name,
    config: encryptedConfig,
    status: 'connected',
    lastTestedAt: new Date(),
  });
  return sanitize(connector.toObject());
}

export async function testWithCredentials(type, config) {
  if (type === 'google_sheets') return testSheetsConnection(config);
  return testConnection(type, config);
}

export async function testConnectorConnection(connectorId, userId) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  const config = decrypt(connector.config);
  const result = connector.type === 'google_sheets'
    ? await testSheetsConnection(config)
    : await testConnection(connector.type, config);

  connector.lastTestedAt = new Date();
  if (result.success) {
    connector.status = 'connected';
    connector.lastError = undefined;
  } else {
    connector.status = 'error';
    connector.lastError = result.error;
  }
  await connector.save();

  return { ...result, status: connector.status };
}

export async function introspectConnector(connectorId, userId, options = {}) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  const config = decrypt(connector.config);

  let tables;
  if (connector.type === 'google_sheets') {
    const spreadsheetId = options.spreadsheetUrl
      ? extractSpreadsheetId(options.spreadsheetUrl)
      : config.spreadsheetId;
    if (!spreadsheetId) {
      throw Object.assign(new Error('Spreadsheet URL is required'), { status: 400 });
    }
    tables = await introspectSheets({ ...config, spreadsheetId });
    // Store spreadsheet metadata alongside tables
    connector.dbSchema = { tables, spreadsheetId, lastIntrospectedAt: new Date() };
  } else {
    tables = await introspectSchema(connector.type, config);
    connector.dbSchema = { tables, lastIntrospectedAt: new Date() };
  }

  await connector.save();

  return connector.dbSchema;
}

export async function getUserConnectors(userId) {
  const connectors = await Connector.find({ userId }).sort({ createdAt: -1 }).lean();
  return connectors.map(sanitize);
}

export async function updateConnector(connectorId, userId, updates) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  if (updates.name) connector.name = updates.name;
  if (updates.config) {
    connector.config = encrypt(updates.config);
  }
  await connector.save();

  return sanitize(connector.toObject());
}

export async function deleteConnector(connectorId, userId) {
  const connector = await Connector.findOneAndDelete({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  // Cascade delete all MCP tools for this connector
  await McpTool.deleteMany({ connectorId });

  return { message: 'Connector and associated tools deleted' };
}

const MAX_PREVIEW_ROWS = 10;

export async function runAdHocQuery(connectorId, userId, query, spreadsheetId) {
  const connector = await Connector.findOne({ _id: connectorId, userId });
  if (!connector) throw Object.assign(new Error('Connector not found'), { status: 404 });

  const config = decrypt(connector.config);

  if (connector.type === 'google_sheets') {
    const { readRange } = await import('../utils/googleSheetsConnector.js');
    const sheetsConfig = { ...config, spreadsheetId: spreadsheetId || connector.dbSchema?.spreadsheetId };
    const result = await readRange(sheetsConfig, query);
    return {
      success: true,
      rowCount: result.rows.length,
      data: result.rows.slice(0, MAX_PREVIEW_ROWS),
      truncated: result.rows.length > MAX_PREVIEW_ROWS,
    };
  }

  const resolvedConfig = await prepareConfig(config);
  const db = createKnexClient(connector.type, resolvedConfig);
  try {
    const result = await db.raw(query);
    const rows = connector.type === 'postgresql' ? result.rows : result[0];
    return {
      success: true,
      rowCount: rows.length,
      data: rows.slice(0, MAX_PREVIEW_ROWS),
      truncated: rows.length > MAX_PREVIEW_ROWS,
    };
  } finally {
    await db.destroy();
  }
}

function sanitize(doc) {
  const { config, ...rest } = doc;
  return rest;
}
