import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
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
import Territories from '@/pages/Territories';
import AuditLog from '@/pages/AuditLog';
import Overdue from '@/pages/Overdue';

function AppRouter() {
    const location = useLocation();
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
                <Route path="/reports/new" element={<NewReport />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/overdue" element={<ProtectedRoute roles={['owner','admin','manager','sales_rep']}><Overdue /></ProtectedRoute>} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/approvals" element={<ProtectedRoute roles={['owner','admin','manager']}><Approvals /></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute roles={['owner','admin','manager']}><Teams /></ProtectedRoute>} />
                <Route path="/territories" element={<Territories />} />
                <Route path="/products" element={<Products />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:id" element={<Messages />} />
                <Route path="/users" element={<ProtectedRoute roles={['owner','admin','manager']}><Users /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute roles={['owner','admin']}><AuditLog /></ProtectedRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRouter />
                        <Toaster richColors position="top-right" />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </div>
    );
}

export default App;
