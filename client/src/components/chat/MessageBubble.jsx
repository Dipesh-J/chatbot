import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Message, MessageContent, MessageResponse, MessageAction, MessageActions } from '../ai/message';
import { Tool, ToolHeader, ToolContent, ToolInput } from '../ai/tool';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '../ai/reasoning';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  if (isUser) {
    return (
      <Message from="user" className="w-full">
        <MessageContent className="bg-[#27272A] text-gray-100 shadow-sm border border-border px-4 py-[10px] pb-3 rounded-2xl ml-auto">
          <div className="whitespace-pre-wrap text-[14.5px] font-normal">{message.content}</div>
        </MessageContent>
      </Message>
    );
  }

  // AI messages — structure follows the reference:
  // <Message> > <div> > [Reasoning] [Tool calls] <MessageContent> <MessageActions>
  return (
    <Message from="assistant" className="w-full mb-4">
      <div>
        {/* Reasoning block (for messages that had thinking) */}
        {message.reasoning && (
          <Reasoning duration={message.reasoning.duration}>
            <ReasoningTrigger />
            <ReasoningContent>{message.reasoning.content}</ReasoningContent>
          </Reasoning>
        )}

        {/* Inline tool calls rendered above the response text */}
        {message.toolCalls?.length > 0 && (
          <div className="space-y-2 mb-3">
            {message.toolCalls.map((tc, i) => (
              <Tool key={i} defaultOpen={false}>
                <ToolHeader
                  title={tc.toolName}
                  type="function"
                  state={tc.state || 'output-available'}
                />
                <ToolContent>
                  <ToolInput input={tc.args} />
                </ToolContent>
              </Tool>
            ))}
          </div>
        )}

        <MessageContent className="group relative pr-10 text-gray-200 leading-relaxed">
          <div className="prose prose-sm prose-invert max-w-none w-full !text-gray-200">
            <MessageResponse>
              {message.content || ''}
            </MessageResponse>
          </div>

          <MessageActions className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction
              onClick={handleCopy}
              tooltip="Copy markdown"
              className="text-gray-500 hover:text-gray-300 w-auto h-auto p-1 text-xs"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
            </MessageAction>
          </MessageActions>
        </MessageContent>
      </div>
    </Message>
  );
}
