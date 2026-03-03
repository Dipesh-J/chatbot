import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronRight, ChevronDown, Table2, Plus, Loader2, Sparkles, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SchemaBrowser({ open, onClose, connector, connectors, onCreateTool, suggestTools, onSaveTool, onIntrospect }) {
    const [expanded, setExpanded] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
    const [loadingSheet, setLoadingSheet] = useState(false);

    // Re-read connector from connectors array to get updated schema
    const current = connectors.find((c) => c._id === connector._id) || connector;
    const isSheets = current.type === 'google_sheets';
    const tables = current.dbSchema?.tables || [];

    const handleLoadSheet = async () => {
        if (!spreadsheetUrl || !onIntrospect) return;
        setLoadingSheet(true);
        await onIntrospect(current._id, { spreadsheetUrl });
        setLoadingSheet(false);
    };

    const toggle = (tableName) => {
        setExpanded((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
    };

    const handleLoadSuggestions = async () => {
        setLoadingSuggestions(true);
        const result = await suggestTools(current._id);
        setSuggestions(result);
        setLoadingSuggestions(false);
    };

    const handleAcceptSuggestion = async (suggestion) => {
        await onSaveTool({
            connectorId: current._id,
            name: suggestion.name,
            description: suggestion.description,
            config: suggestion.config,
        });
        setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Schema: {current.name}</DialogTitle>
                </DialogHeader>

                {isSheets && (
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Spreadsheet URL or ID</label>
                            <Input
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={spreadsheetUrl}
                                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleLoadSheet}
                            disabled={loadingSheet || !spreadsheetUrl}
                        >
                            {loadingSheet ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                            Load
                        </Button>
                    </div>
                )}

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {tables.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No tables found. Try introspecting the connection first.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {tables.map((table) => (
                                <div key={table.name}>
                                    <button
                                        onClick={() => toggle(table.name)}
                                        className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-accent/60 transition-colors"
                                    >
                                        {expanded[table.name] ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        )}
                                        <Table2 className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-sm font-medium text-foreground">{table.name}</span>
                                        <span className="text-[10px] text-muted-foreground/60 bg-zinc-800 px-1.5 py-0.5 rounded">
                                            {table.rowCount?.toLocaleString()} rows
                                        </span>
                                        <div className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCreateTool(current, table.name);
                                            }}
                                            title="Create Query Tool"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </button>

                                    {expanded[table.name] && (
                                        <div className="ml-8 mb-2 space-y-0.5">
                                            {table.columns.map((col) => (
                                                <div
                                                    key={col.name}
                                                    className="flex items-center gap-2 text-xs py-1 px-2"
                                                >
                                                    <span className={cn('text-foreground', col.isPrimaryKey && 'font-semibold')}>
                                                        {col.name}
                                                        {col.isPrimaryKey && ' *'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/60 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                                                        {col.dataType}
                                                    </span>
                                                    {col.nullable && (
                                                        <span className="text-[10px] text-muted-foreground/40">nullable</span>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-primary mt-1"
                                                onClick={() => onCreateTool(current, table.name)}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Create Query Tool
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions section */}
                    {tables.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Tools</h3>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleLoadSuggestions} disabled={loadingSuggestions}>
                                    {loadingSuggestions ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                    Generate
                                </Button>
                            </div>
                            {suggestions.length > 0 && (
                                <div className="space-y-1.5">
                                    {suggestions.map((s) => (
                                        <div key={s.name} className="flex items-center gap-2 p-2 bg-zinc-900/40 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary shrink-0" onClick={() => handleAcceptSuggestion(s)}>
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
