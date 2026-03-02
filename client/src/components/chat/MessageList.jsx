import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ToolCallDisplay } from './ToolCallDisplay';
import { WelcomeScreen } from './WelcomeScreen';

export function MessageList({ messages, isStreaming, toolCalls, onSuggestionClick }) {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <WelcomeScreen onSuggestionClick={onSuggestionClick} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
            <div className="max-w-3xl mx-auto">
                {messages.map((msg) => (
                    <MessageBubble key={msg._id} message={msg} />
                ))}

                {/* Tool calls shown at the bottom during streaming */}
                {isStreaming && toolCalls?.length > 0 && (
                    <div className="max-w-[85%] ml-9">
                        <ToolCallDisplay toolCalls={toolCalls} isStreaming={isStreaming} />
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}
