import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const s = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => console.log('Socket connected'));
    s.on('disconnect', () => console.log('Socket disconnected'));

    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
