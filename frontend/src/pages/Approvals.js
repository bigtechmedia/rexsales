import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApprovalCard } from '@/components/ApprovalCard';
import { toast } from 'sonner';

export default function Approvals() {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('pending');
    const [type, setType] = useState('');

    const load = async () => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (type) params.set('type', type);
        const { data } = await api.get(`/requests?${params.toString()}`);
        setItems(data);
    };
    useEffect(() => { load(); }, [status, type]);

    const onAction = async (action, req) => {
        try {
            await api.post(`/requests/${req.request_id}/action`, { action });
            toast.success(`Request ${action}d`);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.detail || 'Action failed');
        }
    };

    return (
        <div className="space-y-6" data-testid="approvals-page">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Approvals</h1>
                <p className="text-sm text-muted-foreground">Review expense, leave and travel requests from your team.</p>
            </div>
            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-40 rounded-xl" data-testid="approvals-status-filter"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={type} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 rounded-xl" data-testid="approvals-type-filter"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="mt-4 space-y-3" data-testid="approvals-list">
                    {items.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center" data-testid="approvals-empty">No requests here.</div>}
                    {items.map((r) => <ApprovalCard key={r.request_id} request={r} onAction={status === 'pending' ? onAction : null} />)}
                </div>
            </Card>
        </div>
    );
}
