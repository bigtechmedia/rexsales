import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function ProtectedRoute({ roles, children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center" data-testid="loading-skeleton">
                <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (roles && roles.length && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}
