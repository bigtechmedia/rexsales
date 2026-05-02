import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { KpiCard } from '@/components/KpiCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageSearch, MessageSquare, Plus } from 'lucide-react';
import { REPORT_TYPES, formatDate } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';

export default function DashboardDealer() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [{ data: r }, { data: p }] = await Promise.all([
                    api.get('/reports'),
                    api.get('/products'),
                ]);
                setReports(r);
                setProducts(p);
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <div className="space-y-6" data-testid="dealer-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-muted-foreground">Your enquiries, sales requirements and messages with Rex Botanix.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/reports/new?type=product_enquiry"><Button data-testid="dealer-new-enquiry-cta"><Plus className="h-4 w-4 mr-2" /> New enquiry</Button></Link>
                    <Link to="/messages"><Button variant="outline" data-testid="dealer-messages-cta"><MessageSquare className="h-4 w-4 mr-2" /> Message rep</Button></Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <KpiCard label="My enquiries" value={reports.filter(r => r.type?.includes('enquiry') || r.type === 'sales_requirement').length} icon={PackageSearch} testId="kpi-my-enquiries" />
                <KpiCard label="In progress" value={reports.filter(r => r.next_action).length} testId="kpi-my-enquiries-inprogress" />
                <KpiCard label="Messages" value={'—'} icon={MessageSquare} testId="kpi-my-messages" />
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">My enquiries</h3>
                    <Link to="/reports" className="text-xs text-primary hover:underline">View all →</Link>
                </div>
                <div className="mt-3 divide-y" data-testid="dealer-enquiries-list">
                    {loading && <div className="text-sm text-muted-foreground py-3">Loading…</div>}
                    {!loading && reports.length === 0 && <div className="text-sm text-muted-foreground py-3">No enquiries yet. Submit your first product or sales enquiry.</div>}
                    {reports.slice(0, 10).map((r) => (
                        <div key={r.report_id} className="flex items-center gap-3 py-2">
                            <Badge variant="outline" className="font-normal">{REPORT_TYPES.find(x => x.value === r.type)?.label || r.type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">{r.title}</div>
                                <div className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="rounded-2xl p-4 md:p-6">
                <h3 className="font-display text-lg font-semibold">Product catalogue</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="dealer-products-grid">
                    {products.slice(0, 9).map((p) => (
                        <div key={p.product_id} className="rounded-xl border bg-card p-3">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.category} · {p.pack_size}</div>
                            <div className="mt-1 text-sm tabular-nums">{p.mrp ? `₹${p.mrp}` : '—'}</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
