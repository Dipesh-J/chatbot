import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ToolCallIndicator from './ToolCallIndicator';
import { Suggestions, Suggestion } from '../ai/suggestion';

const QUICK_SUGGESTIONS = [
  'Summarize my data',
  'Show a chart',
  'Create a report',
  'Top insights',
];

export default function ChatPanel({ messages, isStreaming, toolCalls, onSend, onUploadRequest }) {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <MessageList messages={messages} onSend={onSend} />
        {/* Inline "AI is thinking" indicator — appears below messages */}
        {toolCalls?.length > 0 && <ToolCallIndicator toolCalls={toolCalls} />}
      </div>

      {/* Suggestion pills between conversation and input (shown when messages exist) */}
      {messages.length > 0 && !isStreaming && (
        <Suggestions className="px-4 max-w-4xl mx-auto w-full pb-2">
          {QUICK_SUGGESTIONS.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={onSend}
              className="border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
            />
          ))}
        </Suggestions>
      )}

      <ChatInput onSend={onSend} onUploadRequest={onUploadRequest} disabled={isStreaming} />
    </div>
  );
}
