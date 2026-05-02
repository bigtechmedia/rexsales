import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { KpiCard } from '@/components/KpiCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ApprovalCard } from '@/components/ApprovalCard';
import { ClipboardList, Users, AlertCircle, Gauge } from 'lucide-react';
import { REPORT_TYPES, formatCurrency, formatDate } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const gridStroke = 'hsl(var(--border))';
const c1 = 'hsl(var(--chart-1))';
const c2 = 'hsl(var(--chart-2))';

export default function DashboardAdmin() {
    const { user } = useAuth();
    const [range, setRange] = useState('30');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState([]);

    const load = async () => {
        setLoading(true);
        try {
            const [{ data: d }, { data: reqs }] = await Promise.all([
                api.get(`/dashboard/summary?days=${range}`),
                api.get('/requests?status=pending'),
            ]);
            setData(d);
            setPending(reqs);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [range]);

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
        <div className="space-y-6" data-testid="admin-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{user?.role === 'admin' ? 'Admin' : 'Manager'} overview</h1>
                    <p className="text-sm text-muted-foreground">Approvals, team activity and performance at a glance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-36 rounded-xl" data-testid="dashboard-timeframe-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="14">Last 14 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <KpiCard label="Reports (period)" value={data?.kpis?.total_reports ?? '—'} icon={ClipboardList} testId="kpi-total-reports" />
                <KpiCard label="Visits (period)" value={data?.kpis?.total_visits ?? '—'} icon={Gauge} testId="kpi-total-visits" />
                <KpiCard label="Active dealers" value={data?.kpis?.active_dealers ?? '—'} icon={Users} testId="kpi-active-dealers" />
                <KpiCard label="Pending approvals" value={data?.kpis?.pending_requests ?? '—'} icon={AlertCircle} tone={data?.kpis?.pending_requests ? 'warn' : 'default'} testId="kpi-pending-approvals" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <Card className="lg:col-span-2 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold">Approval queue</h3>
                        <Link to="/approvals" className="text-xs text-primary hover:underline">View all →</Link>
                    </div>
                    <div className="mt-3 space-y-2" data-testid="admin-approval-queue">
                        {pending.length === 0 && <div className="text-sm text-muted-foreground">No pending approvals 🎉</div>}
                        {pending.slice(0, 4).map((r) => <ApprovalCard key={r.request_id} request={r} onAction={onAction} />)}
                    </div>
                </Card>
                <Card className="lg:col-span-3 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-display text-lg font-semibold">Team activity</h3>
                            <p className="text-xs text-muted-foreground">Reports, visits and enquiries per day.</p>
                        </div>
                    </div>
                    <div className="mt-4 h-60" data-testid="admin-activity-chart">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.trend || []}>
                                    <defs>
                                        <linearGradient id="ga1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={c1} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={c1} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: gridStroke }} />
                                    <Area type="monotone" dataKey="reports" stroke={c1} fill="url(#ga1)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="enquiries" stroke={c2} strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Recent activity</h3>
                    <Link to="/reports" className="text-xs text-primary hover:underline">View all →</Link>
                </div>
                <div className="mt-3 divide-y" data-testid="admin-recent-activity">
                    {(data?.recent || []).length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
                    {(data?.recent || []).map((r, i) => (
                        <div key={r.report_id || i} className="flex items-center gap-3 py-2">
                            <Badge variant="outline" className="font-normal">{REPORT_TYPES.find(x => x.value === r.type)?.label || r.type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">{r.title}</div>
                                <div className="text-xs text-muted-foreground">By {r.author_name} · {formatDate(r.created_at)}</div>
                            </div>
                            {r.amount != null && <div className="text-sm tabular-nums">{formatCurrency(r.amount)}</div>}
                            {r.report_id && <Link to={`/reports/${r.report_id}`}><Button variant="ghost" size="sm">Open</Button></Link>}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
