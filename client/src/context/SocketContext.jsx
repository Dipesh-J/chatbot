import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('bizcopilot_token');
        const newSocket = io('/', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
    return ctx;
}
