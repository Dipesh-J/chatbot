import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createSession,
  deleteSession,
  getMessages,
  getSessions,
  sendMessageStream,
} from '../api/chat';
import { useDashboard } from '../context/DashboardContext';

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState([]);
  const abortControllerRef = useRef(null);
  const { joinSession, clearCharts } = useDashboard();

  const loadSessions = useCallback(async () => {
    try {
      const res = await getSessions();
      setSessions(res.data.sessions || []);
      return res.data.sessions || [];
    } catch (err) {
      toast.error('Failed to load sessions');
      return [];
    }
  }, []);

  const startNewSession = useCallback(async () => {
    try {
      const res = await createSession();
      const session = res.data.session;
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      clearCharts();
      joinSession(session._id);
      return session;
    } catch (err) {
      toast.error('Failed to create session');
    }
  }, [joinSession, clearCharts]);

  const selectSession = useCallback(
    async (session) => {
      if (activeSession?._id === session._id) return;
      setActiveSession(session);
      setMessages([]);
      clearCharts();
      joinSession(session._id);

      try {
        const res = await getMessages(session._id);
        setMessages(res.data.messages || []);
      } catch {
        toast.error('Failed to load messages');
      }
    },
    [activeSession, joinSession, clearCharts]
  );

  const sendMessage = useCallback(
    async (content) => {
      if (!activeSession || isStreaming) return;

      // Optimistically add user message
      const userMsg = {
        _id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      // Placeholder assistant message
      const assistantId = `temp-assistant-${Date.now()}`;
      const assistantMsg = {
        _id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setToolCalls([]);

      try {
        const response = await sendMessageStream(activeSession._id, content);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const event = JSON.parse(dataStr);

              if (event.type === 'token') {
                fullContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === assistantId
                      ? { ...m, content: fullContent, isStreaming: true }
                      : m
                  )
                );
              } else if (event.type === 'tool_call') {
                setToolCalls((prev) => [
                  ...prev,
                  {
                    id: `tc-${Date.now()}`,
                    toolName: event.toolName,
                    args: event.args,
                    status: 'running',
                  },
                ]);
              } else if (event.type === 'done') {
                fullContent = event.content || fullContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === assistantId
                      ? { ...m, content: fullContent, isStreaming: false }
                      : m
                  )
                );
                // Update session title if it changed (first message)
                setSessions((prev) =>
                  prev.map((s) =>
                    s._id === activeSession._id
                      ? { ...s, title: content.slice(0, 60) }
                      : s
                  )
                );
              } else if (event.type === 'error') {
                toast.error(event.content || 'An error occurred');
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === assistantId
                      ? { ...m, content: event.content || 'Error occurred.', isStreaming: false }
                      : m
                  )
                );
              }
            } catch {
              // Non-JSON line, skip
            }
          }
        }
      } catch (err) {
        toast.error('Failed to send message');
        setMessages((prev) =>
          prev.map((m) =>
            m._id === assistantId ? { ...m, content: 'Failed to get response.', isStreaming: false } : m
          )
        );
      } finally {
        setIsStreaming(false);
        setToolCalls([]);
      }
    },
    [activeSession, isStreaming]
  );

  const removeSession = useCallback(
    async (sessionId) => {
      try {
        await deleteSession(sessionId);
        setSessions((prev) => {
          const remaining = prev.filter((s) => s._id !== sessionId);
          if (activeSession?._id === sessionId) {
            if (remaining.length > 0) {
              selectSession(remaining[0]);
            } else {
              setActiveSession(null);
              setMessages([]);
              clearCharts();
            }
          }
          return remaining;
        });
        toast.success('Chat deleted');
      } catch {
        toast.error('Failed to delete session');
      }
    },
    [activeSession, selectSession, clearCharts]
  );

  return {
    sessions,
    activeSession,
    messages,
    isStreaming,
    toolCalls,
    loadSessions,
    startNewSession,
    selectSession,
    sendMessage,
    removeSession,
  };
}
