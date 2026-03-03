import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export function MentionDropdown({ tools, query, position, selectedIndex, onSelect, onClose }) {
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (!ref.current) return;
        const item = ref.current.querySelector(`[data-index="${selectedIndex}"]`);
        item?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (tools.length === 0) return null;

    const typeBadgeColor = {
        sql_query: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        sheets_read: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    return (
        <div
            ref={ref}
            className="absolute z-50 bg-zinc-900 border border-border rounded-xl shadow-xl overflow-hidden min-w-[260px] max-w-[340px]"
            style={{
                bottom: `calc(100% - ${position.top}px + 4px)`,
                left: `${position.left}px`,
            }}
        >
            <div className="px-3 py-2 border-b border-border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                    Tools
                </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
                {tools.slice(0, 10).map((tool, i) => (
                    <button
                        key={tool._id || tool.name}
                        data-index={i}
                        onClick={() => onSelect(tool)}
                        className={cn(
                            'flex items-center gap-2 w-full px-3 py-2 text-left transition-colors',
                            i === selectedIndex
                                ? 'bg-primary/15 text-foreground'
                                : 'text-foreground hover:bg-zinc-800'
                        )}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tool.name}</p>
                            {tool.description && (
                                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                            )}
                        </div>
                        <span
                            className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0',
                                typeBadgeColor[tool.type] || 'bg-zinc-800 text-muted-foreground border-border'
                            )}
                        >
                            {tool.type}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
