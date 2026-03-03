import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '../api/connectors';

export function useConnectors() {
    const [connectors, setConnectors] = useState([]);
    const [mcpTools, setMcpTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testingId, setTestingId] = useState(null);
    const [introspectingId, setIntrospectingId] = useState(null);

    const loadConnectors = useCallback(async () => {
        try {
            const res = await api.getConnectors();
            setConnectors(res.data.connectors || []);
        } catch {
            toast.error('Failed to load connectors');
        }
    }, []);

    const loadMcpTools = useCallback(async () => {
        try {
            const res = await api.getMcpTools();
            setMcpTools(res.data.tools || []);
        } catch {
            toast.error('Failed to load MCP tools');
        }
    }, []);

    useEffect(() => {
        loadConnectors();
        loadMcpTools();
    }, [loadConnectors, loadMcpTools]);

    // Handle Google Sheets OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sheets_connected') === '1') {
            toast.success('Google Sheets connected!');
            loadConnectors();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('sheets_error')) {
            toast.error(`Sheets error: ${params.get('sheets_error')}`);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const testBeforeSave = useCallback(async (type, config) => {
        try {
            const res = await api.testBeforeSave({ type, config });
            return res.data;
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Test failed' };
        }
    }, []);

    const addConnector = useCallback(async ({ type, name, config }) => {
        try {
            const res = await api.createConnector({ type, name, config });
            setConnectors((prev) => [res.data.connector, ...prev]);
            toast.success('Connector created');
            return res.data.connector;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create connector');
            return null;
        }
    }, []);

    const updateConnector = useCallback(async ({ id, ...updates }) => {
        try {
            const res = await api.updateConnector(id, updates);
            setConnectors((prev) => prev.map((c) => (c._id === id ? res.data.connector : c)));
            toast.success('Connector updated');
            return res.data.connector;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update connector');
            return null;
        }
    }, []);

    const testConnector = useCallback(async (id) => {
        setTestingId(id);
        try {
            const res = await api.testConnector(id);
            setConnectors((prev) =>
                prev.map((c) => (c._id === id ? { ...c, status: res.data.status } : c))
            );
            if (res.data.success) toast.success('Connection successful');
            else toast.error(`Connection failed: ${res.data.error}`);
            return res.data;
        } catch (err) {
            toast.error('Test failed');
            return { success: false };
        } finally {
            setTestingId(null);
        }
    }, []);

    const introspect = useCallback(async (id, { spreadsheetUrl } = {}) => {
        setIntrospectingId(id);
        try {
            const res = await api.introspectConnector(id, spreadsheetUrl ? { spreadsheetUrl } : {});
            setConnectors((prev) =>
                prev.map((c) => (c._id === id ? { ...c, dbSchema: res.data.schema } : c))
            );
            toast.success('Schema loaded');
            return res.data.schema;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Introspection failed');
            return null;
        } finally {
            setIntrospectingId(null);
        }
    }, []);

    const removeConnector = useCallback(async (id) => {
        try {
            await api.deleteConnector(id);
            setConnectors((prev) => prev.filter((c) => c._id !== id));
            setMcpTools((prev) => prev.filter((t) => t.connectorId !== id));
            toast.success('Connector deleted');
        } catch {
            toast.error('Failed to delete connector');
        }
    }, []);

    const addMcpTool = useCallback(async (toolDef) => {
        try {
            const res = await api.createMcpTool(toolDef);
            setMcpTools((prev) => [res.data.tool, ...prev]);
            toast.success('Tool created');
            return res.data.tool;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create tool');
            return null;
        }
    }, []);

    const updateMcpTool = useCallback(async ({ id, ...updates }) => {
        try {
            const res = await api.updateMcpTool(id, updates);
            setMcpTools((prev) => prev.map((t) => (t._id === id ? res.data.tool : t)));
            toast.success('Tool updated');
            return res.data.tool;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update tool');
            return null;
        }
    }, []);

    const toggleTool = useCallback(async (id, enabled) => {
        try {
            const res = await api.toggleMcpTool(id, enabled);
            setMcpTools((prev) => prev.map((t) => (t._id === id ? res.data.tool : t)));
        } catch {
            toast.error('Failed to toggle tool');
        }
    }, []);

    const removeMcpTool = useCallback(async (id) => {
        try {
            await api.deleteMcpTool(id);
            setMcpTools((prev) => prev.filter((t) => t._id !== id));
            toast.success('Tool deleted');
        } catch {
            toast.error('Failed to delete tool');
        }
    }, []);

    const testMcpTool = useCallback(async (id) => {
        try {
            const res = await api.testMcpTool(id);
            return res.data;
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Test failed' };
        }
    }, []);

    const connectGoogleSheets = useCallback(async (name) => {
        try {
            const res = await api.getGoogleSheetsAuthUrl(name);
            window.location.href = res.data.authUrl;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start Google auth');
        }
    }, []);

    const suggestTools = useCallback(async (connectorId) => {
        try {
            const res = await api.suggestMcpTools(connectorId);
            return res.data.suggestions || [];
        } catch {
            toast.error('Failed to load suggestions');
            return [];
        }
    }, []);

    return {
        connectors,
        mcpTools,
        loading,
        testingId,
        introspectingId,
        actions: {
            loadConnectors,
            loadMcpTools,
            addConnector,
            updateConnector,
            testBeforeSave,
            testConnector,
            introspect,
            removeConnector,
            addMcpTool,
            updateMcpTool,
            toggleTool,
            removeMcpTool,
            testMcpTool,
            suggestTools,
            connectGoogleSheets,
        },
    };
}
