import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('bizcopilot_token');
        if (!token) {
            setLoading(false);
            return;
        }

        getMe()
            .then((res) => {
                setUser(res.data.user);
            })
            .catch(() => {
                localStorage.removeItem('bizcopilot_token');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const loginUser = (token, userData) => {
        localStorage.setItem('bizcopilot_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('bizcopilot_token');
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = (userData) => {
        setUser((prev) => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, logout, setUser: updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
