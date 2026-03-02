import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-zinc-700 text-muted-foreground hover:text-foreground"
            title="Copy response"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

export function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const isStreaming = message.isStreaming;

    if (isUser) {
        return (
            <div className="flex justify-end mb-4 animate-fade-in-up">
                <div className="max-w-[75%] flex items-end gap-2">
                    <div className="bg-primary/15 border border-primary/20 text-foreground rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
                        {message.content}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-border flex items-center justify-center shrink-0 mb-0.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-4 animate-fade-in-up group">
            <div className="max-w-[85%] flex items-start gap-2">
                {/* Bot avatar */}
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Thinking indicator */}
                    {isStreaming && !message.content && (
                        <div className="flex items-center gap-1 px-4 py-3 bg-zinc-900/60 border border-border rounded-2xl rounded-tl-sm w-fit">
                            <span className="text-xs text-muted-foreground mr-1">BizCopilot is thinking</span>
                            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        </div>
                    )}

                    {/* Message content */}
                    {message.content && (
                        <div className="relative bg-zinc-900/60 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className={cn('prose text-sm', isStreaming && 'streaming-cursor')}>
                                <ReactMarkdown
                                    components={{
                                        // Custom code block rendering
                                        code({ inline, className, children, ...props }) {
                                            return inline ? (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <pre>
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            );
                                        },
                                        // Open links in new tab
                                        a({ href, children, ...props }) {
                                            return (
                                                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                                    {children}
                                                </a>
                                            );
                                        },
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>

                            {/* Copy button — only for completed messages */}
                            {!isStreaming && (
                                <div className="absolute top-2 right-2">
                                    <CopyButton text={message.content} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
