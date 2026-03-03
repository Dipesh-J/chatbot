import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Play, CheckCircle2, XCircle, Save } from 'lucide-react';

export function QueryToolBuilder({ open, onClose, connector, tableName, tool, onSave, onTest, onRunQuery }) {
    const isSheets = connector?.type === 'google_sheets';
    const defaultQuery = tool?.config?.query || (tableName
        ? (isSheets ? `'${tableName}'!A:Z` : `SELECT * FROM "${tableName}" LIMIT 100`)
        : '');
    const [name, setName] = useState(tool?.name || (tableName ? (isSheets ? `read_${tableName}` : `list_${tableName}`) : ''));
    const [description, setDescription] = useState(tool?.description || (tableName ? `Query data from ${tableName}` : ''));
    const [query, setQuery] = useState(defaultQuery);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleRunQuery = async () => {
        setRunning(true);
        setTestResult(null);
        try {
            const spreadsheetId = isSheets ? connector.dbSchema?.spreadsheetId : undefined;
            const result = await onRunQuery(connector._id, query, spreadsheetId);
            setTestResult(result);
        } catch (err) {
            setTestResult({ success: false, error: err.message || 'Query failed' });
        }
        setRunning(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const type = isSheets ? 'sheets_read' : 'sql_query';
        const spreadsheetId = isSheets ? connector.dbSchema?.spreadsheetId : undefined;
        const config = { query, parameters: tool?.config?.parameters || [] };
        if (spreadsheetId) config.spreadsheetId = spreadsheetId;
        const toolDef = tool?._id
            ? { id: tool._id, name, description, config }
            : { connectorId: connector._id, name, description, type, config };
        const result = await onSave(toolDef);
        setSaving(false);
        if (result) onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{tool?._id ? 'Edit' : 'Create'} Query Tool</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 flex-1">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tool Name</label>
                        <Input
                            placeholder="get_monthly_revenue"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <Input
                            placeholder="What does this tool do?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                            {isSheets ? 'Sheet Range' : 'SQL Query'}
                        </label>
                        <textarea
                            className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-y"
                            placeholder={isSheets ? "'Sheet1'!A:Z" : "SELECT * FROM ..."}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setTestResult(null);
                            }}
                        />
                    </div>

                    {/* Run query button — inline with the query editor */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunQuery}
                        disabled={running || !query.trim()}
                        className="w-full"
                    >
                        {running
                            ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                            : <Play className="w-3 h-3 mr-1.5" />
                        }
                        {running ? 'Running...' : 'Run Query'}
                    </Button>

                    {/* Query result preview */}
                    {testResult && (
                        <div className="space-y-2">
                            <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {testResult.success ? `${testResult.rowCount} rows returned${testResult.truncated ? ' (showing first 10)' : ''}` : testResult.error}
                            </div>
                            {testResult.success && testResult.data?.length > 0 && (
                                <div className="max-h-[200px] overflow-auto rounded-md border border-border/40">
                                    <table className="text-xs" style={{ minWidth: 'max-content' }}>
                                        <thead className="sticky top-0 bg-zinc-900 z-10">
                                            <tr className="border-b border-border/50">
                                                {Object.keys(testResult.data[0]).map((key) => (
                                                    <th key={key} className="text-left px-2.5 py-1.5 text-muted-foreground font-medium whitespace-nowrap">
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testResult.data.map((row, i) => (
                                                <tr key={i} className="border-b border-border/30">
                                                    {Object.values(row).map((val, j) => (
                                                        <td key={j} className="px-2.5 py-1.5 text-foreground whitespace-nowrap max-w-[250px] truncate">
                                                            {val === null ? <span className="text-muted-foreground/40">null</span> : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button onClick={handleSave} disabled={saving || !name || !query}>
                        {saving
                            ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            : <Save className="w-3 h-3 mr-1" />
                        }
                        {tool?._id ? 'Update' : 'Save'} Tool
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
