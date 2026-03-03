import * as connectorService from '../services/connector.service.js';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
} from '../utils/googleSheetsConnector.js';
import { encrypt } from '../utils/encryption.js';
import Connector from '../models/Connector.js';
import env from '../config/env.js';

export async function createConnector(req, res, next) {
  try {
    const { type, name, config } = req.body;
    if (!type || !name || !config) {
      return res.status(400).json({ error: 'type, name, and config are required' });
    }
    const connector = await connectorService.createConnector(req.user._id, { type, name, config });
    res.status(201).json({ connector });
  } catch (error) {
    next(error);
  }
}

export async function listConnectors(req, res, next) {
  try {
    const connectors = await connectorService.getUserConnectors(req.user._id);
    res.json({ connectors });
  } catch (error) {
    next(error);
  }
}

export async function testBeforeSave(req, res, next) {
  try {
    const { type, config } = req.body;
    if (!type || !config) {
      return res.status(400).json({ error: 'type and config are required' });
    }
    const result = await connectorService.testWithCredentials(type, config);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function testConnector(req, res, next) {
  try {
    const result = await connectorService.testConnectorConnection(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function introspectConnector(req, res, next) {
  try {
    const schema = await connectorService.introspectConnector(
      req.params.id,
      req.user._id,
      { spreadsheetUrl: req.body.spreadsheetUrl }
    );
    res.json({ schema });
  } catch (error) {
    next(error);
  }
}

export async function updateConnector(req, res, next) {
  try {
    const connector = await connectorService.updateConnector(req.params.id, req.user._id, req.body);
    res.json({ connector });
  } catch (error) {
    next(error);
  }
}

export async function deleteConnector(req, res, next) {
  try {
    const result = await connectorService.deleteConnector(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function runQuery(req, res, next) {
  try {
    const { query, spreadsheetId } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    const result = await connectorService.runAdHocQuery(
      req.params.id,
      req.user._id,
      query,
      spreadsheetId
    );
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    res.json({ success: false, error: error.message });
  }
}

export async function googleSheetsAuthStart(req, res, next) {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const state = Buffer.from(
      JSON.stringify({ type: 'sheets', userId: req.user._id.toString(), name })
    ).toString('base64');
    const authUrl = buildAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    next(error);
  }
}

export async function googleSheetsAuthCallback(req, res) {
  const clientUrl = env.CLIENT_URL;
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${clientUrl}/?sheets_error=${encodeURIComponent('Missing code or state')}`);
    }

    const { userId, name } = JSON.parse(Buffer.from(state, 'base64').toString());

    const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

    const encryptedConfig = encrypt({
      accessToken,
      refreshToken,
    });

    await Connector.create({
      userId,
      type: 'google_sheets',
      name,
      config: encryptedConfig,
      status: 'connected',
      lastTestedAt: new Date(),
    });

    res.redirect(`${clientUrl}/?sheets_connected=1`);
  } catch (error) {
    console.error('Google Sheets OAuth callback error:', error);
    res.redirect(`${clientUrl}/?sheets_error=${encodeURIComponent(error.message)}`);
  }
}
