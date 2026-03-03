import * as mcpToolService from '../services/mcpTool.service.js';

export async function createTool(req, res, next) {
  try {
    const { connectorId, name, description, config, type } = req.body;
    if (!connectorId || !name || !description || !config?.query) {
      return res.status(400).json({ error: 'connectorId, name, description, and config.query are required' });
    }
    const tool = await mcpToolService.createTool(req.user._id, connectorId, { name, description, config, type });
    res.status(201).json({ tool });
  } catch (error) {
    next(error);
  }
}

export async function listTools(req, res, next) {
  try {
    const tools = await mcpToolService.getUserTools(req.user._id);
    res.json({ tools });
  } catch (error) {
    next(error);
  }
}

export async function suggestTools(req, res, next) {
  try {
    const suggestions = await mcpToolService.suggestTools(req.params.connectorId, req.user._id);
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
}

export async function testTool(req, res, next) {
  try {
    const result = await mcpToolService.testToolQuery(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateTool(req, res, next) {
  try {
    const tool = await mcpToolService.updateTool(req.params.id, req.user._id, req.body);
    res.json({ tool });
  } catch (error) {
    next(error);
  }
}

export async function toggleTool(req, res, next) {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }
    const tool = await mcpToolService.toggleTool(req.params.id, req.user._id, enabled);
    res.json({ tool });
  } catch (error) {
    next(error);
  }
}

export async function deleteTool(req, res, next) {
  try {
    const result = await mcpToolService.deleteTool(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
