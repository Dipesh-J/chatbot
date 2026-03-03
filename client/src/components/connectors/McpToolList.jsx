import { Wrench, Pencil, Trash2, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function McpToolList({ tools, onToggle, onEdit, onDelete, onTest }) {
    return (
        <div className="space-y-2">
            {tools.map((tool) => (
                <div
                    key={tool._id}
                    className={cn(
                        'flex items-center gap-3 p-3 bg-zinc-900/40 border border-border/50 rounded-xl transition-opacity',
                        !tool.enabled && 'opacity-50'
                    )}
                >
                    <Wrench className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground/60 truncate">{tool.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onToggle(tool._id, !tool.enabled)}
                            className={cn(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                                tool.enabled ? 'bg-primary' : 'bg-zinc-700'
                            )}
                            title={tool.enabled ? 'Disable' : 'Enable'}
                        >
                            <span
                                className={cn(
                                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                    tool.enabled ? 'translate-x-4' : 'translate-x-0'
                                )}
                            />
                        </button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTest(tool._id)} title="Test">
                            <Play className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tool)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={() => onDelete(tool._id)} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
