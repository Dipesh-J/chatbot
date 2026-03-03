import { Composio } from 'composio-core';
import env from '../config/env.js';

let composioClient = null;

function getClient() {
  if (!composioClient && env.COMPOSIO_API_KEY) {
    composioClient = new Composio({ apiKey: env.COMPOSIO_API_KEY });
  }
  return composioClient;
}

/**
 * Send a message to a Slack channel using Composio's managed Slack connection.
 * Falls back to raw webhook if Composio is not configured.
 */
export async function sendSlackMessage({ channel, text, entityId }) {
  const client = getClient();
  if (!client) return null; // Composio not configured, caller should fallback

  try {
    const entity = client.getEntity(entityId || 'default');
    const connection = await entity.getConnection({ app: 'slack' });

    if (!connection) return null;

    const result = await entity.execute({
      actionName: 'SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL',
      params: {
        channel: channel || '#general',
        text,
      },
      connectedAccountId: connection.id,
    });

    return result;
  } catch (error) {
    console.error('Composio Slack error:', error.message || error);
    return null;
  }
}

/**
 * Get available Slack channels for the user
 */
export async function getSlackChannels(entityId) {
  const client = getClient();
  if (!client) return [];

  try {
    const entity = client.getEntity(entityId || 'default');
    const connection = await entity.getConnection({ app: 'slack' });

    if (!connection) return [];

    const result = await entity.execute({
      actionName: 'SLACK_LIST_CONVERSATIONS',
      params: {
        types: 'public_channel,private_channel',
        limit: 100
      },
      connectedAccountId: connection.id
    });

    if (result && result.data && result.data.channels) {
      return result.data.channels.map(c => ({
        id: c.id,
        name: c.name,
        is_private: c.is_private
      }));
    }

    return [];
  } catch (error) {
    console.error('Composio get channels error:', error.message || error);
    return [];
  }
}

/**
 * Get the Composio auth URL for a user to connect their Slack workspace.
 */
export async function getSlackAuthUrl(entityId) {
  const client = getClient();
  if (!client) return null;

  try {
    const entity = client.getEntity(entityId);
    const connection = await entity.initiateConnection({ appName: 'slack' });
    return connection.redirectUrl;
  } catch (error) {
    console.error('Composio auth URL error:', error.message);
    return null;
  }
}

/**
 * Check if a user has an active Composio Slack connection.
 */
export async function hasSlackConnection(entityId) {
  const client = getClient();
  if (!client) return false;

  try {
    const entity = client.getEntity(entityId);
    const connection = await entity.getConnection({ app: 'slack' });
    return !!connection;
  } catch {
    return false;
  }
}

export function isComposioConfigured() {
  return !!env.COMPOSIO_API_KEY;
}

/**
 * Disconnect/delete the Slack connection for a user entity.
 */
export async function disconnectSlack(entityId) {
  const client = getClient();
  if (!client) return false;

  try {
    const entity = client.getEntity(entityId);
    let connection;

    try {
      connection = await entity.getConnection({ app: 'slack' });
    } catch (err) {
      // SDK throws if connection doesn't exist
      return true;
    }

    if (!connection) return true; // Already disconnected

    // The SDK's delete method is on connectedAccounts, not on the connection object itself
    try {
      await client.connectedAccounts.delete({ connectedAccountId: connection.id });
    } catch (err) {
      console.warn('Composio delete warning (might already be deleted):', err.message);
    }

    return true;
  } catch (error) {
    console.error('Composio disconnect error:', error.message);
    throw error;
  }
}
