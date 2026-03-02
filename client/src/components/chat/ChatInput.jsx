import { useRef, useState, useEffect, useCallback } from 'react';
import { Send, Paperclip, Square, ChevronDown, FileUp, BarChart2, FileText, X, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

const REPORT_PROMPT =
    'Generate a comprehensive business report based on the uploaded data, including key metrics, trends, and actionable insights.';
const DASHBOARD_PROMPT =
    'Generate an interactive dashboard with charts and visualizations based on the uploaded data.';

export function ChatInput({ onSend, isStreaming, hasMessages, onUploadClick }) {
    const [value, setValue] = useState('');
    const [selectedModel, setSelectedModel] = useState(MODELS[0]);
    const [modelOpen, setModelOpen] = useState(false);
    const [attachOpen, setAttachOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const modelRef = useRef(null);
    const attachRef = useRef(null);
    const dragCounterRef = useRef(0);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [value]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false);
            if (attachRef.current && !attachRef.current.contains(e.target)) setAttachOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSubmit = useCallback(() => {
        const trimmed = value.trim();
        if ((!trimmed && attachedFiles.length === 0) || isStreaming) return;
        onSend(trimmed || 'Sent with attachments');
        setValue('');
        setAttachedFiles([]);
    }, [value, attachedFiles, isStreaming, onSend]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFiles = useCallback((files) => {
        const fileArr = Array.from(files);
        setAttachedFiles((prev) => [
            ...prev,
            ...fileArr.map((f) => ({ name: f.name, size: f.size, type: f.type, file: f, id: `${f.name}-${Date.now()}` })),
        ]);
    }, []);

    // Drag-and-drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounterRef.current++;
        if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (id) => setAttachedFiles((prev) => prev.filter((f) => f.id !== id));

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const injectPrompt = (prompt) => {
        setValue(prompt);
        textareaRef.current?.focus();
    };

    return (
        <div
            className="shrink-0 bg-background px-4 pt-2 pb-4"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="max-w-4xl mx-auto space-y-2">
                {/* Drag overlay — fixed so it covers the whole chat pane */}
                {isDragging && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm pointer-events-none">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-3xl px-16 py-12 bg-zinc-900/50">
                            <FileUp className="w-12 h-12 text-primary mb-4 animate-bounce" />
                            <p className="text-xl font-semibold text-primary">Drop files here</p>
                            <p className="text-sm text-muted-foreground mt-1">Release to attach to your message</p>
                        </div>
                    </div>
                )}

                {/* Attached files preview */}
                {attachedFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {attachedFiles.map((f) => (
                            <div
                                key={f.id}
                                className="flex items-center gap-2 bg-zinc-900 border border-border rounded-xl px-3 py-2 text-xs group"
                            >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate max-w-[140px]">{f.name}</p>
                                    <p className="text-muted-foreground">{formatFileSize(f.size)}</p>
                                </div>
                                <button
                                    onClick={() => removeFile(f.id)}
                                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input box */}
                <div
                    className={cn(
                        'rounded-2xl border bg-zinc-900/60 px-4 pt-3 pb-2 transition-all duration-200',
                        isDragging
                            ? 'border-primary ring-1 ring-primary'
                            : isStreaming
                                ? 'border-primary/30'
                                : 'border-border hover:border-zinc-600 focus-within:border-zinc-500'
                    )}
                >
                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isDragging
                                ? 'Drop files to attach...'
                                : isStreaming
                                    ? 'BizCopilot is thinking...'
                                    : 'Ask about your business data...'
                        }
                        disabled={isStreaming}
                        rows={1}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none leading-relaxed max-h-[200px] disabled:opacity-50 mb-2"
                    />

                    {/* Footer: left tools + right send */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Left tools */}
                        <div className="flex items-center gap-1">
                            {/* Attachment dropdown */}
                            <div className="relative" ref={attachRef}>
                                <button
                                    type="button"
                                    onClick={() => setAttachOpen((p) => !p)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                {attachOpen && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]">
                                        <button
                                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground hover:bg-zinc-800 transition-colors"
                                            onClick={() => {
                                                setAttachOpen(false);
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <FileUp className="w-4 h-4 text-muted-foreground" />
                                            Upload File
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Generate Report button */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    onClick={() => injectPrompt(REPORT_PROMPT)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden group-hover:inline text-xs font-medium whitespace-nowrap">Generate Report</span>
                                </button>
                            </div>

                            {/* Generate Dashboard button */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    onClick={() => injectPrompt(DASHBOARD_PROMPT)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    <span className="hidden group-hover:inline text-xs font-medium whitespace-nowrap">Generate Dashboard</span>
                                </button>
                            </div>

                            {/* Model selector */}
                            <div className="relative" ref={modelRef}>
                                <button
                                    type="button"
                                    onClick={() => setModelOpen((p) => !p)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-all border border-transparent hover:border-border"
                                >
                                    <span className="font-medium">{selectedModel.name}</span>
                                    <ChevronDown className={cn('w-3 h-3 transition-transform', modelOpen && 'rotate-180')} />
                                </button>
                                {modelOpen && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[200px]">
                                        {['OpenAI', 'Google', 'Anthropic'].map((provider) => {
                                            const providerModels = MODELS.filter((m) => m.provider === provider);
                                            if (providerModels.length === 0) return null;
                                            return (
                                                <div key={provider}>
                                                    <p className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                                                        {provider}
                                                    </p>
                                                    {providerModels.map((m) => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => {
                                                                setSelectedModel(m);
                                                                setModelOpen(false);
                                                            }}
                                                            className={cn(
                                                                'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                                                selectedModel.id === m.id
                                                                    ? 'text-primary bg-primary/10'
                                                                    : 'text-foreground hover:bg-zinc-800'
                                                            )}
                                                        >
                                                            {m.name}
                                                            {selectedModel.id === m.id && (
                                                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                        <div className="h-1" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Send / Stop */}
                        <button
                            type="button"
                            onClick={isStreaming ? undefined : handleSubmit}
                            disabled={!isStreaming && !value.trim() && attachedFiles.length === 0}
                            className={cn(
                                'p-2 rounded-xl transition-all shrink-0',
                                isStreaming
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer'
                                    : value.trim() || attachedFiles.length > 0
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                                        : 'bg-zinc-800 text-muted-foreground/50 cursor-not-allowed'
                            )}
                            title={isStreaming ? 'Stop' : 'Send message'}
                        >
                            {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground/40 text-center">
                    BizCopilot can make mistakes. Check important information.
                </p>
            </div>

            {/* Hidden file input for native OS file picker */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }
                }}
            />
        </div>
    );
}
