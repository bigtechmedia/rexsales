import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Dealers from '@/pages/Dealers';
import DealerDetail from '@/pages/DealerDetail';
import Reports from '@/pages/Reports';
import NewReport from '@/pages/NewReport';
import ReportDetail from '@/pages/ReportDetail';
import Requests from '@/pages/Requests';
import Approvals from '@/pages/Approvals';
import Teams from '@/pages/Teams';
import Products from '@/pages/Products';
import Messages from '@/pages/Messages';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';

function AppRouter() {
    const location = useLocation();
    // Critical: if returning from OAuth, route to AuthCallback synchronously
    if (location.hash?.includes('session_id=')) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dealers" element={<Dealers />} />
                <Route path="/dealers/:id" element={<DealerDetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/new" element={<ProtectedRoute roles={['owner','admin','manager','sales_rep','dealer']}><NewReport /></ProtectedRoute>} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/approvals" element={<ProtectedRoute roles={['owner','admin','manager']}><Approvals /></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute roles={['owner','admin','manager']}><Teams /></ProtectedRoute>} />
                <Route path="/products" element={<Products />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:id" element={<Messages />} />
                <Route path="/users" element={<ProtectedRoute roles={['owner','admin','manager']}><Users /></ProtectedRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <AuthProvider>
                <BrowserRouter>
                    <AppRouter />
                    <Toaster richColors position="top-right" />
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;
