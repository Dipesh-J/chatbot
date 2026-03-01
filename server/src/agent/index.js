import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import env from '../config/env.js';
import { buildSystemPrompt } from './prompts/system.js';
import { getSessionHistory } from './memory/sessionMemory.js';
import financialAnalysis from './tools/financialAnalysis.js';
import createVisualization from './tools/visualization.js';
import generateStrategy from './tools/strategy.js';
import generateReport from './tools/reportGenerator.js';
import shareToSlack from './tools/slackIntegration.js';

const tools = [financialAnalysis, createVisualization, generateStrategy, generateReport, shareToSlack];

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: env.GEMINI_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 4096,
});

const agent = createReactAgent({
  llm,
  tools,
});

export async function runAgent({ userMessage, user, dataSources, sessionId }) {
  const systemPrompt = buildSystemPrompt(user, dataSources);
  const history = await getSessionHistory(sessionId);

  const messages = [
    new SystemMessage(systemPrompt),
    ...history.map(([role, content]) =>
      role === 'human' ? new HumanMessage(content) : new AIMessage(content)
    ),
    new HumanMessage(userMessage),
  ];

  let result;
  try {
    result = await agent.invoke(
      { messages },
      { configurable: { userId: user._id.toString(), sessionId } }
    );
  } catch (error) {
    console.error('Agent execution error:', error);
    return {
      content: 'I encountered an error processing your request. Please try again.',
      toolCalls: [],
      charts: [],
    };
  }

  const lastMessage = result.messages[result.messages.length - 1];

  // Collect tool calls from intermediate messages
  const toolCalls = [];
  for (const msg of result.messages) {
    if (msg.additional_kwargs?.tool_calls) {
      for (const tc of msg.additional_kwargs.tool_calls) {
        toolCalls.push({
          toolName: tc.function?.name,
          args: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
        });
      }
    }
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        toolCalls.push({ toolName: tc.name, args: tc.args });
      }
    }
  }

  // Extract chart configs from tool messages securely
  const charts = [];
  for (const msg of result.messages) {
    if (msg._getType?.() === 'tool' || msg.constructor?.name === 'ToolMessage') {
      if (msg.name === 'create_visualization' || msg.name === 'createVisualizationTool') {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.chart) charts.push(parsed.chart);
        } catch { }
      }
    }
  }

  return {
    content: lastMessage.content,
    toolCalls,
    charts,
  };
}

export async function streamAgent({ userMessage, user, dataSources, sessionId, onToken, onToolCall }) {
  const systemPrompt = buildSystemPrompt(user, dataSources);
  const history = await getSessionHistory(sessionId);

  const messages = [
    new SystemMessage(systemPrompt),
    ...history.map(([role, content]) =>
      role === 'human' ? new HumanMessage(content) : new AIMessage(content)
    ),
    new HumanMessage(userMessage),
  ];

  let stream;
  try {
    stream = await agent.stream(
      { messages },
      { configurable: { userId: user._id.toString(), sessionId }, streamMode: 'updates' }
    );
  } catch (error) {
    console.error('Agent stream error:', error);
    const errorText = 'I encountered an error processing your request. Please try again.';
    if (onToken) onToken(errorText);
    return { content: errorText, toolCalls: [], charts: [] };
  }

  let finalContent = '';
  const toolCalls = [];
  const charts = [];

  for await (const update of stream) {
    for (const [nodeName, nodeOutput] of Object.entries(update)) {
      if (!nodeOutput.messages) continue;

      for (const msg of nodeOutput.messages) {
        // Collect tool calls
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            const tcData = { toolName: tc.name, args: tc.args };
            toolCalls.push(tcData);
            if (onToolCall) onToolCall(tcData);
          }
        }

        // Extract charts from tool results securely
        if (msg._getType?.() === 'tool' || msg.constructor?.name === 'ToolMessage') {
          if (msg.name === 'create_visualization' || msg.name === 'createVisualizationTool') {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.chart) charts.push(parsed.chart);
            } catch { }
          }
        }

        // Stream AI text content
        if ((msg._getType?.() === 'ai' || msg.constructor?.name === 'AIMessage') && msg.content && !msg.tool_calls?.length) {
          finalContent = msg.content;
          if (onToken) onToken(msg.content);
        }
      }
    }
  }

  return { content: finalContent, toolCalls, charts };
}
