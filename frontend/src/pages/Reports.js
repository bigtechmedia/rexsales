import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REPORT_TYPES, formatCurrency, formatDate } from '@/lib/utils-crm';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reports() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [type, setType] = useState('');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            const { data } = await api.get(`/reports?${params.toString()}`);
            setItems(data);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [type]);

    const filtered = useMemo(() => {
        if (!q) return items;
        const needle = q.toLowerCase();
        return items.filter((r) =>
            (r.title || '').toLowerCase().includes(needle) ||
            (r.author_name || '').toLowerCase().includes(needle) ||
            (r.summary || '').toLowerCase().includes(needle)
        );
    }, [items, q]);

    return (
        <div className="space-y-6" data-testid="reports-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground">Field reports, visits, enquiries and sales requirements.</p>
                </div>
                {['owner', 'admin', 'manager', 'sales_rep'].includes(user?.role) && (
                    <Link to="/reports/new"><Button data-testid="reports-new-button"><Plus className="h-4 w-4 mr-2" /> New report</Button></Link>
                )}
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, author or summary" className="pl-9 h-10 rounded-xl" data-testid="reports-search-input" />
                    </div>
                    <Select value={type} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-52 rounded-xl" data-testid="reports-type-filter"><SelectValue placeholder="All report types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All report types</SelectItem>
                            {REPORT_TYPES.map((rt) => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-4 divide-y">
                    {loading && <div className="text-sm text-muted-foreground py-6">Loading…</div>}
                    {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center" data-testid="reports-empty">No reports yet. Submit your first field report or enquiry.</div>}
                    {filtered.map((r) => (
                        <Link to={`/reports/${r.report_id}`} key={r.report_id} className="block py-3 hover:bg-muted/40 rounded-xl px-2" data-testid={`reports-row-${r.report_id}`}>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="outline" className="font-normal">{REPORT_TYPES.find((x) => x.value === r.type)?.label || r.type}</Badge>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{r.title}</div>
                                    {r.summary && <div className="text-xs text-muted-foreground line-clamp-1">{r.summary}</div>}
                                    <div className="text-[11px] text-muted-foreground mt-0.5">By {r.author_name} · {formatDate(r.created_at)}</div>
                                </div>
                                {r.amount != null && <div className="text-sm tabular-nums">{formatCurrency(r.amount)}</div>}
                            </div>
                        </Link>
                    ))}
                </div>
            </Card>
        </div>
    );
}
