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
export async function sendSlackMessage({ channel, text, entityId, blocks }) {
  const client = getClient();
  if (!client) return null; // Composio not configured, caller should fallback

  try {
    const entity = client.getEntity(entityId || 'default');
    const connection = await entity.getConnection({ app: 'slack' });

    if (!connection) return null;

    const params = {
      channel: channel || '#general',
      text,
    };

    // Add blocks if provided (for rich formatting)
    if (blocks && blocks.length > 0) {
      params.blocks = JSON.stringify(blocks);
    }

    const result = await entity.execute({
      actionName: 'SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL',
      params,
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
 * Get all users in the connected Slack workspace
 */
export async function getSlackUsers(entityId) {
  const client = getClient();
  if (!client) return [];

  try {
    const entity = client.getEntity(entityId || 'default');
    const connection = await entity.getConnection({ app: 'slack' });

    if (!connection) return [];

    const result = await entity.execute({
      actionName: 'SLACK_LIST_ALL_USERS',
      params: { limit: 200 },
      connectedAccountId: connection.id
    });

    let users = [];
    if (result.data?.members) {
      users = result.data.members;
    } else if (result.data?.data?.members) {
      users = result.data.data.members;
    } else if (result.data?.users) {
      users = result.data.users;
    } else if (Array.isArray(result.data)) {
      users = result.data;
    }

    return users.map(u => ({
      id: u.id,
      name: u.name,
      real_name: u.real_name || u.name,
      display_name: u.profile?.display_name || u.profile?.real_name || u.name,
      email: u.profile?.email || '',
    }));
  } catch (error) {
    console.error('Composio get users error:', error.message || error);
    return [];
  }
}

/**
 * Get existing DM conversations
 */
export async function getSlackDMs(entityId) {
  const client = getClient();
  if (!client) return [];

  try {
    const entity = client.getEntity(entityId || 'default');
    const connection = await entity.getConnection({ app: 'slack' });

    if (!connection) return [];

    const result = await entity.execute({
      actionName: 'SLACK_LIST_CONVERSATIONS',
      params: {
        types: 'im,mpim',
        limit: 100
      },
      connectedAccountId: connection.id
    });

    if (result && result.data && result.data.channels) {
      return result.data.channels.map(c => ({
        id: c.id,
        user: c.user,
        is_im: c.is_im,
        is_mpim: c.is_mpim
      }));
    }

    return [];
  } catch (error) {
    console.error('Composio get DMs error:', error.message || error);
    return [];
  }
}

/**
 * Send a direct message to a Slack user
 */
export async function sendSlackDM({ entityId, userId, text }) {
  const client = getClient();
  if (!client) {
    console.error('sendSlackDM: Composio client not configured');
    return null;
  }

  try {
    const entity = client.getEntity(entityId || 'default');
    console.log('sendSlackDM: Getting connection for entityId:', entityId);
    
    const connection = await entity.getConnection({ app: 'slack' });
    console.log('sendSlackDM: Connection found:', connection ? 'yes' : 'no', connection?.id);

    if (!connection) {
      console.error('sendSlackDM: No connection found for entity');
      return null;
    }

    // First, open or get the IM channel for this user
    console.log('sendSlackDM: Opening conversation with user:', userId);
    const conversationResult = await entity.execute({
      actionName: 'SLACK_CONVERSATIONS_OPEN',
      params: {
        users: userId
      },
      connectedAccountId: connection.id
    });

    console.log('sendSlackDM: Conversation result:', JSON.stringify(conversationResult));

    const channelId = conversationResult?.data?.channel?.id;
    if (!channelId) {
      console.error('sendSlackDM: Failed to get IM channel. Response:', conversationResult);
      return null;
    }

    console.log('sendSlackDM: Got channel ID:', channelId);

    // Now send the message to that channel
    const result = await entity.execute({
      actionName: 'SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL',
      params: {
        channel: channelId,
        text,
      },
      connectedAccountId: connection.id,
    });

    console.log('sendSlackDM: Message sent successfully');
    return result;
  } catch (error) {
    console.error('Composio send DM error:', error.message || error);
    console.error('Stack:', error.stack);
    return null;
  }
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
