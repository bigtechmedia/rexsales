import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { KpiCard } from '@/components/KpiCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, ShieldCheck, Store, MessageSquare, Plus } from 'lucide-react';
import { REPORT_TYPES, formatDate } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';

export default function DashboardRep() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [{ data: d }, { data: reqs }] = await Promise.all([
                    api.get('/dashboard/summary?days=30'),
                    api.get('/requests?scope=mine'),
                ]);
                setData(d);
                setRequests(reqs);
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <div className="space-y-6" data-testid="rep-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Namaste, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-muted-foreground">Your area: <span className="text-foreground font-medium">{user?.area || 'Unassigned'}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/reports/new"><Button data-testid="rep-new-report-cta"><Plus className="h-4 w-4 mr-2" /> New report</Button></Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <KpiCard label="My reports (30d)" value={data?.kpis?.total_reports ?? '—'} icon={ClipboardList} testId="kpi-my-reports" />
                <KpiCard label="My visits (30d)" value={data?.kpis?.total_visits ?? '—'} icon={Store} testId="kpi-my-visits" />
                <KpiCard label="My dealers" value={data?.kpis?.total_dealers ?? '—'} icon={Store} testId="kpi-my-dealers" />
                <KpiCard label="Pending approvals" value={data?.kpis?.pending_requests ?? '—'} icon={ShieldCheck} tone={data?.kpis?.pending_requests ? 'warn' : 'default'} testId="kpi-pending-approvals" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold">Quick actions</h3>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {REPORT_TYPES.slice(0, 6).map((rt) => (
                            <Link key={rt.value} to={`/reports/new?type=${rt.value}`} className="rounded-xl border bg-card p-3 hover:border-primary hover:bg-secondary/40 transition-colors" data-testid={`rep-quick-${rt.value}`}>
                                <div className="text-sm font-medium">{rt.label}</div>
                                <div className="text-[11px] text-muted-foreground">Submit a new {rt.label.toLowerCase()}</div>
                            </Link>
                        ))}
                        <Link to="/dealers" className="rounded-xl border bg-card p-3 hover:border-primary hover:bg-secondary/40 transition-colors" data-testid="rep-quick-dealers">
                            <div className="text-sm font-medium">Onboard dealer</div>
                            <div className="text-[11px] text-muted-foreground">Add a new dealer to your area</div>
                        </Link>
                        <Link to="/requests" className="rounded-xl border bg-card p-3 hover:border-primary hover:bg-secondary/40 transition-colors" data-testid="rep-quick-requests">
                            <div className="text-sm font-medium">Expense / Leave / Travel</div>
                            <div className="text-[11px] text-muted-foreground">Submit and track your requests</div>
                        </Link>
                        <Link to="/messages" className="rounded-xl border bg-card p-3 hover:border-primary hover:bg-secondary/40 transition-colors" data-testid="rep-quick-messages">
                            <div className="text-sm font-medium flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Message manager</div>
                            <div className="text-[11px] text-muted-foreground">Chat with your manager or dealers</div>
                        </Link>
                    </div>
                </Card>
                <Card className="rounded-2xl p-4 md:p-6">
                    <h3 className="font-display text-lg font-semibold">My recent requests</h3>
                    <div className="mt-3 divide-y" data-testid="rep-my-requests">
                        {loading && <Skeleton className="h-20 w-full" />}
                        {!loading && requests.length === 0 && <div className="text-sm text-muted-foreground">No requests yet.</div>}
                        {requests.slice(0, 6).map((r) => (
                            <div key={r.request_id} className="py-2 flex items-center gap-2">
                                <Badge variant="outline" className="font-normal capitalize">{r.type}</Badge>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm truncate">{r.title}</div>
                                    <div className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
                                </div>
                                <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'outline'} className="font-normal">{r.status}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">My recent activity</h3>
                    <Link to="/reports" className="text-xs text-primary hover:underline">View all →</Link>
                </div>
                <div className="mt-3 divide-y" data-testid="rep-recent-activity">
                    {(data?.recent || []).length === 0 && <div className="text-sm text-muted-foreground">No activity yet. Submit your first report!</div>}
                    {(data?.recent || []).map((r, i) => (
                        <div key={r.report_id || i} className="flex items-center gap-3 py-2">
                            <Badge variant="outline" className="font-normal">{REPORT_TYPES.find(x => x.value === r.type)?.label || r.type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">{r.title}</div>
                                <div className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
                            </div>
                            {r.report_id && <Link to={`/reports/${r.report_id}`}><Button variant="ghost" size="sm">Open</Button></Link>}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
