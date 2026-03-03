import { google } from 'googleapis';
import env from '../config/env.js';

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.SERVER_URL}/api/auth/google/callback`
  );
}

export function buildAuthUrl(state) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}

export function getSheetsClient(config) {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
  });
  return google.sheets({ version: 'v4', auth: client });
}

export async function testSheetsConnection(config) {
  try {
    // Verify OAuth tokens are valid by making a lightweight Drive files list call
    const client = createOAuth2Client();
    client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
    const drive = google.drive({ version: 'v3', auth: client });
    await drive.files.list({ pageSize: 1, q: "mimeType='application/vnd.google-apps.spreadsheet'" });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function introspectSheets(config) {
  const sheets = getSheetsClient(config);
  const res = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
    includeGridData: false,
  });

  const tables = [];

  for (const sheet of res.data.sheets) {
    const title = sheet.properties.title;
    const rowCount = sheet.properties.gridProperties?.rowCount || 0;

    // Sample first 2 rows for headers + type sniffing
    let columns = [];
    try {
      const sample = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: `'${title}'!1:2`,
      });
      const rows = sample.data.values || [];
      const headers = rows[0] || [];
      const sampleRow = rows[1] || [];

      columns = headers.map((header, i) => {
        const val = sampleRow[i];
        let dataType = 'text';
        if (val !== undefined && val !== '') {
          if (!isNaN(Number(val))) dataType = 'numeric';
          else if (!isNaN(Date.parse(val)) && val.length > 4) dataType = 'date';
        }
        return { name: header, dataType, nullable: true, isPrimaryKey: false };
      });
    } catch {
      // Empty sheet or no headers
    }

    tables.push({ name: title, columns, rowCount });
  }

  return tables;
}

export async function readRange(config, range) {
  const sheets = getSheetsClient(config);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range,
  });

  const values = res.data.values || [];
  if (values.length === 0) return { columns: [], rows: [] };

  const columns = values[0];
  const rows = values.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });

  return { columns, rows };
}

export function extractSpreadsheetId(urlOrId) {
  if (!urlOrId) return null;
  // Match Google Sheets URL pattern
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // Assume bare ID if no URL pattern
  return urlOrId.trim();
}

export async function refreshAccessToken(config) {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: config.refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token || config.refreshToken,
  };
}
