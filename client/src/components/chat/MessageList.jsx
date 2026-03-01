import MessageBubble from './MessageBubble';
import ChartBubble from './ChartBubble';
import { useDashboard } from '../../context/DashboardContext';
import { Conversation, ConversationContent, ConversationScrollButton, ConversationEmptyState } from '../ai/conversation';
import { Suggestions, Suggestion } from '../ai/suggestion';

// Helper: extract charts injected as special messages
function isChartMessage(msg) {
  return msg?.role === 'chart' && msg?.chart;
}

const SUGGESTIONS = [
  'What is my total revenue?',
  'Show monthly expenses as a bar chart',
  'Create a 90-day growth plan',
  'Generate a monthly summary report',
];

export default function MessageList({ messages, onSend }) {
  const { charts } = useDashboard();

  if (messages.length === 0 && charts.length === 0) {
    return (
      <ConversationEmptyState className="flex-1 min-h-full px-4 py-6 space-y-6 max-w-3xl mx-auto w-full justify-center">
        <div className="w-16 h-16 bg-accent-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">B</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to BizCopilot</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Upload a CSV and ask me anything about your business data. I can analyze numbers, create charts,
          build strategic plans, and generate reports.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm max-w-md mx-auto w-full">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend?.(s)}
              className="bg-surface/50 rounded-2xl border border-white/5 p-4 text-gray-300 text-left hover:bg-surface hover:border-white/10 transition-all cursor-pointer flex flex-col gap-2 group shadow-sm hover:shadow-md"
            >
              <span>{s.replace(/\\n/g, ' ').trim()}</span>
            </button>
          ))}
        </div>
      </ConversationEmptyState>
    );
  }

  return (
    <Conversation className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full h-full relative">
      <ConversationContent className="gap-6 w-full max-w-full pb-8">
        {messages.map((msg, i) =>
          isChartMessage(msg) ? (
            <ChartBubble key={i} chart={msg.chart} />
          ) : (
            <MessageBubble key={i} message={msg} />
          )
        )}

        {/* Show any dashboard charts as inline bubbles at end of stream */}
        {charts.map((chart) => (
          <ChartBubble key={chart.id} chart={chart} />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
