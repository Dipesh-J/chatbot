import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSessionCharts } from '../api/dashboard';
import { useSocket } from './SocketContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
    const { socket } = useSocket();
    const [charts, setCharts] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const prevSessionRef = useRef(null);

    const joinSession = useCallback(
        async (sessionId) => {
            if (!sessionId) return;

            // Leave previous session room
            if (socket && prevSessionRef.current) {
                socket.emit('leave:session', prevSessionRef.current);
            }

            setActiveSessionId(sessionId);
            prevSessionRef.current = sessionId;

            // Join new session room
            if (socket) {
                socket.emit('join:session', sessionId);
            }

            // Load existing charts
            try {
                const res = await getSessionCharts(sessionId);
                setCharts(res.data.charts || []);
            } catch {
                setCharts([]);
            }
        },
        [socket]
    );

    const clearCharts = useCallback(() => {
        setCharts([]);
    }, []);

    // Listen for real-time chart updates
    useEffect(() => {
        if (!socket) return;

        const handleChartUpdate = (chart) => {
            setCharts((prev) => {
                // Avoid duplicates
                const exists = prev.find((c) => c.id === chart.id);
                if (exists) return prev;
                return [...prev, chart];
            });
        };

        socket.on('dashboard:chart_update', handleChartUpdate);
        return () => {
            socket.off('dashboard:chart_update', handleChartUpdate);
        };
    }, [socket]);

    return (
        <DashboardContext.Provider value={{ charts, activeSessionId, joinSession, clearCharts }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
    return ctx;
}
