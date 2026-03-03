import api from './client';

// Connectors
export const getConnectors = () => api.get('/connectors');
export const createConnector = (data) => api.post('/connectors', data);
export const testBeforeSave = (data) => api.post('/connectors/test', data);
export const testConnector = (id) => api.post(`/connectors/${id}/test`);
export const introspectConnector = (id, data = {}) => api.post(`/connectors/${id}/introspect`, data);
export const updateConnector = (id, data) => api.put(`/connectors/${id}`, data);
export const deleteConnector = (id) => api.delete(`/connectors/${id}`);
export const getGoogleSheetsAuthUrl = (name) =>
  api.get('/connectors/google/auth', { params: { name } });

// MCP Tools
export const getMcpTools = () => api.get('/mcp-tools');
export const createMcpTool = (data) => api.post('/mcp-tools', data);
export const suggestMcpTools = (connectorId) => api.get(`/mcp-tools/suggest/${connectorId}`);
export const testMcpTool = (id) => api.post(`/mcp-tools/${id}/test`);
export const updateMcpTool = (id, data) => api.put(`/mcp-tools/${id}`, data);
export const toggleMcpTool = (id, enabled) => api.patch(`/mcp-tools/${id}/toggle`, { enabled });
export const deleteMcpTool = (id) => api.delete(`/mcp-tools/${id}`);
