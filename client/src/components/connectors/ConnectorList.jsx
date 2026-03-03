import { Database, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function ConnectorList({ connectors, onTest, onIntrospect, onEdit, onDelete }) {
    return (
        <div className="space-y-2">
            {connectors.map((connector) => (
                <div
                    key={connector._id}
                    className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-border/50 rounded-xl"
                >
                    <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{connector.name}</span>
                            <span
                                className={cn(
                                    'w-2 h-2 rounded-full shrink-0',
                                    connector.status === 'connected' ? 'bg-green-500' : connector.status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
                                )}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground/60">
                            {connector.type} {connector.dbSchema?.tables?.length ? `\u00b7 ${connector.dbSchema.tables.length} tables` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTest(connector._id)} title="Test">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onIntrospect(connector)} title="Browse Schema">
                            <Search className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(connector)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={() => onDelete(connector._id)} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
