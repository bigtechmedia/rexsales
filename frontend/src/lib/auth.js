import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // If returning from OAuth, skip /me check
        if (typeof window !== 'undefined' && window.location.hash?.includes('session_id=')) {
            setLoading(false);
            return;
        }
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data?.session_token) localStorage.setItem('rbx_session_token', data.session_token);
        setUser(data.user);
        return data.user;
    };

    const googleSession = async (session_id) => {
        const { data } = await api.post('/auth/google/session', { session_id });
        if (data?.session_token) localStorage.setItem('rbx_session_token', data.session_token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch { /* noop */ }
        localStorage.removeItem('rbx_session_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, googleSession, refresh: checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
