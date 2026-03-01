import { useState, useCallback } from 'react';
import * as chatApi from '../api/chat';

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState([]);

  const loadSessions = useCallback(async () => {
    const res = await chatApi.getSessions();
    setSessions(res.data.sessions);
  }, []);

  const createSession = useCallback(async () => {
    const res = await chatApi.createSession();
    const session = res.data.session;
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    return session;
  }, []);

  const selectSession = useCallback(async (session) => {
    setActiveSession(session);
    const res = await chatApi.getMessages(session._id);
    setMessages(res.data.messages);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (isStreaming) return;

      // Auto-create a session if none is active
      let session = activeSession;
      if (!session) {
        const res = await chatApi.createSession();
        session = res.data.session;
        setSessions((prev) => [session, ...prev]);
        setActiveSession(session);
      }

      const userMsg = { role: 'user', content, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setToolCalls([]);

      let assistantContent = '';
      const assistantMsg = { role: 'assistant', content: '', createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMsg]);

      await chatApi.sendMessage(session._id, content, (event) => {
        if (event.type === 'token') {
          // Mark any running tool calls as output-available
          setToolCalls((prev) => {
            const hasRunning = prev.some((t) => t.state !== 'output-available');
            if (!hasRunning) return prev;
            return prev.map((t) =>
              t.state !== 'output-available' ? { ...t, state: 'output-available' } : t
            );
          });
          assistantContent = event.content;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
            return updated;
          });
        } else if (event.type === 'tool_call') {
          setToolCalls((prev) => [
            ...prev,
            { toolName: event.toolName || event.tool || 'tool', args: event.args || event.input || {}, state: 'input-available' },
          ]);
        } else if (event.type === 'done') {
          assistantContent = event.content;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
            return updated;
          });
        } else if (event.type === 'error') {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: event.content };
            return updated;
          });
        }
      });

      setIsStreaming(false);
      setToolCalls([]);

      // Update session title in sidebar
      setSessions((prev) =>
        prev.map((s) =>
          s._id === session._id
            ? { ...s, title: content.slice(0, 60) + (content.length > 60 ? '...' : '') }
            : s
        )
      );
    },
    [activeSession, isStreaming]
  );

  const removeSession = useCallback(
    async (sessionId) => {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSession?._id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    },
    [activeSession]
  );

  return {
    sessions,
    activeSession,
    messages,
    isStreaming,
    toolCalls,
    loadSessions,
    createSession,
    selectSession,
    sendMessage,
    removeSession,
  };
}
