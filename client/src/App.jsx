import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ChatPage } from './pages/ChatPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/signup"
                element={
                    <PublicRoute>
                        <SignupPage />
                    </PublicRoute>
                }
            />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <ChatPage />
                    </ProtectedRoute>
                }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
