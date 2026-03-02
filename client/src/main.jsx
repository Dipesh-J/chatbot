import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DashboardProvider } from './context/DashboardContext';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <AuthProvider>
                    <SocketProvider>
                        <DashboardProvider>
                            <App />
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    style: {
                                        background: '#18181b',
                                        color: '#fafafa',
                                        border: '1px solid #27272a',
                                        fontSize: '13px',
                                        borderRadius: '10px',
                                    },
                                    success: {
                                        iconTheme: { primary: '#22c55e', secondary: '#18181b' },
                                    },
                                    error: {
                                        iconTheme: { primary: '#ef4444', secondary: '#18181b' },
                                    },
                                }}
                            />
                        </DashboardProvider>
                    </SocketProvider>
                </AuthProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
    </StrictMode>
);
