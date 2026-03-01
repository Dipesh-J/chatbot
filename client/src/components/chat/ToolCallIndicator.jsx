import { Tool, ToolHeader, ToolContent, ToolInput } from '../ai/tool';
import { Reasoning, ReasoningTrigger } from '../ai/reasoning';
import { Message } from '../ai/message';
import { Shimmer } from '../ai/shimmer';

function getToolLabel(toolName, args) {
  const labels = {
    query_database: 'Querying your data...',
    create_chart: 'Creating a chart...',
    generate_report: 'Generating report...',
    analyze_data: 'Analyzing data...',
    search: 'Searching...',
    calculate: 'Calculating...',
  };
  return labels[toolName] || 'Processing...';
}

export default function ToolCallIndicator({ toolCalls }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <Message from="assistant" className="w-full max-w-4xl mx-auto px-4">
      <div className="space-y-2">
        <Reasoning isStreaming defaultOpen={false}>
          <ReasoningTrigger
            getThinkingMessage={(isStreaming) =>
              isStreaming ? 'BizCopilot is thinking...' : 'Finished thinking'
            }
          />
        </Reasoning>

        {toolCalls.map((tc, i) => (
          <Tool key={i} defaultOpen={false}>
            <ToolHeader
              title={getToolLabel(tc.toolName, tc.args)}
              type="function"
              state={tc.state}
            />
            <ToolContent>
              <ToolInput input={tc.args} />
            </ToolContent>
          </Tool>
        ))}
      </div>
    </Message>
  );
}
