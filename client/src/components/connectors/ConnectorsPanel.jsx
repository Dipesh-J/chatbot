import { useState } from 'react';
import { Database, Sheet } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { ConnectorTypeCard } from './ConnectorTypeCard';
import { ConnectorList } from './ConnectorList';
import { McpToolList } from './McpToolList';
import { SqlConnectionForm } from './SqlConnectionForm';
import { GoogleSheetsConnectionForm } from './GoogleSheetsConnectionForm';
import { SchemaBrowser } from './SchemaBrowser';
import { QueryToolBuilder } from './QueryToolBuilder';

export function ConnectorsPanel({ connectors, mcpTools, actions }) {
    const [connectionFormType, setConnectionFormType] = useState(null);
    const [schemaBrowserConnector, setSchemaBrowserConnector] = useState(null);
    const [queryBuilderState, setQueryBuilderState] = useState(null);
    const [editingConnector, setEditingConnector] = useState(null);
    const [editingTool, setEditingTool] = useState(null);

    const connectorTypes = [
        { type: 'postgresql', name: 'PostgreSQL', icon: Database, description: 'Connect to a PostgreSQL database' },
        { type: 'mysql', name: 'MySQL', icon: Database, description: 'Connect to a MySQL database' },
        { type: 'google_sheets', name: 'Google Sheets', icon: Sheet, description: 'Connect to Google Sheets' },
    ];

    const handleCreateTool = (connector, tableName) => {
        setQueryBuilderState({ connector, tableName });
        setSchemaBrowserConnector(null);
    };

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Add Connector */}
                <section>
                    <h2 className="text-sm font-medium text-foreground mb-3">Add Connector</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {connectorTypes.map((ct) => (
                            <ConnectorTypeCard
                                key={ct.type}
                                name={ct.name}
                                icon={ct.icon}
                                description={ct.description}
                                disabled={ct.disabled}
                                onClick={() => setConnectionFormType(ct.type)}
                            />
                        ))}
                    </div>
                </section>

                {/* Active Connections */}
                <section>
                    <h2 className="text-sm font-medium text-foreground mb-3">Active Connections</h2>
                    {connectors.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground/60">
                            No connections yet. Add a connector above.
                        </div>
                    ) : (
                        <ConnectorList
                            connectors={connectors}
                            onTest={actions.testConnector}
                            onIntrospect={(c) => {
                                if (c.type !== 'google_sheets') {
                                    actions.introspect(c._id);
                                }
                                setSchemaBrowserConnector(c);
                            }}
                            onEdit={(c) => {
                                if (c.type === 'google_sheets') return; // OAuth-managed, no editable fields
                                setEditingConnector(c);
                                setConnectionFormType(c.type);
                            }}
                            onDelete={actions.removeConnector}
                        />
                    )}
                </section>

                {/* Query Tools (MCP) */}
                <section>
                    <h2 className="text-sm font-medium text-foreground mb-3">Query Tools (MCP)</h2>
                    {mcpTools.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground/60">
                            No query tools yet. Browse a schema and create tools from your tables.
                        </div>
                    ) : (
                        <McpToolList
                            tools={mcpTools}
                            onToggle={actions.toggleTool}
                            onEdit={(t) => {
                                setEditingTool(t);
                                setQueryBuilderState({ connector: connectors.find(c => c._id === t.connectorId), tool: t });
                            }}
                            onDelete={actions.removeMcpTool}
                            onTest={actions.testMcpTool}
                        />
                    )}
                </section>
            </div>

            {/* Dialogs */}
            {connectionFormType && connectionFormType === 'google_sheets' ? (
                <GoogleSheetsConnectionForm
                    open={true}
                    onClose={() => { setConnectionFormType(null); setEditingConnector(null); }}
                    onConnect={actions.connectGoogleSheets}
                />
            ) : connectionFormType ? (
                <SqlConnectionForm
                    open={!!connectionFormType}
                    onClose={() => { setConnectionFormType(null); setEditingConnector(null); }}
                    type={connectionFormType}
                    connector={editingConnector}
                    onTestBeforeSave={actions.testBeforeSave}
                    onSave={editingConnector ? actions.updateConnector : actions.addConnector}
                />
            ) : null}

            {schemaBrowserConnector && (
                <SchemaBrowser
                    open={!!schemaBrowserConnector}
                    onClose={() => setSchemaBrowserConnector(null)}
                    connector={schemaBrowserConnector}
                    connectors={connectors}
                    onCreateTool={handleCreateTool}
                    suggestTools={actions.suggestTools}
                    onSaveTool={actions.addMcpTool}
                    onIntrospect={actions.introspect}
                />
            )}

            {queryBuilderState && (
                <QueryToolBuilder
                    open={!!queryBuilderState}
                    onClose={() => { setQueryBuilderState(null); setEditingTool(null); }}
                    connector={queryBuilderState.connector}
                    tableName={queryBuilderState.tableName}
                    tool={queryBuilderState.tool || editingTool}
                    onSave={editingTool ? actions.updateMcpTool : actions.addMcpTool}
                    onTest={actions.testMcpTool}
                />
            )}
        </ScrollArea>
    );
}
