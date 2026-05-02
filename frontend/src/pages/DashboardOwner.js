import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { KpiCard } from '@/components/KpiCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { IndianRupee, Users, ClipboardList, AlertCircle, TrendingUp, Trophy } from 'lucide-react';
import { REPORT_TYPES, formatCurrency, formatDate } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';

const gridStroke = 'hsl(var(--border))';
const c1 = 'hsl(var(--chart-1))';
const c2 = 'hsl(var(--chart-2))';
const c3 = 'hsl(var(--chart-3))';

export default function DashboardOwner() {
    const { user } = useAuth();
    const [range, setRange] = useState('30');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/dashboard/summary?days=${range}`).then(({ data }) => { setData(data); }).finally(() => setLoading(false));
    }, [range]);

    return (
        <div className="space-y-6" data-testid="owner-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-muted-foreground">Company-wide performance across teams, dealers and regions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Timeframe</span>
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-36 rounded-xl" data-testid="dashboard-timeframe-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="14">Last 14 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="180">Last 6 months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <KpiCard label="Total sales (value)" value={formatCurrency(data?.kpis?.total_amount || 0)} icon={IndianRupee} tone="good" testId="kpi-total-amount" />
                <KpiCard label="Reports submitted" value={data?.kpis?.total_reports ?? '—'} icon={ClipboardList} testId="kpi-total-reports" />
                <KpiCard label="Active dealers" value={data?.kpis?.active_dealers ?? '—'} icon={Users} testId="kpi-active-dealers" />
                <KpiCard label="Pending approvals" value={data?.kpis?.pending_requests ?? '—'} icon={AlertCircle} tone={data?.kpis?.pending_requests ? 'warn' : 'default'} testId="kpi-pending-approvals" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-display text-lg font-semibold">Reporting activity</h3>
                            <p className="text-xs text-muted-foreground">Daily reports, visits & enquiries over the selected period.</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4 h-64" data-testid="owner-trend-chart">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.trend || []}>
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={c1} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={c1} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={c2} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={c2} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: gridStroke }} />
                                    <Area type="monotone" dataKey="reports" stroke={c1} fill="url(#g1)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="visits" stroke={c2} fill="url(#g2)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
                <Card className="rounded-2xl p-4 md:p-6">
                    <h3 className="font-display text-lg font-semibold">Top sales reps</h3>
                    <p className="text-xs text-muted-foreground">Ranked by reports & pipeline value.</p>
                    <div className="mt-4 space-y-2" data-testid="owner-top-reps">
                        {(data?.top_reps || []).length === 0 && !loading && <div className="text-sm text-muted-foreground">No data for this period.</div>}
                        {(data?.top_reps || []).map((r, i) => (
                            <div key={r.author_id} className="flex items-center gap-3 py-1.5">
                                <span className={`h-6 w-6 grid place-items-center rounded-full text-xs font-semibold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{r.name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{r.reports} reports · {formatCurrency(r.amount)}</div>
                                </div>
                                {i === 0 && <Trophy className="h-4 w-4 text-[hsl(var(--chart-3))]" />}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="rounded-2xl p-4 md:p-6">
                    <h3 className="font-display text-lg font-semibold">Report type mix</h3>
                    <div className="mt-4 h-60" data-testid="owner-types-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.types_breakdown || []}>
                                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                                <XAxis dataKey="type" tick={{ fontSize: 10 }} tickFormatter={(t) => (REPORT_TYPES.find(x => x.value === t)?.label || t).slice(0, 10)} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, borderColor: gridStroke }} />
                                <Bar dataKey="count" fill={c3} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="rounded-2xl p-4 md:p-6">
                    <h3 className="font-display text-lg font-semibold">Team breakdown</h3>
                    <div className="mt-3 divide-y" data-testid="owner-team-breakdown">
                        {(data?.team_breakdown || []).length === 0 && <div className="text-sm text-muted-foreground">No teams yet.</div>}
                        {(data?.team_breakdown || []).map((t) => (
                            <div key={t.team_id} className="flex items-center justify-between py-2 text-sm">
                                <span className="truncate">{t.name}</span>
                                <span className="text-muted-foreground tabular-nums">{t.reports} reports · {formatCurrency(t.amount)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Recent activity</h3>
                    <Link to="/reports" className="text-xs text-primary hover:underline">View all reports →</Link>
                </div>
                <div className="mt-3 divide-y" data-testid="owner-recent-activity">
                    {(data?.recent || []).length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
                    {(data?.recent || []).map((r, i) => (
                        <div key={r.report_id || i} className="flex items-center gap-3 py-2">
                            <Badge variant="outline" className="font-normal">{REPORT_TYPES.find(x => x.value === r.type)?.label || r.type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">{r.title}</div>
                                <div className="text-xs text-muted-foreground">By {r.author_name} · {formatDate(r.created_at)}</div>
                            </div>
                            {r.amount != null && <div className="text-sm tabular-nums">{formatCurrency(r.amount)}</div>}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
