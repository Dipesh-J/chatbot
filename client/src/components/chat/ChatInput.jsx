import { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

const QUICK_SUGGESTIONS = [
    'Summarize my data',
    'Show a chart',
    'Create a report',
    'Top insights',
];

export function ChatInput({ onSend, isStreaming, hasMessages, onUploadClick }) {
    const [value, setValue] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [value]);

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (!trimmed || isStreaming) return;
        onSend(trimmed);
        setValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-4">
            <div className="max-w-3xl mx-auto space-y-2">
                {/* Quick suggestion pills — shown when chat has messages */}
                {hasMessages && !isStreaming && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {QUICK_SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => onSend(s)}
                                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-zinc-900/60 text-muted-foreground hover:text-foreground hover:border-zinc-600 hover:bg-zinc-900 transition-all"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input area */}
                <div
                    className={cn(
                        'flex items-end gap-2 rounded-2xl border bg-zinc-900/60 px-4 py-3 transition-all duration-200',
                        isStreaming ? 'border-primary/30' : 'border-border hover:border-zinc-600 focus-within:border-zinc-500'
                    )}
                >
                    {/* Attach / Upload button */}
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="mb-0.5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all shrink-0"
                        title="Upload CSV data"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isStreaming ? 'BizCopilot is thinking...' : 'Ask about your business data...'}
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none leading-relaxed max-h-[200px] disabled:opacity-50"
                    />

                    {/* Send / Stop button */}
                    <button
                        type="button"
                        onClick={isStreaming ? undefined : handleSubmit}
                        disabled={!isStreaming && !value.trim()}
                        className={cn(
                            'mb-0.5 p-2 rounded-xl transition-all shrink-0',
                            isStreaming
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer'
                                : value.trim()
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                                    : 'bg-zinc-800 text-muted-foreground/50 cursor-not-allowed'
                        )}
                        title={isStreaming ? 'Stop' : 'Send message'}
                    >
                        {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <p className="text-xs text-muted-foreground/40 text-center">
                    BizCopilot can make mistakes. Check important information.
                </p>
            </div>
        </div>
    );
}
