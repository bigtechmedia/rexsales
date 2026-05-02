import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { REPORT_TYPES, formatDate, relativeTime } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Overdue() {
    const [overdue, setOverdue] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [{ data: o }, { data: u }] = await Promise.all([
                api.get('/sla/overdue'),
                api.get('/sla/upcoming?days=7'),
            ]);
            setOverdue(o);
            setUpcoming(u);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const resolve = async (id) => {
        try {
            await api.post(`/reports/${id}/resolve`, { resolved: true });
            toast.success('Marked resolved');
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    return (
        <div className="space-y-6" data-testid="overdue-page">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">SLA / Overdue</h1>
                <p className="text-sm text-muted-foreground">Track enquiries and requirements with an SLA due date. Overdue items are automatically flagged and notified.</p>
            </div>
            <Card className="rounded-2xl p-4 md:p-6">
                <Tabs defaultValue="overdue">
                    <TabsList>
                        <TabsTrigger value="overdue" data-testid="sla-tab-overdue">
                            <AlertTriangle className="h-4 w-4 mr-1 text-destructive" /> Overdue ({overdue.length})
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" data-testid="sla-tab-upcoming">
                            <Clock className="h-4 w-4 mr-1" /> Due in 7 days ({upcoming.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overdue" className="mt-4 divide-y" data-testid="sla-overdue-list">
                        {loading && <div className="text-sm text-muted-foreground py-6">Loading…</div>}
                        {!loading && overdue.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center">No overdue items. Great work!</div>}
                        {overdue.map((r) => (
                            <RowItem key={r.report_id} r={r} tone="danger" onResolve={resolve} />
                        ))}
                    </TabsContent>
                    <TabsContent value="upcoming" className="mt-4 divide-y" data-testid="sla-upcoming-list">
                        {loading && <div className="text-sm text-muted-foreground py-6">Loading…</div>}
                        {!loading && upcoming.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center">No items due in the next 7 days.</div>}
                        {upcoming.map((r) => (
                            <RowItem key={r.report_id} r={r} tone="warn" onResolve={resolve} />
                        ))}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}

function RowItem({ r, tone, onResolve }) {
    const dueLabel = r.due_at ? formatDate(r.due_at) : '—';
    return (
        <div className="py-3 flex items-center gap-3 flex-wrap" data-testid={`sla-row-${r.report_id}`}>
            {tone === 'danger' ? (
                <Badge variant="outline" className="font-normal bg-destructive/10 text-destructive border-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>
            ) : (
                <Badge variant="outline" className="font-normal"><Clock className="h-3 w-3 mr-1" /> {relativeTime(r.due_at)}</Badge>
            )}
            <Badge variant="outline" className="font-normal">{REPORT_TYPES.find((x) => x.value === r.type)?.label || r.type}</Badge>
            <Link to={`/reports/${r.report_id}`} className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-[11px] text-muted-foreground">By {r.author_name} · Due {dueLabel}</div>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => onResolve(r.report_id)} data-testid={`sla-resolve-${r.report_id}`}><CheckCircle2 className="h-4 w-4 mr-1" /> Resolve</Button>
        </div>
    );
}
