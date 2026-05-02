import React from 'react';
import { useAuth } from '@/lib/auth';
import DashboardOwner from './DashboardOwner';
import DashboardAdmin from './DashboardAdmin';
import DashboardRep from './DashboardRep';
import DashboardDealer from './DashboardDealer';

export default function Dashboard() {
    const { user } = useAuth();
    if (!user) return null;
    if (user.role === 'owner') return <DashboardOwner />;
    if (user.role === 'admin' || user.role === 'manager') return <DashboardAdmin />;
    if (user.role === 'sales_rep') return <DashboardRep />;
    if (user.role === 'dealer') return <DashboardDealer />;
    return null;
}
