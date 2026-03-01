import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { getCharts } from '../api/dashboard';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const socket = useSocket();
  const [charts, setCharts] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleChartUpdate = (chart) => {
      setCharts((prev) => {
        const exists = prev.find((c) => c.id === chart.id);
        if (exists) return prev.map((c) => (c.id === chart.id ? chart : c));
        return [...prev, chart];
      });
    };

    socket.on('dashboard:chart_update', handleChartUpdate);
    return () => socket.off('dashboard:chart_update', handleChartUpdate);
  }, [socket]);

  const joinSession = useCallback(
    async (sessionId) => {
      if (socket && activeSessionId) {
        socket.emit('leave:session', activeSessionId);
      }

      setActiveSessionId(sessionId);

      if (socket) {
        socket.emit('join:session', sessionId);
      }

      try {
        const res = await getCharts(sessionId);
        setCharts(res.data.charts || []);
      } catch {
        setCharts([]);
      }
    },
    [socket, activeSessionId]
  );

  const clearCharts = useCallback(() => setCharts([]), []);

  return (
    <DashboardContext.Provider value={{ charts, activeSessionId, joinSession, clearCharts }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
