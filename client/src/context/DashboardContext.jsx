import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSessionCharts } from '../api/dashboard';
import { useSocket } from './SocketContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
    const { socket } = useSocket();
    const [charts, setCharts] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const activeSessionRef = useRef(null); // always up-to-date without causing re-renders

    const joinSession = useCallback(
        async (sessionId) => {
            if (!sessionId) return;

            // Leave previous session room
            if (socket && activeSessionRef.current && activeSessionRef.current !== sessionId) {
                socket.emit('leave:session', activeSessionRef.current);
            }

            setActiveSessionId(sessionId);
            activeSessionRef.current = sessionId;

            // Join new session room (only if socket is connected)
            if (socket?.connected) {
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

    // Re-join session room whenever the socket (re)connects
    // This handles: cold start where socket connects after joinSession is first called
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            const sessionId = activeSessionRef.current;
            if (sessionId) {
                socket.emit('join:session', sessionId);
            }
        };

        socket.on('connect', handleConnect);

        // If already connected when this effect runs, join immediately
        if (socket.connected && activeSessionRef.current) {
            socket.emit('join:session', activeSessionRef.current);
        }

        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socket]);

    // Listen for real-time chart updates
    useEffect(() => {
        if (!socket) return;

        const handleChartUpdate = (chart) => {
            setCharts((prev) => {
                // Replace if exists (update), otherwise append
                const exists = prev.find((c) => c.id === chart.id);
                if (exists) return prev.map((c) => c.id === chart.id ? chart : c);
                return [...prev, chart];
            });
        };

        socket.on('dashboard:chart_update', handleChartUpdate);
        return () => {
            socket.off('dashboard:chart_update', handleChartUpdate);
        };
    }, [socket]);

    // Expose a refresh function for polling fallback after AI responds
    const refreshCharts = useCallback(async () => {
        const sessionId = activeSessionRef.current;
        if (!sessionId) return;
        try {
            const res = await getSessionCharts(sessionId);
            setCharts(res.data.charts || []);
        } catch {
            // silent
        }
    }, []);

    return (
        <DashboardContext.Provider value={{ charts, activeSessionId, joinSession, clearCharts, refreshCharts }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
    return ctx;
}
